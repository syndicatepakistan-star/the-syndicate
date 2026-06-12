"""Shared API guards for Knight-tier-only dashboard features."""

from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response

from apps.portal.king_access import user_has_knight_tier_access


def require_knight_tier_response(request) -> Response | None:
    """
    Return a 403 response when an authenticated user lacks The Knight tier.
    Anonymous callers are left to the view (legacy/public paths).
    """
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return None
    if user_has_knight_tier_access(user):
        return None
    return Response(
        {"detail": "The Knight membership is required for Syndicate Mode."},
        status=status.HTTP_403_FORBIDDEN,
    )
