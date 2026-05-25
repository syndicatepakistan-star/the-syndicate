"""
Helpers for admin/API image saves (Cloudinary or S3-compatible default storage).
"""

from __future__ import annotations

import logging
from pathlib import Path

from django.core.files import File

logger = logging.getLogger(__name__)


def copy_image_field_to_field(*, source_field, dest_instance, dest_field_name: str, dest_upload_to) -> None:
    """
    Copy bytes from one ImageField into another (playlist cover from video thumbnail).
    Safer than assigning ``dest.name = source.name`` across different upload_to prefixes.
    """
    if not source_field or not getattr(source_field, "name", ""):
        return
    ext = Path(source_field.name).suffix or ".jpg"
    dest_name = dest_upload_to(dest_instance, f"synced{ext}")
    update_fields = [dest_field_name, "updated_at"]
    dest_field = getattr(dest_instance, dest_field_name)
    with source_field.open("rb") as src:
        dest_field.save(dest_name, File(src), save=False)
    dest_instance.save(update_fields=update_fields)


def save_image_field_on_instance(*, instance, field_name: str, uploaded_file, extra_update_fields: list[str] | None = None) -> None:
    """Assign and persist a new uploaded image after the parent row exists."""
    setattr(instance, field_name, uploaded_file)
    update_fields = [field_name]
    if extra_update_fields:
        update_fields.extend(extra_update_fields)
    if hasattr(instance, "updated_at"):
        update_fields.append("updated_at")
    instance.save(update_fields=list(dict.fromkeys(update_fields)))
