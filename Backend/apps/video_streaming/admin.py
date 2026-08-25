import logging

from django.contrib import admin, messages
from django.conf import settings
from django import forms
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from django.db import IntegrityError, transaction
from django.http import HttpResponseRedirect
from django.urls import reverse

from apps.video_streaming.attachment_schema import stream_playlist_attachments_table_ready
from apps.video_streaming.models import (
    StreamPlaylist,
    StreamPlaylistAttachment,
    StreamPlaylistCertificate,
    StreamPlaylistItem,
    StreamPlaylistPurchase,
    StreamVideo,
)
from apps.video_streaming.services.bucket_reference import (
    bucket_key_resolution_candidates,
    normalize_bucket_object_key,
    resolve_bucket_object_key,
)
from apps.video_streaming.services.hls_playback import validate_hls_manifest_in_bucket
from apps.video_streaming.services.image_upload import save_image_field_on_instance
from apps.video_streaming.services.object_storage import bucket_object_exists
from apps.video_streaming.services.playback_kinds import detect_playback_kind

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


class StreamPlaylistAttachmentInline(admin.TabularInline):
    model = StreamPlaylistAttachment
    extra = 0
    ordering = ("order", "id")
    fields = ("order", "title", "file")


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
    inlines = [StreamPlaylistItemInline, StreamPlaylistAttachmentInline]

    def get_inline_instances(self, request, obj=None):
        inline_classes = [StreamPlaylistItemInline]
        if stream_playlist_attachments_table_ready():
            inline_classes.append(StreamPlaylistAttachmentInline)
        elif request.method == "GET":
            self.message_user(
                request,
                "PDF attachments are unavailable until database migrations finish. "
                "Redeploy or run: python manage.py migrate video_streaming",
                level=messages.WARNING,
            )
        return [inline(self.model, self.admin_site) for inline in inline_classes]

    fieldsets = (
        (
            None,
            {
                "fields": ("title", "slug", "vault_plan_slug", "category", "price", "rating", "cover_image"),
                "description": (
                    "Pack playlists: agentic_ai, ai_content_automation, trading_technical_analysis. "
                    "Module playlists: agentic_ai_c01, ai_content_c02, trading_scalpel_protocol, etc. "
                    "One vault_plan_slug per playlist (hyphens are auto-converted to underscores). "
                    "Pack purchases unlock all modules in that pack; each module still needs its own playlist for playback."
                ),
            },
        ),
        (
            "Program description (dashboard modal)",
            {
                "fields": ("description",),
                "description": (
                    "Use two section titles each on its own line (case-insensitive), then the body text below. "
                    "Titles: Introduction — What you will learn. "
                    "Legacy titles The Hook and The core protocol are still accepted; core protocol is hidden in the UI. "
                    "Optional markdown hashes at the start of a title line (e.g. ## Introduction) are allowed. "
                    "Under What you will learn, lines like Module 1, Chapter 2, or Chapter 3: Title (own line) "
                    "become sub-headings; list topics on the following lines (or with - bullets). "
                    "Blank lines between sections are fine."
                ),
            },
        ),
        (
            "Publishing",
            {
                "fields": ("is_published", "is_coming_soon"),
                "description": (
                    "Attach PDFs, worksheets, and reference files below under "
                    '"Stream playlist attachments" (visible to members who unlocked this playlist).'
                ),
            },
        ),
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
            if request.method == "POST":
                transaction.set_rollback(True)
            self.message_user(request, f"Playlist admin failed: {exc}", level=messages.ERROR)
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
            "Upload media in Cloudflare R2 first, then paste either the object key or full R2/S3 URL. "
            "MP4 example: test/lesson.mp4 — single file playback. "
            "HLS example: test/my-video/index.m3u8 — folder with index.m3u8 + segment_*.ts in the same prefix. "
            "Click Save — playback uses signed API URLs (not this raw link in the app)."
        ),
    )

    class Meta:
        model = StreamVideo
        exclude = ("original_video", "playback_kind")

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
        selected_key = resolve_bucket_object_key(raw_ref, bucket_name=bucket) if raw_ref else ""
        if raw_ref and not selected_key:
            raise ValidationError(
                {"bucket_video_url_or_key": "Could not parse a storage object key from that URL or path."}
            )
        cleaned["bucket_video_url_or_key"] = raw_ref
        cleaned["_resolved_bucket_key"] = selected_key
        if selected_key:
            kind = detect_playback_kind(selected_key)
            cleaned["_playback_kind"] = kind
            if kind == "hls":
                ok, err = validate_hls_manifest_in_bucket(selected_key)
                if not ok:
                    raise ValidationError({"bucket_video_url_or_key": err or "HLS manifest validation failed."})
            elif not bucket_object_exists(selected_key):
                raise ValidationError(
                    {
                        "bucket_video_url_or_key": (
                            f"Object “{selected_key}” was not found in bucket "
                            f"“{bucket or '(not configured)'}”. "
                            "Upload the MP4 to R2 first, then paste the exact object key (e.g. test/lesson.mp4)."
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
                        "Paste the R2 object key (or URL) after uploading an MP4 or HLS manifest to your bucket."
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
        "playback_kind",
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
        "playback_kind",
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
                "Upload MP4 or HLS package in Cloudflare R2, then paste the object key or R2 URL and Save. "
                "MP4: test/lesson.mp4 (fast-start: ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4). "
                "HLS: test/my-folder/index.m3u8 with segment_*.ts in the same folder."
            ),
        }),
        ("Pipeline", {"fields": ("status", "playback_kind", "transcode_progress", "transcode_message", "hls_path", "last_error", "created_at")}),
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
            selected_key = resolve_bucket_object_key(raw_ref, bucket_name=bucket)

        pending_bucket_key = ""
        playback_kind = StreamVideo.PlaybackKind.MP4
        if selected_key:
            obj._skip_auto_ready = True
            playback_kind = detect_playback_kind(selected_key)
            obj.status = StreamVideo.Status.READY
            obj.transcode_progress = 100
            obj.transcode_message = "Linked to bucket object. Ready for playback."
            obj.last_error = ""
            obj.hls_path = selected_key if playback_kind == "hls" else ""
            obj.playback_kind = playback_kind
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
            kind = detect_playback_kind(pending_bucket_key)
            StreamVideo.objects.filter(pk=obj.pk).update(
                original_video=pending_bucket_key,
                playback_kind=kind,
                status=StreamVideo.Status.READY,
                transcode_progress=100,
                transcode_message="Linked to bucket object. Ready for playback.",
                last_error="",
                hls_path=pending_bucket_key if kind == "hls" else "",
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


@admin.register(StreamPlaylistPurchase)
class StreamPlaylistPurchaseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_email",
        "playlist",
        "status",
        "amount_paid",
        "currency",
        "paid_at",
        "created_at",
        "stripe_checkout_session_id",
    )
    list_display_links = ("id", "user_email", "playlist")
    list_filter = ("status", "currency", "paid_at", "created_at")
    search_fields = (
        "user__email",
        "user__username",
        "playlist__title",
        "playlist__slug",
        "stripe_checkout_session_id",
        "stripe_session_id",
    )
    autocomplete_fields = ("user", "playlist")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "paid_at"
    ordering = ("-paid_at", "-id")
    list_per_page = 50

    @admin.display(description="Buyer email", ordering="user__email")
    def user_email(self, obj: StreamPlaylistPurchase) -> str:
        user = obj.user
        return (getattr(user, "email", None) or getattr(user, "username", None) or str(user.pk))


@admin.register(StreamPlaylistCertificate)
class StreamPlaylistCertificateAdmin(admin.ModelAdmin):
    list_display = ("token_id", "holder_name", "playlist", "user", "status", "issued_at")
    list_filter = ("status",)
    search_fields = ("token_id", "holder_name", "user__email", "user__username", "playlist__title")
    readonly_fields = ("token_id", "issued_at", "updated_at")
    autocomplete_fields = ("user", "playlist")
