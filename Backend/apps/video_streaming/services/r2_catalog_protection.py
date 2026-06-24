"""
Protect user-uploaded course media in R2 from Django admin / catalog purge deletes.

StreamVideo rows are disposable (DB); R2 lesson folders are the source of truth.
"""

from __future__ import annotations

# Top-level R2 folders for syndicate course uploads (see accounts/r2_path_catalog.py).
PROTECTED_R2_CATALOG_PREFIXES: tuple[str, ...] = (
    "Business Models/",
    "Business Psychology/",
    "Agentic AI/",
    "Ai Content Automation/",
    "Trading with Advanced Technical Analysis/",
)


def is_protected_r2_catalog_key(key: str) -> bool:
    """True when this object key is user course media and must not be auto-deleted."""
    normalized = (key or "").strip().lstrip("/")
    if not normalized:
        return False
    return any(normalized.startswith(prefix) for prefix in PROTECTED_R2_CATALOG_PREFIXES)


def r2_keys_safe_to_delete_on_video_row_removal(*keys: str) -> list[str]:
    """Filter object keys that the app may delete when a StreamVideo row is removed."""
    out: list[str] = []
    for raw in keys:
        key = (raw or "").strip().lstrip("/")
        if not key or is_protected_r2_catalog_key(key):
            continue
        out.append(key)
    return out
