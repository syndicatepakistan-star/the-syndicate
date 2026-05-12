"""
Authorization for secure MP4 playback (programs playlists vs membership hub).
"""

from __future__ import annotations

import logging

from apps.portal.king_access import king_allowed_playlist_ids, king_selection_completed, user_entitlement_tier
from apps.portal.models import UserDashboardEntitlement
from apps.video_streaming.entitlements import user_stream_playlists_unlocked_by_entitlement
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase, StreamVideo

logger = logging.getLogger(__name__)


def stream_playlist_accessible_for_playback(user, playlist: StreamPlaylist) -> bool:
    """
    Playback access: logged-in user must be paid (Stripe playlist purchase and/or paid plan tier).

    Free (price 0) playlists do not grant playback without a PAID purchase or an included paid tier.
    """
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    if not playlist.is_published:
        return False
    if StreamPlaylistPurchase.objects.filter(
        user=user,
        playlist=playlist,
        status=StreamPlaylistPurchase.Status.PAID,
    ).exists():
        return True
    if not user_stream_playlists_unlocked_by_entitlement(user):
        return False
    try:
        ent = user.dashboard_entitlement
    except UserDashboardEntitlement.DoesNotExist:
        return False
    if ent.access_tier == UserDashboardEntitlement.AccessTier.KING:
        paid_ids = set(
            StreamPlaylistPurchase.objects.filter(
                user=user,
                status=StreamPlaylistPurchase.Status.PAID,
            ).values_list("playlist_id", flat=True)
        )
        return playlist.id in king_allowed_playlist_ids(user) or playlist.id in paid_ids
    return True


def user_can_play_programs_stream_video(user, video: StreamVideo) -> bool:
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    if not video.show_in_programs:
        logger.info("programs playback denied: video %s hidden from programs", video.pk)
        return False

    playlists = StreamPlaylist.objects.filter(is_published=True, items__stream_video_id=video.id).distinct()
    if playlists.exists():
        return any(stream_playlist_accessible_for_playback(user, pl) for pl in playlists)

    logger.info("programs playback denied: video %s not in an accessible paid context for user %s", video.pk, user.pk)
    return False


def user_has_membership_stream_catalog_access(user) -> bool:
    """Whether the membership hub should list secure StreamVideo rows."""
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    tier = user_entitlement_tier(user)
    if tier == UserDashboardEntitlement.AccessTier.NONE:
        return False
    if tier == UserDashboardEntitlement.AccessTier.KING:
        return king_selection_completed(user)
    return tier in (
        UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        UserDashboardEntitlement.AccessTier.FULL,
    )


def user_can_play_membership_stream_video(user, video: StreamVideo) -> bool:
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    if not video.show_in_membership:
        logger.info("membership playback denied: video %s not in membership", video.pk)
        return False
    tier = user_entitlement_tier(user)
    if tier == UserDashboardEntitlement.AccessTier.NONE:
        return False
    if tier == UserDashboardEntitlement.AccessTier.KING:
        ok = king_selection_completed(user)
        if not ok:
            logger.info("membership playback denied: king selection incomplete user=%s", user.pk)
        return ok
    return tier in (
        UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        UserDashboardEntitlement.AccessTier.FULL,
    )
