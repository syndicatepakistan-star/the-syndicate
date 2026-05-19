from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.portal.permissions import IsAuthenticatedStrict

from apps.courses.access import user_can_access_course, user_can_access_video
from apps.courses.models import Course, CourseCertificate, Video, VideoProgress
from apps.courses.serializers import (
    CourseSerializer,
    CourseWriteSerializer,
    VideoSerializer,
    VideoProgressSerializer,
)


class CourseListCreateView(APIView):
    """GET: list published courses (auth). POST: staff creates course."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [IsAuthenticatedStrict()]

    def get(self, request):
        qs = Course.objects.filter(show_in_programs=True)
        if not getattr(request.user, "is_staff", False):
            qs = qs.filter(is_published=True)
        ser = CourseSerializer(qs.order_by("title"), many=True, context={"request": request})
        return Response(ser.data)

    def post(self, request):
        ser = CourseWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        course = ser.save()
        return Response(CourseSerializer(course, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if not user_can_access_course(request.user, course):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        return Response(CourseSerializer(course, context={"request": request}).data)


class CourseVideosListView(APIView):
    """GET /api/courses/<id>/videos/ — ordered playlist metadata."""

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if not user_can_access_course(request.user, course):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        qs = (
            course.videos.filter(status=Video.Status.READY)
            .exclude(video_url="")
            .order_by("order", "id")
        )
        return Response(VideoSerializer(qs, many=True).data)


class VideoProgressView(APIView):
    """GET/POST /api/videos/<id>/progress/ — read or upsert watch position."""

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        if not user_can_access_video(request.user, video):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        prog = VideoProgress.objects.filter(user=request.user, video=video).first()
        if not prog:
            return Response({"position_seconds": 0, "completed": False})
        return Response(VideoProgressSerializer(prog).data)

    def post(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        if not user_can_access_video(request.user, video):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        ser = VideoProgressSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj, _ = VideoProgress.objects.update_or_create(
            user=request.user,
            video=video,
            defaults={
                "position_seconds": ser.validated_data.get("position_seconds", 0),
                "completed": ser.validated_data.get("completed", False),
            },
        )
        if obj.completed:
            ready_video_ids = list(
                video.course.videos.filter(status=Video.Status.READY).exclude(video_url="").values_list("id", flat=True)
            )
            if ready_video_ids:
                completed_video_ids = set(
                    VideoProgress.objects.filter(
                        user=request.user,
                        video_id__in=ready_video_ids,
                        completed=True,
                    ).values_list("video_id", flat=True)
                )
                if len(completed_video_ids) == len(ready_video_ids):
                    CourseCertificate.objects.get_or_create(
                        user=request.user,
                        course=video.course,
                        defaults={"status": CourseCertificate.Status.CERTIFIED},
                    )
        return Response(VideoProgressSerializer(obj).data)


def _certificate_verify_payload(*, token_id: str, title: str, holder_name: str, issued_at, kind: str) -> dict:
    return {
        "verified": True,
        "status": "certified",
        "message": "You are Syndicate Certified",
        "token_id": token_id,
        "kind": kind,
        "title": title,
        "course_title": title,
        "playlist_title": title,
        "holder_name": holder_name,
        "issued_at": issued_at,
    }


@method_decorator(csrf_exempt, name="dispatch")
class CourseCertificateVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        raw_token = str((request.data or {}).get("token_id", "")).strip().upper()
        if not raw_token:
            return Response(
                {
                    "verified": False,
                    "status": "not_certified",
                    "message": "Token ID is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cert = (
            CourseCertificate.objects.select_related("course")
            .filter(token_id=raw_token, status=CourseCertificate.Status.CERTIFIED)
            .first()
        )
        if cert:
            return Response(
                _certificate_verify_payload(
                    token_id=cert.token_id,
                    title=cert.course.title,
                    holder_name="",
                    issued_at=cert.issued_at,
                    kind="course",
                )
            )

        from apps.video_streaming.models import StreamPlaylistCertificate

        playlist_cert = (
            StreamPlaylistCertificate.objects.select_related("playlist")
            .filter(token_id=raw_token, status=StreamPlaylistCertificate.Status.CERTIFIED)
            .first()
        )
        if playlist_cert:
            return Response(
                _certificate_verify_payload(
                    token_id=playlist_cert.token_id,
                    title=playlist_cert.playlist.title,
                    holder_name=playlist_cert.holder_name,
                    issued_at=playlist_cert.issued_at,
                    kind="playlist",
                )
            )

        return Response(
            {
                "verified": False,
                "status": "not_certified",
                "message": "You are not Syndicate Certified",
            }
        )


class MyCertificatesListView(APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request):
        from apps.video_streaming.models import StreamPlaylistCertificate

        rows: list[dict] = []
        for cert in (
            StreamPlaylistCertificate.objects.filter(
                user=request.user,
                status=StreamPlaylistCertificate.Status.CERTIFIED,
            )
            .select_related("playlist")
            .order_by("-issued_at", "-id")
        ):
            rows.append(
                {
                    "kind": "playlist",
                    "certificate_id": cert.token_id,
                    "token_id": cert.token_id,
                    "title": cert.playlist.title,
                    "name": cert.holder_name,
                    "issued_at": cert.issued_at.isoformat() if cert.issued_at else None,
                }
            )
        for cert in (
            CourseCertificate.objects.filter(
                user=request.user,
                status=CourseCertificate.Status.CERTIFIED,
            )
            .select_related("course")
            .order_by("-issued_at", "-id")
        ):
            rows.append(
                {
                    "kind": "course",
                    "certificate_id": cert.token_id,
                    "token_id": cert.token_id,
                    "title": cert.course.title,
                    "name": "",
                    "issued_at": cert.issued_at.isoformat() if cert.issued_at else None,
                }
            )
        return Response(rows)
