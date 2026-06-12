from __future__ import annotations

from django.contrib.auth.models import AbstractBaseUser

from apps.portal.models import KingProgramSelection, UserDashboardEntitlement


def user_entitlement_tier(user: AbstractBaseUser) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return UserDashboardEntitlement.AccessTier.NONE
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return UserDashboardEntitlement.AccessTier.FULL
    try:
        return user.dashboard_entitlement.access_tier
    except UserDashboardEntitlement.DoesNotExist:
        return UserDashboardEntitlement.AccessTier.NONE


def king_selection_record(user: AbstractBaseUser) -> KingProgramSelection | None:
    if not user or not getattr(user, "is_authenticated", False):
        return None
    try:
        return user.king_program_selection
    except KingProgramSelection.DoesNotExist:
        return None


def king_selection_total_selected(user: AbstractBaseUser) -> int:
    rec = king_selection_record(user)
    if rec is None:
        return 0
    return rec.courses.count() + rec.playlists.count()


def king_selection_completed(user: AbstractBaseUser) -> bool:
    rec = king_selection_record(user)
    if rec is None:
        return False
    return rec.completed_at is not None and king_selection_total_selected(user) == KingProgramSelection.REQUIRED_SELECTION_COUNT


def king_selection_required(user: AbstractBaseUser) -> bool:
    return user_entitlement_tier(user) == UserDashboardEntitlement.AccessTier.KING and not king_selection_completed(user)


def user_has_knight_tier_access(user: AbstractBaseUser) -> bool:
    """The Knight (king tier) unlocks Syndicate Mode and the Membership section."""
    tier = user_entitlement_tier(user)
    return tier in (
        UserDashboardEntitlement.AccessTier.KING,
        UserDashboardEntitlement.AccessTier.FULL,
    )


def king_allowed_course_ids(user: AbstractBaseUser) -> set[int]:
    rec = king_selection_record(user)
    if rec is None:
        return set()
    return set(rec.courses.values_list("id", flat=True))


def king_allowed_playlist_ids(user: AbstractBaseUser) -> set[int]:
    rec = king_selection_record(user)
    if rec is None:
        return set()
    return set(rec.playlists.values_list("id", flat=True))
