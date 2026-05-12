"""
Dashboard / playlist entitlement helpers shared by streaming views and playback access checks.
"""

from __future__ import annotations

from apps.portal.king_access import king_allowed_playlist_ids, king_selection_completed
from apps.portal.models import UserDashboardEntitlement


def user_stream_playlists_unlocked_by_entitlement(user) -> bool:
    """
    Money Mastery / King / staff-equivalent tiers include published stream playlists
    (per UI `is_unlocked` + detail queryset), not only per-playlist Stripe purchases.
    """
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    try:
        ent = user.dashboard_entitlement
    except UserDashboardEntitlement.DoesNotExist:
        return False
    if ent.access_tier == UserDashboardEntitlement.AccessTier.KING:
        return king_selection_completed(user) and bool(king_allowed_playlist_ids(user))
    return ent.access_tier in (
        UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        UserDashboardEntitlement.AccessTier.FULL,
    )


def playlist_included_by_entitlement(user, playlist_id: int) -> bool:
    """
    Per-playlist entitlement check (used by checkout).
    King access is selection-based, so only selected playlist IDs are included.
    """
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    try:
        ent = user.dashboard_entitlement
    except UserDashboardEntitlement.DoesNotExist:
        return False
    if ent.access_tier == UserDashboardEntitlement.AccessTier.KING:
        return king_selection_completed(user) and int(playlist_id) in king_allowed_playlist_ids(user)
    return ent.access_tier in (
        UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        UserDashboardEntitlement.AccessTier.FULL,
    )
