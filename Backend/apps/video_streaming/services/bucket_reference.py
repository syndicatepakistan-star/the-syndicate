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
