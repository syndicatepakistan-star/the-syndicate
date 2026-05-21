from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.courses.models import Course
from apps.video_streaming.models import StreamPlaylist

class PortalPermission(models.Model):
    """Fine-grained permission codename (e.g. social.links.manage)."""

    codename = models.SlugField(max_length=80, unique=True, db_index=True)
    name = models.CharField(max_length=160)

    class Meta:
        ordering = ["codename"]

    def __str__(self) -> str:
        return self.codename


class PortalRole(models.Model):
    name = models.SlugField(max_length=64, unique=True, db_index=True)
    display_name = models.CharField(max_length=128)
    permissions = models.ManyToManyField(
        PortalPermission,
        blank=True,
        related_name="roles",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.display_name


class UserPortalRole(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portal_role_links",
    )
    role = models.ForeignKey(PortalRole, on_delete=models.CASCADE, related_name="user_links")

    class Meta:
        unique_together = [["user", "role"]]
        indexes = [models.Index(fields=["user"])]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.role.name}"


class SocialLink(models.Model):
    class Platform(models.TextChoices):
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"
        X = "x", "X (Twitter)"
        LINKEDIN = "linkedin", "LinkedIn"
        YOUTUBE = "youtube", "YouTube"
        TIKTOK = "tiktok", "TikTok"
        DISCORD = "discord", "Discord"
        WEBSITE = "website", "Website"
        CALENDAR = "calendar", "Calendar"
        EMAIL = "email", "Email"
        OTHER = "other", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_links",
    )
    platform = models.CharField(max_length=32, choices=Platform.choices, default=Platform.OTHER)
    url = models.URLField(max_length=512)
    label = models.CharField(max_length=160, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [models.Index(fields=["user", "is_active"])]

    def clean(self):
        if self.url and not str(self.url).lower().startswith(("http://", "https://")):
            raise ValidationError({"url": "URL must start with http:// or https://"})


class Mission(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        MISSED = "missed", "Missed"
        DONE = "done", "Done"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="missions",
    )
    title = models.CharField(max_length=255)
    target_at = models.DateTimeField()
    points = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-target_at"]
        indexes = [models.Index(fields=["user", "status"])]


class Reminder(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    title = models.CharField(max_length=255)
    date = models.DateField()
    time = models.TimeField()
    points = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-time"]
        indexes = [models.Index(fields=["user", "status"])]


class Note(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="deck_notes",
    )
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user"])]


class UserDashboardEntitlement(models.Model):
    """Commercial tier for dashboard + course access (Money Mastery bundle vs King, etc.)."""

    class AccessTier(models.TextChoices):
        NONE = "none", "None"
        MONEY_MASTERY = "money_mastery", "Money Mastery"
        KING = "king", "The Knight"
        FULL = "full", "Full access"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dashboard_entitlement",
    )
    access_tier = models.CharField(
        max_length=32,
        choices=AccessTier.choices,
        default=AccessTier.NONE,
        db_index=True,
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User dashboard entitlement"
        verbose_name_plural = "User dashboard entitlements"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.access_tier}"


class UserPlanPurchase(models.Model):
    """Stripe checkout rows for syndicate plans (Money Mastery bundle, King, etc.) — shown in billing history."""

    class Status(models.TextChoices):
        PAID = "paid", "Paid"
        PENDING = "pending", "Pending"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="plan_purchases",
    )
    stripe_checkout_session_id = models.CharField(max_length=255, unique=True, db_index=True)
    plan_slug = models.CharField(max_length=32, db_index=True)
    product_title = models.CharField(max_length=255)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default="usd")
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PAID,
        db_index=True,
    )
    paid_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-paid_at", "-id"]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.plan_slug}:{self.stripe_checkout_session_id}"


class KingProgramSelection(models.Model):
    """
    The Knight buyers must pick exactly 5 programs before premium sections unlock.
    Programs can be course rows and/or stream playlist rows.
    """

    REQUIRED_SELECTION_COUNT = 5

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="king_program_selection",
    )
    courses = models.ManyToManyField(Course, blank=True, related_name="king_selection_users")
    playlists = models.ManyToManyField(StreamPlaylist, blank=True, related_name="king_selection_users")
    completed_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "King program selection"
        verbose_name_plural = "King program selections"

    def __str__(self) -> str:
        return f"{self.user_id}:courses={self.courses.count()} playlists={self.playlists.count()}"
