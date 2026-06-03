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

from botocore.exceptions import ClientError
from django.conf import settings
from django.core import signing
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from django.urls import reverse

from apps.video_streaming.models import StreamVideo
from apps.video_streaming.services.object_storage import s3_client

logger = logging.getLogger(__name__)

PLAYBACK_TOKEN_SALT = "video_streaming.playback.mp4.v1"


def s3_proxy_read_chunk_bytes() -> int:
    """Bytes per read when streaming S3 through Django (larger = fewer reads; cap for memory)."""
    try:
        raw = int(getattr(settings, "STREAM_S3_PROXY_READ_CHUNK_BYTES", 4 * 1024 * 1024))
    except (TypeError, ValueError):
        raw = 4 * 1024 * 1024
    return max(256 * 1024, min(raw, 8 * 1024 * 1024))


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


def _first_bytes_range_for_s3(range_header: str | None) -> str | None:
    """
    First `bytes=` range only, formatted for S3 GetObject `Range` (e.g. bytes=0- or bytes=1024-2047).
    Returns None to fetch the full object (initial playback). HTML5 video sends a single range per request.
    """
    if not range_header:
        return None
    trimmed = range_header.strip()
    if not trimmed.lower().startswith("bytes="):
        return None
    try:
        _, inner = trimmed.split("=", 1)
    except ValueError:
        return None
    first = inner.strip().split(",", 1)[0].strip()
    if not first:
        return None
    return f"bytes={first}"


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
    """
    Stream object bytes through Django with Range support (HTML5 video seeking).

    Uses a single S3 GetObject per request when possible (no extra HeadObject before ranged reads),
    which cuts latency roughly in half on each seek/scrub.
    """
    client = s3_client()
    if client is None:
        raise Http404()

    range_header = (request.headers.get("Range") or request.META.get("HTTP_RANGE") or "").strip() or None
    s3_range = _first_bytes_range_for_s3(range_header)

    get_kwargs: dict = {"Bucket": bucket, "Key": key}
    if s3_range:
        get_kwargs["Range"] = s3_range

    try:
        obj = client.get_object(**get_kwargs)
    except ClientError as e:
        err = e.response.get("Error") or {}
        code = err.get("Code", "")
        http_status = (e.response.get("ResponseMetadata") or {}).get("HTTPStatusCode")
        if code == "InvalidRange" or http_status == 416:
            try:
                head = client.head_object(Bucket=bucket, Key=key)
                full = int(head.get("ContentLength") or 0)
            except ClientError:
                full = 0
            resp = HttpResponse(status=416)
            resp["Content-Range"] = f"bytes */{max(0, full)}"
            return resp
        if code in ("404", "NoSuchKey", "NotFound"):
            raise Http404() from e
        logger.exception("get_object failed bucket=%s key=%s", bucket, key)
        raise Http404() from e

    meta = obj.get("ResponseMetadata") or {}
    ctype = (obj.get("ContentType") or "").strip() or _guess_video_content_type(key)
    content_range_hdr = obj.get("ContentRange")
    if isinstance(content_range_hdr, str):
        content_range_hdr = content_range_hdr.strip() or None
    else:
        content_range_hdr = None

    status = int(meta.get("HTTPStatusCode") or 0)
    if status not in (200, 206):
        status = 206 if s3_range else 200
    if s3_range and status == 200 and content_range_hdr:
        status = 206

    clen = obj.get("ContentLength")
    content_length = int(clen) if isinstance(clen, int) and clen > 0 else 0
    if content_length <= 0:
        raise Http404()

    body = obj["Body"]
    chunk_size = s3_proxy_read_chunk_bytes()

    def iterator():
        try:
            while True:
                chunk = body.read(chunk_size)
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
) -> tuple[str | None, int | None]:
    """
    Absolute URL for `<video src>` and its Unix expiry epoch.

    - Default: signed same-origin proxy (entitlement re-check on every Range; storage host hidden).
    - Optional: short-lived S3 presigned GET when ``STREAM_PLAYBACK_USE_S3_PRESIGNED_GET`` is true
      (smoothest playback; treat URL as a secret until it expires).
    """
    key = (getattr(video.original_video, "name", None) or "").strip()
    if not key:
        return None, None
    ttl = playback_ttl_seconds()
    exp = int(time.time()) + ttl
    bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
    use_presign = bool(getattr(settings, "STREAM_PLAYBACK_USE_S3_PRESIGNED_GET", False))
    if use_presign and getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket:
        url = presigned_get_object_url(bucket=bucket, key=key, expires_in=ttl)
        if url:
            return url, exp
    token = build_playback_token(user_id=user_id, video_id=video.pk, exp=exp, access_mode=access_mode)
    rel = reverse("streaming-video-playback-file", kwargs={"video_id": video.pk})
    from urllib.parse import urlencode

    qs = urlencode({"token": token, "expires": str(exp)})
    return request.build_absolute_uri(f"{rel}?{qs}"), exp


def build_stream_playback_api_payload(
    request,
    *,
    user_id: int,
    video: StreamVideo,
    access_mode: str = "programs",
) -> dict:
    """JSON payload for stream-info endpoints (includes ``playback_expires_at`` for client refresh)."""
    base: dict = {
        "id": video.id,
        "status": video.status,
        "playback_url": None,
        "playback_expires_at": None,
    }
    if not video.original_video or not video.original_video.name:
        return base
    if video.status != StreamVideo.Status.READY:
        return base
    url, exp = build_playback_url_for_video(
        request,
        user_id=user_id,
        video=video,
        access_mode=access_mode,
    )
    if not url:
        return base
    return {
        "id": video.id,
        "status": video.status,
        "playback_url": url,
        "playback_expires_at": exp,
    }


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
