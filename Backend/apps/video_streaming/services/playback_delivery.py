"""
Playback delivery: signed app URLs only (never hand the browser a raw S3/R2 presigned URL).

The HTML5 `<video>` element cannot send `Authorization` headers, so `/api/streaming/videos/stream/<id>/`
returns a time-limited signed URL to `StreamVideoPlaybackFileView`, which re-validates the token and
entitlements on every GET (including each Range seek). Bytes are proxied from object storage with
HTTP Range support for MP4 seeking.
"""

from __future__ import annotations

import logging
import mimetypes
import time
from typing import Literal

from botocore.exceptions import ClientError
from django.conf import settings
from django.core import signing
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from django.urls import reverse

from apps.video_streaming.models import StreamVideo
from apps.video_streaming.services.object_storage import s3_client

logger = logging.getLogger(__name__)

RangeParse = tuple[int, int] | None | Literal["unsatisfiable"]

PLAYBACK_TOKEN_SALT = "video_streaming.playback.mp4.v1"


def _playback_signing_secret() -> str:
    return (getattr(settings, "STREAM_SIGNING_SECRET", "") or "").strip() or settings.SECRET_KEY


def playback_ttl_seconds() -> int:
    raw = str(getattr(settings, "STREAM_SIGNED_URL_TTL_SECONDS", 600)).strip() or "600"
    try:
        ttl = int(raw)
    except ValueError:
        ttl = 600
    return max(60, min(ttl, 60 * 60))


def build_playback_token(*, user_id: int, video_id: int, exp: int, access_mode: str = "programs") -> str:
    mode = (access_mode or "programs").strip() or "programs"
    if mode not in ("programs", "membership"):
        mode = "programs"
    payload = {"u": int(user_id), "v": int(video_id), "exp": int(exp), "m": mode}
    return signing.dumps(payload, key=_playback_signing_secret(), salt=PLAYBACK_TOKEN_SALT, compress=True)


def verify_playback_token(*, token: str, video_id: int) -> dict | None:
    try:
        payload = signing.loads(token, key=_playback_signing_secret(), salt=PLAYBACK_TOKEN_SALT)
    except signing.BadSignature:
        return None
    if not isinstance(payload, dict):
        return None
    try:
        uid = int(payload.get("u"))
        vid = int(payload.get("v"))
        exp = int(payload.get("exp"))
    except (TypeError, ValueError):
        return None
    now = int(time.time())
    if vid != int(video_id) or exp <= now:
        return None
    mode_raw = payload.get("m")
    mode = str(mode_raw).strip() if mode_raw is not None else "programs"
    if mode not in ("programs", "membership"):
        mode = "programs"
    return {"u": uid, "v": vid, "exp": exp, "m": mode}


def presigned_get_object_url(*, bucket: str, key: str, expires_in: int) -> str | None:
    """Optional direct presign (e.g. internal tools); playback uses `build_playback_url_for_video` proxy URLs."""
    client = s3_client()
    if client is None:
        return None
    try:
        return client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )
    except ClientError:
        logger.exception("Could not presign GET for key=%s", key)
        return None
    except Exception:
        logger.exception("Unexpected error presigning GET for key=%s", key)
        return None


def _guess_video_content_type(file_key: str) -> str:
    ctype, _ = mimetypes.guess_type(file_key)
    if ctype:
        return ctype
    lower = file_key.lower()
    if lower.endswith((".mp4", ".m4v")):
        return "video/mp4"
    if lower.endswith(".webm"):
        return "video/webm"
    return "application/octet-stream"


def parse_first_byte_range(range_header: str | None, full_length: int) -> RangeParse:
    """First `bytes=` range only; inclusive (start, end). None = send full object (200)."""
    if full_length <= 0:
        return "unsatisfiable"
    if not range_header:
        return None
    trimmed = range_header.strip()
    if not trimmed.lower().startswith("bytes="):
        return None
    try:
        _, spec = trimmed.split("=", 1)
    except ValueError:
        return None
    first = spec.split(",", 1)[0].strip()
    if not first:
        return None

    if first.startswith("-"):
        try:
            suffix = int(first[1:])
        except ValueError:
            return None
        if suffix <= 0:
            return None
        start = max(0, full_length - suffix)
        end = full_length - 1
        return (start, end)

    if "-" not in first:
        return None
    start_part, end_part = first.split("-", 1)
    try:
        start = int(start_part) if start_part.strip() else 0
    except ValueError:
        return None
    if end_part.strip() == "":
        end = full_length - 1
    else:
        try:
            end = int(end_part)
        except ValueError:
            return None
    if start < 0:
        start = 0
    if start >= full_length:
        return "unsatisfiable"
    end = min(end, full_length - 1)
    if start > end:
        return "unsatisfiable"
    return (start, end)


def head_s3_original(*, bucket: str, key: str) -> HttpResponse:
    client = s3_client()
    if client is None:
        raise Http404()
    try:
        head = client.head_object(Bucket=bucket, Key=key)
    except ClientError as e:
        code = (e.response.get("Error") or {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            raise Http404() from e
        logger.exception("head_object failed bucket=%s key=%s", bucket, key)
        raise Http404() from e

    size = int(head.get("ContentLength") or 0)
    ctype = (head.get("ContentType") or "").strip() or _guess_video_content_type(key)
    resp = HttpResponse(status=200)
    resp["Content-Type"] = ctype
    resp["Content-Length"] = str(max(0, size))
    resp["Accept-Ranges"] = "bytes"
    resp["Cache-Control"] = "private, no-store"
    return resp


def streaming_s3_original_response(request, *, bucket: str, key: str) -> HttpResponse | StreamingHttpResponse:
    """Stream object bytes through Django with Range support (HTML5 video seeking)."""
    client = s3_client()
    if client is None:
        raise Http404()
    ctype = _guess_video_content_type(key)

    try:
        head = client.head_object(Bucket=bucket, Key=key)
    except ClientError as e:
        code = (e.response.get("Error") or {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            raise Http404() from e
        logger.exception("head_object failed bucket=%s key=%s", bucket, key)
        raise Http404() from e

    full_length = int(head.get("ContentLength") or 0)
    if full_length <= 0:
        raise Http404()

    range_header = (request.headers.get("Range") or request.META.get("HTTP_RANGE") or "").strip() or None
    parsed = parse_first_byte_range(range_header, full_length)

    if parsed == "unsatisfiable":
        resp = HttpResponse(status=416)
        resp["Content-Range"] = f"bytes */{full_length}"
        return resp

    get_kwargs: dict = {"Bucket": bucket, "Key": key}
    status = 200
    content_length = full_length
    content_range_hdr: str | None = None

    if isinstance(parsed, tuple):
        start, end = parsed
        get_kwargs["Range"] = f"bytes={start}-{end}"
        status = 206
        content_length = end - start + 1
        content_range_hdr = f"bytes {start}-{end}/{full_length}"

    try:
        obj = client.get_object(**get_kwargs)
    except ClientError as e:
        code = (e.response.get("Error") or {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            raise Http404() from e
        logger.exception("get_object failed bucket=%s key=%s", bucket, key)
        raise Http404() from e

    body = obj["Body"]
    if content_range_hdr is None:
        cr = obj.get("ContentRange")
        if isinstance(cr, str) and cr.strip():
            content_range_hdr = cr.strip()

    clen = obj.get("ContentLength")
    if isinstance(clen, int) and clen > 0:
        content_length = clen

    def iterator():
        try:
            while True:
                chunk = body.read(262_144)
                if not chunk:
                    break
                yield chunk
        finally:
            close = getattr(body, "close", None)
            if callable(close):
                close()

    resp = StreamingHttpResponse(iterator(), status=status, content_type=ctype)
    resp["Accept-Ranges"] = "bytes"
    resp["Content-Length"] = str(content_length)
    resp["Cache-Control"] = "private, no-store"
    if status == 206 and content_range_hdr:
        resp["Content-Range"] = content_range_hdr
    return resp


def build_playback_url_for_video(
    request,
    *,
    user_id: int,
    video: StreamVideo,
    access_mode: str = "programs",
) -> str | None:
    """
    Absolute URL for `<video src>`: always same-origin signed URL to StreamVideoPlaybackFileView.

    Raw storage presigned URLs are intentionally not returned to clients (they are bearer URLs with no
    entitlement hook). The proxy re-checks the signed token and access rules on each request.
    """
    key = (getattr(video.original_video, "name", None) or "").strip()
    if not key:
        return None
    exp = int(time.time()) + playback_ttl_seconds()
    token = build_playback_token(user_id=user_id, video_id=video.pk, exp=exp, access_mode=access_mode)
    rel = reverse("streaming-video-playback-file", kwargs={"video_id": video.pk})
    from urllib.parse import urlencode

    qs = urlencode({"token": token, "expires": str(exp)})
    return request.build_absolute_uri(f"{rel}?{qs}")


def file_response_for_local_original(video: StreamVideo):
    """Stream original file from configured storage (development / disk)."""
    if not video.original_video or not video.original_video.name:
        raise Http404()
    name_lower = (video.original_video.name or "").lower()
    ctype, _ = mimetypes.guess_type(video.original_video.name)
    if not ctype:
        ctype = "video/mp4" if name_lower.endswith(".mp4") else "application/octet-stream"
    try:
        fh = video.original_video.open("rb")
    except FileNotFoundError:
        raise Http404() from None
    except Exception:
        logger.exception("Could not open original_video for video_id=%s", video.pk)
        raise Http404()

    resp = FileResponse(fh, content_type=ctype)
    resp["Cache-Control"] = "private, no-store"
    return resp
