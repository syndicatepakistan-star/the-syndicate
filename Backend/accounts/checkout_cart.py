"""Multi-plan and playlist unlock cart checkout (one-time payment line items only)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from accounts.checkout_ownership import user_owns_checkout_selection
from accounts.vault_plan_catalog import is_vault_course_plan_slug, vault_course_product_title
from apps.video_streaming.models import StreamPlaylist

_CART_BLOCKED_ROOT_PLANS = frozenset({"bundle", "king", "knight", "pawn"})
_KNIGHT_PLANS = frozenset({"king", "knight"})
_RECORDABLE_ROOT_PLANS = frozenset(
    {
        "agentic_ai",
        "ai_content_automation",
        "trading_technical_analysis",
        "trading_scalpel_protocol",
        "trading_master_strategies",
        "trading_master_setups",
        "trading_master_secrets",
    }
)
_KNIGHT_CHECKOUT_BLOCKED = True

_PLAN_PRODUCT_TITLES = {
    "agentic_ai": "Agentic AI — lifetime access",
    "ai_content_automation": "AI Content Automation — lifetime access",
    "trading_technical_analysis": "Trading Advanced Technical Analysis — lifetime access",
    "trading_scalpel_protocol": "The Scalpel Protocol — lifetime access",
    "trading_master_strategies": "Strategies of a Master Trader — lifetime access",
    "trading_master_setups": "Setups of a Master Trader — lifetime access",
    "trading_master_secrets": "Secrets of a Master Trader — lifetime access",
}


@dataclass(frozen=True)
class CartCheckoutItem:
    amount_pence: int
    plan: str | None = None
    playlist_id: int | None = None


def _parse_pence_from_amount_payload(raw) -> int | None:
    if raw is None:
        return None
    s = re.sub(r"[^0-9.]", "", str(raw).strip())
    if not s:
        return None
    try:
        v = float(s)
        return int(max(50, round(v * 100)))
    except ValueError:
        return None


def _is_recordable_plan_slug(plan: str) -> bool:
    plan = (plan or "").strip().lower()
    if plan in _RECORDABLE_ROOT_PLANS:
        return True
    return is_vault_course_plan_slug(plan)


def _knight_plan_checkout_blocked(plan_raw: str) -> bool:
    if not _KNIGHT_CHECKOUT_BLOCKED:
        return False
    return (plan_raw or "").strip().lower() in ("king", "knight")


def _checkout_product_name(*, plan_raw: str = "", playlist_title: str | None = None) -> str:
    if playlist_title:
        title = playlist_title.strip()
        return f"{title} playlist access" if title else "The Syndicate — playlist access"
    plan = (plan_raw or "").strip().lower()
    vault_name = vault_course_product_title(plan)
    if vault_name:
        return vault_name
    return _PLAN_PRODUCT_TITLES.get(plan, "The Syndicate — checkout")


def _is_knight_subscription_plan(plan_raw: str) -> bool:
    return (plan_raw or "").strip().lower() in _KNIGHT_PLANS


def _normalize_plan_slug(raw: str) -> str:
    return (raw or "").strip().lower()


def _cart_item_key(item: CartCheckoutItem) -> str:
    if item.playlist_id is not None:
        return f"playlist:{item.playlist_id}"
    return f"plan:{item.plan or ''}"


def is_cart_eligible_plan_slug(plan_raw: str) -> bool:
    plan = _normalize_plan_slug(plan_raw)
    if not plan or plan in _CART_BLOCKED_ROOT_PLANS:
        return False
    if _is_knight_subscription_plan(plan):
        return False
    return _is_recordable_plan_slug(plan)


def _resolve_cart_playlist(playlist_id: int) -> StreamPlaylist | None:
    return StreamPlaylist.objects.filter(
        id=playlist_id,
        is_published=True,
        is_coming_soon=False,
    ).first()


def parse_cart_items_from_payload(payload: dict) -> tuple[list[CartCheckoutItem], str | None]:
    """Parse and validate cart_items from checkout JSON. Returns (items, error_message)."""
    raw_items = payload.get("cart_items")
    if raw_items is None:
        return [], None
    if not isinstance(raw_items, list):
        return [], "cart_items must be a list."

    items: list[CartCheckoutItem] = []
    seen: set[str] = set()

    for entry in raw_items:
        if not isinstance(entry, dict):
            return [], "Each cart item must be an object."

        plan = _normalize_plan_slug(str(entry.get("plan", "")))
        playlist_id_raw = str(entry.get("playlist_id", "")).strip()
        playlist_id = int(playlist_id_raw) if playlist_id_raw.isdigit() else None

        if plan and playlist_id is not None:
            return [], "Each cart item must be either a plan or a playlist — not both."
        if not plan and playlist_id is None:
            return [], "Each cart item requires a plan slug or playlist_id."

        amount_pence = _parse_pence_from_amount_payload(entry.get("amount"))
        if amount_pence is None:
            return [], "Invalid amount for cart item."

        if playlist_id is not None:
            playlist = _resolve_cart_playlist(playlist_id)
            if playlist is None:
                return [], f"Playlist not found: {playlist_id}."
            if playlist.price <= 0:
                return [], f"Playlist price must be greater than 0: {playlist_id}."
            item = CartCheckoutItem(playlist_id=playlist_id, amount_pence=amount_pence)
        else:
            if not is_cart_eligible_plan_slug(plan):
                return [], f"Plan cannot be added to unlock cart: {plan}."
            item = CartCheckoutItem(plan=plan, amount_pence=amount_pence)

        key = _cart_item_key(item)
        if key in seen:
            return [], f"Duplicate item in cart: {key}."
        seen.add(key)
        items.append(item)

    if not items:
        return [], "Unlock cart is empty."
    if len(items) > 20:
        return [], "Unlock cart supports up to 20 programs per checkout."

    return items, None


def cart_items_to_metadata_json(items: list[CartCheckoutItem]) -> str:
    payload: list[dict] = []
    for item in items:
        row: dict = {"amount": f"{item.amount_pence / 100:.2f}"}
        if item.playlist_id is not None:
            row["playlist_id"] = item.playlist_id
        else:
            row["plan"] = item.plan or ""
        payload.append(row)
    return json.dumps(payload, separators=(",", ":"))


def parse_cart_items_from_metadata(session_meta: dict) -> list[CartCheckoutItem]:
    raw = str(session_meta.get("cart_items_json", "") or "").strip()
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    items: list[CartCheckoutItem] = []
    for entry in parsed:
        if not isinstance(entry, dict):
            continue
        plan = _normalize_plan_slug(str(entry.get("plan", "")))
        playlist_id_raw = str(entry.get("playlist_id", "")).strip()
        playlist_id = int(playlist_id_raw) if playlist_id_raw.isdigit() else None
        amount_pence = _parse_pence_from_amount_payload(entry.get("amount"))
        if amount_pence is None:
            continue
        if playlist_id is not None:
            items.append(CartCheckoutItem(playlist_id=playlist_id, amount_pence=amount_pence))
        elif plan:
            items.append(CartCheckoutItem(plan=plan, amount_pence=amount_pence))
    return items


def validate_cart_items_for_user(user, items: list[CartCheckoutItem]) -> str | None:
    for item in items:
        if item.playlist_id is not None:
            playlist = _resolve_cart_playlist(item.playlist_id)
            if playlist is None:
                return f"Playlist not found: {item.playlist_id}."
            if user_owns_checkout_selection(user, playlist=playlist):
                return f"You already own: {_checkout_product_name(playlist_title=playlist.title)}."
            continue
        plan = item.plan or ""
        if _knight_plan_checkout_blocked(plan):
            return "The Knight membership cannot be purchased in a program cart."
        if user_owns_checkout_selection(user, plan_raw=plan):
            return f"You already own: {_checkout_product_name(plan_raw=plan)}."
    return None


def filter_cart_items_excluding_owned(
    user, items: list[CartCheckoutItem]
) -> tuple[list[CartCheckoutItem], list[str], str | None]:
    """
    Drop already-owned cart rows so checkout can proceed with the rest.
    Returns (kept_items, excluded_titles, hard_error).
    """
    kept: list[CartCheckoutItem] = []
    excluded: list[str] = []
    for item in items:
        if item.playlist_id is not None:
            playlist = _resolve_cart_playlist(item.playlist_id)
            if playlist is None:
                return [], [], f"Playlist not found: {item.playlist_id}."
            title = _checkout_product_name(playlist_title=playlist.title)
            if user is not None and user_owns_checkout_selection(user, playlist=playlist):
                excluded.append(title)
                continue
            kept.append(item)
            continue
        plan = item.plan or ""
        if _knight_plan_checkout_blocked(plan):
            return [], [], "The Knight membership cannot be purchased in a program cart."
        title = _checkout_product_name(plan_raw=plan)
        if user is not None and user_owns_checkout_selection(user, plan_raw=plan):
            excluded.append(title)
            continue
        kept.append(item)
    return kept, excluded, None


def build_stripe_cart_line_items(items: list[CartCheckoutItem], *, currency: str) -> list[dict]:
    line_items: list[dict] = []
    playlist_ids = [item.playlist_id for item in items if item.playlist_id is not None]
    playlists_by_id: dict[int, StreamPlaylist] = {}
    if playlist_ids:
        for playlist in StreamPlaylist.objects.filter(id__in=playlist_ids):
            playlists_by_id[playlist.id] = playlist

    for item in items:
        if item.playlist_id is not None:
            playlist = playlists_by_id.get(item.playlist_id)
            product_name = _checkout_product_name(playlist_title=playlist.title if playlist else None)
        else:
            product_name = _checkout_product_name(plan_raw=item.plan or "")
        line_items.append(
            {
                "price_data": {
                    "currency": currency,
                    "product_data": {"name": product_name},
                    "unit_amount": item.amount_pence,
                },
                "quantity": 1,
            }
        )
    return line_items


def cart_item_amount_decimal(item: CartCheckoutItem) -> Decimal:
    try:
        return Decimal(str(item.amount_pence)) / Decimal("100")
    except (InvalidOperation, ZeroDivisionError):
        return Decimal("0.00")


def is_vault_cart_checkout_metadata(session_meta: dict) -> bool:
    return str(session_meta.get("checkout_cart", "") or "").strip() == "1"


def purchase_record_session_key(stripe_session_id: str, plan_slug: str, *, cart_multi: bool) -> str:
    sid = (stripe_session_id or "").strip()
    plan = _normalize_plan_slug(plan_slug)
    if cart_multi and sid and plan:
        return f"{sid}:{plan}"
    return sid


def playlist_purchase_session_key(stripe_session_id: str, playlist_id: int, *, cart_multi: bool) -> str:
    sid = (stripe_session_id or "").strip()
    if cart_multi and sid and playlist_id:
        return f"{sid}:playlist:{playlist_id}"
    return sid
