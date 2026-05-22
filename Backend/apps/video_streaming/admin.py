from django.contrib import admin, messages
from django.conf import settings
from django import forms
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.video_streaming.models import (
    StreamPlaylist,
    StreamPlaylistCertificate,
    StreamPlaylistItem,
    StreamPlaylistPurchase,
    StreamVideo,
)
from apps.video_streaming.services.bucket_reference import normalize_bucket_object_key


class StreamPlaylistItemInline(admin.TabularInline):
    model = StreamPlaylistItem
    extra = 0
    ordering = ("order", "id")
    autocomplete_fields = ("stream_video",)
    fields = ("order", "stream_video")


@admin.register(StreamPlaylist)
class StreamPlaylistAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "price", "rating", "slug", "is_published", "is_coming_soon", "updated_at")
    list_filter = ("category", "is_published", "is_coming_soon")
    search_fields = ("title", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [StreamPlaylistItemInline]
    fieldsets = (
        (None, {"fields": ("title", "slug", "category", "price", "rating", "cover_image")}),
        (
            "Program description (dashboard modal)",
            {
                "fields": ("description",),
                "description": (
                    "Use three section titles each on its own line (case-insensitive), then the body text below. "
                    "Titles: The Hook — The core protocol (or Core protocol) — What you will learn. "
                    "Optional markdown hashes at the start of a title line (e.g. ## The Hook) are allowed. "
                    "Under What you will learn, lines like Module 1, Chapter 2, or Chapter 3: Title (own line) "
                    "become sub-headings; list topics on the following lines (or with - bullets). "
                    "Blank lines between sections are fine."
                ),
            },
        ),
        ("Publishing", {"fields": ("is_published", "is_coming_soon")}),
    )


class StreamVideoAdminForm(forms.ModelForm):
    bucket_video_url_or_key = forms.CharField(
        required=False,
        label="R2 bucket URL or object key",
        help_text=(
            "Upload the MP4 in Cloudflare R2 first, then paste either the object key "
            "(e.g. stream_videos/originals/my-video.mp4) or the full R2/S3 URL from the dashboard. "
            "Click Save — playback uses your private bucket via signed API URLs (not this raw link in the app)."
        ),
    )
    multipart_video = forms.FileField(
        required=False,
        help_text=(
            "For very large files (9GB+), pick a file, click “Upload large file to bucket”, wait until it finishes, "
            "then Save. The file choice is cleared after upload so Save only sends the key—otherwise Django would "
            "receive the whole video again and Save would be very slow."
        ),
    )
    multipart_uploaded_key = forms.CharField(required=False, widget=forms.HiddenInput())

    class Meta:
        model = StreamVideo
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            existing = (getattr(self.instance.original_video, "name", None) or "").strip()
            if existing and not self.initial.get("bucket_video_url_or_key"):
                self.initial["bucket_video_url_or_key"] = existing

    def clean(self):
        cleaned = super().clean()
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        raw_ref = (cleaned.get("bucket_video_url_or_key") or "").strip()
        multipart_key = (cleaned.get("multipart_uploaded_key") or "").strip()
        selected_key = normalize_bucket_object_key(raw_ref, bucket_name=bucket) or multipart_key
        if raw_ref and not selected_key:
            raise ValidationError(
                {"bucket_video_url_or_key": "Could not parse a storage object key from that URL or path."}
            )
        cleaned["bucket_video_url_or_key"] = raw_ref
        cleaned["_resolved_bucket_key"] = selected_key
        uploaded_file = cleaned.get("original_video")
        if selected_key or not uploaded_file:
            return cleaned

        max_gb = float(getattr(settings, "STREAM_DIRECT_UPLOAD_MAX_GB", 5))
        max_bytes = int(max_gb * 1024 * 1024 * 1024)
        size = int(getattr(uploaded_file, "size", 0) or 0)
        if size > max_bytes:
            raise ValidationError(
                {
                    "original_video": (
                        f"This file is {size / (1024 ** 3):.2f} GB. Direct upload is limited to {max_gb:g} GB. "
                        "Use Multipart video upload (Upload large file to bucket) or paste an R2 URL / object key."
                    )
                }
            )
        return cleaned


@admin.register(StreamVideo)
class StreamVideoAdmin(admin.ModelAdmin):
    form = StreamVideoAdminForm
    list_display = (
        "title",
        "status",
        "transcode_progress",
        "transcode_message",
        "player_layout",
        "price",
        "show_in_programs",
        "show_in_membership",
        "created_at",
    )
    list_filter = ("status", "player_layout", "show_in_programs", "show_in_membership")
    search_fields = ("title", "description")
    readonly_fields = (
        "resolved_storage_key_display",
        "hls_path",
        "status",
        "transcode_progress",
        "transcode_message",
        "last_error",
        "source_width",
        "source_height",
        "created_at",
    )
    fieldsets = (
        (None, {"fields": ("title", "description", "price", "show_in_programs", "show_in_membership")}),
        ("Player", {"fields": ("player_layout", "source_width", "source_height")}),
        ("Media", {
            "fields": (
                "thumbnail",
                "bucket_video_url_or_key",
                "resolved_storage_key_display",
                "original_video",
                "multipart_video",
                "multipart_uploaded_key",
            ),
            "description": (
                "Manual R2 workflow: upload MP4 in Cloudflare R2, paste the object key or R2 URL in "
                "R2 bucket URL or object key, then Save. Optional: use Original video to upload through Django. "
                "Fast-start MP4s seek sooner: ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4"
            ),
        }),
        ("Pipeline", {"fields": ("status", "transcode_progress", "transcode_message", "hls_path", "last_error", "created_at")}),
    )

    @admin.display(description="Resolved storage key (used for playback)")
    def resolved_storage_key_display(self, obj: StreamVideo) -> str:
        key = (getattr(obj.original_video, "name", None) or "").strip()
        return key or "—"
    class Media:
        js = ("admin/streamvideo_multipart_upload.js",)

    def save_model(self, request, obj, form, change):
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        raw_ref = (form.cleaned_data.get("bucket_video_url_or_key") or "").strip()
        uploaded_key = (form.cleaned_data.get("multipart_uploaded_key") or "").strip()
        selected_key = (form.cleaned_data.get("_resolved_bucket_key") or "").strip()
        if not selected_key and raw_ref:
            selected_key = normalize_bucket_object_key(raw_ref, bucket_name=bucket)
        if not selected_key:
            selected_key = uploaded_key
        if selected_key:
            obj._skip_auto_ready = True
            obj.original_video.name = selected_key
            obj.status = StreamVideo.Status.READY
            obj.transcode_progress = 100
            obj.transcode_message = "Linked to bucket object. Ready for playback."
            obj.last_error = ""
            obj.hls_path = ""
            if raw_ref or uploaded_key:
                messages.success(
                    request,
                    f"Video linked to bucket object: {selected_key}",
                )
        super().save_model(request, obj, form, change)


@admin.register(StreamPlaylistCertificate)
class StreamPlaylistCertificateAdmin(admin.ModelAdmin):
    list_display = ("token_id", "holder_name", "playlist", "user", "status", "issued_at")
    list_filter = ("status",)
    search_fields = ("token_id", "holder_name", "user__email", "user__username", "playlist__title")
    readonly_fields = ("token_id", "issued_at", "updated_at")
    autocomplete_fields = ("user", "playlist")
