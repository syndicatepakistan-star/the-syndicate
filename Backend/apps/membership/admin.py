from django import forms
from django.contrib import admin, messages
from django.core.files.uploadedfile import UploadedFile
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.urls import path, reverse
from apps.membership.dataset_match import (
    article_seed_keyword,
    describe_seed_in_dataset,
    format_all_keywords_for_search,
    seed_matches_dataset,
)
from apps.membership.keyword_dataset import (
    MAX_DATASET_ROWS,
    KeywordDatasetParseError,
    parse_keyword_dataset_bytes,
)
from apps.membership.models import Article, ArticleKeywordDataset, KeywordUsageStat, MembershipGenerationState, MembershipStreamVideo, Video
from apps.membership.services.article_from_dataset import (
    DEFAULT_MEMBERSHIP_ARTICLE_COUNT,
    MembershipArticleGenerationError,
    OpenAINotConfiguredError,
    generate_membership_articles_batch,
)


def _all_model_field_names(model) -> tuple[str, ...]:
    return tuple(
        field.name
        for field in model._meta.get_fields()
        if ((field.concrete and not field.auto_created) or field.many_to_many)
    )


class AllFieldsListDisplayAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return _all_model_field_names(self.model)


class ArticleKeywordDatasetForm(forms.ModelForm):
    class Meta:
        model = ArticleKeywordDataset
        fields = ("name", "csv_file", "is_active")

    def clean_csv_file(self):
        f = self.cleaned_data.get("csv_file")
        if not f:
            return f
        if isinstance(f, UploadedFile):
            raw = f.read()
            f.seek(0)
            name = getattr(f, "name", "") or ""
            try:
                rows = parse_keyword_dataset_bytes(raw, filename=name)
            except KeywordDatasetParseError as exc:
                raise forms.ValidationError(str(exc)) from exc
            if not rows:
                raise forms.ValidationError(
                    "No rows could be parsed or extracted. Check the file has enough text, "
                    "or use CSV with columns such as category, keyword, title, description, content."
                )
            self.parsed_keyword_rows = rows
        return f


@admin.register(ArticleKeywordDataset)
class ArticleKeywordDatasetAdmin(admin.ModelAdmin):
    form = ArticleKeywordDatasetForm
    change_form_template = "admin/membership/articlekeyworddataset/change_form.html"
    list_display = ("name", "is_active", "row_count", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
    readonly_fields = ("created_at", "rows_preview", "all_keywords_searchable")
    show_full_result_count = False
    fieldsets = (
        (None, {"fields": ("name", "csv_file", "is_active")}),
        (
            "Parsed keywords",
            {
                "fields": ("rows_preview", "all_keywords_searchable"),
                "description": "Rows are stored in the database but not shown as raw JSON (large files can crash the server).",
            },
        ),
        ("Meta", {"fields": ("created_at",)}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).defer("rows")

    def get_object(self, request, object_id, from_field=None):
        qs = self.get_queryset(request)
        if from_field:
            return qs.filter(**{from_field: object_id}).first()
        return qs.filter(pk=object_id).first()

    @admin.display(description="Rows")
    def row_count(self, obj: ArticleKeywordDataset) -> int:
        if obj is None:
            return 0
        rows = obj.rows if isinstance(obj.rows, list) else []
        if not rows and obj.pk:
            rows = ArticleKeywordDataset.objects.filter(pk=obj.pk).values_list("rows", flat=True).first() or []
        return len(rows) if isinstance(rows, list) else 0

    def _load_rows(self, obj: ArticleKeywordDataset) -> list:
        if not getattr(obj, "pk", None):
            return []
        rows = obj.rows if isinstance(obj.rows, list) and obj.rows else None
        if rows is None:
            raw = ArticleKeywordDataset.objects.filter(pk=obj.pk).values_list("rows", flat=True).first()
            rows = raw if isinstance(raw, list) else []
        return rows

    def rows_preview(self, obj: ArticleKeywordDataset) -> str:
        if not getattr(obj, "pk", None):
            return "Save the dataset once with a file to preview parsed rows."
        rows = self._load_rows(obj)
        if not rows:
            return "-"
        import json

        preview_rows = []
        for row in rows[:8]:
            if not isinstance(row, dict):
                continue
            item = dict(row)
            st = str(item.get("source_text") or item.get("content") or "")
            if len(st) > 280:
                item["source_text"] = st[:280] + "…"
            preview_rows.append(item)
        return json.dumps(preview_rows, ensure_ascii=False, indent=2) + (
            f"\n... ({len(rows)} total)" if len(rows) > 8 else ""
        )

    @admin.display(description="Keywords preview (first 80)")
    def all_keywords_searchable(self, obj: ArticleKeywordDataset) -> str:
        if not getattr(obj, "pk", None):
            return "Save the dataset first."
        return format_all_keywords_for_search(self._load_rows(obj))

    def delete_model(self, request, obj):
        self._delete_datasets_efficiently([obj.pk])
        self.message_user(request, f"Deleted dataset “{obj.name}”.", messages.SUCCESS)

    def delete_queryset(self, request, queryset):
        ids = list(queryset.values_list("pk", flat=True))
        self._delete_datasets_efficiently(ids)
        self.message_user(request, f"Deleted {len(ids)} dataset(s).", messages.SUCCESS)

    @staticmethod
    def _delete_datasets_efficiently(dataset_ids: list[int]) -> None:
        if not dataset_ids:
            return
        KeywordUsageStat.objects.filter(dataset_id__in=dataset_ids).delete()
        Article.objects.filter(generation_source_dataset_id__in=dataset_ids).update(
            generation_source_dataset_id=None
        )
        ArticleKeywordDataset.objects.filter(pk__in=dataset_ids).delete()

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<path:object_id>/generate-articles/",
                self.admin_site.admin_view(self.generate_articles_view),
                name="membership_articlekeyworddataset_generate_articles",
            ),
        ]
        return custom + urls

    def generate_articles_view(self, request, object_id):
        if request.method != "POST":
            return HttpResponseRedirect(
                reverse("admin:membership_articlekeyworddataset_change", args=[object_id])
            )

        ds = get_object_or_404(ArticleKeywordDataset, pk=object_id)
        rows = ds.rows if isinstance(ds.rows, list) else []
        row_count = len(rows)
        if row_count < 1:
            self.message_user(
                request,
                f"Dataset “{ds.name}” has no parsed rows ({row_count}). Upload a CSV/DOCX/PDF and click Save first.",
                level=messages.ERROR,
            )
            return HttpResponseRedirect(
                reverse("admin:membership_articlekeyworddataset_change", args=[object_id])
            )

        try:
            batch = generate_membership_articles_batch(
                count=DEFAULT_MEMBERSHIP_ARTICLE_COUNT,
                dataset=ds,
                use_openai=True,
                fresh_batch=True,
                stop_on_error=False,
            )
        except OpenAINotConfiguredError:
            self.message_user(
                request,
                "OPENAI_API_KEY is not set on the server.",
                level=messages.ERROR,
            )
        except MembershipArticleGenerationError as exc:
            self.message_user(request, str(exc), level=messages.ERROR)
        else:
            generated = batch.generated
            if generated:
                seeds = ", ".join(g.keyword[:40] for g in generated[:5])
                extra = f" … (+{len(generated) - 5} more)" if len(generated) > 5 else ""
                self.message_user(
                    request,
                    f"Created {len(generated)} article(s) from “{ds.name}” ({row_count} seeds in file). "
                    f"Keywords: {seeds}{extra}",
                    level=messages.SUCCESS,
                )
            if batch.errors:
                self.message_user(
                    request,
                    f"Generation stopped: {batch.errors[0]}",
                    level=messages.ERROR,
                )
            if not generated and not batch.errors:
                self.message_user(
                    request,
                    "No articles were created. Check Railway logs and OPENAI_API_KEY.",
                    level=messages.WARNING,
                )
            elif not generated and batch.errors:
                pass

        return HttpResponseRedirect(
            reverse("admin:membership_articlekeyworddataset_change", args=[object_id])
        )

    def save_model(self, request, obj: ArticleKeywordDataset, form, change) -> None:
        super().save_model(request, obj, form, change)
        rows: list | None = getattr(form, "parsed_keyword_rows", None)
        if rows is None and obj.csv_file:
            try:
                obj.csv_file.open("rb")
                raw = obj.csv_file.read()
            finally:
                obj.csv_file.close()
            try:
                rows = parse_keyword_dataset_bytes(raw, filename=obj.csv_file.name)
            except KeywordDatasetParseError as exc:
                self.message_user(request, str(exc), level=messages.ERROR)
                rows = []
        if rows is not None:
            if len(rows) > MAX_DATASET_ROWS:
                self.message_user(
                    request,
                    f"Dataset capped at {MAX_DATASET_ROWS} keywords (file had more). "
                    "Use CSV with one keyword per row, or a shorter PDF, for better article seeds.",
                    level=messages.WARNING,
                )
                rows = rows[:MAX_DATASET_ROWS]
            ArticleKeywordDataset.objects.filter(pk=obj.pk).update(rows=rows)
            obj.rows = rows
            if rows and (not change or "csv_file" in form.changed_data):
                self.message_user(request, f"Keyword dataset saved with {len(rows)} seeds.", messages.SUCCESS)
        if obj.is_active:
            ArticleKeywordDataset.objects.exclude(pk=obj.pk).update(is_active=False)


@admin.register(KeywordUsageStat)
class KeywordUsageStatAdmin(AllFieldsListDisplayAdmin):
    list_filter = ("category",)
    search_fields = ("keyword", "fingerprint")
    readonly_fields = ("fingerprint",)


@admin.register(MembershipGenerationState)
class MembershipGenerationStateAdmin(AllFieldsListDisplayAdmin):
    readonly_fields = ("id", "updated_at")


@admin.register(Article)
class ArticleAdmin(AllFieldsListDisplayAdmin):
    list_filter = ("is_featured",)
    search_fields = ("title", "slug", "description", "generation_seed_keyword")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "seed_dataset_check")

    @admin.display(description="Seed vs active dataset")
    def seed_dataset_check(self, obj: Article) -> str:
        if not obj.pk:
            return "-"
        kw = article_seed_keyword(obj)
        if not kw:
            return "No seed (press/archive article — not from keyword dataset)."
        ds = ArticleKeywordDataset.objects.filter(is_active=True).first()
        if not ds:
            return f"Seed keyword: «{kw}» — no active dataset to compare."
        if seed_matches_dataset(obj, ds):
            return f"✓ «{kw}» — {describe_seed_in_dataset(obj, ds)}"
        src = getattr(obj, "generation_source_dataset", None)
        if src and seed_matches_dataset(obj, src):
            return f"✓ «{kw}» — {describe_seed_in_dataset(obj, src)}"
        return (
            f"✗ «{kw}» — {describe_seed_in_dataset(obj, ds)} "
            "If you re-uploaded the dataset file, old articles keep old seeds. "
            "Generate new articles from the current dataset."
        )

    @admin.display(boolean=True)
    def has_pdf(self, obj: Article) -> bool:
        return bool(obj.pdf_file)


@admin.register(Video)
class MembershipVideoAdmin(AllFieldsListDisplayAdmin):
    """Membership hub videos (URL-based), separate from courses.Video lessons."""

    search_fields = ("title", "description", "video_url")


@admin.register(MembershipStreamVideo)
class MembershipStreamVideoAdmin(admin.ModelAdmin):
    """
    Secure upload section for Membership videos (same StreamVideo storage as Programs;
    use show_in_membership + signed MP4 playback).
    """

    list_display = ("title", "status", "price", "show_in_membership", "show_in_programs", "created_at")
    list_filter = ("status", "show_in_membership", "show_in_programs")
    search_fields = ("title", "description")
    readonly_fields = ("hls_path", "status", "last_error", "created_at")
    fieldsets = (
        (None, {"fields": ("title", "description", "price", "show_in_membership", "show_in_programs")}),
        ("Media", {"fields": ("thumbnail", "original_video")}),
        ("Pipeline", {"fields": ("status", "hls_path", "last_error", "created_at")}),
    )

    class Media:
        js = ("admin/streamvideo_multipart_upload.js",)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(show_in_membership=True).order_by("-created_at")

    def save_model(self, request, obj, form, change):
        if not change:
            obj.show_in_membership = True
            obj.show_in_programs = False
        super().save_model(request, obj, form, change)
