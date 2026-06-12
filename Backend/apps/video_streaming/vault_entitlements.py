"""
Vault pack / module plan purchases unlock linked StreamPlaylists (vault_plan_slug).
Money Mastery / Full tiers continue to unlock all published playlists via entitlements.py.
"""

from __future__ import annotations

from accounts.vault_plan_catalog import vault_pack_for_module_slug
from apps.portal.models import UserPlanPurchase
from apps.video_streaming.entitlements import user_stream_playlists_unlocked_by_entitlement
from apps.video_streaming.models import StreamPlaylist


def purchased_vault_plan_slugs(user) -> set[str]:
    if not getattr(user, "is_authenticated", False):
        return set()
    return {
        str(slug).strip().lower()
        for slug in UserPlanPurchase.objects.filter(
            user=user,
            status=UserPlanPurchase.Status.PAID,
        ).values_list("plan_slug", flat=True)
        if slug
    }


def user_has_vault_module_access(
    user,
    module_slug: str,
    purchased: set[str] | None = None,
) -> bool:
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    if user_stream_playlists_unlocked_by_entitlement(user):
        return True

    module_slug = (module_slug or "").strip().lower()
    if not module_slug:
        return False

    if purchased is None:
        purchased = purchased_vault_plan_slugs(user)
    if module_slug in purchased:
        return True

    pack = vault_pack_for_module_slug(module_slug)
    return pack is not None and pack in purchased


def user_can_access_vault_playlist(user, playlist: StreamPlaylist) -> bool:
    slug = (getattr(playlist, "vault_plan_slug", None) or "").strip()
    if not slug:
        return False
    return user_has_vault_module_access(user, slug)


def vault_unlocked_playlist_ids_for_user(user) -> set[int]:
    """Playlist IDs unlocked via vault plan purchases (not Money Mastery / Full)."""
    if not getattr(user, "is_authenticated", False):
        return set()
    if user_stream_playlists_unlocked_by_entitlement(user):
        return set()

    purchased = purchased_vault_plan_slugs(user)
    if not purchased:
        return set()

    unlocked: set[int] = set()
    for playlist_id, module_slug in StreamPlaylist.objects.filter(
        is_published=True,
    ).exclude(vault_plan_slug="").values_list("id", "vault_plan_slug"):
        if user_has_vault_module_access(user, module_slug, purchased):
            unlocked.add(int(playlist_id))
    return unlocked
