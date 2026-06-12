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


def user_can_access_stream_playlist(user, playlist) -> bool:
    """Whether the user may view/issue certificates for this published playlist."""
    from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase
    from apps.video_streaming.vault_entitlements import user_can_access_vault_playlist

    if not getattr(user, "is_authenticated", False):
        return False
    if not isinstance(playlist, StreamPlaylist):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    if not playlist.is_published:
        return False
    if playlist.price <= 0:
        return True
    if StreamPlaylistPurchase.objects.filter(
        user=user,
        playlist=playlist,
        status=StreamPlaylistPurchase.Status.PAID,
    ).exists():
        return True
    if user_can_access_vault_playlist(user, playlist):
        return True
    return playlist_included_by_entitlement(user, playlist.id)


def playlist_included_by_entitlement(user, playlist_id: int) -> bool:
    """
    Per-playlist entitlement check (used by checkout).
    King access is selection-based, so only selected playlist IDs are included.
    """
    from apps.video_streaming.models import StreamPlaylist
    from apps.video_streaming.vault_entitlements import user_can_access_vault_playlist

    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True

    try:
        playlist = StreamPlaylist.objects.get(pk=int(playlist_id), is_published=True)
    except (StreamPlaylist.DoesNotExist, TypeError, ValueError):
        playlist = None
    if playlist is not None and user_can_access_vault_playlist(user, playlist):
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
