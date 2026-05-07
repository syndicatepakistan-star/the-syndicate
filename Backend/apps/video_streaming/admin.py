from django.contrib import admin
from django import forms

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamPlaylistPurchase, StreamVideo
from apps.video_streaming.transcode_policy import inline_stream_transcode_enabled


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
    multipart_video = forms.FileField(
        required=False,
        help_text="For very large files (9GB+), use this field and click 'Upload large file to bucket' before Save.",
    )
    multipart_uploaded_key = forms.CharField(required=False, widget=forms.HiddenInput())

    class Meta:
        model = StreamVideo
        fields = "__all__"


@admin.register(StreamVideo)
class StreamVideoAdmin(admin.ModelAdmin):
    form = StreamVideoAdminForm
    list_display = (
        "title",
        "status",
        "player_layout",
        "price",
        "show_in_programs",
        "show_in_membership",
        "created_at",
    )
    list_filter = ("status", "player_layout", "show_in_programs", "show_in_membership")
    search_fields = ("title", "description")
    readonly_fields = ("hls_path", "status", "last_error", "source_width", "source_height", "created_at")
    actions = ("reprocess_hls",)
    fieldsets = (
        (None, {"fields": ("title", "description", "price", "show_in_programs", "show_in_membership")}),
        ("Player", {"fields": ("player_layout", "source_width", "source_height")}),
        ("Media", {"fields": ("thumbnail", "original_video", "multipart_video", "multipart_uploaded_key")}),
        ("Pipeline", {"fields": ("status", "hls_path", "last_error", "created_at")}),
    )
    class Media:
        js = ("admin/streamvideo_multipart_upload.js",)

    def save_model(self, request, obj, form, change):
        uploaded_key = (form.cleaned_data.get("multipart_uploaded_key") or "").strip()
        if uploaded_key:
            obj.original_video.name = uploaded_key
        super().save_model(request, obj, form, change)

    @admin.action(description="Re-run HLS transcoding (selected rows with an original file)")
    def reprocess_hls(self, request, queryset):
        from apps.video_streaming.tasks import process_stream_video_to_hls

        n = 0
        for v in queryset:
            if not v.original_video or not v.original_video.name:
                continue
            n += 1
            if inline_stream_transcode_enabled():
                process_stream_video_to_hls(v.pk)
            else:
                process_stream_video_to_hls.delay(v.pk)
        self.message_user(request, f"HLS transcoding started for {n} video(s).")


@admin.register(StreamPlaylistPurchase)
class StreamPlaylistPurchaseAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "playlist", "status", "amount_paid", "currency", "paid_at", "updated_at")
    list_filter = ("status", "currency", "paid_at")
    search_fields = ("user__username", "user__email", "playlist__title", "stripe_checkout_session_id")
    autocomplete_fields = ("user", "playlist")
