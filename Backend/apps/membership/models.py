from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from apps.video_streaming.models import StreamVideo


class ArticleKeywordDataset(models.Model):
    """
    Admin-uploaded source for AI-generated membership article seeds.
    Upload CSV, Word (.docx), or PDF. If the file has category/keyword columns or lines, those are
    used. Otherwise the full document text is read and OpenAI extracts keyword seeds automatically
    (requires OPENAI_API_KEY). Legacy .doc not supported—use .docx or CSV.
    Optional column **level** (beginner | intermediate | advanced) drives content progression.
    """

    name = models.CharField(max_length=200)
    csv_file = models.FileField(
        upload_to="membership/keyword_datasets/",
        help_text="CSV, Word (.docx), or PDF. Structured sheets parse directly; prose PDFs/DOCX get automatic keyword extraction via OpenAI.",
    )
    rows = models.JSONField(
        default=list,
        blank=True,
        help_text="Filled automatically when the file is saved.",
    )
    is_active = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return self.name


class KeywordUsageStat(models.Model):
    """Per active dataset: how often each keyword fingerprint was used and when."""

    dataset = models.ForeignKey(
        ArticleKeywordDataset,
        on_delete=models.CASCADE,
        related_name="keyword_usage_stats",
    )
    fingerprint = models.CharField(max_length=32, db_index=True)
    category = models.CharField(max_length=32, blank=True)
    keyword = models.CharField(max_length=500, blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["dataset", "fingerprint"], name="membership_kwusage_dataset_fp"),
        ]
        indexes = [
            models.Index(fields=["dataset", "last_used_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.keyword[:40]!r} ({self.usage_count})"


class MembershipGenerationState(models.Model):
    """
    Singleton row (id=1): progression per category, recent titles/keyword fingerprints for de-dupe.
    """

    id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    progression_by_category = models.JSONField(default=dict, blank=True)
    recent_keyword_fingerprints = models.JSONField(default=list, blank=True)
    recent_titles = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return "Membership generation state"


class Article(models.Model):
    title = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True, db_index=True)
    description = models.TextField(blank=True)
    content = models.TextField(blank=True)
    source_url = models.URLField(max_length=2048, blank=True)
    thumbnail = models.URLField(max_length=2048, blank=True)
    published_at = models.DateTimeField(default=timezone.now, db_index=True)
    tags = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(
        upload_to="membership/pdfs/",
        blank=True,
        null=True,
        help_text="Optional stored PDF for members (search uses title/description/content; seed can append PDF text extract).",
    )
    generation_seed_keyword = models.CharField(max_length=500, blank=True)
    generation_seed_category = models.CharField(max_length=32, blank=True)
    generation_seed_level = models.CharField(max_length=24, blank=True)

    class Meta:
        ordering = ["-published_at", "-id"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:495] or "article"
            slug = base
            n = 2
            while Article.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                suffix = f"-{n}"
                slug = f"{base[: 495 - len(suffix)]}{suffix}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Video(models.Model):
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    video_url = models.URLField(max_length=2048)
    thumbnail = models.URLField(max_length=2048, blank=True)
    duration = models.CharField(max_length=32, blank=True, help_text='Display e.g. "12:34" or "1:02:05"')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return self.title


class MembershipStreamVideo(StreamVideo):
    """
    Proxy model to provide a dedicated Membership admin upload section
    backed by the secure StreamVideo pipeline.
    """

    class Meta:
        proxy = True
        app_label = "membership"
        verbose_name = "Membership stream video"
        verbose_name_plural = "Membership stream videos"
