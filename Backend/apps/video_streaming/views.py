import logging
import mimetypes
import re
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlsplit

import stripe
from django.conf import settings
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse

from apps.affiliate_tracking.checkout_attribution import record_sale_from_checkout_metadata
from apps.portal.entitlements import reconcile_dashboard_entitlement_from_plan_purchases
from apps.portal.models import UserDashboardEntitlement
from apps.video_streaming.entitlements import (
    playlist_included_by_entitlement,
    unlocked_stream_playlist_ids_for_user,
    user_can_access_stream_playlist,
    user_stream_playlists_unlocked_by_entitlement,
)
from apps.video_streaming.playback_access import (
    user_can_play_membership_stream_video,
    user_can_play_programs_stream_video,
)
from apps.video_streaming.services.object_storage import s3_client
from apps.video_streaming.services.playback_delivery import (
    build_stream_playback_api_payload,
    file_response_for_local_original,
    head_s3_original,
    streaming_s3_original_response,
    verify_playback_token,
    video_playback_kind,
)
from apps.video_streaming.services.hls_playback import (
    hls_manifest_http_response,
    resolve_hls_segment_storage_key,
)
from apps.video_streaming.models import (
    StreamPlaylist,
    StreamPlaylistCertificate,
    StreamPlaylistItem,
    StreamPlaylistPurchase,
    StreamVideo,
    stream_video_original_upload_to,
)
from apps.video_streaming.serializers import (
    StreamPlaylistDetailSerializer,
    StreamPlaylistListSerializer,
    StreamPlaylistPurchaseHistorySerializer,
    StreamVideoDetailSerializer,
    StreamVideoListSerializer,
    StreamVideoStreamSerializer,
)

logger = logging.getLogger(__name__)


class StreamVideoListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = StreamVideo.objects.filter(show_in_programs=True)
    serializer_class = StreamVideoListSerializer


class StreamVideoDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = StreamVideo.objects.all()
    serializer_class = StreamVideoDetailSerializer


class StreamVideoStreamView(APIView):
    """
    GET /api/streaming/videos/stream/<id>/

    Authorized users receive a short-lived signed URL to the same-origin playback proxy
    (never a raw storage presigned URL). Each byte range request re-validates the token
    and entitlements.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int, *args, **kwargs):
        try:
            video = StreamVideo.objects.get(pk=pk)
        except StreamVideo.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if not user_can_play_programs_stream_video(request.user, video):
            return Response(
                {"detail": "You do not have access to this video."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = build_stream_playback_api_payload(
            request,
            user_id=request.user.id,
            video=video,
        )
        if video.status == StreamVideo.Status.READY and video.original_video and video.original_video.name:
            if not payload.get("playback_url"):
                logger.error("playback_url missing for video %s (check storage configuration)", video.pk)
                return Response(
                    {"detail": "Playback is temporarily unavailable."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
        return Response(StreamVideoStreamSerializer(payload).data, status=status.HTTP_200_OK)


class StreamVideoPlaybackFileView(APIView):
    """
    `<video src>` / hls.js manifest URL: signed query token from `build_playback_url_for_video`.

    Re-validates token + entitlements on every GET/HEAD (including each HTTP Range for MP4 seeking).
    For HLS, returns a rewritten m3u8 with signed segment proxy URLs.
  """

    permission_classes = [AllowAny]

    def _user_video_for_playback_token(self, request, video_id: int):
        token = (request.query_params.get("token") or "").strip()
        if not token:
            raise Http404()
        claims = verify_playback_token(token=token, video_id=video_id)
        if not claims:
            raise Http404()

        from django.contrib.auth import get_user_model

        User = get_user_model()
        try:
            user = User.objects.get(pk=int(claims["u"]))
        except (User.DoesNotExist, TypeError, ValueError, KeyError):
            raise Http404()

        video = get_object_or_404(StreamVideo, pk=video_id)
        mode = str(claims.get("m") or "programs").strip() or "programs"
        if mode == "membership":
            if not user_can_play_membership_stream_video(user, video):
                raise Http404()
        else:
            if not user_can_play_programs_stream_video(user, video):
                raise Http404()
        return user, video, token, claims

    def get(self, request, video_id: int, *args, **kwargs):
        _, video, token, claims = self._user_video_for_playback_token(request, video_id)
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        storage_key = (getattr(video.original_video, "name", None) or "").strip()
        kind = video_playback_kind(video)
        if kind == "hls" and storage_key.lower().endswith(".m3u8"):
            if getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket:
                return hls_manifest_http_response(
                    request,
                    bucket=bucket,
                    manifest_key=storage_key,
                    video_id=video_id,
                    token=token,
                    exp=int(claims["exp"]),
                )
            logger.error(
                "HLS playback unavailable: USE_S3_OBJECT_STORAGE is off or bucket unset (video_id=%s)",
                video_id,
            )
            return HttpResponse(
                "HLS playback requires R2/S3 credentials on the backend (USE_S3_OBJECT_STORAGE).",
                status=503,
                content_type="text/plain",
            )
        if getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket and storage_key:
            return streaming_s3_original_response(request, bucket=bucket, key=storage_key)
        return file_response_for_local_original(video, request)

    def head(self, request, video_id: int, *args, **kwargs):
        _, video, _token, _claims = self._user_video_for_playback_token(request, video_id)
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        storage_key = (getattr(video.original_video, "name", None) or "").strip()
        kind = video_playback_kind(video)
        if kind == "hls" and storage_key.lower().endswith(".m3u8"):
            resp = HttpResponse(status=200)
            resp["Content-Type"] = "application/vnd.apple.mpegurl"
            resp["Cache-Control"] = "private, no-store"
            return resp
        if getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket and storage_key:
            return head_s3_original(bucket=bucket, key=storage_key)
        if not video.original_video or not video.original_video.name:
            raise Http404()
        name_lower = (video.original_video.name or "").lower()
        ctype, _ = mimetypes.guess_type(video.original_video.name)
        if not ctype:
            ctype = "video/mp4" if name_lower.endswith(".mp4") else "application/octet-stream"
        try:
            size = int(video.original_video.size)
        except (FileNotFoundError, OSError, ValueError, TypeError):
            raise Http404() from None
        resp = HttpResponse(status=200)
        resp["Content-Type"] = ctype
        resp["Content-Length"] = str(max(0, size))
        resp["Accept-Ranges"] = "bytes"
        resp["Cache-Control"] = "private, no-store"
        return resp


class StreamVideoPlaybackHlsMediaView(APIView):
    """Signed proxy for individual HLS segments (.ts, init mp4, nested playlists)."""

    permission_classes = [AllowAny]

    def _authorized_video(self, request, video_id: int) -> StreamVideo:
        token = (request.query_params.get("token") or "").strip()
        if not token:
            raise Http404()
        claims = verify_playback_token(token=token, video_id=video_id)
        if not claims:
            raise Http404()

        from django.contrib.auth import get_user_model

        User = get_user_model()
        try:
            user = User.objects.get(pk=int(claims["u"]))
        except (User.DoesNotExist, TypeError, ValueError, KeyError):
            raise Http404()

        video = get_object_or_404(StreamVideo, pk=video_id)
        mode = str(claims.get("m") or "programs").strip() or "programs"
        if mode == "membership":
            if not user_can_play_membership_stream_video(user, video):
                raise Http404()
        else:
            if not user_can_play_programs_stream_video(user, video):
                raise Http404()
        if video_playback_kind(video) != "hls":
            raise Http404()
        return video

    def get(self, request, video_id: int, media_path: str, *args, **kwargs):
        video = self._authorized_video(request, video_id)
        manifest_key = (getattr(video.original_video, "name", None) or "").strip()
        if not manifest_key.lower().endswith(".m3u8"):
            raise Http404()
        try:
            segment_key = resolve_hls_segment_storage_key(manifest_key, media_path)
        except ValueError:
            raise Http404() from None
        if not segment_key:
            raise Http404()
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        if getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket:
            return streaming_s3_original_response(request, bucket=bucket, key=segment_key)
        raise Http404()

    def head(self, request, video_id: int, media_path: str, *args, **kwargs):
        video = self._authorized_video(request, video_id)
        manifest_key = (getattr(video.original_video, "name", None) or "").strip()
        if not manifest_key.lower().endswith(".m3u8"):
            raise Http404()
        try:
            segment_key = resolve_hls_segment_storage_key(manifest_key, media_path)
        except ValueError:
            raise Http404() from None
        if not segment_key:
            raise Http404()
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        if getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket:
            return head_s3_original(bucket=bucket, key=segment_key)
        raise Http404()


class StreamPlaylistListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = StreamPlaylistListSerializer

    def get_queryset(self):
        qs = StreamPlaylist.objects.all()
        if not getattr(self.request.user, "is_authenticated", False):
            qs = qs.filter(is_published=True)
        elif not getattr(self.request.user, "is_staff", False):
            qs = qs.filter(is_published=True)
        return (
            qs.order_by("title")
            .annotate(video_count=Count("items", distinct=True))
            .prefetch_related(
                Prefetch(
                    "items",
                    queryset=StreamPlaylistItem.objects.select_related("stream_video").order_by("order", "id"),
                )
            )
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = getattr(self.request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            reconcile_dashboard_entitlement_from_plan_purchases(user)
            ctx["unlocked_playlist_ids"] = unlocked_stream_playlist_ids_for_user(user)
        else:
            ctx["unlocked_playlist_ids"] = set()
        return ctx


class StreamPlaylistCertificateIssueView(APIView):
    """Issue (or refresh) a SYN token for a completed playlist."""

    permission_classes = [IsAuthenticated]

    def post(self, request, playlist_id: int):
        playlist = get_object_or_404(StreamPlaylist, pk=playlist_id, is_published=True)
        if not user_can_access_stream_playlist(request.user, playlist):
            return Response({"detail": "Playlist not unlocked."}, status=status.HTTP_403_FORBIDDEN)

        holder_name = str((request.data or {}).get("holder_name", "")).strip()
        if not holder_name:
            return Response({"detail": "holder_name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(holder_name) > 255:
            return Response({"detail": "holder_name is too long."}, status=status.HTTP_400_BAD_REQUEST)

        cert, created = StreamPlaylistCertificate.objects.get_or_create(
            user=request.user,
            playlist=playlist,
            defaults={
                "holder_name": holder_name,
                "status": StreamPlaylistCertificate.Status.CERTIFIED,
            },
        )
        if not created:
            update_fields = ["updated_at"]
            if cert.holder_name != holder_name:
                cert.holder_name = holder_name
                update_fields.append("holder_name")
            if cert.status != StreamPlaylistCertificate.Status.CERTIFIED:
                cert.status = StreamPlaylistCertificate.Status.CERTIFIED
                update_fields.append("status")
            cert.save(update_fields=update_fields)

        return Response(
            {
                "certificate_id": cert.token_id,
                "token_id": cert.token_id,
                "playlist_id": playlist.id,
                "playlist_title": playlist.title,
                "holder_name": cert.holder_name,
                "issued_at": cert.issued_at.isoformat() if cert.issued_at else None,
                "created": created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class StreamPlaylistDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StreamPlaylistDetailSerializer
    lookup_field = "pk"

    def get_queryset(self):
        qs = StreamPlaylist.objects.all()
        user = self.request.user
        if not getattr(user, "is_staff", False):
            unlocked_ids = unlocked_stream_playlist_ids_for_user(user)
            qs = qs.filter(Q(is_published=True) | Q(id__in=unlocked_ids))
            if not user_stream_playlists_unlocked_by_entitlement(user):
                qs = qs.filter(Q(price__lte=0) | Q(id__in=unlocked_ids))
            else:
                from apps.portal.commercial_access import user_has_active_knight_subscription, user_has_money_mastery

                if user_has_active_knight_subscription(user) and not user_has_money_mastery(user):
                    qs = qs.filter(Q(price__lte=0) | Q(id__in=unlocked_ids))
        return (
            qs.annotate(video_count=Count("items", distinct=True))
            .prefetch_related(
                Prefetch(
                    "items",
                    queryset=StreamPlaylistItem.objects.select_related("stream_video").order_by("order", "id"),
                )
            )
        )


class StreamPlaylistPurchaseHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StreamPlaylistPurchaseHistorySerializer

    def get_queryset(self):
        return (
            StreamPlaylistPurchase.objects.filter(user=self.request.user)
            .select_related("playlist")
            .order_by("-updated_at", "-id")
        )


def vault_playlist_map_view(request):
    """Published vault-linked playlists keyed by vault_plan_slug (for vault modal Open actions)."""
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = getattr(request, "user", None)
    authenticated = user is not None and getattr(user, "is_authenticated", False)
    if authenticated:
        reconcile_dashboard_entitlement_from_plan_purchases(user)
        unlocked_ids = unlocked_stream_playlist_ids_for_user(user)
    else:
        unlocked_ids = set()

    qs = StreamPlaylist.objects.exclude(vault_plan_slug="").order_by("vault_plan_slug")
    if authenticated and unlocked_ids:
        qs = qs.filter(Q(is_published=True) | Q(id__in=unlocked_ids))
    else:
        qs = qs.filter(is_published=True)
    qs = (
        qs.annotate(video_count=Count("items", distinct=True))
        .prefetch_related(
            Prefetch(
                "items",
                queryset=StreamPlaylistItem.objects.select_related("stream_video").order_by("order", "id"),
            )
        )
    )
    rows = StreamPlaylistListSerializer(
        qs,
        many=True,
        context={"request": request, "unlocked_playlist_ids": unlocked_ids},
    ).data
    mapping = {}
    for row in rows:
        slug = str(row.get("vault_plan_slug") or "").strip().lower()
        if slug:
            mapping[slug] = row
    resp = JsonResponse({"map": mapping})
    resp["Cache-Control"] = "public, max-age=60, s-maxage=300"
    return resp


def public_stream_playlists_view(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)
    qs = (
        StreamPlaylist.objects.filter(is_published=True)
        .order_by("title")
        .annotate(video_count=Count("items", distinct=True))
        .prefetch_related(
            Prefetch(
                "items",
                queryset=StreamPlaylistItem.objects.select_related("stream_video").order_by("order", "id"),
            )
        )
    )
    data = StreamPlaylistListSerializer(qs, many=True, context={"request": request}).data
    resp = JsonResponse(data, safe=False)
    resp["Cache-Control"] = "public, max-age=60, s-maxage=300"
    return resp


class StreamPlaylistCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, playlist_id: int, *args, **kwargs):
        playlist = get_object_or_404(StreamPlaylist, pk=playlist_id, is_published=True)
        if playlist.is_coming_soon:
            return Response({"detail": "This playlist is coming soon and cannot be purchased yet."}, status=status.HTTP_400_BAD_REQUEST)

        if playlist.price <= 0:
            return Response(
                {"detail": "This playlist price is zero. Set a positive price in admin before checkout."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if playlist_included_by_entitlement(request.user, playlist.id):
            return Response(
                {
                    "is_unlocked": True,
                    "playlist_id": playlist.id,
                    "message": "Included with your plan — playlist access is already active.",
                },
                status=status.HTTP_200_OK,
            )

        if not settings.STRIPE_SECRET_KEY:
            return Response({"detail": "Stripe is not configured on backend."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        existing_paid = StreamPlaylistPurchase.objects.filter(
            user=request.user,
            playlist=playlist,
            status=StreamPlaylistPurchase.Status.PAID,
        ).first()
        if existing_paid is not None:
            return Response(
                {
                    "is_unlocked": True,
                    "playlist_id": playlist.id,
                    "message": "Playlist already unlocked.",
                },
                status=status.HTTP_200_OK,
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY
        amount_pence = int(max(50, round(float(playlist.price) * 100)))
        frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
        requested_base = str(request.data.get("return_base_url", "")).strip() if isinstance(request.data, dict) else ""
        if requested_base:
            parsed = urlsplit(requested_base)
            if parsed.scheme in ("http", "https") and bool(parsed.netloc):
                frontend_base = f"{parsed.scheme}://{parsed.netloc}"

        def _session_create(pm_types: list[str], metadata: dict):
            return stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=pm_types,
                customer_email=request.user.email or None,
                line_items=[
                    {
                        "price_data": {
                            "currency": settings.DEFAULT_CURRENCY,
                            "product_data": {"name": f"{playlist.title} playlist access"},
                            "unit_amount": amount_pence,
                        },
                        "quantity": 1,
                    }
                ],
                success_url=f"{frontend_base}/dashboard?section=programs&playlist_checkout=success&session_id={{CHECKOUT_SESSION_ID}}&playlist_id={playlist.id}",
                cancel_url=f"{frontend_base}/programs?playlist_checkout=cancelled&playlist_id={playlist.id}",
                metadata=metadata,
            )

        meta_affiliate_id = ""
        meta_visitor_id = ""
        if isinstance(request.data, dict):
            meta_affiliate_id = str(request.data.get("affiliate_id", "")).strip()
            meta_visitor_id = str(request.data.get("visitor_id", "")).strip()
        session_metadata = {
            "checkout_kind": "playlist_unlock",
            "playlist_id": str(playlist.id),
            "user_id": str(request.user.id),
        }
        if meta_affiliate_id:
            session_metadata["affiliate_id"] = meta_affiliate_id
        if meta_visitor_id:
            session_metadata["visitor_id"] = meta_visitor_id

        pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
        try:
            session = _session_create(pm_list, session_metadata)
        except stripe.error.InvalidRequestError as exc:
            err_txt = str(exc).lower()
            match = re.search(r"payment method type provided:\s*([a-z0-9_]+)\s+is invalid", err_txt)
            bad_type = match.group(1) if match else ""
            pm_retry = [t for t in pm_list if t != bad_type] if bad_type else [t for t in pm_list if t not in ("pay_by_bank",)]
            if not pm_retry:
                pm_retry = ["card"]
            try:
                session = _session_create(pm_retry, session_metadata)
            except stripe.error.StripeError as exc2:
                msg = getattr(exc2, "user_message", None) or str(exc2) or "Stripe could not start checkout."
                return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.StripeError as exc:
            msg = getattr(exc, "user_message", None) or str(exc) or "Stripe could not start checkout."
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"detail": "Unable to create checkout session."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        purchase, created = StreamPlaylistPurchase.objects.get_or_create(
            user=request.user,
            playlist=playlist,
            defaults={
                "status": StreamPlaylistPurchase.Status.PENDING,
                "stripe_session_id": session.id,
                "stripe_checkout_session_id": session.id,
                "amount_paid": playlist.price,
                "currency": settings.DEFAULT_CURRENCY,
                "paid_at": timezone.now(),
            },
        )
        if created or purchase.status != StreamPlaylistPurchase.Status.PAID:
            purchase.status = StreamPlaylistPurchase.Status.PENDING
            purchase.stripe_session_id = session.id
            purchase.stripe_checkout_session_id = session.id
            purchase.amount_paid = playlist.price
            purchase.currency = settings.DEFAULT_CURRENCY
            purchase.save(update_fields=["status", "stripe_session_id", "stripe_checkout_session_id", "amount_paid", "currency", "updated_at"])
        return Response({"checkout_url": session.url, "session_id": session.id, "playlist_id": playlist.id}, status=status.HTTP_200_OK)


class StreamPlaylistCheckoutSuccessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        session_id = str(request.data.get("session_id", "")).strip()
        if not session_id:
            return Response({"detail": "Session ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.STRIPE_SECRET_KEY:
            return Response({"detail": "Stripe is not configured on backend."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except Exception:
            return Response({"detail": "Invalid checkout session."}, status=status.HTTP_400_BAD_REQUEST)

        if getattr(session, "payment_status", "") != "paid":
            return Response({"detail": "Payment not completed."}, status=status.HTTP_400_BAD_REQUEST)

        def _session_metadata_dict(session_obj) -> dict:
            raw = getattr(session_obj, "metadata", None)
            if not raw:
                return {}
            if isinstance(raw, dict):
                return dict(raw)
            try:
                to_dict = getattr(raw, "to_dict_recursive", None)
                if callable(to_dict):
                    data = to_dict()
                    return data if isinstance(data, dict) else {}
            except Exception:
                pass
            data_attr = getattr(raw, "_data", None)
            if isinstance(data_attr, dict):
                return dict(data_attr)
            result = {}
            for k in ("playlist_id", "checkout_kind", "user_id", "affiliate_id", "visitor_id"):
                try:
                    v = raw[k]
                except Exception:
                    continue
                if v is None:
                    continue
                result[str(k)] = str(v)
            return result

        metadata = _session_metadata_dict(session)
        if str(metadata.get("checkout_kind", "")).strip() != "playlist_unlock":
            return Response({"detail": "Invalid checkout type."}, status=status.HTTP_400_BAD_REQUEST)
        if str(metadata.get("user_id", "")).strip() and str(metadata.get("user_id")).strip() != str(request.user.id):
            return Response({"detail": "Checkout session belongs to another user."}, status=status.HTTP_403_FORBIDDEN)

        playlist_id_raw = str(metadata.get("playlist_id", "")).strip()
        if not playlist_id_raw.isdigit():
            return Response({"detail": "Invalid playlist metadata."}, status=status.HTTP_400_BAD_REQUEST)
        playlist = get_object_or_404(StreamPlaylist, pk=int(playlist_id_raw))

        already_purchased = StreamPlaylistPurchase.objects.filter(
            user=request.user,
            playlist=playlist,
            status=StreamPlaylistPurchase.Status.PAID,
        ).exists()

        amount_total = getattr(session, "amount_total", None)
        amount_paid = Decimal(str(amount_total or 0)) / Decimal("100")
        currency = str(getattr(session, "currency", settings.DEFAULT_CURRENCY) or settings.DEFAULT_CURRENCY).lower()

        purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
            user=request.user,
            playlist=playlist,
            defaults={
                "status": StreamPlaylistPurchase.Status.PAID,
                "stripe_session_id": session_id,
                "stripe_checkout_session_id": session_id,
                "amount_paid": amount_paid,
                "currency": currency,
                "paid_at": timezone.now(),
            },
        )
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.stripe_session_id = session_id
        purchase.stripe_checkout_session_id = session_id
        purchase.amount_paid = amount_paid
        purchase.currency = currency
        purchase.paid_at = timezone.now()
        purchase.save(update_fields=["status", "stripe_session_id", "stripe_checkout_session_id", "amount_paid", "currency", "paid_at", "updated_at"])
        buyer_email = (request.user.email or "").strip().lower()
        if buyer_email:
            try:
                record_sale_from_checkout_metadata(
                    session_id=session_id,
                    affiliate_id=str(metadata.get("affiliate_id", "")).strip(),
                    visitor_id=str(metadata.get("visitor_id", "")).strip(),
                    email=buyer_email,
                    purchase_amount=amount_paid,
                    currency=currency,
                    plan_label=f"{playlist.title} playlist",
                )
            except Exception:
                logger.exception("Playlist checkout succeeded but affiliate sale attribution failed")
        return Response(
            {
                "message": "Playlist unlocked successfully.",
                "playlist_id": playlist.id,
                "is_unlocked": True,
                "already_purchased": already_purchased,
            },
            status=status.HTTP_200_OK,
        )


class StreamVideoMultipartUploadStartView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not getattr(request.user, "is_staff", False):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
            return Response({"detail": "Object storage is not configured."}, status=status.HTTP_400_BAD_REQUEST)
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", "") or "").strip()
        if not bucket:
            return Response({"detail": "Bucket is not configured."}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data if isinstance(request.data, dict) else {}
        filename = str(payload.get("filename", "")).strip()
        if not filename:
            return Response({"detail": "filename is required."}, status=status.HTTP_400_BAD_REQUEST)
        content_type = str(payload.get("content_type", "")).strip() or "application/octet-stream"
        raw_id = payload.get("stream_video_id")
        stream_video = None
        if raw_id not in (None, "", "null"):
            try:
                stream_video = get_object_or_404(StreamVideo, pk=int(raw_id))
            except (TypeError, ValueError):
                return Response({"detail": "stream_video_id is invalid."}, status=status.HTTP_400_BAD_REQUEST)
        if stream_video is None:
            provisional_title = str(payload.get("title", "")).strip() or Path(filename).stem or "video"
            stream_video = StreamVideo(title=provisional_title)
        key = stream_video_original_upload_to(stream_video, Path(filename).name)
        client = s3_client()
        if client is None:
            return Response({"detail": "Could not initialize object storage client."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            result = client.create_multipart_upload(
                Bucket=bucket,
                Key=key,
                ContentType=content_type,
            )
        except Exception:
            return Response({"detail": "Failed to start multipart upload."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        part_size = int((request.data.get("part_size_mb") or 64)) * 1024 * 1024
        part_size = max(5 * 1024 * 1024, min(part_size, 256 * 1024 * 1024))
        return Response(
            {
                "bucket": bucket,
                "key": key,
                "upload_id": result["UploadId"],
                "part_size": part_size,
            },
            status=status.HTTP_200_OK,
        )


class StreamVideoMultipartUploadSignPartView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not getattr(request.user, "is_staff", False):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", "") or "").strip()
        if not bucket:
            return Response({"detail": "Bucket is not configured."}, status=status.HTTP_400_BAD_REQUEST)
        payload = request.data if isinstance(request.data, dict) else {}
        key = str(payload.get("key", "")).strip()
        upload_id = str(payload.get("upload_id", "")).strip()
        try:
            part_number = int(payload.get("part_number"))
        except (TypeError, ValueError):
            return Response({"detail": "part_number is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not key or not upload_id:
            return Response({"detail": "key and upload_id are required."}, status=status.HTTP_400_BAD_REQUEST)
        client = s3_client()
        if client is None:
            return Response({"detail": "Could not initialize object storage client."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            signed_url = client.generate_presigned_url(
                ClientMethod="upload_part",
                Params={
                    "Bucket": bucket,
                    "Key": key,
                    "UploadId": upload_id,
                    "PartNumber": part_number,
                },
                ExpiresIn=3600,
            )
        except Exception:
            return Response({"detail": "Failed to sign part URL."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"url": signed_url}, status=status.HTTP_200_OK)


class StreamVideoMultipartUploadCompleteView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not getattr(request.user, "is_staff", False):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", "") or "").strip()
        if not bucket:
            return Response({"detail": "Bucket is not configured."}, status=status.HTTP_400_BAD_REQUEST)
        payload = request.data if isinstance(request.data, dict) else {}
        key = str(payload.get("key", "")).strip()
        upload_id = str(payload.get("upload_id", "")).strip()
        parts = payload.get("parts") if isinstance(payload.get("parts"), list) else []
        if not key or not upload_id or not parts:
            return Response({"detail": "key, upload_id and parts are required."}, status=status.HTTP_400_BAD_REQUEST)

        normalized_parts = []
        for p in parts:
            if not isinstance(p, dict):
                continue
            try:
                pn = int(p.get("PartNumber"))
            except (TypeError, ValueError):
                continue
            etag = str(p.get("ETag", "")).strip()
            if pn > 0 and etag:
                normalized_parts.append({"PartNumber": pn, "ETag": etag})
        if not normalized_parts:
            return Response({"detail": "No valid parts provided."}, status=status.HTTP_400_BAD_REQUEST)
        normalized_parts.sort(key=lambda item: item["PartNumber"])

        client = s3_client()
        if client is None:
            return Response({"detail": "Could not initialize object storage client."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            client.complete_multipart_upload(
                Bucket=bucket,
                Key=key,
                UploadId=upload_id,
                MultipartUpload={"Parts": normalized_parts},
            )
        except Exception:
            return Response({"detail": "Failed to complete multipart upload."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        raw_id = payload.get("stream_video_id")
        stream_video = None
        if raw_id not in (None, "", "null"):
            try:
                stream_video = get_object_or_404(StreamVideo, pk=int(raw_id))
            except (TypeError, ValueError):
                return Response({"detail": "stream_video_id is invalid."}, status=status.HTTP_400_BAD_REQUEST)
        if stream_video is None:
            return Response(
                {
                    "ok": True,
                    "queued": False,
                    "pending_save": True,
                    "key": key,
                },
                status=status.HTTP_200_OK,
            )

        StreamVideo.objects.filter(pk=stream_video.pk).update(
            original_video=key,
            status=StreamVideo.Status.READY,
            transcode_progress=100,
            transcode_message="Upload complete. Ready for playback.",
            last_error="",
            hls_path="",
        )

        return Response({"ok": True, "ready": True, "key": key}, status=status.HTTP_200_OK)


class StreamVideoMultipartUploadAbortView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not getattr(request.user, "is_staff", False):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", "") or "").strip()
        payload = request.data if isinstance(request.data, dict) else {}
        key = str(payload.get("key", "")).strip()
        upload_id = str(payload.get("upload_id", "")).strip()
        if not bucket or not key or not upload_id:
            return Response({"ok": True}, status=status.HTTP_200_OK)
        client = s3_client()
        if client is None:
            return Response({"ok": True}, status=status.HTTP_200_OK)
        try:
            client.abort_multipart_upload(Bucket=bucket, Key=key, UploadId=upload_id)
        except Exception:
            pass
        return Response({"ok": True}, status=status.HTTP_200_OK)
