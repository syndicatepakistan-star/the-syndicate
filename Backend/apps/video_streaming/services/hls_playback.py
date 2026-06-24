"""
HLS manifest rewrite and segment delivery through the signed playback proxy.
"""

from __future__ import annotations

import logging
import re
from functools import lru_cache
from urllib.parse import urlencode

from django.conf import settings
from django.core.cache import cache
from django.http import Http404, HttpResponse
from django.urls import reverse

from apps.video_streaming.services.object_storage import bucket_object_exists, get_s3_object_text
from apps.video_streaming.services.playback_kinds import (
    iter_hls_manifest_references,
    resolve_hls_relative_key,
    validate_hls_media_path,
)

logger = logging.getLogger(__name__)


def _hls_manifest_body_cache_ttl() -> int:
    try:
        raw = int(getattr(settings, "STREAM_HLS_MANIFEST_CACHE_SECONDS", 120))
    except (TypeError, ValueError):
        raw = 120
    return max(0, min(raw, 600))


def _hls_manifest_body_cache_key(*, bucket: str, manifest_key: str) -> str:
    return f"hls_body:{bucket}:{manifest_key}"


@lru_cache(maxsize=256)
def _hls_media_proxy_prefix(video_id: int) -> str:
    """Cached route prefix — avoids reverse() per manifest segment line."""
    rel = reverse(
        "streaming-video-playback-hls-media",
        kwargs={"video_id": int(video_id), "media_path": "_"},
    )
    return rel[: -len("_")]


def build_hls_media_proxy_url(
    request,
    *,
    video_id: int,
    relative_path: str,
    token: str,
    exp: int,
) -> str:
    del request  # same-origin relative URLs; kept for call-site compatibility
    safe_path = validate_hls_media_path(relative_path)
    qs = urlencode({"token": token, "expires": str(int(exp))})
    return f"{_hls_media_proxy_prefix(int(video_id))}{safe_path}?{qs}"


def rewrite_hls_manifest_text(
    manifest_text: str,
    *,
    manifest_key: str,
    request,
    video_id: int,
    token: str,
    exp: int,
) -> str:
    """Rewrite playlist URIs to signed same-origin proxy URLs."""
    out_lines: list[str] = []
    for line in (manifest_text or "").splitlines():
        stripped = line.strip()
        if not stripped:
            out_lines.append(line)
            continue
        if stripped.startswith("#"):
            if "URI=" in stripped:

                def _replace_uri(match: re.Match[str]) -> str:
                    uri = match.group(1)
                    try:
                        proxy = build_hls_media_proxy_url(
                            request,
                            video_id=video_id,
                            relative_path=uri,
                            token=token,
                            exp=exp,
                        )
                    except ValueError:
                        return match.group(0)
                    return f'URI="{proxy}"'

                out_lines.append(re.sub(r'URI="([^"]+)"', _replace_uri, line, flags=re.IGNORECASE))
            else:
                out_lines.append(line)
            continue
        uri = stripped.split("?", 1)[0].strip()
        try:
            proxy = build_hls_media_proxy_url(
                request,
                video_id=video_id,
                relative_path=uri,
                token=token,
                exp=exp,
            )
        except ValueError:
            out_lines.append(line)
            continue
        out_lines.append(proxy)
    return "\n".join(out_lines) + "\n"


def resolve_hls_segment_storage_key(manifest_key: str, media_path: str) -> str:
    safe = validate_hls_media_path(media_path)
    return resolve_hls_relative_key(manifest_key, safe)


def fetch_hls_manifest_text(*, bucket: str, manifest_key: str) -> str:
    ttl = _hls_manifest_body_cache_ttl()
    cache_key = _hls_manifest_body_cache_key(bucket=bucket, manifest_key=manifest_key)
    if ttl:
        cached = cache.get(cache_key)
        if isinstance(cached, str) and cached.strip():
            return cached
    text = get_s3_object_text(bucket=bucket, key=manifest_key)
    if text is None:
        raise Http404()
    if ttl and text.strip():
        cache.set(cache_key, text, timeout=ttl)
    return text


def hls_manifest_http_response(
    request,
    *,
    bucket: str,
    manifest_key: str,
    video_id: int,
    token: str,
    exp: int,
) -> HttpResponse:
    body = fetch_hls_manifest_text(bucket=bucket, manifest_key=manifest_key)
    rewritten = rewrite_hls_manifest_text(
        body,
        manifest_key=manifest_key,
        request=request,
        video_id=video_id,
        token=token,
        exp=exp,
    )
    resp = HttpResponse(rewritten, content_type="application/vnd.apple.mpegurl")
    resp["Cache-Control"] = "private, max-age=15"
    return resp


def validate_hls_manifest_in_bucket(manifest_key: str) -> tuple[bool, str]:
    """
    Validate manifest exists and at least one referenced segment resolves in bucket.

    Returns (ok, error_message).
    """
    key = (manifest_key or "").strip().lstrip("/")
    if not key.lower().endswith(".m3u8"):
        return False, "HLS manifest key must end with .m3u8"
    if not bucket_object_exists(key):
        return False, f"Manifest “{key}” was not found in the bucket."
    if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        return True, ""

    bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
    try:
        body = get_s3_object_text(bucket=bucket, key=key)
    except Exception:
        return False, "Could not read manifest from bucket."
    if not body:
        return False, "Manifest is empty or unreadable."
    refs = iter_hls_manifest_references(body)
    if not refs:
        return False, "Manifest contains no segment URIs."
    first_key = resolve_hls_relative_key(key, refs[0])
    if not first_key or not bucket_object_exists(first_key):
        return False, f"First segment “{refs[0]}” was not found (resolved key: {first_key or '—'})."
    return True, ""
