"""
Resolve admin-pasted bucket references (object key or full S3/R2 URL) to a storage object key.
"""

from __future__ import annotations

from urllib.parse import unquote, urlparse


def normalize_bucket_object_key(reference: str, *, bucket_name: str = "") -> str:
    """
    Turn a pasted value into the object key stored on ``StreamVideo.original_video``.

    Accepts:
    - Object key: ``stream_videos/originals/my.mp4``
    - Path: ``/stream_videos/originals/my.mp4``
    - S3 URI: ``s3://my-bucket/stream_videos/originals/my.mp4``
    - HTTPS URL: ``https://<account>.r2.cloudflarestorage.com/<bucket>/stream_videos/...``
    - Custom domain URL: ``https://cdn.example.com/stream_videos/...`` (bucket prefix stripped when it matches)
    """
    ref = (reference or "").strip()
    if not ref:
        return ""

    bucket = (bucket_name or "").strip().strip("/")

    if ref.lower().startswith("s3://"):
        without_scheme = ref[5:].lstrip("/")
        if bucket and without_scheme.startswith(bucket + "/"):
            return without_scheme[len(bucket) + 1 :].lstrip("/")
        if "/" in without_scheme:
            first, _, rest = without_scheme.partition("/")
            if bucket and first == bucket:
                return rest.lstrip("/")
            return without_scheme
        return without_scheme

    if ref.startswith(("http://", "https://")):
        path = unquote(urlparse(ref).path or "").lstrip("/")
        if not path:
            return ""
        if bucket and path.startswith(bucket + "/"):
            return path[len(bucket) + 1 :]
        return path

    return ref.lstrip("/")


def bucket_key_resolution_candidates(reference: str, *, bucket_name: str = "") -> tuple[str, ...]:
    """Return normalized key plus common Level-1 / vault prefix variants for admin linking."""
    primary = normalize_bucket_object_key(reference, bucket_name=bucket_name)
    if not primary:
        return ()
    seen: set[str] = set()
    out: list[str] = []

    def add(key: str) -> None:
        k = (key or "").strip().lstrip("/")
        if k and k not in seen:
            seen.add(k)
            out.append(k)

    add(primary)
    lower = primary.lower()
    if not lower.startswith("business models/") and not lower.startswith("business psychology/"):
        add(f"Business Models/{primary}")
        add(f"Business Psychology/{primary}")
    return tuple(out)


def resolve_bucket_object_key(reference: str, *, bucket_name: str = "") -> str:
    """Pick the first candidate key that exists in the bucket, else the normalized primary."""
    from apps.video_streaming.services.object_storage import bucket_object_exists

    candidates = bucket_key_resolution_candidates(reference, bucket_name=bucket_name)
    if not candidates:
        return ""
    for key in candidates:
        if bucket_object_exists(key):
            return key
    return candidates[0]
