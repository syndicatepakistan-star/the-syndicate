"""Stacked commercial access: Money Mastery (lifetime programs) vs Knight (monthly Syndicate + Membership)."""

from __future__ import annotations

from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser
from django.utils import timezone

from apps.portal.models import UserDashboardEntitlement, UserPlanPurchase

_KNIGHT_PLAN_SLUGS = frozenset({"king", "knight"})
_KNIGHT_PERIOD_DAYS = 30


def _entitlement(user: AbstractBaseUser) -> UserDashboardEntitlement | None:
    if not user or not getattr(user, "is_authenticated", False):
        return None
    try:
        return user.dashboard_entitlement
    except UserDashboardEntitlement.DoesNotExist:
        return None


def user_has_money_mastery(user: AbstractBaseUser) -> bool:
    """Lifetime Money Mastery unlocks every program, vault module, and nested lesson."""
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    ent = _entitlement(user)
    if ent is not None and ent.money_mastery_lifetime:
        return True
    if ent is not None and ent.access_tier in (
        UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        UserDashboardEntitlement.AccessTier.FULL,
    ):
        return True
    return UserPlanPurchase.objects.filter(
        user=user,
        plan_slug="bundle",
        status=UserPlanPurchase.Status.PAID,
    ).exists()


def knight_subscription_expires_at(user: AbstractBaseUser):
    ent = _entitlement(user)
    if ent is None:
        return None
    return ent.king_subscription_expires_at


def user_has_active_knight_subscription(user: AbstractBaseUser) -> bool:
    """Active Knight unlocks Syndicate Mode and Membership (not programs unless also Money Mastery)."""
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    ent = _entitlement(user)
    if ent is None:
        return False
    expires = ent.king_subscription_expires_at
    return expires is not None and expires > timezone.now()


def _latest_knight_purchase(user: AbstractBaseUser) -> UserPlanPurchase | None:
    return (
        UserPlanPurchase.objects.filter(
            user=user,
            plan_slug__in=_KNIGHT_PLAN_SLUGS,
            status=UserPlanPurchase.Status.PAID,
        )
        .order_by("-paid_at", "-id")
        .first()
    )


def _resolve_access_tier(user: AbstractBaseUser, ent: UserDashboardEntitlement) -> str:
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return UserDashboardEntitlement.AccessTier.FULL
    if ent.king_subscription_expires_at and ent.king_subscription_expires_at > timezone.now():
        return UserDashboardEntitlement.AccessTier.KING
    if ent.money_mastery_lifetime or user_has_money_mastery(user):
        return UserDashboardEntitlement.AccessTier.MONEY_MASTERY
    return UserDashboardEntitlement.AccessTier.NONE


def sync_entitlement_access_tier(user: AbstractBaseUser) -> bool:
    """Recompute stored access_tier from stacked flags. Returns True when tier changed."""
    if not user or not getattr(user, "is_authenticated", False):
        return False
    ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
    target = _resolve_access_tier(user, ent)
    if ent.access_tier == target:
        return False
    ent.access_tier = target
    ent.save(update_fields=["access_tier", "updated_at"])
    return True


def refresh_knight_subscription(user: AbstractBaseUser) -> bool:
    """
    Expire Knight when past due and sync tier.
    Backfills a 30-day window for legacy Knight rows missing an expiry timestamp.
    """
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return False

    ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
    changed = False
    now = timezone.now()
    update_fields: list[str] = []

    if ent.king_subscription_expires_at is None:
        latest = _latest_knight_purchase(user)
        if latest is not None:
            ent.king_subscription_expires_at = latest.paid_at + timedelta(days=_KNIGHT_PERIOD_DAYS)
            changed = True
            update_fields.append("king_subscription_expires_at")

    if ent.king_subscription_expires_at and ent.king_subscription_expires_at <= now:
        ent.king_subscription_expires_at = None
        ent.stripe_knight_subscription_id = ""
        changed = True
        update_fields.extend(["king_subscription_expires_at", "stripe_knight_subscription_id"])

    target = _resolve_access_tier(user, ent)
    if ent.access_tier != target:
        ent.access_tier = target
        changed = True
        update_fields.append("access_tier")

    if changed:
        update_fields.append("updated_at")
        ent.save(update_fields=list(dict.fromkeys(update_fields)))
    return changed


def mark_money_mastery_lifetime(user: AbstractBaseUser) -> None:
    ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
    ent.money_mastery_lifetime = True
    ent.access_tier = _resolve_access_tier(user, ent)
    ent.save(update_fields=["money_mastery_lifetime", "access_tier", "updated_at"])


def activate_knight_subscription(
    user: AbstractBaseUser,
    expires_at,
    *,
    stripe_subscription_id: str = "",
) -> None:
    ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
    ent.king_subscription_expires_at = expires_at
    if stripe_subscription_id:
        ent.stripe_knight_subscription_id = stripe_subscription_id.strip()[:255]
    ent.access_tier = UserDashboardEntitlement.AccessTier.KING
    ent.save(
        update_fields=[
            "king_subscription_expires_at",
            "stripe_knight_subscription_id",
            "access_tier",
            "updated_at",
        ]
    )


def default_knight_expiry_from_now():
    return timezone.now() + timedelta(days=_KNIGHT_PERIOD_DAYS)


def knight_expiry_from_stripe_session(session):
    """Read subscription period end from a Stripe Checkout Session (falls back to 30 days)."""
    sub_id = getattr(session, "subscription", None)
    if sub_id:
        try:
            import stripe
            from django.conf import settings

            stripe.api_key = settings.STRIPE_SECRET_KEY
            sub = stripe.Subscription.retrieve(str(sub_id))
            period_end = getattr(sub, "current_period_end", None)
            if period_end:
                from datetime import datetime, timezone as dt_timezone

                return datetime.fromtimestamp(int(period_end), tz=dt_timezone.utc)
        except Exception:
            pass
    return default_knight_expiry_from_now()
