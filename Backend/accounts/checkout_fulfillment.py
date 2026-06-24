"""Shared Stripe checkout fulfillment helpers (signup, returning, logged-in, metadata fallback)."""

from __future__ import annotations

import logging
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.authtoken.models import Token

from apps.portal.models import UserPlanPurchase
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase

logger = logging.getLogger(__name__)


def resolve_checkout_user_from_metadata(session_meta: dict) -> User | None:
    """Best-effort user lookup when PendingSignup/ReturningCheckout rows are missing."""
    uid_raw = str(session_meta.get("user_id", "") or "").strip()
    if uid_raw.isdigit():
        try:
            return User.objects.get(pk=int(uid_raw))
        except User.DoesNotExist:
            pass

    email = str(session_meta.get("email", "") or "").strip().lower()
    if email:
        from accounts.views import _canonical_user_for_email

        return _canonical_user_for_email(email)

    signup_token = str(session_meta.get("signup_token", "") or "").strip()
    if not signup_token:
        return None
    from accounts.models import PendingSignup

    try:
        token_uuid = uuid.UUID(signup_token)
    except ValueError:
        return None
    pending = PendingSignup.objects.filter(token=token_uuid).first()
    if pending is None:
        return None
    return User.objects.filter(email__iexact=pending.email).first()


def resolve_playlist_from_checkout_metadata(session_meta: dict) -> StreamPlaylist | None:
    """Resolve playlist from Stripe metadata — slug is stable across catalog re-seeds."""
    slug = str(session_meta.get("playlist_slug", "") or "").strip()
    if slug:
        playlist = StreamPlaylist.objects.filter(slug=slug).first()
        if playlist is not None:
            return playlist
    playlist_id = str(session_meta.get("playlist_id", "") or "").strip()
    if playlist_id.isdigit():
        return StreamPlaylist.objects.filter(pk=int(playlist_id)).first()
    return None


def _apply_playlist_purchase(user: User, session, session_meta: dict) -> None:
    playlist = resolve_playlist_from_checkout_metadata(session_meta)
    if playlist is None:
        return
    purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
        user=user,
        playlist=playlist,
        defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "stripe_session_id": session.id,
            "stripe_checkout_session_id": session.id,
            "amount_paid": playlist.price,
            "currency": settings.DEFAULT_CURRENCY,
            "paid_at": timezone.now(),
        },
    )
    purchase.status = StreamPlaylistPurchase.Status.PAID
    purchase.stripe_session_id = session.id
    purchase.stripe_checkout_session_id = session.id
    purchase.amount_paid = playlist.price
    purchase.currency = settings.DEFAULT_CURRENCY
    purchase.paid_at = timezone.now()
    purchase.save(
        update_fields=[
            "status",
            "stripe_session_id",
            "stripe_checkout_session_id",
            "amount_paid",
            "currency",
            "paid_at",
            "updated_at",
        ]
    )


def fulfill_checkout_session_for_user(
    user: User,
    session,
    session_meta: dict,
    *,
    paid_amount: float,
    paid_currency: str,
) -> tuple[str, str, bool]:
    """
    Idempotent plan/playlist fulfillment for a paid Stripe session.
    Returns (plan_slug, playlist_id_raw, was_already_recorded).
    """
    from accounts.views import _safe_apply_plan_and_record_purchase

    sid = str(getattr(session, "id", "") or "").strip()
    playlist_id = str(session_meta.get("playlist_id", "") or "").strip()
    playlist_slug = str(session_meta.get("playlist_slug", "") or "").strip()
    plan_sel = str(session_meta.get("selected_plan", "") or "").strip().lower()

    was_recorded = bool(sid) and UserPlanPurchase.objects.filter(stripe_checkout_session_id=sid).exists()
    playlist_paid = False
    resolved_playlist = resolve_playlist_from_checkout_metadata(session_meta)
    if resolved_playlist is not None:
        playlist_paid = StreamPlaylistPurchase.objects.filter(
            user=user,
            playlist=resolved_playlist,
            status=StreamPlaylistPurchase.Status.PAID,
        ).exists()

    if resolved_playlist is not None and not playlist_paid:
        _apply_playlist_purchase(user, session, session_meta)
    if plan_sel:
        _safe_apply_plan_and_record_purchase(user, session, plan_sel, paid_amount, paid_currency)
    elif not was_recorded and sid:
        logger.warning(
            "Checkout session %s paid for user_id=%s but selected_plan metadata is empty",
            sid,
            user.id,
        )
    return plan_sel, playlist_id, was_recorded


def checkout_success_json_response(
    user: User,
    session,
    session_meta: dict,
    *,
    paid_amount: float,
    paid_currency: str,
    plan_sel: str,
    playlist_id: str,
    was_already_recorded: bool = False,
) -> JsonResponse:
    from accounts.views import (
        _affiliate_attribution_payload,
        _checkout_success_redirect_path,
        _record_checkout_affiliate_sale,
        _safe_affiliate_referral_ids,
    )

    auth_token, _ = Token.objects.get_or_create(user=user)
    referral_ids = _safe_affiliate_referral_ids(user)
    _record_checkout_affiliate_sale(session, session_meta, user.email, paid_amount, paid_currency)
    return JsonResponse(
        {
            "message": "Payment successful.",
            "email": user.email,
            "token": auth_token.key,
            "redirect_url": _checkout_success_redirect_path(plan_sel, playlist_id),
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "referral_ids": referral_ids,
            "amount_paid": paid_amount,
            "currency": paid_currency,
            "affiliate_attribution": _affiliate_attribution_payload(session_meta),
            "selected_plan": plan_sel or None,
            "playlist_id": int(playlist_id) if playlist_id.isdigit() else None,
            "already_purchased": was_already_recorded,
        },
        status=200,
    )
