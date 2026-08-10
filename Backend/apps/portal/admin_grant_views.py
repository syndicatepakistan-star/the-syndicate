"""Staff-only HTTP endpoints for grant-by-email access."""

from __future__ import annotations

from rest_framework import status, views
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.portal.admin_grants import (
    build_grant_catalog,
    grant_access_by_email,
    lookup_user_access,
)
from apps.portal.permissions import IsAuthenticatedStrict


class AdminGrantCatalogView(views.APIView):
    """GET: grantable plans + published playlists for the admin UI."""

    permission_classes = [IsAuthenticatedStrict, IsAdminUser]

    def get(self, request):
        return Response(build_grant_catalog())


class AdminGrantLookupView(views.APIView):
    """GET ?email=… — whether the account exists and what it already owns."""

    permission_classes = [IsAuthenticatedStrict, IsAdminUser]

    def get(self, request):
        email = (request.query_params.get("email") or "").strip()
        if not email:
            return Response({"detail": "email is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            return Response(lookup_user_access(email))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class AdminGrantAccessView(views.APIView):
    """
    POST: grant plans/playlists to any email ($0 synthetic purchases).
    Creates the user when missing. Does not touch Stripe checkout or OTP flows.
    """

    permission_classes = [IsAuthenticatedStrict, IsAdminUser]

    def post(self, request):
        body = request.data if isinstance(request.data, dict) else {}
        email = body.get("email") or ""
        plan_slugs = body.get("plan_slugs") or body.get("plans") or []
        playlist_ids = body.get("playlist_ids") or body.get("playlists") or []
        duration = body.get("duration") if isinstance(body.get("duration"), dict) else {}
        duration_type = (
            body.get("duration_type")
            or duration.get("type")
            or "lifetime"
        )
        days = body.get("days", duration.get("days"))
        expires_at = body.get("expires_at") or duration.get("expires_at")
        create_missing = body.get("create_user_if_missing", True)
        if isinstance(create_missing, str):
            create_missing = create_missing.strip().lower() not in ("0", "false", "no")

        if not isinstance(plan_slugs, list):
            return Response({"detail": "plan_slugs must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(playlist_ids, list):
            return Response({"detail": "playlist_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = grant_access_by_email(
                str(email),
                plan_slugs=[str(s) for s in plan_slugs],
                playlist_ids=playlist_ids,
                duration_type=str(duration_type),
                days=int(days) if days is not None and str(days).strip() != "" else None,
                expires_at=str(expires_at) if expires_at else None,
                create_user_if_missing=bool(create_missing),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {"detail": "Grant failed. Check server logs."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        ok_plans = sum(1 for p in result.get("plans", []) if p.get("ok"))
        ok_playlists = sum(1 for p in result.get("playlists", []) if p.get("ok"))
        result["summary"] = {
            "plans_granted": ok_plans,
            "playlists_granted": ok_playlists,
        }
        return Response(result, status=status.HTTP_200_OK)
