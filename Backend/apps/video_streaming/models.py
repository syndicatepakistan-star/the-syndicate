import uuid

from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


def stream_video_original_upload_to(instance: "StreamVideo", filename: str) -> str:
    sid = str(instance.pk) if instance.pk else uuid.uuid4().hex[:16]
    base = slugify(instance.title)[:80] or "video"
    return f"stream_videos/originals/{sid}/{base}_{filename}"


def stream_video_thumbnail_upload_to(instance: "StreamVideo", filename: str) -> str:
    sid = str(instance.pk) if instance.pk else uuid.uuid4().hex[:16]
    return f"stream_videos/thumbnails/{sid}/{filename}"


def stream_playlist_cover_upload_to(instance: "StreamPlaylist", filename: str) -> str:
    sid = str(instance.pk) if instance.pk else uuid.uuid4().hex[:16]
    return f"stream_playlists/covers/{sid}/{filename}"


class StreamVideo(models.Model):
    """
    Admin-uploaded MP4 stored in private object storage (or local media in dev).
    Playback uses short-lived signed GET URLs (S3 presigned) or a signed Django file proxy locally.
    """

    class Status(models.TextChoices):
        PROCESSING = "processing", "Processing"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    thumbnail = models.ImageField(upload_to=stream_video_thumbnail_upload_to, blank=True, null=True)
    original_video = models.FileField(
        upload_to=stream_video_original_upload_to,
        blank=True,
        help_text="Original MP4 (or other supported format). Stored privately; served only via signed playback URLs.",
    )
    hls_path = models.URLField(
        max_length=2048,
        blank=True,
        default="",
        help_text="Legacy field from the old HLS pipeline; unused. Left blank for new uploads.",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PROCESSING,
        db_index=True,
    )
    transcode_progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Upload / pipeline status. Ready means original file is stored and can be played.",
    )
    transcode_message = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Human-readable pipeline status shown in admin during processing.",
    )
    last_error = models.TextField(blank=True, default="")
    show_in_programs = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Visible in Programs section secure video lists/playlists.",
    )
    show_in_membership = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Visible in Membership section secure videos.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class PlayerLayout(models.TextChoices):
        AUTO = "auto", "Auto (from video)"
        LANDSCAPE = "landscape", "Landscape (16:9 frame)"
        PORTRAIT = "portrait", "Portrait (9:16 frame)"

    player_layout = models.CharField(
        max_length=16,
        choices=PlayerLayout.choices,
        default=PlayerLayout.AUTO,
        help_text="Dashboard player frame. Auto uses pixel dimensions from transcoding and live playback metadata.",
    )
    source_width = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Source video width in pixels (filled when HLS processing completes).",
    )
    source_height = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Source video height in pixels (filled when HLS processing completes).",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class StreamPlaylist(models.Model):
    """Ordered collection of StreamVideo entries for the Programs dashboard."""

    class Category(models.TextChoices):
        BUSINESS_MODEL = "business_model", "Business Model"
        BUSINESS_PSYCHOLOGY = "business_psychology", "Business Psychology"

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, db_index=True)
    category = models.CharField(
        max_length=32,
        choices=Category.choices,
        default=Category.BUSINESS_PSYCHOLOGY,
        db_index=True,
        help_text="Programs grouping used by dashboard filters.",
    )
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Playlist price shown on Programs cards.",
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Public rating out of 5 stars.",
    )
    cover_image = models.ImageField(
        upload_to=stream_playlist_cover_upload_to,
        blank=True,
        null=True,
        help_text="Optional. Shown on the Programs grid; falls back to the first video thumbnail.",
    )
    is_published = models.BooleanField(default=True, db_index=True)
    is_coming_soon = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Show this playlist card as Coming Soon on Programs.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or "playlist"
            slug = base
            n = 2
            while StreamPlaylist.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class StreamPlaylistItem(models.Model):
    playlist = models.ForeignKey(StreamPlaylist, on_delete=models.CASCADE, related_name="items")
    stream_video = models.ForeignKey(StreamVideo, on_delete=models.CASCADE, related_name="playlist_items")
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["playlist", "order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["playlist", "stream_video"],
                name="video_streaming_playlist_unique_video",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.playlist_id}:{self.stream_video_id}"


class StreamPlaylistPurchase(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="stream_playlist_purchases")
    playlist = models.ForeignKey(StreamPlaylist, on_delete=models.CASCADE, related_name="purchases")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    # Legacy column kept for older SQLite schemas still enforcing NOT NULL on this field.
    stripe_session_id = models.CharField(max_length=255, blank=True, default="")
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True, db_index=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=12, default="gbp")
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "playlist"], name="stream_playlist_purchase_unique_user_playlist"),
        ]
        ordering = ["-updated_at", "-id"]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.playlist_id}:{self.status}"
