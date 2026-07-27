from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Prefetch
from rest_framework import generics, status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import logging

from apps.portal.entitlements import reconcile_dashboard_entitlement_from_plan_purchases
from apps.portal.king_access import king_selection_completed, king_selection_required
from apps.portal.king_selection_catalog import (
    knight_selectable_courses_qs,
    knight_selectable_playlists_qs,
)
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

logger = logging.getLogger(__name__)


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
            plan_title = pp.product_title
            if pp.plan_slug == "king":
                plan_title = (
                    "The Knight membership"
                    if "membership" in (pp.product_title or "").lower()
                    else "The Knight"
                )
            rows.append(
                {
                    "id": -pp.id,
                    "playlist_id": 0,
                    "playlist_title": plan_title,
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


class PlanPurchaseSlugsView(views.APIView):
    """Paid plan slugs for vault unlock UI (pack + individual course checkouts)."""

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request):
        slugs = list(
            UserPlanPurchase.objects.filter(
                user=request.user,
                status=UserPlanPurchase.Status.PAID,
            )
            .values_list("plan_slug", flat=True)
            .distinct()
        )
        return Response({"plan_slugs": slugs})


def _user_paid_purchases(user) -> list[dict]:
    """Structured paid packs/programs for guarantee apply selection (unique, newest first)."""
    plan_rows = list(
        UserPlanPurchase.objects.filter(user=user, status=UserPlanPurchase.Status.PAID)
        .order_by("-paid_at", "-id")
        .values_list("plan_slug", "product_title", "amount_paid", "currency", "paid_at")[:80]
    )
    playlist_rows = list(
        StreamPlaylistPurchase.objects.filter(user=user, status=StreamPlaylistPurchase.Status.PAID)
        .select_related("playlist")
        .order_by("-paid_at", "-id")[:80]
    )
    items: list[dict] = []
    seen_keys: set[str] = set()
    seen_labels: set[str] = set()

    def _add(item: dict) -> None:
        key = str(item.get("key") or "").strip()
        label_norm = str(item.get("label") or "").strip().casefold()
        if not key or key in seen_keys:
            return
        # Same course title from multiple paid rows / plan+playlist overlap → keep newest only.
        if label_norm and label_norm in seen_labels:
            return
        seen_keys.add(key)
        if label_norm:
            seen_labels.add(label_norm)
        items.append(item)

    for slug, title, amount, currency, paid_at in plan_rows:
        label = (title or slug or "plan").strip()
        _add(
            {
                "key": f"plan:{slug}",
                "kind": "plan",
                "label": label,
                "amount": str(amount),
                "currency": (currency or "").upper(),
                "paid_at": paid_at.isoformat() if paid_at else None,
            }
        )
    for row in playlist_rows:
        title = getattr(row.playlist, "title", None) or f"Playlist #{row.playlist_id}"
        _add(
            {
                "key": f"playlist:{row.playlist_id}",
                "kind": "playlist",
                "label": title,
                "amount": str(row.amount_paid),
                "currency": (row.currency or "").upper(),
                "paid_at": row.paid_at.isoformat() if row.paid_at else None,
            }
        )
    return items[:40]


def _user_has_paid_purchase(user) -> tuple[bool, str]:
    """Return (eligible, human summary of paid items)."""
    items = _user_paid_purchases(user)
    lines = [
        f"{'Plan' if i['kind'] == 'plan' else 'Playlist'}: {i['label']} ({i['amount']} {i['currency']})".strip()
        for i in items
    ]
    return (len(items) > 0, "\n".join(lines) if lines else "")


def _resolve_guarantee_user(request):
    """Resolve user from public guarantee_token or authenticated session."""
    from django.contrib.auth import get_user_model
    from accounts.guarantee_auth import parse_guarantee_token

    User = get_user_model()
    data = request.data if isinstance(request.data, dict) else {}
    token = str(data.get("guarantee_token") or request.headers.get("X-Guarantee-Token") or "").strip()
    if token:
        parsed = parse_guarantee_token(token)
        if not parsed:
            return None, "Verification expired. Please verify your email again."
        user_id, email = parsed
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None, "Account not found."
        if (user.email or "").strip().lower() != email:
            return None, "Verification mismatch. Please verify your email again."
        return user, None

    if getattr(request.user, "is_authenticated", False):
        return request.user, None
    return None, "Verify your email with the OTP before applying."


@method_decorator(csrf_exempt, name="dispatch")
class GuaranteeSendOtpView(views.APIView):
    """Public: send OTP to a registered member email for guarantee apply."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from django.core.exceptions import ValidationError
        from django.core.validators import validate_email
        from accounts.guarantee_auth import create_and_email_guarantee_otp
        from accounts.views import _canonical_user_for_email

        data = request.data if isinstance(request.data, dict) else {}
        email = str(data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_email(email)
        except ValidationError:
            return Response({"detail": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)

        user = _canonical_user_for_email(email)
        if user is None:
            return Response(
                {
                    "detail": "No account found for this email. Use the email you purchased with.",
                    "code": "ACCOUNT_NOT_FOUND",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            create_and_email_guarantee_otp(email, user.username or "Operator")
        except Exception:
            logger.exception("Guarantee OTP send failed for %s", email)
            return Response(
                {"detail": "Could not send verification code. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "ok": True,
                "email": email,
                "otp_required": True,
                "message": "Verification code sent to your email. Check your Gmail inbox (and spam).",
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class GuaranteeVerifyOtpView(views.APIView):
    """Public: verify OTP; return short-lived guarantee token + purchases if eligible."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from accounts.guarantee_auth import make_guarantee_token, verify_guarantee_otp
        from accounts.views import _canonical_user_for_email

        data = request.data if isinstance(request.data, dict) else {}
        email = str(data.get("email") or "").strip().lower()
        otp = str(data.get("otp") or "").strip()
        if not email or not otp:
            return Response({"detail": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(otp) != 6 or not otp.isdigit():
            return Response({"detail": "OTP must be a 6-digit code."}, status=status.HTTP_400_BAD_REQUEST)

        user = _canonical_user_for_email(email)
        if user is None:
            return Response(
                {"detail": "No account found for this email.", "code": "ACCOUNT_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not verify_guarantee_otp(email, otp):
            return Response(
                {"detail": "Invalid or expired verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        purchases = _user_paid_purchases(user)
        eligible = len(purchases) > 0
        summary = "\n".join(
            f"{'Plan' if p['kind'] == 'plan' else 'Playlist'}: {p['label']} ({p['amount']} {p['currency']})"
            for p in purchases
        )
        member_name = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip() or user.username
        token = make_guarantee_token(user_id=user.id, email=user.email) if eligible else ""

        payload = {
            "ok": True,
            "email": user.email,
            "member_name": member_name,
            "eligible": eligible,
            "purchases": purchases,
            "purchases_summary": summary,
            "guarantee_token": token,
        }
        if not eligible:
            payload["detail"] = (
                "We verified your email, but no paid pack or program was found on this account. "
                "Only purchased members can apply for the Syndicate Guarantee."
            )
            return Response(payload, status=status.HTTP_403_FORBIDDEN)

        return Response(payload)


@method_decorator(csrf_exempt, name="dispatch")
class GuaranteeApplyView(views.APIView):
    """
    Public apply after email OTP verification (guarantee_token), or authenticated session.
    POST emails intelligence@the-syndicate.com with member + issue details.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        user, err = _resolve_guarantee_user(request)
        if user is None:
            return Response({"detail": err or "Unauthorized."}, status=status.HTTP_401_UNAUTHORIZED)

        purchases = _user_paid_purchases(user)
        if not purchases:
            return Response(
                {
                    "detail": "You need at least one paid purchase before applying for the Syndicate Guarantee.",
                    "eligible": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        summary = "\n".join(
            f"{'Plan' if p['kind'] == 'plan' else 'Playlist'}: {p['label']} ({p['amount']} {p['currency']})"
            for p in purchases
        )

        data = request.data if isinstance(request.data, dict) else {}
        request_type = str(data.get("request_type") or "Founder Audit").strip()[:80]
        allowed = {
            "Founder Audit",
            "Full Refund",
            "Full Replacement",
            "Replacement Program",  # legacy label from older clients
        }
        if request_type not in allowed:
            request_type = "Full Refund"
        if request_type == "Replacement Program":
            request_type = "Full Replacement"

        purchase_key = str(data.get("purchase_key") or "").strip()[:120]
        program_label = str(data.get("program_label") or "").strip()[:200]
        if purchase_key:
            match = next((p for p in purchases if p["key"] == purchase_key), None)
            if match:
                program_label = match["label"]
            elif not program_label:
                return Response(
                    {"detail": "Select a purchased pack or program."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not program_label:
            return Response(
                {"detail": "Select which pack or program this request is about."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = str(data.get("message") or "").strip()
        if len(message) < 20:
            return Response(
                {"detail": "Please describe what went wrong (at least 20 characters)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(message) > 4000:
            return Response(
                {"detail": "Message is too long (max 4000 characters)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member_name = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip() or user.username
        email_sent = False
        try:
            from accounts.guarantee_mailer import send_guarantee_apply_email

            send_guarantee_apply_email(
                member_email=user.email,
                member_name=member_name,
                member_id=user.id,
                request_type=request_type,
                program_label=program_label,
                message=message,
                purchases_summary=summary,
            )
            email_sent = True
        except Exception:
            logger.exception("Guarantee apply email failed for user_id=%s", user.id)

        try:
            from accounts.models import RefundApplication

            RefundApplication.objects.create(
                user=user,
                member_email=user.email,
                member_name=member_name,
                request_type=request_type,
                program_label=program_label,
                purchase_key=purchase_key,
                message=message,
                purchases_summary=summary,
                email_sent=email_sent,
            )
        except Exception:
            logger.exception("Failed to persist refund application for user_id=%s", user.id)
            if not email_sent:
                return Response(
                    {"detail": "Could not save your request right now. Please try again shortly."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        if not email_sent:
            return Response(
                {"detail": "Could not send your request right now. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "ok": True,
                "message": "Your guarantee request was sent. Our team will review it at intelligence@the-syndicate.com.",
            }
        )


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
                    "detail": "Knight program selection is only available for Knight tier users.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        selection, _ = KingProgramSelection.objects.get_or_create(user=user)
        courses_qs = knight_selectable_courses_qs()
        playlists_qs = knight_selectable_playlists_qs().prefetch_related(
            Prefetch(
                "items",
                queryset=StreamPlaylistItem.objects.select_related("stream_video").order_by("order", "id"),
            )
        )

        from syndicate_backend.media_storages import public_media_url

        def _field_url(file_field):
            return public_media_url(file_field, request)

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
                "playlists": [
                    {
                        "id": p.id,
                        "title": p.title,
                        "thumbnail_url": _playlist_thumb_url(p),
                        "vault_plan_slug": (p.vault_plan_slug or "").strip() or None,
                    }
                    for p in playlists_qs
                ],
            }
        )

    def post(self, request):
        user = request.user
        if not king_selection_required(user) and not king_selection_completed(user):
            return Response(
                {"detail": "Knight program selection is only available for Knight tier users."},
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

        valid_course_ids = set(knight_selectable_courses_qs().filter(id__in=course_ids).values_list("id", flat=True))
        valid_playlist_ids = set(
            knight_selectable_playlists_qs().filter(id__in=playlist_ids).values_list("id", flat=True)
        )
        if valid_course_ids != course_ids or valid_playlist_ids != playlist_ids:
            return Response(
                {"detail": "One or more selected programs are invalid. Knight tier includes standalone Level 1 programs only (no vault packs, mid-ticket modules, or Money Mastery)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
