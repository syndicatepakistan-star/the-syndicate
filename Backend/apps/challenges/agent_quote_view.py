"""Isolated view for GET /api/challenges/agent_quote/ (avoids coupling to large views module)."""
from __future__ import annotations

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import MindsetKnowledge

from apps.portal.api_guards import require_knight_tier_response
from .services import ensure_agent_quote_for_user


@api_view(["GET"])
def agent_quote_today(request):
    """AI-generated Syndicate brief for today; one cached row per user per calendar date."""
    denied = require_knight_tier_response(request)
    if denied is not None:
        return denied
    today_iso = timezone.localdate().isoformat()
    if not MindsetKnowledge.objects.exists():
        return Response(
            {"quote": "", "date": today_iso, "detail": "Ingest a document first."},
            status=status.HTTP_200_OK,
        )
    ok, text, err = ensure_agent_quote_for_user(request.user)
    if not ok:
        code = status.HTTP_503_SERVICE_UNAVAILABLE if err and "OPENAI_API_KEY" in (err or "") else status.HTTP_502_BAD_GATEWAY
        return Response({"quote": "", "date": today_iso, "detail": err or "Failed"}, status=code)
    return Response({"quote": text, "date": today_iso})
