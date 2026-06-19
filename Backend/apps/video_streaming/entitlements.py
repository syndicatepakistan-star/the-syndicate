"""
Dashboard / playlist entitlement helpers shared by streaming views and playback access checks.
"""

from __future__ import annotations

from apps.portal.king_access import king_allowed_playlist_ids, king_selection_completed
from apps.portal.commercial_access import user_has_active_knight_subscription, user_has_money_mastery
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
    if user_has_money_mastery(user):
        return True
    if user_has_active_knight_subscription(user):
        return king_selection_completed(user) and bool(king_allowed_playlist_ids(user))
    return False


def unlocked_stream_playlist_ids_for_user(user) -> set[int]:
    """
    Published playlist ids the dashboard may treat as unlocked (list `is_unlocked` + detail fetch).
    Includes direct playlist purchases, vault module/plan purchases, and tier-based access.
    """
    from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase
    from apps.video_streaming.vault_entitlements import vault_unlocked_playlist_ids_for_user

    if not getattr(user, "is_authenticated", False):
        return set()
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return set(StreamPlaylist.objects.filter(is_published=True).values_list("id", flat=True))

    unlocked_ids = set(
        StreamPlaylistPurchase.objects.filter(
            user=user,
            status=StreamPlaylistPurchase.Status.PAID,
        ).values_list("playlist_id", flat=True)
    )

    if user_stream_playlists_unlocked_by_entitlement(user):
        try:
            ent = user.dashboard_entitlement
        except UserDashboardEntitlement.DoesNotExist:
            ent = None
        if user_has_money_mastery(user):
            unlocked_ids |= set(
                StreamPlaylist.objects.filter(is_published=True).values_list("id", flat=True)
            )
        elif ent is not None and user_has_active_knight_subscription(user):
            unlocked_ids |= king_allowed_playlist_ids(user)
        else:
            unlocked_ids |= set(
                StreamPlaylist.objects.filter(is_published=True).values_list("id", flat=True)
            )

    unlocked_ids |= vault_unlocked_playlist_ids_for_user(user)
    return unlocked_ids


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
    if user_has_money_mastery(user):
        return True
    if ent.access_tier == UserDashboardEntitlement.AccessTier.KING and user_has_active_knight_subscription(user):
        return king_selection_completed(user) and int(playlist_id) in king_allowed_playlist_ids(user)
    return False
