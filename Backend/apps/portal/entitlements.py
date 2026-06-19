from __future__ import annotations

from django.contrib.auth import get_user_model

from apps.courses.models import Course, CourseEnrollment
from apps.portal.commercial_access import (
    activate_knight_subscription,
    default_knight_expiry_from_now,
    knight_expiry_from_stripe_session,
    mark_money_mastery_lifetime,
    refresh_knight_subscription,
    sync_entitlement_access_tier,
)
from apps.portal.models import UserDashboardEntitlement, UserPlanPurchase

User = get_user_model()

_PLAN_SLUGS = frozenset({"bundle", "king", "pawn", "knight"})


def apply_purchased_plan(user: User, plan: str) -> bool:
    """
    Upgrade dashboard entitlement from a plan slug (Stripe checkout metadata).
    Money Mastery and Knight stack — Knight is monthly; Money Mastery is lifetime programs.
    Returns True when stored entitlement fields changed.
    """
    plan = (plan or "").strip().lower()
    if plan not in _PLAN_SLUGS:
        return False

    refresh_knight_subscription(user)
    ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
    before_tier = ent.access_tier
    before_mm = ent.money_mastery_lifetime
    before_expiry = ent.king_subscription_expires_at

    if plan == "bundle":
        mark_money_mastery_lifetime(user)
        for course in Course.objects.filter(is_published=True):
            CourseEnrollment.objects.get_or_create(user=user, course=course)
    elif plan in ("king", "knight"):
        activate_knight_subscription(user, default_knight_expiry_from_now())

    sync_entitlement_access_tier(user)
    ent.refresh_from_db()
    return (
        ent.access_tier != before_tier
        or ent.money_mastery_lifetime != before_mm
        or ent.king_subscription_expires_at != before_expiry
    )


def apply_purchased_plan_from_checkout(user: User, plan: str, session) -> bool:
    """Apply plan entitlements using Stripe session data (Knight subscription period end)."""
    plan = (plan or "").strip().lower()
    if plan not in _PLAN_SLUGS:
        return False

    refresh_knight_subscription(user)
    ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
    before_tier = ent.access_tier
    before_mm = ent.money_mastery_lifetime
    before_expiry = ent.king_subscription_expires_at

    if plan == "bundle":
        mark_money_mastery_lifetime(user)
        for course in Course.objects.filter(is_published=True):
            CourseEnrollment.objects.get_or_create(user=user, course=course)
    elif plan in ("king", "knight"):
        sub_id = str(getattr(session, "subscription", "") or "")
        activate_knight_subscription(
            user,
            knight_expiry_from_stripe_session(session),
            stripe_subscription_id=sub_id,
        )

    sync_entitlement_access_tier(user)
    ent.refresh_from_db()
    return (
        ent.access_tier != before_tier
        or ent.money_mastery_lifetime != before_mm
        or ent.king_subscription_expires_at != before_expiry
    )


def reconcile_dashboard_entitlement_from_plan_purchases(user: User) -> bool:
    """
    Repair tier when billing shows a paid plan but entitlement was not updated
    (e.g. checkout apply failed while purchase row was written).
    """
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return False

    paid_slugs = set(
        UserPlanPurchase.objects.filter(
            user=user,
            status=UserPlanPurchase.Status.PAID,
            plan_slug__in=_PLAN_SLUGS,
        ).values_list("plan_slug", flat=True)
    )
    if not paid_slugs:
        return refresh_knight_subscription(user)

    changed = refresh_knight_subscription(user)
    if "bundle" in paid_slugs:
        mark_money_mastery_lifetime(user)
        changed = True
    if "king" in paid_slugs or "knight" in paid_slugs:
        ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
        if ent.king_subscription_expires_at is None:
            activate_knight_subscription(user, default_knight_expiry_from_now())
            changed = True
    changed = sync_entitlement_access_tier(user) or changed
    return changed
