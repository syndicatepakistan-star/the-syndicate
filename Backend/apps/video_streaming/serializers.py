from rest_framework import serializers

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamPlaylistPurchase, StreamVideo
from apps.video_streaming.playlist_description import parse_playlist_description_sections
from syndicate_backend.media_storages import public_media_url


def _safe_media_url_for_field(file_field, request):
    return public_media_url(file_field, request)


class StreamVideoListSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = StreamVideo
        fields = (
            "id",
            "title",
            "description",
            "price",
            "thumbnail_url",
            "status",
            "player_layout",
            "source_width",
            "source_height",
            "created_at",
        )
        read_only_fields = fields

    def get_thumbnail_url(self, obj: StreamVideo):
        request = self.context.get("request")
        return _safe_media_url_for_field(obj.thumbnail, request)


class StreamVideoDetailSerializer(StreamVideoListSerializer):
    class Meta(StreamVideoListSerializer.Meta):
        fields = StreamVideoListSerializer.Meta.fields


class StreamVideoStreamSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    status = serializers.CharField()
    playback_url = serializers.CharField(allow_null=True, allow_blank=True)
    playback_expires_at = serializers.IntegerField(allow_null=True, required=False)


class StreamPlaylistItemSerializer(serializers.ModelSerializer):
    stream_video = StreamVideoListSerializer(read_only=True)

    class Meta:
        model = StreamPlaylistItem
        fields = ("id", "order", "stream_video")


class StreamPlaylistListSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    video_count = serializers.IntegerField(read_only=True)
    description_sections = serializers.SerializerMethodField()

    class Meta:
        model = StreamPlaylist
        fields = (
            "id",
            "title",
            "slug",
            "category",
            "description",
            "description_sections",
            "price",
            "rating",
            "cover_image_url",
            "video_count",
            "is_published",
            "is_coming_soon",
            "is_unlocked",
            "created_at",
        )
        read_only_fields = fields

    is_unlocked = serializers.SerializerMethodField()

    def get_description_sections(self, obj: StreamPlaylist) -> dict[str, str]:
        return parse_playlist_description_sections(obj.description)

    def get_cover_image_url(self, obj: StreamPlaylist):
        request = self.context.get("request")
        cover_url = _safe_media_url_for_field(obj.cover_image, request)
        if cover_url:
            return cover_url
        for item in obj.items.all():
            sv = item.stream_video
            thumb_url = _safe_media_url_for_field(sv.thumbnail, request)
            if thumb_url:
                return thumb_url
        return None

    def get_is_unlocked(self, obj: StreamPlaylist):
        request = self.context.get("request")
        if request is None:
            return False
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False) and getattr(user, "is_staff", False):
            return True
        unlocked_ids = self.context.get("unlocked_playlist_ids")
        if isinstance(unlocked_ids, set):
            return obj.id in unlocked_ids
        return False


class StreamPlaylistDetailSerializer(StreamPlaylistListSerializer):
    items = StreamPlaylistItemSerializer(many=True, read_only=True)

    class Meta(StreamPlaylistListSerializer.Meta):
        fields = (*StreamPlaylistListSerializer.Meta.fields, "items")


class StreamPlaylistPurchaseHistorySerializer(serializers.ModelSerializer):
    playlist_id = serializers.IntegerField(source="playlist.id", read_only=True)
    playlist_title = serializers.CharField(source="playlist.title", read_only=True)

    class Meta:
        model = StreamPlaylistPurchase
        fields = (
            "id",
            "playlist_id",
            "playlist_title",
            "status",
            "amount_paid",
            "currency",
            "paid_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
