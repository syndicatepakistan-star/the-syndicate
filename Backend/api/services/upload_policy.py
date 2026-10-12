"""
Lightweight upload hardening: size caps + magic-byte / header checks.

No external antivirus service — free and low-maintenance. Call from every
multipart path before parsing or storing bytes.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class UploadProfile:
    """Named policy for a class of uploads."""

    name: str
    max_bytes: int
    allowed_suffixes: frozenset[str]


# Mindset / document pipeline — public API path (if ever opened) stays tight.
DOC_PROFILE = UploadProfile(
    name="document",
    max_bytes=20 * 1024 * 1024,  # 20 MB
    allowed_suffixes=frozenset({".pdf", ".txt", ".md", ".markdown", ".docx"}),
)

# Django admin / staff API — same type checks, roomier size for ops.
STAFF_DOC_PROFILE = UploadProfile(
    name="document_staff",
    max_bytes=100 * 1024 * 1024,  # 100 MB
    allowed_suffixes=DOC_PROFILE.allowed_suffixes,
)

# Challenge admin-task video submissions (logged-in Knight members only).
VIDEO_PROFILE = UploadProfile(
    name="admin_task_video",
    max_bytes=50 * 1024 * 1024,  # 50 MB
    allowed_suffixes=frozenset({".webm", ".mp4", ".mov", ".mkv", ".m4v", ".ogv", ".avi"}),
)


def is_staff_uploader(user) -> bool:
    """True for Django staff / superuser — the only roles that may use document ingest APIs."""
    if user is None:
        return False
    return bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))


def _looks_like_text(data: bytes) -> bool:
    sample = data[:8192]
    if not sample:
        return False
    # Reject obvious binary / null-heavy payloads pretending to be .txt/.md
    if sample.count(0) > max(2, len(sample) // 50):
        return False
    try:
        sample.decode("utf-8")
        return True
    except UnicodeDecodeError:
        try:
            sample.decode("latin-1")
            return True
        except UnicodeDecodeError:
            return False


def sniff_matches_suffix(data: bytes, suffix: str) -> bool:
    """
    True if file header matches the claimed extension.
    Empty data → False.
    """
    if not data:
        return False
    sfx = (suffix or "").lower()
    head = data[:64]

    if sfx == ".pdf":
        # Allow UTF-8 BOM then %PDF
        stripped = data.lstrip(b"\xef\xbb\xbf \t\r\n")
        return stripped.startswith(b"%PDF")

    if sfx == ".docx":
        # DOCX is a ZIP package
        return head.startswith(b"PK\x03\x04") or head.startswith(b"PK\x05\x06")

    if sfx in {".txt", ".md", ".markdown"}:
        return _looks_like_text(data)

    if sfx in {".mp4", ".m4v", ".mov"}:
        # ISO BMFF: size(4) + 'ftyp'
        return len(data) >= 8 and data[4:8] == b"ftyp"

    if sfx in {".webm", ".mkv"}:
        return head.startswith(b"\x1a\x45\xdf\xa3")

    if sfx == ".ogv":
        return head.startswith(b"OggS")

    if sfx == ".avi":
        return head.startswith(b"RIFF") and len(data) >= 12 and data[8:12] == b"AVI "

    return False


def assert_upload_bytes(
    data: bytes,
    original_name: str,
    *,
    profile: UploadProfile,
) -> str | None:
    """
    Validate size, extension allowlist, and magic bytes.
    Returns an error message, or None if OK.
    """
    name = (original_name or "upload").strip() or "upload"
    suffix = Path(name).suffix.lower()

    if not data:
        return "Empty file."

    if len(data) > profile.max_bytes:
        mb = profile.max_bytes // (1024 * 1024)
        return f"File too large (max {mb}MB for {profile.name} uploads)."

    if suffix not in profile.allowed_suffixes:
        allowed = ", ".join(sorted(profile.allowed_suffixes))
        return f"Unsupported type {suffix!r}. Allowed: {allowed}"

    if not sniff_matches_suffix(data, suffix):
        return (
            f"File content does not match extension {suffix!r}. "
            "Upload a real file of that type (fake or renamed files are blocked)."
        )

    return None


def assert_uploaded_file(upload, *, profile: UploadProfile) -> str | None:
    """
    Validate a Django UploadedFile without necessarily reading the whole body
    when size is already known. For magic bytes, reads a small header then resets.
    """
    if upload is None:
        return "Missing file."

    name = getattr(upload, "name", "") or "upload"
    suffix = Path(name).suffix.lower()
    size = int(getattr(upload, "size", 0) or 0)

    if size <= 0:
        return "Empty file."

    if size > profile.max_bytes:
        mb = profile.max_bytes // (1024 * 1024)
        return f"File too large (max {mb}MB for {profile.name} uploads)."

    if suffix not in profile.allowed_suffixes:
        allowed = ", ".join(sorted(profile.allowed_suffixes))
        return f"Unsupported type {suffix!r}. Allowed: {allowed}"

    # Header sniff (reset pointer for later save)
    try:
        pos = upload.tell()
    except Exception:
        pos = 0
    try:
        header = upload.read(8192)
        upload.seek(pos)
    except Exception:
        try:
            upload.seek(0)
        except Exception:
            pass
        return "Could not read upload for security check."

    if not sniff_matches_suffix(header, suffix):
        # For text, short files may need fuller sample — header is enough for UTF-8 check
        return (
            f"File content does not match extension {suffix!r}. "
            "Upload a real file of that type (fake or renamed files are blocked)."
        )

    # Video content-type is advisory only; magic bytes already checked.
    return None
