"""Ensure STATIC_ROOT contains Django admin assets (Railway / WhiteNoise)."""

from __future__ import annotations

import shutil
from pathlib import Path


def admin_css_path(static_root: Path) -> Path:
    return static_root / "admin" / "css" / "base.css"


def copy_admin_static_fallback(static_root: Path) -> None:
    import django.contrib.admin

    src = Path(django.contrib.admin.__file__).resolve().parent / "static" / "admin"
    dst = static_root / "admin"
    if not src.is_dir():
        raise RuntimeError(f"Django admin static tree not found at {src}")
    shutil.copytree(src, dst, dirs_exist_ok=True)


def ensure_staticfiles(*, clear: bool = False, verbosity: int = 1) -> Path:
    """
    Run collectstatic until admin/css/base.css exists; copy from Django package as last resort.
    """
    from django.conf import settings
    from django.core.management import call_command

    static_root = Path(settings.STATIC_ROOT)
    static_root.mkdir(parents=True, exist_ok=True)
    target = admin_css_path(static_root)

    if target.is_file() and not clear:
        return target

    def _collect(clear_run: bool) -> None:
        call_command(
            "collectstatic",
            interactive=False,
            verbosity=verbosity,
            clear=clear_run,
        )

    _collect(clear)

    if not target.is_file():
        _collect(True)

    if not target.is_file():
        copy_admin_static_fallback(static_root)

    if not target.is_file():
        raise RuntimeError(
            f"Admin static missing after collectstatic: expected {target}. "
            "Check INSTALLED_APPS includes django.contrib.staticfiles and Railway root directory is Backend/."
        )

    return target
