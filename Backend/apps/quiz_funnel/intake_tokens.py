"""Unique intake link tokens / Klaviyo personalized URLs."""

from __future__ import annotations

import secrets
from urllib.parse import quote

from django.conf import settings

from .models import User


def generate_intake_ref() -> str:
    """URL-safe opaque token (~32 chars)."""
    return secrets.token_urlsafe(24)


def _frontend_base() -> str:
    return (getattr(settings, "FRONTEND_BASE_URL", "") or "https://the-syndicate.com").rstrip("/")


def intake_url_for_ref(intake_ref: str) -> str:
    ref = (intake_ref or "").strip()
    return f"{_frontend_base()}/quiz/intake?ref={ref}"


def intake_url_for_email(email: str) -> str:
    """
    Klaviyo-friendly intake URL.

    Uses {{ person.email }} which always personalizes (unlike custom intake_ref props).
    """
    email_norm = (email or "").strip().lower()
    return f"{_frontend_base()}/quiz/intake?email={quote(email_norm, safe='')}"


def intake_url_for_user(user: User) -> str:
    email = (user.email or "").strip()
    if email:
        return intake_url_for_email(email)
    if user.intake_ref:
        return intake_url_for_ref(user.intake_ref)
    return f"{_frontend_base()}/quiz/intake"


def ensure_intake_ref(user: User) -> str:
    """Return existing or newly saved intake_ref for a quiz funnel user."""
    if user.intake_ref:
        return user.intake_ref
    for _ in range(8):
        candidate = generate_intake_ref()
        if not User.objects.filter(intake_ref=candidate).exists():
            user.intake_ref = candidate
            user.save(update_fields=["intake_ref"])
            return candidate
    raise RuntimeError("Unable to allocate unique intake_ref")
