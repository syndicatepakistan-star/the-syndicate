"""
Knight (The Knight tier) onboarding — selectable programs only.

Includes standalone Level 1 programs (psychology + business model library rows on /programs).

Excludes vault packs, vault sub-modules, mid-ticket modules, and Money Mastery rows.
"""

from __future__ import annotations

from django.db.models import QuerySet

from accounts.level1_program_catalog import KNIGHT_SELECTABLE_LEVEL1_SLUGS
from apps.courses.models import Course
from apps.video_streaming.models import StreamPlaylist


def knight_selectable_playlists_qs() -> QuerySet[StreamPlaylist]:
    return (
        StreamPlaylist.objects.filter(
            slug__in=KNIGHT_SELECTABLE_LEVEL1_SLUGS,
            is_published=True,
            is_coming_soon=False,
            vault_plan_slug="",
        )
        .order_by("title")
    )


def knight_selectable_courses_qs() -> QuerySet[Course]:
    """Knight picks individual stream programs only — not LMS course rows or vault modules."""
    return Course.objects.none()


def knight_playlist_id_is_selectable(playlist_id: int) -> bool:
    return knight_selectable_playlists_qs().filter(pk=int(playlist_id)).exists()
