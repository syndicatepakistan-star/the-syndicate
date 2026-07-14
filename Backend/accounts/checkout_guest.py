"""Guest unlock checkout: pay first, claim with email + OTP after Stripe."""

from __future__ import annotations

import json
import logging
import secrets
from typing import Any

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.authtoken.models import Token

from accounts.checkout_cart import (
    cart_items_to_metadata_json,
    filter_cart_items_excluding_owned,
    parse_cart_items_from_metadata,
    parse_cart_items_from_payload,
)
from accounts.checkout_fulfillment import fulfill_checkout_session_for_user
from accounts.checkout_ownership import find_user_by_email, user_owns_checkout_selection
from accounts.models import GuestCheckoutClaim, GuestCheckoutReceipt, LoginOTP, PendingSignup, SignupOTP
from accounts.stripe_checkout_helpers import (
    build_checkout_line_items,
    build_checkout_line_items_for_cart,
    checkout_session_is_paid,
    checkout_session_mode,
)
from accounts.vault_plan_catalog import vault_course_product_title
from apps.video_streaming.models import StreamPlaylist

logger = logging.getLogger(__name__)


def _safe_media_url(field) -> str:
    if field is None:
        return ""
    try:
        url = getattr(field, "url", "") or ""
        return str(url).strip()
    except Exception:
        return ""


def extract_display_items_from_payload(payload: dict) -> list[dict]:
    """Normalize optional title/image display fields from cart or single checkout payload."""
    items: list[dict] = []
    raw_items = payload.get("cart_items")
    if isinstance(raw_items, list):
        for entry in raw_items:
            if not isinstance(entry, dict):
                continue
            title = str(entry.get("title", "") or "").strip()
            image = str(entry.get("image") or entry.get("image_url") or entry.get("imageSrc") or "").strip()
            amount = str(entry.get("amount", "") or "").strip()
            plan = str(entry.get("plan", "") or "").strip().lower()
            playlist_raw = str(entry.get("playlist_id", "") or "").strip()
            playlist_id = int(playlist_raw) if playlist_raw.isdigit() else None
            row: dict = {"title": title, "image": image, "amount": amount}
            if plan:
                row["plan"] = plan
            if playlist_id is not None:
                row["playlist_id"] = playlist_id
            if title or image or plan or playlist_id is not None:
                items.append(row)
    if items:
        return items

    plan = str(payload.get("selected_plan", "") or "").strip().lower()
    playlist_raw = str(payload.get("playlist_id", "") or "").strip()
    playlist_id = int(playlist_raw) if playlist_raw.isdigit() else None
    title = str(payload.get("title", "") or "").strip()
    image = str(payload.get("image") or payload.get("image_url") or payload.get("imageSrc") or "").strip()
    amount = str(payload.get("selected_amount", "") or "").strip()
    if plan or playlist_id is not None:
        row = {"title": title, "image": image, "amount": amount}
        if plan:
            row["plan"] = plan
        if playlist_id is not None:
            row["playlist_id"] = playlist_id
        items.append(row)
    return items


def save_guest_checkout_receipt(session_id: str, payload: dict, session_meta: dict | None = None) -> None:
    sid = (session_id or "").strip()
    if not sid:
        return
    display_items = extract_display_items_from_payload(payload)
    meta = session_meta or {}
    meta_cart = parse_cart_items_from_metadata(meta) if meta else []
    if meta_cart and display_items:
        allowed_plans = {item.plan for item in meta_cart if item.plan}
        allowed_playlists = {item.playlist_id for item in meta_cart if item.playlist_id is not None}
        filtered = []
        for row in display_items:
            plan = str(row.get("plan", "") or "").strip().lower()
            playlist_id = row.get("playlist_id") if isinstance(row.get("playlist_id"), int) else None
            if plan and plan in allowed_plans:
                filtered.append(row)
            elif playlist_id is not None and playlist_id in allowed_playlists:
                filtered.append(row)
        if filtered:
            display_items = filtered
    # Enrich missing titles/images from database when possible.
    enriched: list[dict] = []
    for item in display_items:
        row = dict(item)
        playlist_id = row.get("playlist_id")
        if isinstance(playlist_id, int):
            pl = StreamPlaylist.objects.filter(pk=playlist_id).first()
            if pl is not None:
                if not row.get("title"):
                    row["title"] = pl.title
                if not row.get("image"):
                    row["image"] = _safe_media_url(pl.cover_image)
                if not row.get("amount") and pl.price is not None:
                    row["amount"] = str(pl.price)
        plan = str(row.get("plan", "") or "").strip().lower()
        if plan and not row.get("title"):
            row["title"] = vault_course_product_title(plan) or plan.replace("_", " ").title()
        enriched.append(row)

    GuestCheckoutReceipt.objects.update_or_create(
        stripe_checkout_session_id=sid,
        defaults={"items_json": json.dumps(enriched, separators=(",", ":"))},
    )


def load_unlocked_items_for_session(session_id: str, session_meta: dict) -> list[dict]:
    receipt = GuestCheckoutReceipt.objects.filter(stripe_checkout_session_id=session_id).first()
    items: list[dict] = []
    if receipt is not None and receipt.items_json:
        try:
            parsed = json.loads(receipt.items_json)
            if isinstance(parsed, list):
                items = [row for row in parsed if isinstance(row, dict)]
        except json.JSONDecodeError:
            items = []

    if items:
        return [
            {
                "title": str(row.get("title", "") or "").strip() or "Program unlock",
                "image": str(row.get("image", "") or "").strip(),
                "amount": str(row.get("amount", "") or "").strip(),
                "plan": str(row.get("plan", "") or "").strip().lower() or None,
                "playlist_id": row.get("playlist_id") if isinstance(row.get("playlist_id"), int) else None,
            }
            for row in items
        ]

    # Fallback from cart metadata + DB.
    cart_items = parse_cart_items_from_metadata(session_meta)
    out: list[dict] = []
    for item in cart_items:
        if item.playlist_id is not None:
            pl = StreamPlaylist.objects.filter(pk=item.playlist_id).first()
            out.append(
                {
                    "title": pl.title if pl else f"Playlist #{item.playlist_id}",
                    "image": _safe_media_url(pl.cover_image) if pl else "",
                    "amount": f"{item.amount_pence / 100:.2f}",
                    "plan": None,
                    "playlist_id": item.playlist_id,
                }
            )
        elif item.plan:
            out.append(
                {
                    "title": vault_course_product_title(item.plan) or item.plan.replace("_", " ").title(),
                    "image": "",
                    "amount": f"{item.amount_pence / 100:.2f}",
                    "plan": item.plan,
                    "playlist_id": None,
                }
            )
    if out:
        return out

    plan = str(session_meta.get("selected_plan", "") or "").strip().lower()
    playlist_id = str(session_meta.get("playlist_id", "") or "").strip()
    if playlist_id.isdigit():
        pl = StreamPlaylist.objects.filter(pk=int(playlist_id)).first()
        return [
            {
                "title": pl.title if pl else "Program playlist",
                "image": _safe_media_url(pl.cover_image) if pl else "",
                "amount": "",
                "plan": None,
                "playlist_id": int(playlist_id),
            }
        ]
    if plan:
        return [
            {
                "title": vault_course_product_title(plan) or plan.replace("_", " ").title(),
                "image": "",
                "amount": "",
                "plan": plan,
                "playlist_id": None,
            }
        ]
    return [{"title": "Your program unlock", "image": "", "amount": "", "plan": None, "playlist_id": None}]


def build_guest_checkout_metadata(payload: dict, cart_items: list) -> dict[str, str]:
    metadata: dict[str, str] = {
        "checkout_kind": "guest",
    }
    if cart_items:
        metadata["checkout_cart"] = "1"
        metadata["cart_items_json"] = cart_items_to_metadata_json(cart_items)
        first_plan = next((item.plan for item in cart_items if item.plan), "")
        if first_plan:
            metadata["selected_plan"] = first_plan
        first_playlist = next((item.playlist_id for item in cart_items if item.playlist_id is not None), None)
        if first_playlist is not None:
            metadata["playlist_id"] = str(first_playlist)
    affiliate_id = str(payload.get("affiliate_id", "")).strip()
    visitor_id = str(payload.get("visitor_id", "")).strip()
    if affiliate_id:
        metadata["affiliate_id"] = affiliate_id
    if visitor_id:
        metadata["visitor_id"] = visitor_id
    return metadata


def resolve_guest_line_items(
    payload: dict,
    *,
    currency: str,
    parse_pence,
    checkout_product_name,
    knight_blocked,
) -> tuple[list[dict], dict[str, str], str | None, list[str]]:
    """
    Build Stripe line items + metadata for guest checkout.
    Returns (line_items, metadata, error_message, excluded_owned_titles).
    When payload includes email/claim_email for an existing account, already-owned
    cart rows are dropped before Stripe so duplicates are not charged again.
    """
    excluded_owned: list[str] = []
    cart_items, cart_error = parse_cart_items_from_payload(payload)
    if cart_error:
        return [], {}, cart_error, []

    claim_email = str(payload.get("email") or payload.get("claim_email") or "").strip().lower()
    owner = find_user_by_email(claim_email) if claim_email else None

    if cart_items:
        if owner is not None:
            cart_items, excluded_owned, filter_error = filter_cart_items_excluding_owned(owner, cart_items)
            if filter_error:
                return [], {}, filter_error, excluded_owned
            if not cart_items:
                return [], {}, "You already own every program in this unlock bucket.", excluded_owned
        metadata = build_guest_checkout_metadata(payload, cart_items)
        return build_checkout_line_items_for_cart(cart_items, currency=currency), metadata, None, excluded_owned

    selected_playlist = None
    playlist_id_raw = str(payload.get("playlist_id", "")).strip()
    if playlist_id_raw:
        if not playlist_id_raw.isdigit():
            return [], {}, "Invalid playlist ID.", []
        selected_playlist = StreamPlaylist.objects.filter(
            id=int(playlist_id_raw),
            is_published=True,
            is_coming_soon=False,
        ).first()
        if selected_playlist is None:
            return [], {}, "Playlist not found.", []
        if selected_playlist.price <= 0:
            return [], {}, "Playlist price must be greater than 0.", []
        if owner is not None and user_owns_checkout_selection(owner, playlist=selected_playlist):
            return [], {}, "You already own this playlist.", [selected_playlist.title]

    plan_raw = str(payload.get("selected_plan", "")).strip().lower()
    if plan_raw and knight_blocked(plan_raw):
        return [], {}, "The Knight membership is coming soon and is not available for purchase yet.", []

    if selected_playlist is None and not plan_raw:
        return [], {}, "Add at least one program to checkout.", []

    if owner is not None and plan_raw and user_owns_checkout_selection(owner, plan_raw=plan_raw):
        return [], {}, "You already own this program.", [checkout_product_name(plan_raw=plan_raw)]

    metadata: dict[str, str] = {"checkout_kind": "guest"}
    if plan_raw:
        metadata["selected_plan"] = plan_raw
    if selected_playlist is not None:
        metadata["playlist_id"] = str(selected_playlist.id)
    affiliate_id = str(payload.get("affiliate_id", "")).strip()
    visitor_id = str(payload.get("visitor_id", "")).strip()
    if affiliate_id:
        metadata["affiliate_id"] = affiliate_id
    if visitor_id:
        metadata["visitor_id"] = visitor_id

    unit_amount = (
        int(max(50, round(float(selected_playlist.price) * 100)))
        if selected_playlist is not None
        else (parse_pence(payload.get("selected_amount")) or settings.CHECKOUT_AMOUNT_PENCE)
    )
    product_name = checkout_product_name(
        plan_raw=plan_raw,
        playlist_title=selected_playlist.title if selected_playlist is not None else None,
    )
    line_items = build_checkout_line_items(
        plan_raw=plan_raw,
        product_name=product_name,
        unit_amount=unit_amount,
        currency=currency,
    )
    return line_items, metadata, None, excluded_owned


def guest_session_mode(metadata: dict[str, str]) -> str:
    return checkout_session_mode(str(metadata.get("selected_plan", "") or ""))


def guest_success_payload(session, session_meta: dict, *, paid_amount: float, paid_currency: str) -> dict[str, Any]:
    claim = GuestCheckoutClaim.objects.filter(stripe_checkout_session_id=session.id).select_related("user").first()
    if claim is not None and claim.user_id:
        auth_token, _ = Token.objects.get_or_create(user=claim.user)
        return {
            "needs_claim": False,
            "already_claimed": True,
            "message": "Payment already linked to your account.",
            "email": claim.user.email,
            "token": auth_token.key,
            "user": {"id": claim.user.id, "username": claim.user.username, "email": claim.user.email},
            "redirect_url": "/dashboard?section=programs",
            "amount_paid": paid_amount,
            "currency": paid_currency,
            "selected_plan": str(session_meta.get("selected_plan", "") or "").strip().lower() or None,
            "playlist_id": int(session_meta["playlist_id"])
            if str(session_meta.get("playlist_id", "")).isdigit()
            else None,
        }

    unlocked_items = load_unlocked_items_for_session(session.id, session_meta)
    titles = [str(item.get("title", "") or "").strip() for item in unlocked_items if str(item.get("title", "")).strip()]
    if not titles:
        titles = ["Your program unlock"]

    return {
        "needs_claim": True,
        "message": "Payment successful. Enter your email to unlock access.",
        "session_id": session.id,
        "amount_paid": paid_amount,
        "currency": paid_currency,
        "unlocked_titles": titles,
        "unlocked_items": unlocked_items,
        "selected_plan": str(session_meta.get("selected_plan", "") or "").strip().lower() or None,
        "playlist_id": int(session_meta["playlist_id"])
        if str(session_meta.get("playlist_id", "")).isdigit()
        else None,
        "cart_count": max(len(unlocked_items), 1),
    }


def ensure_session_is_guest_paid(session, session_meta: dict) -> str | None:
    if not checkout_session_is_paid(session):
        return "Payment not completed."
    if str(session_meta.get("checkout_kind", "") or "").strip() != "guest":
        return "This checkout session cannot be claimed this way."
    return None


def claim_and_fulfill_guest_checkout(
    *,
    user: User,
    session,
    session_meta: dict,
    paid_amount: float,
    paid_currency: str,
) -> GuestCheckoutClaim:
    plan_sel, playlist_id, _was_recorded = fulfill_checkout_session_for_user(
        user,
        session,
        session_meta,
        paid_amount=paid_amount,
        paid_currency=paid_currency,
    )
    claim, _ = GuestCheckoutClaim.objects.update_or_create(
        stripe_checkout_session_id=session.id,
        defaults={
            "email": (user.email or "").strip().lower(),
            "user": user,
            "claimed_at": timezone.now(),
            "selected_plan": plan_sel or "",
            "playlist_id": playlist_id if str(playlist_id).isdigit() else "",
        },
    )
    return claim


def unique_pending_username() -> str:
    for _ in range(32):
        candidate = f"syn_{secrets.token_hex(10)}"
        if not User.objects.filter(username=candidate).exists():
            return candidate
    return f"syn_{secrets.token_hex(16)}"


def ensure_pending_signup_for_claim(email: str) -> PendingSignup:
    pending, created = PendingSignup.objects.get_or_create(
        email=email,
        defaults={
            "username": unique_pending_username(),
            "password_hash": make_password(secrets.token_urlsafe(48)),
            "is_paid": False,
            "stripe_checkout_session_id": "",
        },
    )
    if not created and not pending.password_hash:
        pending.password_hash = make_password(secrets.token_urlsafe(48))
        pending.save(update_fields=["password_hash", "updated_at"])
    return pending
