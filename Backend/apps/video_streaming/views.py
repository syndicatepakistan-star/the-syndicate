import mimetypes
import re
import time
from decimal import Decimal
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from botocore.exceptions import ClientError
import stripe
from django.conf import settings
from django.db.models import Count, Prefetch, Q
from django.core import signing
from django.utils import timezone
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse

from apps.portal.models import UserDashboardEntitlement
from apps.portal.king_access import king_allowed_playlist_ids, king_selection_completed
from apps.video_streaming.models import (
    StreamPlaylist,
    StreamPlaylistItem,
    StreamPlaylistPurchase,
    StreamVideo,
    stream_video_original_upload_to,
)
from apps.video_streaming.transcode_policy import enqueue_stream_video_transcode, inline_stream_transcode_enabled
from apps.video_streaming.serializers import (
    StreamPlaylistDetailSerializer,
    StreamPlaylistListSerializer,
    StreamPlaylistPurchaseHistorySerializer,
    StreamVideoDetailSerializer,
    StreamVideoListSerializer,
    StreamVideoStreamSerializer,
)
from apps.video_streaming.services.r2_hls import _s3_client

STREAM_TOKEN_SALT = "video_streaming.hls.v1"


def _user_stream_playlists_unlocked_by_entitlement(user) -> bool:
    """
    Money Mastery / King / staff-equivalent tiers include all published stream playlists
    (UI `is_unlocked` + detail queryset), not only per-playlist Stripe purchases.
    """
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    try:
        ent = user.dashboard_entitlement
    except UserDashboardEntitlement.DoesNotExist:
        return False
    if ent.access_tier == UserDashboardEntitlement.AccessTier.KING:
        return king_selection_completed(user) and bool(king_allowed_playlist_ids(user))
    return ent.access_tier in (
        UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        UserDashboardEntitlement.AccessTier.FULL,
    )


def _playlist_included_by_entitlement(user, playlist_id: int) -> bool:
    """
    Per-playlist entitlement check (used by checkout).
    King access is selection-based, so only selected playlist IDs are included.
    """
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return True
    try:
        ent = user.dashboard_entitlement
    except UserDashboardEntitlement.DoesNotExist:
        return False
    if ent.access_tier == UserDashboardEntitlement.AccessTier.KING:
        return king_selection_completed(user) and int(playlist_id) in king_allowed_playlist_ids(user)
    return ent.access_tier in (
        UserDashboardEntitlement.AccessTier.MONEY_MASTERY,
        UserDashboardEntitlement.AccessTier.FULL,
    )


def _normalize_hls_relpath(raw: str) -> str | None:
    cleaned = (raw or "").strip().replace("\\", "/").lstrip("/")
    if not cleaned:
        return None
    parts = [p for p in cleaned.split("/") if p]
    for p in parts:
        if p in (".", ".."):
            return None
    return "/".join(parts)


def _content_type_for_name(name: str) -> str:
    lower = name.lower()
    if lower.endswith(".m3u8"):
        return "application/vnd.apple.mpegurl"
    if lower.endswith(".ts"):
        return "video/mp2t"
    ct, _ = mimetypes.guess_type(name)
    return ct or "application/octet-stream"


def playback_playlist_path(video_id: int) -> str:
    """Site-relative URL (works behind Next.js proxy)."""
    return reverse("streaming-hls-media", kwargs={"video_id": video_id, "rel_path": "index.m3u8"})


def _stream_token_secret() -> str:
    return (getattr(settings, "STREAM_SIGNING_SECRET", "") or "").strip() or settings.SECRET_KEY


def _token_ttl_seconds() -> int:
    raw = str(getattr(settings, "STREAM_SIGNED_URL_TTL_SECONDS", 900)).strip() or "900"
    try:
        ttl = int(raw)
    except ValueError:
        ttl = 900
    return max(30, min(ttl, 60 * 60 * 24))


def _build_stream_token(*, user_id: int, video_id: int, exp: int) -> str:
    payload = {"u": int(user_id), "v": int(video_id), "exp": int(exp)}
    return signing.dumps(payload, key=_stream_token_secret(), salt=STREAM_TOKEN_SALT, compress=True)


def _verify_stream_token(*, token: str, video_id: int) -> dict | None:
    try:
        payload = signing.loads(token, key=_stream_token_secret(), salt=STREAM_TOKEN_SALT)
    except signing.BadSignature:
        return None
    if not isinstance(payload, dict):
        return None
    try:
        uid = int(payload.get("u"))
        vid = int(payload.get("v"))
        exp = int(payload.get("exp"))
    except (TypeError, ValueError):
        return None
    now = int(time.time())
    if vid != int(video_id) or exp <= now:
        return None
    return {"u": uid, "v": vid, "exp": exp}


def _append_query_params(url: str, extra: dict[str, str]) -> str:
    if not url:
        return url
    split = urlsplit(url)
    query = dict(parse_qsl(split.query, keep_blank_values=True))
    query.update(extra)
    return urlunsplit((split.scheme, split.netloc, split.path, urlencode(query), split.fragment))


def _rewrite_hls_manifest(content: str, token: str, exp: str) -> str:
    """
    Ensure each URI in manifest carries auth query params so `.ts` / key files
    are protected by the same signed token as `index.m3u8`.
    """
    extra = {"token": token, "expires": exp}
    out: list[str] = []
    uri_attr_re = re.compile(r'URI="([^"]+)"')
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line:
            out.append(raw_line)
            continue
        if line.startswith("#"):
            def _replace_uri(m: re.Match[str]) -> str:
                return f'URI="{_append_query_params(m.group(1), extra)}"'

            out.append(uri_attr_re.sub(_replace_uri, raw_line))
            continue
        out.append(_append_query_params(raw_line, extra))
    # HLS parsers are happier with trailing newline.
    return "\n".join(out) + "\n"


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

    Returns a site-relative HLS playlist path that is only served by StreamHlsMediaView when authenticated.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int, *args, **kwargs):
        try:
            video = StreamVideo.objects.get(pk=pk)
        except StreamVideo.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Local-dev fallback: stuck "processing" rows (e.g. no worker) transcode on first playback.
        if (
            inline_stream_transcode_enabled()
            and video.status == StreamVideo.Status.PROCESSING
            and bool(video.original_video and video.original_video.name)
        ):
            try:
                from apps.video_streaming.tasks import process_stream_video_to_hls

                process_stream_video_to_hls(video.pk)
                video.refresh_from_db(fields=["status", "hls_path", "last_error"])
            except Exception:
                video.refresh_from_db(fields=["status", "hls_path", "last_error"])

        if video.status != StreamVideo.Status.READY or not (video.hls_path or "").strip():
            payload = {"id": video.id, "status": video.status, "hls_url": None}
            ser = StreamVideoStreamSerializer(payload)
            return Response(ser.data, status=status.HTTP_200_OK)

        exp = int(time.time()) + _token_ttl_seconds()
        token = _build_stream_token(user_id=request.user.id, video_id=video.pk, exp=exp)
        query = urlencode({"token": token, "expires": str(exp)})
        payload = {
            "id": video.id,
            "status": video.status,
            "hls_url": f"{playback_playlist_path(video.pk)}?{query}",
        }
        ser = StreamVideoStreamSerializer(payload)
        return Response(ser.data, status=status.HTTP_200_OK)


class StreamHlsMediaView(APIView):
    """
    Authenticated HLS delivery (playlist + segments). Use hls.js xhrSetup to send Authorization on each request.
    """

    permission_classes = [AllowAny]

    def get(self, request, video_id: int, rel_path: str, *args, **kwargs):
        token = (request.query_params.get("token") or "").strip()
        expires = (request.query_params.get("expires") or "").strip()
        if not token or not expires:
            raise Http404()
        claims = _verify_stream_token(token=token, video_id=video_id)
        if not claims:
            raise Http404()
        # If request carries a logged-in user, token must belong to same user.
        if getattr(request.user, "is_authenticated", False) and request.user.id != claims["u"]:
            raise Http404()

        video = get_object_or_404(StreamVideo, pk=video_id)
        if video.status != StreamVideo.Status.READY or not (video.hls_path or "").strip():
            raise Http404()

        sub = _normalize_hls_relpath(rel_path)
        if not sub:
            raise Http404()

        media_root = Path(settings.MEDIA_ROOT).resolve()
        base_local = media_root / "hls" / str(video_id)
        try:
            local_file = (base_local / sub).resolve()
            local_file.relative_to(base_local)
        except ValueError:
            raise Http404()

        if local_file.is_file():
            if sub.lower().endswith(".m3u8"):
                content = local_file.read_text(encoding="utf-8", errors="replace")
                rewritten = _rewrite_hls_manifest(content, token=token, exp=expires)
                resp = HttpResponse(rewritten, content_type=_content_type_for_name(sub))
            else:
                resp = FileResponse(local_file.open("rb"), content_type=_content_type_for_name(sub))
            resp["Cache-Control"] = "private, no-store"
            return resp

        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        if getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket:
            client = _s3_client()
            if not client:
                raise Http404()
            key = f"hls/{video_id}/{sub}"
            try:
                obj = client.get_object(Bucket=bucket, Key=key)
            except ClientError as ex:
                code = ex.response.get("Error", {}).get("Code", "")
                if code in ("404", "NoSuchKey", "NotFound"):
                    raise Http404() from ex
                raise
            body = obj["Body"]

            if sub.lower().endswith(".m3u8"):
                content = body.read().decode("utf-8", errors="replace")
                rewritten = _rewrite_hls_manifest(content, token=token, exp=expires)
                resp = HttpResponse(rewritten, content_type=_content_type_for_name(sub))
            else:
                def chunks():
                    while True:
                        data = body.read(65536)
                        if not data:
                            break
                        yield data

                resp = StreamingHttpResponse(chunks(), content_type=_content_type_for_name(sub))
            resp["Cache-Control"] = "private, no-store"
            return resp

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
            unlocked_ids = set(
                StreamPlaylistPurchase.objects.filter(
                    user=user,
                    status=StreamPlaylistPurchase.Status.PAID,
                ).values_list("playlist_id", flat=True)
            )
            if _user_stream_playlists_unlocked_by_entitlement(user):
                if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
                    unlocked_ids |= set(
                        StreamPlaylist.objects.filter(is_published=True).values_list("id", flat=True)
                    )
                else:
                    try:
                        ent = user.dashboard_entitlement
                    except UserDashboardEntitlement.DoesNotExist:
                        ent = None
                    if ent is not None and ent.access_tier == UserDashboardEntitlement.AccessTier.KING:
                        unlocked_ids |= king_allowed_playlist_ids(user)
                    else:
                        unlocked_ids |= set(
                            StreamPlaylist.objects.filter(is_published=True).values_list("id", flat=True)
                        )
            ctx["unlocked_playlist_ids"] = unlocked_ids
        else:
            ctx["unlocked_playlist_ids"] = set()
        return ctx


class StreamPlaylistDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StreamPlaylistDetailSerializer
    lookup_field = "pk"

    def get_queryset(self):
        qs = StreamPlaylist.objects.all()
        if not getattr(self.request.user, "is_staff", False):
            qs = qs.filter(is_published=True)
            if not _user_stream_playlists_unlocked_by_entitlement(self.request.user):
                unlocked_ids = set(
                    StreamPlaylistPurchase.objects.filter(
                        user=self.request.user,
                        status=StreamPlaylistPurchase.Status.PAID,
                    ).values_list("playlist_id", flat=True)
                )
                qs = qs.filter(Q(price__lte=0) | Q(id__in=unlocked_ids))
            else:
                if not getattr(self.request.user, "is_staff", False) and not getattr(self.request.user, "is_superuser", False):
                    try:
                        ent = self.request.user.dashboard_entitlement
                    except UserDashboardEntitlement.DoesNotExist:
                        ent = None
                    if ent is not None and ent.access_tier == UserDashboardEntitlement.AccessTier.KING:
                        paid_ids = set(
                            StreamPlaylistPurchase.objects.filter(
                                user=self.request.user,
                                status=StreamPlaylistPurchase.Status.PAID,
                            ).values_list("playlist_id", flat=True)
                        )
                        qs = qs.filter(
                            Q(price__lte=0)
                            | Q(id__in=king_allowed_playlist_ids(self.request.user))
                            | Q(id__in=paid_ids)
                        )
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

        if _playlist_included_by_entitlement(request.user, playlist.id):
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

        def _session_create(pm_types: list[str]):
            return stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=pm_types,
                customer_email=request.user.email or None,
                line_items=[
                    {
                        "price_data": {
                            "currency": "gbp",
                            "product_data": {"name": f"{playlist.title} playlist access"},
                            "unit_amount": amount_pence,
                        },
                        "quantity": 1,
                    }
                ],
                success_url=f"{frontend_base}/dashboard?playlist_checkout=success&session_id={{CHECKOUT_SESSION_ID}}&playlist_id={playlist.id}",
                cancel_url=f"{frontend_base}/programs?playlist_checkout=cancelled&playlist_id={playlist.id}",
                metadata={
                    "checkout_kind": "playlist_unlock",
                    "playlist_id": str(playlist.id),
                    "user_id": str(request.user.id),
                },
            )

        pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
        try:
            session = _session_create(pm_list)
        except stripe.error.InvalidRequestError as exc:
            err_txt = str(exc).lower()
            match = re.search(r"payment method type provided:\s*([a-z0-9_]+)\s+is invalid", err_txt)
            bad_type = match.group(1) if match else ""
            pm_retry = [t for t in pm_list if t != bad_type] if bad_type else [t for t in pm_list if t not in ("pay_by_bank",)]
            if not pm_retry:
                pm_retry = ["card"]
            try:
                session = _session_create(pm_retry)
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
                "currency": "gbp",
                "paid_at": timezone.now(),
            },
        )
        if created or purchase.status != StreamPlaylistPurchase.Status.PAID:
            purchase.status = StreamPlaylistPurchase.Status.PENDING
            purchase.stripe_session_id = session.id
            purchase.stripe_checkout_session_id = session.id
            purchase.amount_paid = playlist.price
            purchase.currency = "gbp"
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
            for k in ("playlist_id", "checkout_kind", "user_id"):
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

        amount_total = getattr(session, "amount_total", None)
        amount_paid = Decimal(str(amount_total or 0)) / Decimal("100")
        currency = str(getattr(session, "currency", "gbp") or "gbp").lower()

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
        return Response(
            {"message": "Playlist unlocked successfully.", "playlist_id": playlist.id, "is_unlocked": True},
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
        client = _s3_client()
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
        client = _s3_client()
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

        client = _s3_client()
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

        # IMPORTANT: avoid model save/signals here; in some environments signals may run
        # transcoding inline and block/kill this request for huge uploads.
        StreamVideo.objects.filter(pk=stream_video.pk).update(
            original_video=key,
            status=StreamVideo.Status.PROCESSING,
            last_error="",
            hls_path="",
        )

        try:
            enqueue_stream_video_transcode(stream_video.pk)
        except Exception:
            return Response(
                {
                    "detail": "Upload stored but could not queue processing. Check worker/broker.",
                    "ok": False,
                    "key": key,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"ok": True, "queued": True, "key": key}, status=status.HTTP_200_OK)


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
        client = _s3_client()
        if client is None:
            return Response({"ok": True}, status=status.HTTP_200_OK)
        try:
            client.abort_multipart_upload(Bucket=bucket, Key=key, UploadId=upload_id)
        except Exception:
            pass
        return Response({"ok": True}, status=status.HTTP_200_OK)
