"""Create UploadedDocument from uploads: text in DB; raw bytes on S3 when configured, else inline path only."""
from __future__ import annotations

import hashlib
import logging
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile

from api.models import UploadedDocument
from api.services.document_extract import extract_text_from_bytes
from api.services.upload_policy import DOC_PROFILE, STAFF_DOC_PROFILE, UploadProfile, assert_upload_bytes

logger = logging.getLogger(__name__)

SUPPORTED_SUFFIXES = DOC_PROFILE.allowed_suffixes

# Typed payload between prepare_upload_bytes (validation / extract) and persist_upload_to_storage (S3/disk).
UploadPrepared = dict


def prepare_upload_bytes(
    data: bytes,
    original_name: str,
    *,
    profile: UploadProfile | None = None,
) -> tuple[UploadPrepared | None, str | None]:
    """Validate, hash, extract text — no database or object storage (safe inside admin form validation)."""
    name = (original_name or "upload").strip() or "upload"
    # Default: staff-sized profile (Django admin + staff API). Callers can pass DOC_PROFILE for tighter caps.
    err = assert_upload_bytes(data, name, profile=profile or STAFF_DOC_PROFILE)
    if err:
        return None, err
    suffix = Path(name).suffix.lower()
    content_hash = hashlib.sha256(data).hexdigest()
    try:
        text = extract_text_from_bytes(data, suffix)
    except ValueError as e:
        return None, str(e)
    except Exception as e:
        return None, f"Could not read this document (corrupt or unsupported content): {e}"
    return {
        "original_name": name,
        "data": data,
        "text": text,
        "content_hash": content_hash,
        "suffix": suffix,
    }, None


def persist_upload_to_storage(prepared: UploadPrepared) -> tuple[str | None, str | None]:
    """Write raw bytes to object storage or virtual inline path; returns stored_path."""
    data = prepared["data"]
    h = prepared["content_hash"]
    suffix = prepared["suffix"]
    if getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        key = f"uploads/{h}-{uuid.uuid4().hex[:12]}{suffix}"
        try:
            return default_storage.save(key, ContentFile(data)), None
        except Exception as e:
            logger.exception("Object storage upload failed for key=%s", key)
            return None, f"Could not store file in object storage: {e}"
    return f"inline/{h}{suffix}", None


def store_upload_bytes(
    data: bytes,
    original_name: str,
    *,
    profile: UploadProfile | None = None,
) -> tuple[UploadedDocument | None, str | None]:
    """API path: prepare + storage + single DB create."""
    prepared, err = prepare_upload_bytes(data, original_name, profile=profile)
    if err:
        return None, err
    stored_path, err = persist_upload_to_storage(prepared)
    if err:
        return None, err
    try:
        doc = UploadedDocument.objects.create(
            original_name=prepared["original_name"],
            stored_path=stored_path,
            content_hash=prepared["content_hash"],
            text_extracted=prepared["text"],
        )
    except Exception as e:
        return None, f"Could not save document record: {e}"
    return doc, None


def store_uploaded_file(
    f: UploadedFile,
    *,
    profile: UploadProfile | None = None,
) -> tuple[UploadedDocument | None, str | None]:
    """
    Read upload in memory, extract text, save UploadedDocument.
    Does not write under data/uploads/ (avoids read-only / ephemeral disk issues on Railway).
    Staff/admin callers should use STAFF_DOC_PROFILE (default).
    """
    from api.services.upload_policy import assert_uploaded_file

    use_profile = profile or STAFF_DOC_PROFILE
    early = assert_uploaded_file(f, profile=use_profile)
    if early:
        return None, early
    name = getattr(f, "name", "upload") or "upload"
    data = b"".join(f.chunks())
    return store_upload_bytes(data, name, profile=use_profile)
