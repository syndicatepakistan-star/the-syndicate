"""
Media storage split: Cloudinary for images, default storage (S3 or local) for videos/files.
"""

from __future__ import annotations

from urllib.parse import quote

from django.conf import settings


def get_image_storage():
    """
    Callable for ImageField(storage=...).
    Cloudinary when USE_CLOUDINARY; otherwise default (S3 or filesystem).
    """
    from django.core.files.storage import storages

    if getattr(settings, "USE_CLOUDINARY", False):
        return storages["cloudinary_media"]
    return storages["default"]


def _storage_is_cloudinary(file_field) -> bool:
    if not file_field:
        return False
    storage = getattr(file_field, "storage", None)
    if storage is None:
        return bool(getattr(settings, "USE_CLOUDINARY", False))
    module = (getattr(type(storage), "__module__", "") or "").lower()
    return "cloudinary" in module


def public_media_url(file_field, request=None) -> str | None:
    """
    Public URL for thumbnails, covers, and other images.
    Cloudinary URLs are returned as-is (HTTPS, CDN). S3 images use MEDIA_PUBLIC_BASE_URL or presigned URLs.
    """
    if not file_field:
        return None
    name = getattr(file_field, "name", "") or ""
    if not name:
        return None

    if _storage_is_cloudinary(file_field):
        try:
            return file_field.url
        except Exception:
            return None

    if bool(getattr(settings, "AWS_QUERYSTRING_AUTH", False)):
        try:
            signed_url = file_field.url
        except Exception:
            return None
        if request is not None and isinstance(signed_url, str) and signed_url.startswith("/"):
            return request.build_absolute_uri(signed_url)
        return signed_url

    public_base = (getattr(settings, "MEDIA_PUBLIC_BASE_URL", "") or "").strip().rstrip("/")
    if public_base:
        encoded_name = quote(name.lstrip("/"), safe="/")
        return f"{public_base}/{encoded_name}"

    try:
        url = file_field.url
    except Exception:
        return None
    if request is not None and isinstance(url, str) and url.startswith("/"):
        return request.build_absolute_uri(url)
    return url
