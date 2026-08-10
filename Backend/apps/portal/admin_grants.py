"""Staff grant-by-email: write the same entitlement tables Stripe fulfillment uses ($0 synthetic sessions)."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from accounts.level1_category_packs import (
    LEVEL1_CATEGORY_PACK_SLUGS,
    LEVEL1_CATEGORY_PACK_TITLES,
    grant_level1_category_pack_playlists,
    is_level1_category_pack_slug,
)
from accounts.vault_plan_catalog import (
    VAULT_COURSE_TITLES,
    VAULT_PACK_DISPLAY_TITLES,
    VAULT_PACK_SLUGS,
    is_vault_course_plan_slug,
    vault_course_billing_title,
)
from apps.courses.models import Course, CourseEnrollment
from apps.portal.commercial_access import (
    activate_knight_subscription,
    mark_money_mastery_lifetime,
    sync_entitlement_access_tier,
)
from apps.portal.models import UserDashboardEntitlement, UserPlanPurchase
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase

User = get_user_model()
logger = logging.getLogger(__name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_KNIGHT_SLUGS = frozenset({"king", "knight"})
_MM_SLUGS = frozenset({"bundle", "pawn"})
_PLAN_ENTITLEMENT_SLUGS = frozenset({"bundle", "king", "pawn", "knight"})

_TRADING_MODULE_TITLES = {
    "trading_scalpel_protocol": "The Scalpel Protocol",
    "trading_master_strategies": "Strategies of a Master Trader",
    "trading_master_setups": "Setups of a Master Trader",
    "trading_master_secrets": "Secrets of a Master Trader",
}

_PRIMARY_PLAN_TITLES = {
    "bundle": "Money Mastery (lifetime bundle)",
    "king": "The Knight",
    "knight": "The Knight",
    "pawn": "Pawn",
}


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def is_valid_email(email: str) -> bool:
    return bool(_EMAIL_RE.match(normalize_email(email)))


def ensure_user_for_email(email: str) -> tuple[Any, bool]:
    """Return (user, created). Creates an unusable-password account when missing."""
    from accounts.views import _canonical_user_for_email

    e = normalize_email(email)
    user = _canonical_user_for_email(e)
    if user is not None:
        if not (user.email or "").strip():
            user.email = e
            user.save(update_fields=["email"])
        return user, False

    base = re.sub(r"[^a-z0-9._+-]", "_", e)[:120] or "user"
    username = base[:150]
    suffix = 2
    while User.objects.filter(username=username).exists():
        username = f"{base[:140]}_{suffix}"
        suffix += 1
    user = User(username=username, email=e)
    user.set_unusable_password()
    user.save()
    UserDashboardEntitlement.objects.get_or_create(user=user)
    return user, True


def resolve_knight_expiry(
    duration_type: str,
    *,
    days: int | None = None,
    expires_at: str | None = None,
):
    """Resolve Knight expiry. Lifetime → ~100 years; month → +30d; days → +N; custom → ISO datetime."""
    now = timezone.now()
    kind = (duration_type or "lifetime").strip().lower()
    if kind == "lifetime":
        return now + timedelta(days=365 * 100)
    if kind == "month":
        return now + timedelta(days=30)
    if kind == "days":
        n = int(days or 0)
        if n < 1:
            raise ValueError("days must be >= 1")
        if n > 3650:
            raise ValueError("days must be <= 3650")
        return now + timedelta(days=n)
    if kind == "custom":
        raw = (expires_at or "").strip()
        if not raw:
            raise ValueError("expires_at is required for custom duration")
        dt = parse_datetime(raw)
        if dt is None:
            try:
                dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValueError("expires_at must be a valid ISO datetime") from exc
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())
        if dt <= now:
            raise ValueError("expires_at must be in the future")
        return dt
    raise ValueError("duration type must be lifetime, month, days, or custom")


def _admin_plan_session_id(user_id: int, plan_slug: str) -> str:
    return f"admin_grant_plan_{user_id}_{plan_slug}"[:255]


def _admin_playlist_session_id(user_id: int, playlist_id: int) -> str:
    return f"admin_grant_pl_{user_id}_{playlist_id}"[:255]


def _plan_product_title(plan_slug: str) -> str:
    plan = (plan_slug or "").strip().lower()
    return (
        vault_course_billing_title(plan)
        or _PRIMARY_PLAN_TITLES.get(plan)
        or VAULT_PACK_DISPLAY_TITLES.get(plan)
        or LEVEL1_CATEGORY_PACK_TITLES.get(plan)
        or _TRADING_MODULE_TITLES.get(plan)
        or plan
    )


def is_grantable_plan_slug(plan: str) -> bool:
    plan = (plan or "").strip().lower()
    if plan in _PLAN_ENTITLEMENT_SLUGS:
        return True
    if plan in VAULT_PACK_SLUGS:
        return True
    if plan in _TRADING_MODULE_TITLES:
        return True
    if is_level1_category_pack_slug(plan):
        return True
    if is_vault_course_plan_slug(plan):
        return True
    return False


def _record_plan_purchase(user, plan_slug: str) -> str:
    sid = _admin_plan_session_id(user.id, plan_slug)
    UserPlanPurchase.objects.update_or_create(
        stripe_checkout_session_id=sid,
        defaults={
            "user": user,
            "plan_slug": plan_slug[:32],
            "product_title": _plan_product_title(plan_slug)[:255],
            "amount_paid": Decimal("0.00"),
            "currency": (getattr(settings, "DEFAULT_CURRENCY", "usd") or "usd")[:8],
            "status": UserPlanPurchase.Status.PAID,
            "paid_at": timezone.now(),
        },
    )
    return sid


def _grant_single_plan(user, plan_slug: str, knight_expires_at) -> dict[str, Any]:
    plan = (plan_slug or "").strip().lower()
    if not is_grantable_plan_slug(plan):
        return {"slug": plan, "ok": False, "error": "unknown_plan"}

    sid = _record_plan_purchase(user, plan)
    detail: dict[str, Any] = {"slug": plan, "ok": True, "session_id": sid}

    if plan in _MM_SLUGS or plan == "bundle":
        mark_money_mastery_lifetime(user)
        enrolled = 0
        for course in Course.objects.filter(is_published=True):
            _, created = CourseEnrollment.objects.get_or_create(user=user, course=course)
            if created:
                enrolled += 1
        detail["money_mastery"] = True
        detail["courses_enrolled"] = enrolled
    elif plan in _KNIGHT_SLUGS:
        activate_knight_subscription(user, knight_expires_at)
        detail["knight_expires_at"] = knight_expires_at.isoformat()
    elif is_level1_category_pack_slug(plan):
        count = grant_level1_category_pack_playlists(
            user,
            plan,
            session_id=sid,
            paid_currency=getattr(settings, "DEFAULT_CURRENCY", "usd"),
        )
        detail["level1_playlists_granted"] = count

    sync_entitlement_access_tier(user)
    return detail


def _grant_playlist(user, playlist_id: int) -> dict[str, Any]:
    try:
        playlist = StreamPlaylist.objects.get(pk=int(playlist_id))
    except (StreamPlaylist.DoesNotExist, TypeError, ValueError):
        return {"playlist_id": playlist_id, "ok": False, "error": "not_found"}

    sid = _admin_playlist_session_id(user.id, playlist.id)
    purchase, _ = StreamPlaylistPurchase.objects.update_or_create(
        user=user,
        playlist=playlist,
        defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "amount_paid": Decimal("0.00"),
            "currency": (getattr(settings, "DEFAULT_CURRENCY", "usd") or "usd")[:12],
            "paid_at": timezone.now(),
            "stripe_session_id": sid,
            "stripe_checkout_session_id": sid,
        },
    )
    if purchase.status != StreamPlaylistPurchase.Status.PAID:
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.paid_at = timezone.now()
        purchase.amount_paid = Decimal("0.00")
        purchase.stripe_session_id = sid
        purchase.stripe_checkout_session_id = sid
        purchase.save(
            update_fields=[
                "status",
                "paid_at",
                "amount_paid",
                "stripe_session_id",
                "stripe_checkout_session_id",
                "updated_at",
            ]
        )
    return {
        "playlist_id": playlist.id,
        "title": playlist.title,
        "ok": True,
        "session_id": sid,
    }


@transaction.atomic
def grant_access_by_email(
    email: str,
    *,
    plan_slugs: list[str] | None = None,
    playlist_ids: list[int] | None = None,
    duration_type: str = "lifetime",
    days: int | None = None,
    expires_at: str | None = None,
    create_user_if_missing: bool = True,
) -> dict[str, Any]:
    e = normalize_email(email)
    if not is_valid_email(e):
        raise ValueError("Invalid email address")

    plans = sorted({(p or "").strip().lower() for p in (plan_slugs or []) if (p or "").strip()})
    playlists = sorted({int(pid) for pid in (playlist_ids or []) if pid is not None})
    if not plans and not playlists:
        raise ValueError("Select at least one plan or playlist")

    from accounts.views import _canonical_user_for_email

    existing = _canonical_user_for_email(e)
    if existing is None and not create_user_if_missing:
        raise ValueError("No account for this email")

    user, created = ensure_user_for_email(e) if existing is None else (existing, False)

    needs_knight_expiry = any(p in _KNIGHT_SLUGS for p in plans)
    knight_expires = None
    if needs_knight_expiry:
        knight_expires = resolve_knight_expiry(duration_type, days=days, expires_at=expires_at)

    plan_results = []
    for slug in plans:
        try:
            plan_results.append(_grant_single_plan(user, slug, knight_expires))
        except Exception as exc:
            logger.exception("Admin grant failed for plan=%s user_id=%s", slug, user.id)
            plan_results.append({"slug": slug, "ok": False, "error": str(exc)})

    playlist_results = [_grant_playlist(user, pid) for pid in playlists]
    sync_entitlement_access_tier(user)

    ent = UserDashboardEntitlement.objects.filter(user=user).first()
    return {
        "email": e,
        "user_id": user.id,
        "username": user.username,
        "user_created": created,
        "duration_type": (duration_type or "lifetime").strip().lower(),
        "knight_expires_at": knight_expires.isoformat() if knight_expires else None,
        "plans": plan_results,
        "playlists": playlist_results,
        "entitlement": {
            "money_mastery_lifetime": bool(ent and ent.money_mastery_lifetime),
            "knight_subscription_expires_at": (
                ent.king_subscription_expires_at.isoformat()
                if ent and ent.king_subscription_expires_at
                else None
            ),
            "access_tier": ent.access_tier if ent else None,
        },
    }


def build_grant_catalog() -> dict[str, Any]:
    plans: list[dict[str, str]] = [
        {"slug": "bundle", "title": "Money Mastery Bundle", "group": "primary"},
        {"slug": "king", "title": "The Knight", "group": "primary"},
    ]
    for slug in sorted(VAULT_PACK_SLUGS):
        plans.append(
            {
                "slug": slug,
                "title": VAULT_PACK_DISPLAY_TITLES.get(slug, slug),
                "group": "vault_pack",
            }
        )
    for slug, title in _TRADING_MODULE_TITLES.items():
        plans.append({"slug": slug, "title": title, "group": "trading_module"})
    for slug in sorted(LEVEL1_CATEGORY_PACK_SLUGS):
        plans.append(
            {
                "slug": slug,
                "title": LEVEL1_CATEGORY_PACK_TITLES.get(slug, slug),
                "group": "level1_pack",
            }
        )
    for slug, title in sorted(VAULT_COURSE_TITLES.items()):
        pack = "vault_course"
        if slug.startswith("agentic_ai"):
            pack = "agentic_ai_course"
        elif slug.startswith("ai_content"):
            pack = "ai_content_course"
        elif slug.startswith("trading_"):
            pack = "trading_course"
        plans.append({"slug": slug, "title": title, "group": pack})

    playlists = [
        {
            "id": p["id"],
            "title": p["title"],
            "category": p.get("category") or "",
            "vault_plan_slug": p.get("vault_plan_slug") or "",
        }
        for p in StreamPlaylist.objects.filter(is_published=True)
        .order_by("title")
        .values("id", "title", "category", "vault_plan_slug")
    ]
    return {"plans": plans, "playlists": playlists}


def lookup_user_access(email: str) -> dict[str, Any]:
    from accounts.views import _canonical_user_for_email

    e = normalize_email(email)
    if not is_valid_email(e):
        raise ValueError("Invalid email address")
    user = _canonical_user_for_email(e)
    if user is None:
        return {"email": e, "exists": False}

    ent = UserDashboardEntitlement.objects.filter(user=user).first()
    plan_slugs = list(
        UserPlanPurchase.objects.filter(user=user, status=UserPlanPurchase.Status.PAID)
        .order_by("plan_slug")
        .values_list("plan_slug", flat=True)
        .distinct()
    )
    playlist_ids = list(
        StreamPlaylistPurchase.objects.filter(user=user, status=StreamPlaylistPurchase.Status.PAID)
        .order_by("playlist_id")
        .values_list("playlist_id", flat=True)
    )
    return {
        "email": e,
        "exists": True,
        "user_id": user.id,
        "username": user.username,
        "entitlement": {
            "money_mastery_lifetime": bool(ent and ent.money_mastery_lifetime),
            "knight_subscription_expires_at": (
                ent.king_subscription_expires_at.isoformat()
                if ent and ent.king_subscription_expires_at
                else None
            ),
            "access_tier": ent.access_tier if ent else None,
        },
        "plan_slugs": plan_slugs,
        "playlist_ids": playlist_ids,
    }
