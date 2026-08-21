import csv

from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, reverse
from django.utils.html import format_html

from .intake_data import INTAKE_QUESTIONS
from .intake_tokens import intake_url_for_user
from .models import IntakeResponse, QuizOption, QuizQuestion, Result, User


def _build_excel_response(filename: str) -> HttpResponse:
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def export_users_to_excel(modeladmin, request, queryset):
    response = _build_excel_response("quiz_users_export.csv")
    writer = csv.writer(response)
    intake_headers = [q["label"] for q in INTAKE_QUESTIONS]
    writer.writerow(
        ["User Name", "Email", "Number", "Intake Ref", "Intake URL", "Intake Done", "Score", "Category", "Virus"]
        + intake_headers
    )

    users = queryset.select_related("result", "intake")
    for user in users:
        result = getattr(user, "result", None)
        intake = getattr(user, "intake", None)
        answers = (intake.answers if intake else {}) or {}
        writer.writerow(
            [
                user.name or "",
                user.email or "",
                user.phone or "",
                user.intake_ref or "",
                intake_url_for_user(user) if (user.email or user.intake_ref) else "",
                "Yes" if intake else "No",
                result.score if result else "",
                result.category if result else "",
                result.virus if result else "",
            ]
            + [answers.get(q["id"], "") for q in INTAKE_QUESTIONS]
        )
    return response


export_users_to_excel.short_description = "Export selected users to Excel"


def export_results_to_excel(modeladmin, request, queryset):
    response = _build_excel_response("quiz_results_export.csv")
    writer = csv.writer(response)
    writer.writerow(["User Name", "Email", "Number", "Score", "Category", "Virus"])

    results = queryset.select_related("user")
    for result in results:
        user = result.user
        writer.writerow(
            [
                user.name or "",
                user.email or "",
                user.phone or "",
                result.score,
                result.category or "",
                result.virus or "",
            ]
        )
    return response


export_results_to_excel.short_description = "Export selected results to Excel"


class ResultInline(admin.StackedInline):
    model = Result
    extra = 0
    can_delete = False
    fields = ("score", "category", "virus", "course_offer", "ai_report", "created_at")
    readonly_fields = ("score", "category", "virus", "course_offer", "ai_report", "created_at")


class IntakeResponseInline(admin.StackedInline):
    model = IntakeResponse
    extra = 0
    can_delete = False
    fields = ("answers", "submitted_at", "updated_at")
    readonly_fields = ("answers", "submitted_at", "updated_at")


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "email",
        "phone",
        "intake_ref",
        "intake_done",
        "score",
        "category",
        "virus",
        "course_offer",
        "created_at",
    )
    search_fields = ("name", "email", "phone", "intake_ref")
    ordering = ("-created_at",)
    list_filter = ("created_at",)
    date_hierarchy = "created_at"
    inlines = [ResultInline, IntakeResponseInline]
    actions = [export_users_to_excel]
    change_list_template = "admin/quiz_funnel/user/change_list.html"
    readonly_fields = ("intake_link_display", "created_at")

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "export-filtered/",
                self.admin_site.admin_view(self.export_filtered_view),
                name="quiz_funnel_user_export_filtered",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        query_string = request.GET.urlencode()
        export_url = reverse("admin:quiz_funnel_user_export_filtered")
        if query_string:
            export_url = f"{export_url}?{query_string}"
        extra_context["export_filtered_url"] = export_url
        return super().changelist_view(request, extra_context=extra_context)

    def export_filtered_view(self, request):
        changelist = self.get_changelist_instance(request)
        queryset = changelist.get_queryset(request).select_related("result", "intake")
        response = _build_excel_response("quiz_users_export.csv")
        writer = csv.writer(response)
        intake_headers = [q["label"] for q in INTAKE_QUESTIONS]
        writer.writerow(
            ["User Name", "Email", "Number", "Intake Ref", "Intake URL", "Intake Done", "Score", "Category", "Virus"]
            + intake_headers
        )
        for user in queryset:
            result = getattr(user, "result", None)
            intake = getattr(user, "intake", None)
            answers = (intake.answers if intake else {}) or {}
            writer.writerow(
                [
                    user.name or "",
                    user.email or "",
                    user.phone or "",
                    user.intake_ref or "",
                    intake_url_for_user(user) if (user.email or user.intake_ref) else "",
                    "Yes" if intake else "No",
                    result.score if result else "",
                    result.category if result else "",
                    result.virus if result else "",
                ]
                + [answers.get(q["id"], "") for q in INTAKE_QUESTIONS]
            )
        return response

    @admin.display(description="Intake link")
    def intake_link_display(self, obj):
        if not (obj.email or obj.intake_ref):
            return "—"
        url = intake_url_for_user(obj)
        return format_html('<a href="{}" target="_blank" rel="noopener">{}</a>', url, url)

    @admin.display(boolean=True, description="Intake done")
    def intake_done(self, obj):
        return hasattr(obj, "intake") and obj.intake is not None

    @admin.display(description="Score")
    def score(self, obj):
        return obj.result.score if hasattr(obj, "result") else "-"

    @admin.display(description="Category")
    def category(self, obj):
        return obj.result.category if hasattr(obj, "result") else "-"

    @admin.display(description="Virus")
    def virus(self, obj):
        return obj.result.virus if hasattr(obj, "result") else "-"

    @admin.display(description="Course Offer")
    def course_offer(self, obj):
        return obj.result.course_offer if hasattr(obj, "result") else "-"


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "score", "category", "virus", "course_offer", "created_at")
    search_fields = ("user__name", "user__email", "category")
    ordering = ("-created_at",)
    list_filter = ("created_at", "category", "virus")
    date_hierarchy = "created_at"
    actions = [export_results_to_excel]
    change_list_template = "admin/quiz_funnel/result/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "export-filtered/",
                self.admin_site.admin_view(self.export_filtered_view),
                name="quiz_funnel_result_export_filtered",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        query_string = request.GET.urlencode()
        export_url = reverse("admin:quiz_funnel_result_export_filtered")
        if query_string:
            export_url = f"{export_url}?{query_string}"
        extra_context["export_filtered_url"] = export_url
        return super().changelist_view(request, extra_context=extra_context)

    def export_filtered_view(self, request):
        changelist = self.get_changelist_instance(request)
        queryset = changelist.get_queryset(request).select_related("user")
        response = _build_excel_response("quiz_results_export.csv")
        writer = csv.writer(response)
        writer.writerow(["User Name", "Email", "Number", "Score", "Category", "Virus"])
        for result in queryset:
            user = result.user
            writer.writerow(
                [
                    user.name or "",
                    user.email or "",
                    user.phone or "",
                    result.score,
                    result.category or "",
                    result.virus or "",
                ]
            )
        return response


class QuizOptionInline(admin.TabularInline):
    model = QuizOption
    extra = 0


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "section", "question_text", "created_at")
    search_fields = ("question_text", "section")
    ordering = ("id",)
    inlines = [QuizOptionInline]


@admin.register(IntakeResponse)
class IntakeResponseAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "user_email", "submitted_at")
    search_fields = ("user__email", "user__name", "user__intake_ref")
    ordering = ("-submitted_at",)
    readonly_fields = ("user", "answers", "submitted_at", "updated_at")

    @admin.display(description="Email")
    def user_email(self, obj):
        return obj.user.email or "—"
