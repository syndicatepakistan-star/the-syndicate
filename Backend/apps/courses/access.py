from django.contrib.auth.models import AbstractBaseUser

from apps.courses.models import Course, CourseEnrollment, Video
from apps.portal.commercial_access import user_has_money_mastery
from apps.portal.king_access import king_allowed_course_ids, king_selection_completed, user_entitlement_tier
from apps.portal.models import UserDashboardEntitlement


def _user_is_quiz_ticket_user(user: AbstractBaseUser) -> bool:
    """
    Quiz-ticket users should only access explicitly enrolled courses.
    They are created from quiz OTP flow when no normal account exists.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return False
    return str(getattr(user, "username", "")).startswith("quiz_ticket_")


def _user_is_playlist_only_buyer(user: AbstractBaseUser) -> bool:
    """
    User paid for one or more stream playlists only (no Money Mastery / King tier).
    LMS Django courses require explicit enrollment; stream programs use playlist unlock.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return False
    if _user_has_full_course_access(user):
        return False
    from apps.portal.commercial_access import user_has_active_knight_subscription

    if user_has_active_knight_subscription(user):
        return False
    from apps.video_streaming.models import StreamPlaylistPurchase

    return StreamPlaylistPurchase.objects.filter(
        user=user,
        status=StreamPlaylistPurchase.Status.PAID,
    ).exists()


def _user_has_full_course_access(user: AbstractBaseUser) -> bool:
    return user_has_money_mastery(user)


def user_can_access_course(user: AbstractBaseUser, course: Course) -> bool:
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    if not course.is_published:
        return False
    if _user_is_quiz_ticket_user(user):
        return CourseEnrollment.objects.filter(user=user, course=course).exists()
    if _user_is_playlist_only_buyer(user):
        return CourseEnrollment.objects.filter(user=user, course=course).exists()
    tier = user_entitlement_tier(user)
    from apps.portal.commercial_access import user_has_active_knight_subscription

    if user_has_active_knight_subscription(user) and not user_has_money_mastery(user):
        if not king_selection_completed(user):
            return False
        return course.id in king_allowed_course_ids(user)
    if _user_has_full_course_access(user):
        return True
    if course.allow_all_authenticated:
        return True
    return CourseEnrollment.objects.filter(user=user, course=course).exists()


def user_can_access_video(user: AbstractBaseUser, video: Video) -> bool:
    return user_can_access_course(user, video.course)
