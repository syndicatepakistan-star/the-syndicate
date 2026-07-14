"""Detect when checkout should skip Stripe because the user already owns the selection."""

from __future__ import annotations

from django.contrib.auth.models import User
from django.http import JsonResponse

from apps.portal.commercial_access import user_has_active_knight_subscription, user_has_money_mastery
from apps.portal.models import UserPlanPurchase
from apps.video_streaming.entitlements import playlist_included_by_entitlement
from apps.video_streaming.models import StreamPlaylist
from apps.video_streaming.vault_entitlements import user_has_vault_module_access


def user_owns_checkout_selection(user, *, plan_raw: str = "", playlist=None) -> bool:
    if user is None or not getattr(user, "is_authenticated", False):
        return False

    if playlist is not None:
        return playlist_included_by_entitlement(user, playlist.id)

    plan = (plan_raw or "").strip().lower()
    if not plan:
        return False

    if plan == "bundle":
        return user_has_money_mastery(user)

    if plan in ("king", "knight"):
        return user_has_active_knight_subscription(user)

    if user_has_money_mastery(user):
        return True

    if UserPlanPurchase.objects.filter(
        user=user,
        plan_slug=plan,
        status=UserPlanPurchase.Status.PAID,
    ).exists():
        return True

    return user_has_vault_module_access(user, plan)


def user_owns_display_item(user, item: dict) -> bool:
    """True when a receipt/cart display item is already owned by this account."""
    if user is None:
        return False
    playlist_id = item.get("playlist_id")
    if isinstance(playlist_id, int) and playlist_id > 0:
        playlist = StreamPlaylist.objects.filter(pk=playlist_id).first()
        if playlist is not None:
            return user_owns_checkout_selection(user, playlist=playlist)
    plan = str(item.get("plan", "") or "").strip().lower()
    if plan:
        return user_owns_checkout_selection(user, plan_raw=plan)
    return False


def partition_display_items_for_user(user, items: list[dict]) -> tuple[list[dict], list[dict]]:
    """Split unlocked display items into (already_owned, claimable_new)."""
    owned: list[dict] = []
    claimable: list[dict] = []
    for raw in items:
        if not isinstance(raw, dict):
            continue
        row = dict(raw)
        if user is not None and user_owns_display_item(user, row):
            row["already_owned"] = True
            owned.append(row)
        else:
            row["already_owned"] = False
            claimable.append(row)
    return owned, claimable


def find_user_by_email(email: str) -> User | None:
    cleaned = (email or "").strip().lower()
    if not cleaned:
        return None
    return User.objects.filter(email__iexact=cleaned).order_by("id").first()


def already_owned_checkout_response(*, plan_raw: str = "", playlist=None) -> JsonResponse:
    body: dict = {
        "is_unlocked": True,
        "already_purchased": True,
        "message": "Already active on this account.",
    }
    if playlist is not None:
        body["playlist_id"] = playlist.id
        body["message"] = "Playlist already unlocked."
    elif (plan_raw or "").strip():
        body["selected_plan"] = (plan_raw or "").strip().lower()
        body["message"] = "Plan already active for this account."
    return JsonResponse(body, status=200)
