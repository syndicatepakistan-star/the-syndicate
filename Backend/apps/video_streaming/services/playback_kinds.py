"""
Detect and validate MP4 vs HLS bucket references for StreamVideo playback.
"""

from __future__ import annotations

import re
from urllib.parse import unquote, urlparse

HLS_MANIFEST_SUFFIX = ".m3u8"
MP4_SUFFIXES = (".mp4", ".m4v", ".webm", ".mov")


def detect_playback_kind(object_key: str) -> str:
    """Return ``mp4`` or ``hls`` from a storage object key."""
    lower = (object_key or "").strip().lower()
    if lower.endswith(HLS_MANIFEST_SUFFIX):
        return "hls"
    if lower.endswith(MP4_SUFFIXES):
        return "mp4"
    return "mp4"


def hls_prefix_for_manifest(manifest_key: str) -> str:
    """Directory prefix for segment keys relative to a manifest object key."""
    key = (manifest_key or "").strip().lstrip("/")
    if not key:
        return ""
    if "/" not in key:
        return ""
    return key.rsplit("/", 1)[0] + "/"


def resolve_hls_relative_key(manifest_key: str, relative_uri: str) -> str:
    """
  Resolve a segment/init URI from an m3u8 playlist to a bucket object key.

  Supports same-folder relative paths (``segment_000.ts``) and rejects traversal.
  """
    manifest_key = (manifest_key or "").strip().lstrip("/")
    raw = (relative_uri or "").strip()
    if not raw:
        return ""
    if raw.lower().startswith(("http://", "https://")):
        parsed = urlparse(unquote(raw))
        path = (parsed.path or "").lstrip("/")
        if not path:
            return ""
        return path
    if raw.startswith("/"):
        return raw.lstrip("/")
    prefix = hls_prefix_for_manifest(manifest_key)
    combined = f"{prefix}{raw}" if prefix else raw
    parts: list[str] = []
    for part in combined.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            if parts:
                parts.pop()
            continue
        parts.append(part)
    return "/".join(parts)


_EXT_X_MAP_URI_RE = re.compile(r'URI="([^"]+)"', re.IGNORECASE)


def iter_hls_manifest_references(manifest_text: str) -> list[str]:
    """Collect segment/init URIs referenced in a playlist body."""
    refs: list[str] = []
    for line in (manifest_text or "").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            map_match = _EXT_X_MAP_URI_RE.search(stripped)
            if map_match:
                refs.append(map_match.group(1).strip())
            continue
        refs.append(stripped.split("?", 1)[0].strip())
    return [r for r in refs if r]


def validate_hls_media_path(media_path: str) -> str:
    """Normalize and reject path traversal in HLS media proxy paths."""
    raw = unquote((media_path or "").strip().lstrip("/"))
    if not raw or ".." in raw.split("/"):
        raise ValueError("Invalid HLS media path.")
    if raw.lower().startswith(("http://", "https://")):
        raise ValueError("Absolute URLs are not allowed for HLS media paths.")
    return raw
