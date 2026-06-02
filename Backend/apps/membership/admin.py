from django import forms
from django.contrib import admin, messages
from django.core.files.uploadedfile import UploadedFile
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.urls import path, reverse
from apps.membership.keyword_dataset import KeywordDatasetParseError, parse_keyword_dataset_bytes
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
        fields = "__all__"

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
                    "No keywords could be parsed or extracted. Check the file has enough text, "
                    "or use CSV / two-column Word tables (category, keyword)."
                )
            self.parsed_keyword_rows = rows
        return f


@admin.register(ArticleKeywordDataset)
class ArticleKeywordDatasetAdmin(AllFieldsListDisplayAdmin):
    form = ArticleKeywordDatasetForm
    change_form_template = "admin/membership/articlekeyworddataset/change_form.html"
    list_filter = ("is_active",)
    search_fields = ("name",)
    readonly_fields = ("created_at", "rows_preview")

    @admin.display(description="Rows")
    def row_count(self, obj: ArticleKeywordDataset) -> int:
        return len(obj.rows) if isinstance(obj.rows, list) else 0

    def rows_preview(self, obj: ArticleKeywordDataset) -> str:
        if not getattr(obj, "pk", None):
            return "Save the dataset once with a file to preview parsed rows."
        if not obj.rows:
            return "-"
        import json

        return json.dumps(obj.rows[:8], ensure_ascii=False, indent=2) + (
            f"\n... ({len(obj.rows)} total)" if len(obj.rows) > 8 else ""
        )

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
    readonly_fields = ("created_at",)

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
