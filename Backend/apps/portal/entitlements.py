from __future__ import annotations

from django.contrib.auth import get_user_model

from apps.courses.models import Course, CourseEnrollment
from apps.portal.models import UserDashboardEntitlement, UserPlanPurchase

User = get_user_model()

_PLAN_SLUGS = frozenset({"bundle", "king", "pawn", "knight"})


def apply_purchased_plan(user: User, plan: str) -> bool:
    """
    Upgrade dashboard entitlement from a plan slug (Stripe checkout metadata).
    Returns True when the stored tier changed.
    """
    plan = (plan or "").strip().lower()
    if plan not in _PLAN_SLUGS:
        return False

    ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
    current = ent.access_tier
    target = current

    if plan == "bundle":
        if current in (
            UserDashboardEntitlement.AccessTier.NONE,
            UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        ):
            target = UserDashboardEntitlement.AccessTier.MONEY_MASTERY
        for course in Course.objects.filter(is_published=True):
            CourseEnrollment.objects.get_or_create(user=user, course=course)
    elif plan in ("king", "knight"):
        if current != UserDashboardEntitlement.AccessTier.FULL:
            target = UserDashboardEntitlement.AccessTier.KING
    elif plan == "pawn":
        target = current

    if target == current:
        return False
    ent.access_tier = target
    ent.save(update_fields=["access_tier", "updated_at"])
    return True


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
        return False

    changed = False
    if "king" in paid_slugs or "knight" in paid_slugs:
        changed = apply_purchased_plan(user, "king") or changed
    if "bundle" in paid_slugs:
        changed = apply_purchased_plan(user, "bundle") or changed
    return changed
