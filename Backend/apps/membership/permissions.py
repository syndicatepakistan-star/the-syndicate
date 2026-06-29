"""
Membership API access: when MEMBERSHIP_ALLOW_ANONYMOUS_READ is True (default in DEBUG),
hub endpoints (articles, videos, tags, operator briefs meta + generate) work without JWT.

PDF download stays on IsAuthenticatedStrict. In production, set the env flag to false unless
you accept public reads and OpenAI-backed brief generation.
"""

from django.conf import settings
from rest_framework.permissions import BasePermission


from apps.portal.commercial_access import user_has_active_knight_subscription


class MembershipPublicReadOrAuthenticated(BasePermission):
    """
    When MEMBERSHIP_ALLOW_ANONYMOUS_READ is True, allow unauthenticated access (any HTTP method
    for views using this class — needed for POST /generated-article/).

    When False, require an authenticated user with an active Knight subscription (or staff).
    Money Mastery alone does not unlock membership content.
    """

    message = "The Knight membership is required for this content."

    def has_permission(self, request, view):
        if getattr(settings, "MEMBERSHIP_ALLOW_ANONYMOUS_READ", False):
            return True
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return True
        return user_has_active_knight_subscription(user)
