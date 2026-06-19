"""Detect when checkout should skip Stripe because the user already owns the selection."""

from __future__ import annotations

from django.http import JsonResponse

from apps.portal.commercial_access import user_has_active_knight_subscription, user_has_money_mastery
from apps.portal.models import UserPlanPurchase
from apps.video_streaming.entitlements import playlist_included_by_entitlement
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
