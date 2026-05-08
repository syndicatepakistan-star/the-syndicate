from django.contrib import admin, messages
from django.conf import settings
from django import forms
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamPlaylistPurchase, StreamVideo
from apps.video_streaming.transcode_policy import enqueue_stream_video_transcode


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
    bucket_video_key = forms.CharField(
        required=False,
        label="Bucket video key",
        help_text=(
            "Optional. Paste an existing object key uploaded directly to bucket "
            "(example: stream_videos/originals/Amazon KDP.mp4)."
        ),
    )
    multipart_video = forms.FileField(
        required=False,
        help_text="For very large files (9GB+), use this field and click 'Upload large file to bucket' before Save.",
    )
    multipart_uploaded_key = forms.CharField(required=False, widget=forms.HiddenInput())

    class Meta:
        model = StreamVideo
        fields = "__all__"

    def clean(self):
        cleaned = super().clean()
        selected_key = (cleaned.get("bucket_video_key") or "").strip() or (cleaned.get("multipart_uploaded_key") or "").strip()
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
                        "Use Multipart video upload (Upload large file to bucket) or paste a bucket video key."
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
        "player_layout",
        "price",
        "show_in_programs",
        "show_in_membership",
        "created_at",
    )
    list_filter = ("status", "player_layout", "show_in_programs", "show_in_membership")
    search_fields = ("title", "description")
    readonly_fields = ("hls_path", "status", "transcode_progress", "last_error", "source_width", "source_height", "created_at")
    actions = ("reprocess_hls",)
    fieldsets = (
        (None, {"fields": ("title", "description", "price", "show_in_programs", "show_in_membership")}),
        ("Player", {"fields": ("player_layout", "source_width", "source_height")}),
        ("Media", {"fields": ("thumbnail", "original_video", "bucket_video_key", "multipart_video", "multipart_uploaded_key")}),
        ("Pipeline", {"fields": ("status", "transcode_progress", "hls_path", "last_error", "created_at")}),
    )
    class Media:
        js = ("admin/streamvideo_multipart_upload.js",)

    def save_model(self, request, obj, form, change):
        bucket_key = (form.cleaned_data.get("bucket_video_key") or "").strip()
        uploaded_key = (form.cleaned_data.get("multipart_uploaded_key") or "").strip()
        selected_key = bucket_key or uploaded_key
        if selected_key:
            # Multipart path: skip signal auto-transcode during save request to keep
            # admin response fast/reliable for very large files.
            obj._skip_auto_transcode = True
            obj.original_video.name = selected_key
            obj.status = StreamVideo.Status.PROCESSING
            obj.transcode_progress = 0
            obj.last_error = ""
            obj.hls_path = ""
        super().save_model(request, obj, form, change)
        if selected_key:

            def _enqueue(vid: int) -> None:
                try:
                    enqueue_stream_video_transcode(vid)
                except Exception:
                    # Keep admin save successful even if broker is temporarily unavailable.
                    StreamVideo.objects.filter(pk=vid).update(
                        status=StreamVideo.Status.FAILED,
                        last_error="Video saved but background processing could not be queued.",
                    )

            transaction.on_commit(lambda vid=obj.pk: _enqueue(vid))

    @admin.action(description="Re-run HLS transcoding (selected rows with an original file)")
    def reprocess_hls(self, request, queryset):
        n = 0
        for v in queryset:
            if not v.original_video or not v.original_video.name:
                continue
            n += 1
            try:
                enqueue_stream_video_transcode(v.pk)
            except Exception:
                self.message_user(
                    request,
                    f"Could not queue HLS for “{v.title}” (id={v.pk}). Check Celery broker / Redis.",
                    level=messages.ERROR,
                )
        if n:
            self.message_user(
                request,
                f"HLS transcoding started for {n} video(s) in the background. Refresh this list in a few minutes; "
                "check Pipeline → last_error on a video if status stays Processing.",
            )


@admin.register(StreamPlaylistPurchase)
class StreamPlaylistPurchaseAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "playlist", "status", "amount_paid", "currency", "paid_at", "updated_at")
    list_filter = ("status", "currency", "paid_at")
    search_fields = ("user__username", "user__email", "playlist__title", "stripe_checkout_session_id")
    autocomplete_fields = ("user", "playlist")
