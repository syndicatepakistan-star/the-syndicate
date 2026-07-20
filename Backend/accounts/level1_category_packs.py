"""Level 1 category unlock-all packs (Business Behaviour Psychology / Business Models)."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db.models import Q
from django.utils import timezone

LEVEL1_CATEGORY_PACK_SLUGS = frozenset(
    {
        "level1_business_psychology",
        "level1_business_models",
    }
)

LEVEL1_CATEGORY_BY_PLAN = {
    "level1_business_psychology": "business_psychology",
    "level1_business_models": "business_model",
}

LEVEL1_CATEGORY_PACK_TITLES = {
    "level1_business_psychology": "Business Behaviour Psychology — unlock all",
    "level1_business_models": "Business Models — unlock all",
}


def is_level1_category_pack_slug(plan: str) -> bool:
    return (plan or "").strip().lower() in LEVEL1_CATEGORY_PACK_SLUGS


def level1_category_pack_title(plan: str) -> str | None:
    return LEVEL1_CATEGORY_PACK_TITLES.get((plan or "").strip().lower())


def category_for_level1_pack(plan: str) -> str | None:
    return LEVEL1_CATEGORY_BY_PLAN.get((plan or "").strip().lower())


def _level1_playlists_qs(category: str):
    """
    Only the 11 Level 1 programs in a category.

    Vault packs (Agentic AI, AI Content, Trading, etc.) are also stored with
    category=business_model — they must NEVER be granted by Unlock All Models.
    """
    from accounts.level1_program_catalog import LEVEL1_BUSINESS_MODEL_PROGRAMS, LEVEL1_PSYCHOLOGY_PROGRAMS
    from apps.video_streaming.models import StreamPlaylist

    catalog_slugs = (
        {row.catalog_slug for row in LEVEL1_PSYCHOLOGY_PROGRAMS}
        if category == "business_psychology"
        else {row.catalog_slug for row in LEVEL1_BUSINESS_MODEL_PROGRAMS}
    )

    return StreamPlaylist.objects.filter(
        is_published=True,
        is_coming_soon=False,
        category=category,
        slug__in=catalog_slugs,
    ).filter(Q(vault_plan_slug="") | Q(vault_plan_slug__isnull=True))


def user_owns_level1_category_pack(user, plan: str) -> bool:
    """True when the pack was purchased or every Level 1 playlist in the category is unlocked."""
    from apps.portal.models import UserPlanPurchase
    from apps.video_streaming.entitlements import unlocked_stream_playlist_ids_for_user
    from apps.video_streaming.models import StreamPlaylist

    plan = (plan or "").strip().lower()
    category = category_for_level1_pack(plan)
    if not category:
        return False

    if UserPlanPurchase.objects.filter(
        user=user,
        plan_slug=plan,
        status=UserPlanPurchase.Status.PAID,
    ).exists():
        return True

    playlist_ids = list(_level1_playlists_qs(category).values_list("id", flat=True))
    if not playlist_ids:
        # Legacy DBs without level1-* slugs: still never grant/count vault-linked rows.
        playlist_ids = list(
            StreamPlaylist.objects.filter(
                is_published=True,
                is_coming_soon=False,
                category=category,
            )
            .filter(Q(vault_plan_slug="") | Q(vault_plan_slug__isnull=True))
            .values_list("id", flat=True)
        )
    if not playlist_ids:
        return False

    unlocked = unlocked_stream_playlist_ids_for_user(user)
    return all(pid in unlocked for pid in playlist_ids)


def grant_level1_category_pack_playlists(
    user,
    plan: str,
    *,
    session_id: str = "",
    paid_currency: str = "",
) -> int:
    """Mark only the 11 Level 1 playlists in the pack category as paid. Returns count granted/updated."""
    from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase

    category = category_for_level1_pack(plan)
    if not category:
        return 0

    sid = (session_id or "").strip()
    currency = (paid_currency or settings.DEFAULT_CURRENCY).strip().lower()[:8] or settings.DEFAULT_CURRENCY
    now = timezone.now()
    granted = 0

    playlists = list(_level1_playlists_qs(category))
    if not playlists:
        # Legacy DBs may use different slugs — still never grant vault-linked rows.
        playlists = list(
            StreamPlaylist.objects.filter(
                is_published=True,
                category=category,
            ).filter(Q(vault_plan_slug="") | Q(vault_plan_slug__isnull=True))
        )

    for playlist in playlists:
        purchase, created = StreamPlaylistPurchase.objects.get_or_create(
            user=user,
            playlist=playlist,
            defaults={
                "status": StreamPlaylistPurchase.Status.PAID,
                "stripe_session_id": sid,
                "stripe_checkout_session_id": sid,
                "amount_paid": Decimal("0.00"),
                "currency": currency,
                "paid_at": now,
            },
        )
        if created:
            granted += 1
            continue
        if purchase.status != StreamPlaylistPurchase.Status.PAID:
            purchase.status = StreamPlaylistPurchase.Status.PAID
            purchase.stripe_session_id = sid or purchase.stripe_session_id
            purchase.stripe_checkout_session_id = sid or purchase.stripe_checkout_session_id
            purchase.currency = currency
            purchase.paid_at = now
            purchase.save(
                update_fields=[
                    "status",
                    "stripe_session_id",
                    "stripe_checkout_session_id",
                    "currency",
                    "paid_at",
                    "updated_at",
                ]
            )
            granted += 1

    return granted
