import logging

from django.contrib import admin, messages
from django.conf import settings
from django import forms
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from django.db import IntegrityError, transaction
from django.http import HttpResponseRedirect
from django.urls import reverse

from apps.video_streaming.models import (
    StreamPlaylist,
    StreamPlaylistCertificate,
    StreamPlaylistItem,
    StreamPlaylistPurchase,
    StreamVideo,
)
from apps.video_streaming.services.bucket_reference import normalize_bucket_object_key
from apps.video_streaming.services.image_upload import save_image_field_on_instance
from apps.video_streaming.services.object_storage import bucket_object_exists

logger = logging.getLogger(__name__)


class StreamPlaylistItemInlineFormSet(forms.BaseInlineFormSet):
    def clean(self):
        super().clean()
        seen: set[int] = set()
        for form in self.forms:
            if not hasattr(form, "cleaned_data") or not form.cleaned_data:
                continue
            if form.cleaned_data.get("DELETE"):
                continue
            video = form.cleaned_data.get("stream_video")
            vid = getattr(video, "pk", None)
            if not vid:
                continue
            if vid in seen:
                raise ValidationError("Each video can only appear once in this playlist.")
            seen.add(vid)


class StreamPlaylistItemInline(admin.TabularInline):
    model = StreamPlaylistItem
    formset = StreamPlaylistItemInlineFormSet
    extra = 0
    ordering = ("order", "id")
    autocomplete_fields = ("stream_video",)
    fields = ("order", "stream_video")


@admin.register(StreamPlaylist)
class StreamPlaylistAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "vault_plan_slug",
        "category",
        "price",
        "rating",
        "slug",
        "is_published",
        "is_coming_soon",
        "updated_at",
    )
    list_filter = ("category", "is_published", "is_coming_soon")
    search_fields = ("title", "slug", "vault_plan_slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [StreamPlaylistItemInline]
    fieldsets = (
        (
            None,
            {
                "fields": ("title", "slug", "vault_plan_slug", "category", "price", "rating", "cover_image"),
                "description": (
                    "Set vault_plan_slug to link a mid-ticket module (e.g. agentic_ai_c01, ai_content_c05, "
                    "trading_scalpel_protocol). One playlist per module slug. Pack purchases unlock all "
                    "modules in that pack in the UI; each module still needs its playlist for playback."
                ),
            },
        ),
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

    def save_model(self, request, obj, form, change):
        cover_upload = form.cleaned_data.get("cover_image")
        pending_cover = isinstance(cover_upload, UploadedFile)
        if pending_cover:
            obj.cover_image = None

        super().save_model(request, obj, form, change)

        if pending_cover and obj.pk:
            try:
                with transaction.atomic():
                    save_image_field_on_instance(
                        instance=obj,
                        field_name="cover_image",
                        uploaded_file=cover_upload,
                    )
            except Exception as exc:
                logger.exception("StreamPlaylist cover_image upload failed")
                messages.warning(
                    request,
                    f"Playlist saved, but cover image upload failed ({exc}). "
                    "Set CLOUDINARY_URL (recommended) or verify R2/S3 Write permissions, then try again.",
                )

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        try:
            return super().changeform_view(request, object_id, form_url, extra_context)
        except IntegrityError:
            messages.error(
                request,
                "Could not save playlist items — a video was added twice to the same playlist.",
            )
            if object_id:
                return HttpResponseRedirect(
                    reverse("admin:video_streaming_streamplaylist_change", args=[object_id])
                )
            return HttpResponseRedirect(reverse("admin:video_streaming_streamplaylist_add"))
        except Exception as exc:
            logger.exception("StreamPlaylist admin changeform_view failed")
            transaction.set_rollback(True)
            self.message_user(request, f"Save failed: {exc}", level=messages.ERROR)
            if object_id:
                return HttpResponseRedirect(
                    reverse("admin:video_streaming_streamplaylist_change", args=[object_id])
                )
            return HttpResponseRedirect(reverse("admin:video_streaming_streamplaylist_add"))


class StreamVideoAdminForm(forms.ModelForm):
    bucket_video_url_or_key = forms.CharField(
        required=False,
        label="R2 bucket URL or object key",
        help_text=(
            "Upload the MP4 in Cloudflare R2 first, then paste either the object key "
            "(e.g. bg.mp4 or stream_videos/originals/my-video.mp4) or the full R2/S3 URL from the dashboard. "
            "Click Save — playback uses your private bucket via signed API URLs (not this raw link in the app)."
        ),
    )

    class Meta:
        model = StreamVideo
        exclude = ("original_video",)

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
        selected_key = normalize_bucket_object_key(raw_ref, bucket_name=bucket)
        if raw_ref and not selected_key:
            raise ValidationError(
                {"bucket_video_url_or_key": "Could not parse a storage object key from that URL or path."}
            )
        cleaned["bucket_video_url_or_key"] = raw_ref
        cleaned["_resolved_bucket_key"] = selected_key
        if selected_key and not bucket_object_exists(selected_key):
            raise ValidationError(
                {
                    "bucket_video_url_or_key": (
                        f"Object “{selected_key}” was not found in bucket "
                        f"“{bucket or '(not configured)'}”. "
                        "Upload the MP4 to R2 first, then paste the exact object key (e.g. bg.mp4)."
                    )
                }
            )
        existing_key = ""
        if self.instance and self.instance.pk:
            existing_key = (getattr(self.instance.original_video, "name", None) or "").strip()
        if not selected_key and not existing_key:
            raise ValidationError(
                {
                    "bucket_video_url_or_key": (
                        "Paste the R2 object key (or URL) after uploading the MP4 to your bucket."
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
            ),
            "description": (
                "Upload the MP4 in Cloudflare R2, then paste the object key or R2 URL and Save. "
                "Fast-start MP4s seek sooner: ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4"
            ),
        }),
        ("Pipeline", {"fields": ("status", "transcode_progress", "transcode_message", "hls_path", "last_error", "created_at")}),
    )

    @admin.display(description="Resolved storage key (used for playback)")
    def resolved_storage_key_display(self, obj: StreamVideo) -> str:
        key = (getattr(obj.original_video, "name", None) or "").strip()
        return key or "—"
    def save_model(self, request, obj, form, change):
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        raw_ref = (form.cleaned_data.get("bucket_video_url_or_key") or "").strip()
        selected_key = (form.cleaned_data.get("_resolved_bucket_key") or "").strip()
        if not selected_key and raw_ref:
            selected_key = normalize_bucket_object_key(raw_ref, bucket_name=bucket)

        pending_bucket_key = ""
        if selected_key:
            obj._skip_auto_ready = True
            obj.status = StreamVideo.Status.READY
            obj.transcode_progress = 100
            obj.transcode_message = "Linked to bucket object. Ready for playback."
            obj.last_error = ""
            obj.hls_path = ""
            pending_bucket_key = selected_key
            obj.original_video = None

        # Save video + R2 key first; upload thumbnail in a separate atomic block so a
        # Cloudinary failure cannot poison Django admin's outer transaction.atomic().
        thumbnail_upload = form.cleaned_data.get("thumbnail")
        has_new_thumbnail = bool(thumbnail_upload)
        if has_new_thumbnail:
            obj.thumbnail = None

        super().save_model(request, obj, form, change)

        if pending_bucket_key:
            StreamVideo.objects.filter(pk=obj.pk).update(
                original_video=pending_bucket_key,
                status=StreamVideo.Status.READY,
                transcode_progress=100,
                transcode_message="Linked to bucket object. Ready for playback.",
                last_error="",
                hls_path="",
            )
            obj.refresh_from_db()

        if has_new_thumbnail and obj.pk:
            try:
                with transaction.atomic():
                    save_image_field_on_instance(
                        instance=obj,
                        field_name="thumbnail",
                        uploaded_file=thumbnail_upload,
                    )
            except Exception as exc:
                logger.exception("StreamVideo thumbnail upload failed")
                messages.warning(
                    request,
                    f"Video saved, but thumbnail upload failed ({exc}). "
                    "In Cloudinary Dashboard → API Keys, enable Upload/create permission, "
                    "then edit this video and add the thumbnail again.",
                )

        if selected_key and (raw_ref or pending_bucket_key):
            messages.success(request, f"Video linked to bucket object: {selected_key}")

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        try:
            return super().changeform_view(request, object_id, form_url, extra_context)
        except Exception as exc:
            logger.exception("StreamVideo admin changeform_view failed")
            transaction.set_rollback(True)
            self.message_user(
                request,
                f"Save failed: {exc}",
                level=messages.ERROR,
            )
            if object_id:
                return HttpResponseRedirect(
                    reverse("admin:video_streaming_streamvideo_change", args=[object_id])
                )
            return HttpResponseRedirect(reverse("admin:video_streaming_streamvideo_add"))


@admin.register(StreamPlaylistCertificate)
class StreamPlaylistCertificateAdmin(admin.ModelAdmin):
    list_display = ("token_id", "holder_name", "playlist", "user", "status", "issued_at")
    list_filter = ("status",)
    search_fields = ("token_id", "holder_name", "user__email", "user__username", "playlist__title")
    readonly_fields = ("token_id", "issued_at", "updated_at")
    autocomplete_fields = ("user", "playlist")
