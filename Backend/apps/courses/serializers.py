from typing import Optional

from rest_framework import serializers

from apps.courses.access import user_can_access_course
from apps.courses.models import Course, Video, VideoProgress
from syndicate_backend.media_storages import public_media_url


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
        request = self.context.get("request")
        return public_media_url(obj.cover_image, request)


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
        request = self.context.get("request")
        return public_media_url(obj.thumbnail, request)


class VideoProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoProgress
        fields = ("position_seconds", "completed", "updated_at")
        read_only_fields = ("updated_at",)
