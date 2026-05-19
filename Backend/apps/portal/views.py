from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Prefetch
from rest_framework import generics, status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.courses.models import Course
from apps.portal.entitlements import reconcile_dashboard_entitlement_from_plan_purchases
from apps.portal.king_access import king_selection_completed, king_selection_required
from apps.portal.models import KingProgramSelection, Mission, Note, Reminder, SocialLink, UserPlanPurchase
from apps.video_streaming.models import StreamPlaylistItem, StreamPlaylistPurchase, StreamPlaylist
from apps.portal.permissions import DeckPermission, IsAuthenticatedStrict, SocialLinkPermission
from django.conf import settings

from apps.portal.serializers import (
    MissionSerializer,
    NoteSerializer,
    ReminderSerializer,
    SocialLinkSerializer,
    SyndicateTokenObtainPairSerializer,
    UserMeSerializer,
)


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = SyndicateTokenObtainPairSerializer


@method_decorator(csrf_exempt, name="dispatch")
class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(views.APIView):
    """
    JWT is stateless: client discards tokens. Optional: pass refresh in body to blacklist
    if simplejwt blacklist is enabled later.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(views.APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request):
        reconcile_dashboard_entitlement_from_plan_purchases(request.user)
        return Response(UserMeSerializer(request.user).data)


class BillingPurchasesView(views.APIView):
    """
    Unified billing rows: stream playlist checkouts + plan bundles (Money Mastery / King).
    Shape matches StreamPlaylistPurchaseHistorySerializer for dashboard Settings.
    """

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request):
        user = request.user
        reconcile_dashboard_entitlement_from_plan_purchases(user)
        rows: list[dict] = []
        for p in (
            StreamPlaylistPurchase.objects.filter(user=user)
            .select_related("playlist")
            .order_by("-paid_at", "-id")
        ):
            pl = p.playlist
            rows.append(
                {
                    "id": p.id,
                    "playlist_id": p.playlist_id,
                    "playlist_title": pl.title if pl is not None else f"Playlist #{p.playlist_id}",
                    "status": p.status,
                    "amount_paid": str(p.amount_paid),
                    "currency": (p.currency or settings.DEFAULT_CURRENCY).lower(),
                    "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                }
            )
        for pp in UserPlanPurchase.objects.filter(user=user).order_by("-paid_at", "-id"):
            rows.append(
                {
                    "id": -pp.id,
                    "playlist_id": 0,
                    "playlist_title": pp.product_title,
                    "status": pp.status,
                    "amount_paid": str(pp.amount_paid),
                    "currency": (pp.currency or settings.DEFAULT_CURRENCY).lower(),
                    "paid_at": pp.paid_at.isoformat() if pp.paid_at else None,
                    "created_at": pp.created_at.isoformat() if pp.created_at else None,
                    "updated_at": pp.updated_at.isoformat() if pp.updated_at else None,
                }
            )

        def sort_key(r: dict) -> str:
            return r.get("paid_at") or r.get("created_at") or ""

        rows.sort(key=sort_key, reverse=True)
        return Response(rows)


class SocialLinkListCreateView(generics.ListCreateAPIView):
    serializer_class = SocialLinkSerializer
    permission_classes = [IsAuthenticatedStrict, SocialLinkPermission]

    def get_queryset(self):
        qs = SocialLink.objects.all()
        user = self.request.user
        from apps.portal.rbac import user_has_permission

        if user_has_permission(user, "social.links.manage_all"):
            return qs.order_by("-updated_at")
        return qs.filter(user=user).order_by("-updated_at")


class SocialLinkDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SocialLinkSerializer
    permission_classes = [IsAuthenticatedStrict, SocialLinkPermission]
    lookup_field = "pk"

    def get_queryset(self):
        user = self.request.user
        from apps.portal.rbac import user_has_permission

        if user_has_permission(user, "social.links.manage_all"):
            return SocialLink.objects.all()
        return SocialLink.objects.filter(user=user)


class MissionListCreateView(generics.ListCreateAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Mission.objects.filter(user=self.request.user).order_by("-target_at")


class MissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Mission.objects.filter(user=self.request.user)


class ReminderListCreateView(generics.ListCreateAPIView):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user).order_by("-date", "-time")


class ReminderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user)


class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).order_by("-created_at")


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)


class KingProgramSelectionView(views.APIView):
    """
    The King onboarding gate:
    - GET returns all selectable programs + current selection.
    - POST requires exactly 5 picks across courses + playlists.
    """

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request):
        user = request.user
        if not king_selection_required(user) and not king_selection_completed(user):
            return Response(
                {
                    "detail": "King program selection is only available for King tier users.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        selection, _ = KingProgramSelection.objects.get_or_create(user=user)
        courses_qs = Course.objects.filter(is_published=True, show_in_programs=True).order_by("title")
        playlists_qs = (
            StreamPlaylist.objects.filter(is_published=True, is_coming_soon=False)
            .prefetch_related(
                Prefetch(
                    "items",
                    queryset=StreamPlaylistItem.objects.select_related("stream_video").order_by("order", "id"),
                )
            )
            .order_by("title")
        )

        def _field_url(file_field):
            if not file_field:
                return None
            try:
                url = file_field.url
            except Exception:
                return None
            if request is not None:
                return request.build_absolute_uri(url)
            return url

        def _playlist_thumb_url(pl: StreamPlaylist):
            direct = _field_url(pl.cover_image)
            if direct:
                return direct
            for item in pl.items.all():
                thumb = _field_url(item.stream_video.thumbnail)
                if thumb:
                    return thumb
            return None
        selected_course_ids = set(selection.courses.values_list("id", flat=True))
        selected_playlist_ids = set(selection.playlists.values_list("id", flat=True))
        selected_items = [
            *[{"program_type": "course", "id": cid} for cid in sorted(selected_course_ids)],
            *[{"program_type": "playlist", "id": pid} for pid in sorted(selected_playlist_ids)],
        ]
        return Response(
            {
                "required_count": KingProgramSelection.REQUIRED_SELECTION_COUNT,
                "selected_count": len(selected_items),
                "selection_completed": king_selection_completed(user),
                "selected_items": selected_items,
                "courses": [{"id": c.id, "title": c.title, "thumbnail_url": _field_url(c.cover_image)} for c in courses_qs],
                "playlists": [{"id": p.id, "title": p.title, "thumbnail_url": _playlist_thumb_url(p)} for p in playlists_qs],
            }
        )

    def post(self, request):
        user = request.user
        if not king_selection_required(user) and not king_selection_completed(user):
            return Response(
                {"detail": "King program selection is only available for King tier users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not isinstance(request.data, dict):
            return Response({"detail": "Invalid payload."}, status=status.HTTP_400_BAD_REQUEST)

        raw_course_ids = request.data.get("course_ids") or []
        raw_playlist_ids = request.data.get("playlist_ids") or []
        if not isinstance(raw_course_ids, list) or not isinstance(raw_playlist_ids, list):
            return Response({"detail": "course_ids and playlist_ids must be arrays."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course_ids = {int(x) for x in raw_course_ids}
            playlist_ids = {int(x) for x in raw_playlist_ids}
        except (TypeError, ValueError):
            return Response({"detail": "Selections must contain numeric IDs."}, status=status.HTTP_400_BAD_REQUEST)

        total_selected = len(course_ids) + len(playlist_ids)
        if total_selected != KingProgramSelection.REQUIRED_SELECTION_COUNT:
            return Response(
                {"detail": f"Select exactly {KingProgramSelection.REQUIRED_SELECTION_COUNT} programs to continue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_course_ids = set(
            Course.objects.filter(id__in=course_ids, is_published=True, show_in_programs=True).values_list("id", flat=True)
        )
        valid_playlist_ids = set(
            StreamPlaylist.objects.filter(id__in=playlist_ids, is_published=True, is_coming_soon=False).values_list("id", flat=True)
        )
        if valid_course_ids != course_ids or valid_playlist_ids != playlist_ids:
            return Response({"detail": "One or more selected programs are invalid."}, status=status.HTTP_400_BAD_REQUEST)

        selection, _ = KingProgramSelection.objects.get_or_create(user=user)
        selection.courses.set(sorted(valid_course_ids))
        selection.playlists.set(sorted(valid_playlist_ids))
        selection.completed_at = timezone.now()
        selection.save(update_fields=["completed_at", "updated_at"])
        return Response(
            {
                "required_count": KingProgramSelection.REQUIRED_SELECTION_COUNT,
                "selected_count": total_selected,
                "selection_completed": True,
            },
            status=status.HTTP_200_OK,
        )
