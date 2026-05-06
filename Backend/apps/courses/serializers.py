from typing import Optional
from urllib.parse import quote

from django.conf import settings
from rest_framework import serializers

from apps.courses.access import user_can_access_course
from apps.courses.models import Course, Video, VideoProgress


class CourseSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "cover_image_url",
            "is_published",
            "allow_all_authenticated",
            "can_access",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "cover_image_url", "can_access", "created_at", "updated_at")

    def get_can_access(self, obj: Course) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return user_can_access_course(request.user, obj)

    def get_cover_image_url(self, obj: Course) -> Optional[str]:
        if not obj.cover_image:
            return None
        name = (getattr(obj.cover_image, "name", "") or "").strip()
        public_base = (getattr(settings, "MEDIA_PUBLIC_BASE_URL", "") or "").strip().rstrip("/")
        if name and public_base:
            return f"{public_base}/{quote(name.lstrip('/'), safe='/')}"
        return obj.cover_image.url


class CourseWriteSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=280)

    class Meta:
        model = Course
        fields = ("title", "slug", "description", "is_published", "allow_all_authenticated")


class VideoSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = (
            "id",
            "title",
            "description",
            "course",
            "video_url",
            "thumbnail_url",
            "order",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "thumbnail_url", "created_at", "updated_at")

    def get_thumbnail_url(self, obj: Video) -> Optional[str]:
        if not obj.thumbnail:
            return None
        name = (getattr(obj.thumbnail, "name", "") or "").strip()
        public_base = (getattr(settings, "MEDIA_PUBLIC_BASE_URL", "") or "").strip().rstrip("/")
        if name and public_base:
            return f"{public_base}/{quote(name.lstrip('/'), safe='/')}"
        return obj.thumbnail.url


class VideoProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoProgress
        fields = ("position_seconds", "completed", "updated_at")
        read_only_fields = ("updated_at",)
