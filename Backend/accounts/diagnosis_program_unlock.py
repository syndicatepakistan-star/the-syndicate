"""Diagnosis-gated permanent unlock for two Level 1 psychology programs."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

User = get_user_model()

# Public URL keys → catalog playlist slug + display title
DIAGNOSIS_UNLOCK_PROGRAMS: dict[str, dict[str, str]] = {
    "mastering-risk-and-uncertainty": {
        "title": "Mastering Risk and Uncertainty",
        "catalog_slug": "level1-psych-08",
        "alt_titles": ("Mastering Risk and Uncertainty", "Risk and Uncertainty"),
    },
    "the-secret-to-transformation": {
        "title": "The Secret To Transformation",
        "catalog_slug": "level1-psych-05",
        "alt_titles": ("The Secret To Transformation", "Secret To Transformation"),
    },
}

DIAGNOSIS_UNLOCK_KEYS = frozenset(DIAGNOSIS_UNLOCK_PROGRAMS.keys())


def normalize_diagnosis_unlock_key(raw: str | None) -> str | None:
    key = (raw or "").strip().lower().replace("_", "-")
    if key in DIAGNOSIS_UNLOCK_PROGRAMS:
        return key
    # Accept short aliases
    aliases = {
        "risk": "mastering-risk-and-uncertainty",
        "uncertainty": "mastering-risk-and-uncertainty",
        "mastering-risk": "mastering-risk-and-uncertainty",
        "transformation": "the-secret-to-transformation",
        "secret-to-transformation": "the-secret-to-transformation",
        "secret": "the-secret-to-transformation",
    }
    return aliases.get(key)


def email_in_syn_diagnosis(email: str) -> bool:
    """True when email was captured in the Syndicate Diagnosis quiz funnel DB."""
    from apps.quiz_funnel.models import User as QuizUser

    e = (email or "").strip().lower()
    if not e:
        return False
    return QuizUser.objects.filter(email__iexact=e).exists()


def resolve_diagnosis_playlist(program_key: str):
    from apps.video_streaming.models import StreamPlaylist

    meta = DIAGNOSIS_UNLOCK_PROGRAMS.get(program_key)
    if not meta:
        return None
    slug = meta["catalog_slug"]
    pl = (
        StreamPlaylist.objects.filter(is_published=True, slug=slug)
        .filter(Q(vault_plan_slug="") | Q(vault_plan_slug__isnull=True))
        .order_by("id")
        .first()
    )
    if pl is not None:
        return pl
    titles = meta.get("alt_titles") or (meta["title"],)
    for title in titles:
        pl = (
            StreamPlaylist.objects.filter(is_published=True, title__iexact=title)
            .filter(Q(vault_plan_slug="") | Q(vault_plan_slug__isnull=True))
            .order_by("id")
            .first()
        )
        if pl is not None:
            return pl
    return None


def ensure_portal_user_for_diagnosis_email(email: str):
    """Find or create auth User for this email (unusable password)."""
    from accounts.views import _canonical_user_for_email
    import re

    e = (email or "").strip().lower()
    user = _canonical_user_for_email(e)
    if user is not None:
        if not (user.email or "").strip():
            user.email = e
            user.save(update_fields=["email"])
        return user, False

    # Username may already be the email with blank Email field
    by_username = User.objects.filter(username__iexact=e).order_by("pk").first()
    if by_username is not None:
        if not (by_username.email or "").strip():
            by_username.email = e
            by_username.save(update_fields=["email"])
        return by_username, False

    base = re.sub(r"[^a-z0-9._+-]", "_", e)[:120] or "user"
    username = base[:150]
    suffix = 2
    while User.objects.filter(username=username).exists():
        username = f"{base[:140]}_{suffix}"
        suffix += 1
    user = User(username=username, email=e)
    user.set_unusable_password()
    user.save()
    return user, True


def grant_diagnosis_playlist(user, playlist) -> str:
    from apps.video_streaming.models import StreamPlaylistPurchase

    sid = f"diagnosis_unlock_{user.id}_{playlist.id}"[:255]
    now = timezone.now()
    currency = (getattr(settings, "DEFAULT_CURRENCY", "usd") or "usd")[:12]
    purchase, _ = StreamPlaylistPurchase.objects.update_or_create(
        user=user,
        playlist=playlist,
        defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "amount_paid": Decimal("0.00"),
            "currency": currency,
            "paid_at": now,
            "stripe_session_id": sid,
            "stripe_checkout_session_id": sid,
        },
    )
    if purchase.status != StreamPlaylistPurchase.Status.PAID:
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.amount_paid = Decimal("0.00")
        purchase.paid_at = now
        purchase.stripe_session_id = sid
        purchase.stripe_checkout_session_id = sid
        purchase.save(
            update_fields=[
                "status",
                "amount_paid",
                "paid_at",
                "stripe_session_id",
                "stripe_checkout_session_id",
                "updated_at",
            ]
        )
    return sid


def claim_diagnosis_program_unlock(email: str, program_key_raw: str) -> dict[str, Any]:
    """
    If email is in Syn Diagnosis quiz DB → permanently unlock the program playlist.
    Otherwise → quiz_required (no unlock).

    Non-diagnosis emails return immediately. Unlocked path resolves playlist + portal
    user in parallel workers to cut OTP verify latency.
    """
    from concurrent.futures import ThreadPoolExecutor

    key = normalize_diagnosis_unlock_key(program_key_raw)
    if not key:
        return {"status": "invalid_program", "detail": "Unknown diagnosis unlock program."}

    meta = DIAGNOSIS_UNLOCK_PROGRAMS[key]
    title = meta["title"]
    e = (email or "").strip().lower()
    quiz_required_detail = (
        "Firstly You Have To Attempt The Syndicate Diagnosis To Access This Program"
    )

    if not email_in_syn_diagnosis(e):
        return {
            "status": "quiz_required",
            "program_key": key,
            "program_title": title,
            "quiz_url": "/quiz",
            "detail": quiz_required_detail,
            "redirect_path": (
                f"/dashboard/programs?diagnosis_gate=1&diagnosis_unlock={key}"
            ),
        }

    with ThreadPoolExecutor(max_workers=2) as pool:
        fut_playlist = pool.submit(resolve_diagnosis_playlist, key)
        fut_user = pool.submit(ensure_portal_user_for_diagnosis_email, e)
        playlist = fut_playlist.result()
        user, created = fut_user.result()

    if playlist is None:
        return {
            "status": "playlist_missing",
            "program_key": key,
            "program_title": title,
            "detail": "Program playlist is not available yet. Contact support.",
        }

    grant_diagnosis_playlist(user, playlist)
    redirect_path = f"/dashboard/programs?playlist={playlist.id}"

    return {
        "status": "unlocked",
        "program_key": key,
        "program_title": title,
        "playlist_id": playlist.id,
        "playlist_slug": playlist.slug or meta["catalog_slug"],
        "user_id": user.id,
        "user_created": created,
        "redirect_path": redirect_path,
    }
