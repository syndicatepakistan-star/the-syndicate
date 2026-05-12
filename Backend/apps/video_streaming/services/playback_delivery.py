"""
Time-limited playback URLs: S3 GET presign (production) or signed same-origin proxy (local files).
"""

from __future__ import annotations

import logging
import mimetypes
import time

from botocore.exceptions import ClientError
from django.conf import settings
from django.core import signing
from django.http import FileResponse, Http404
from django.urls import reverse

from apps.video_streaming.models import StreamVideo
from apps.video_streaming.services.object_storage import s3_client

logger = logging.getLogger(__name__)

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


def build_playback_url_for_video(
    request,
    *,
    user_id: int,
    video: StreamVideo,
    access_mode: str = "programs",
) -> str | None:
    """
    Return an absolute URL the browser <video> can load directly.
    - Private bucket: short-lived S3 presigned URL.
    - Local / non-S3 storage: signed URL to StreamVideoPlaybackFileView on this site.
    """
    key = (getattr(video.original_video, "name", None) or "").strip()
    if not key:
        return None
    exp = int(time.time()) + playback_ttl_seconds()
    bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
    if getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket:
        url = presigned_get_object_url(bucket=bucket, key=key, expires_in=playback_ttl_seconds())
        if url:
            return url
        return None
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
