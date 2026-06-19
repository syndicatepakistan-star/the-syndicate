"""
Knight (The Knight tier) onboarding — selectable programs only.

Includes standalone Level 1 programs (psychology + business model library rows on /programs).

Excludes vault packs, vault sub-modules, mid-ticket modules, and Money Mastery rows.
"""

from __future__ import annotations

from django.db.models import QuerySet

from apps.courses.models import Course
from apps.video_streaming.models import StreamPlaylist

# Standalone programs on /programs (not vault pack rows).
KNIGHT_SELECTABLE_PLAYLIST_IDS: frozenset[int] = frozenset(
    {
        # Business Psychology
        1,
        2,
        3,
        6,
        9,
        12,
        30,
        31,
        99,
        # Business Model
        13,
        14,
        16,
        17,
        19,
        20,
        21,
        23,
        24,
        25,
        28,
    }
)

def knight_selectable_playlists_qs() -> QuerySet[StreamPlaylist]:
    return (
        StreamPlaylist.objects.filter(
            id__in=KNIGHT_SELECTABLE_PLAYLIST_IDS,
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
    return int(playlist_id) in KNIGHT_SELECTABLE_PLAYLIST_IDS
