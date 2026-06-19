"""Pending signup lifecycle — only abandoned OTP signups stay in the admin list."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Exists, OuterRef

from accounts.models import PendingSignup

User = get_user_model()


def user_registered_for_email(email: str) -> bool:
    return User.objects.filter(email__iexact=(email or "").strip()).exists()


def abandoned_pending_signup_queryset():
    """Rows where the email has not become a User yet (true pending signups)."""
    registered = User.objects.filter(email__iexact=OuterRef("email"))
    return PendingSignup.objects.filter(~Exists(registered))


def complete_pending_signup(pending: PendingSignup | None) -> None:
    """Remove staging row once the account exists or checkout finished."""
    if pending is not None:
        pending.delete()


def purge_stale_pending_signups() -> int:
    """Delete pending rows whose email already has a User account."""
    stale_ids: list[int] = []
    for pending in PendingSignup.objects.only("id", "email").iterator():
        if user_registered_for_email(pending.email):
            stale_ids.append(pending.id)
    if not stale_ids:
        return 0
    deleted, _ = PendingSignup.objects.filter(id__in=stale_ids).delete()
    return deleted
