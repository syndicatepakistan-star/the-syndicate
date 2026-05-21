from django.conf import settings
from django.db import models
from syndicate_backend.media_storages import get_image_storage
from django.utils.text import slugify
import secrets
import string


def course_cover_upload_to(instance: "Course", filename: str) -> str:
    return f"courses/covers/{instance.slug or 'draft'}/{filename}"


def video_thumbnail_upload_to(instance: "Video", filename: str) -> str:
    cid = instance.course_id or "draft"
    return f"courses/{cid}/video_thumbs/{filename}"


class Course(models.Model):
    """Course container for ordered lessons (each lesson has a playback URL)."""

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, db_index=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(
        upload_to=course_cover_upload_to,
        storage=get_image_storage,
        blank=True,
        null=True,
        help_text="Programs grid cover. Use a high-resolution file (e.g. JPEG/PNG at least ~1200px on the short edge, or 1600px+ wide) so it stays sharp on retina screens; small images are stretched and look soft.",
    )
    is_published = models.BooleanField(default=True, db_index=True)
    show_in_programs = models.BooleanField(
        default=True,
        db_index=True,
        help_text="If False, this course is hidden from the dashboard Programs grid (lessons API unchanged).",
    )
    allow_all_authenticated = models.BooleanField(
        default=True,
        help_text="If True, any authenticated user may view videos. If False, only enrolled users (or staff).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or "course"
            slug = base
            n = 2
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class CourseEnrollment(models.Model):
    """Explicit enrollment when allow_all_authenticated is False."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_enrollments",
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "course"], name="courses_enrollment_user_course"),
        ]


class Video(models.Model):
    """Lesson row: title, optional thumbnail, and a URL used for playback in the dashboard."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        UPLOADING = "uploading", "Uploading"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, help_text="Optional. Shown under the lesson title in the player.")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="videos")
    thumbnail = models.ImageField(
        upload_to=video_thumbnail_upload_to,
        storage=get_image_storage,
        blank=True,
        null=True,
        help_text="Optional. Shown in the lesson list.",
    )
    video_url = models.URLField(
        max_length=2048,
        blank=True,
        default="",
        help_text="Direct file URL (MP4/WebM) or a normal watch link (e.g. YouTube). Set in Django admin.",
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["course_id", "order", "id"]
        indexes = [
            models.Index(fields=["course", "order"]),
        ]

    def __str__(self) -> str:
        return self.title


class VideoProgress(models.Model):
    """Per-user playback position for optional resume."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="video_progress_records",
    )
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="progress_records")
    position_seconds = models.FloatField(default=0)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "video"], name="courses_videoprogress_user_video"),
        ]


def _generate_certificate_token_id() -> str:
    alphabet = string.ascii_uppercase + string.digits
    body = "".join(secrets.choice(alphabet) for _ in range(12))
    return f"SYN-{body[:4]}-{body[4:8]}-{body[8:]}"


class CourseCertificate(models.Model):
    class Status(models.TextChoices):
        CERTIFIED = "certified", "Certified"
        REVOKED = "revoked", "Revoked"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_certificates",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    token_id = models.CharField(max_length=32, unique=True, db_index=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.CERTIFIED, db_index=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "course"], name="courses_certificate_user_course"),
        ]

    def save(self, *args, **kwargs):
        if not self.token_id:
            candidate = _generate_certificate_token_id()
            while CourseCertificate.objects.filter(token_id=candidate).exclude(pk=self.pk).exists():
                candidate = _generate_certificate_token_id()
            self.token_id = candidate
        super().save(*args, **kwargs)
