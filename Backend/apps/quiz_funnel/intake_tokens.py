"""Unique intake link tokens for Klaviyo personalized URLs."""

from __future__ import annotations

import secrets

from django.conf import settings

from .models import User


def generate_intake_ref() -> str:
    """URL-safe opaque token (~32 chars)."""
    return secrets.token_urlsafe(24)


def intake_url_for_ref(intake_ref: str) -> str:
    base = (getattr(settings, "FRONTEND_BASE_URL", "") or "https://the-syndicate.com").rstrip("/")
    ref = (intake_ref or "").strip()
    return f"{base}/quiz/intake?ref={ref}"


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
