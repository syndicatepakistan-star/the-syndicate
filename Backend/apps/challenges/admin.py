from __future__ import annotations

from typing import Optional

from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from django.utils.html import format_html
from django.utils.text import Truncator

from .models import (
    AdminAssignedTask,
    AdminTaskSubmission,
    AgentDailyQuote,
    GeneratedChallenge,
    LeaderboardEntry,
    ReferralRestore,
    SyndicateUserProgress,
    UserAgentDailyQuote,
    UserDeviceMindsetContext,
)

User = get_user_model()


def _all_model_field_names(model) -> tuple[str, ...]:
    return tuple(
        field.name
        for field in model._meta.get_fields()
        if ((field.concrete and not field.auto_created) or field.many_to_many)
    )


class AllFieldsListDisplayAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return _all_model_field_names(self.model)


def _format_elapsed(seconds: int) -> str:
    if seconds <= 0:
        return ""
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    parts: list[str] = []
    if h:
        parts.append(f"{h}h")
    if m or h:
        parts.append(f"{m}m")
    parts.append(f"{s}s")
    return " ".join(parts)


def _dt_display(dt) -> str:
    if dt is None:
        return "—"
    if timezone.is_aware(dt):
        dt = timezone.localtime(dt)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def _syndicate_progress_for_user(user) -> SyndicateUserProgress | None:
    if user is None or not getattr(user, "pk", None):
        return None
    return SyndicateUserProgress.objects.filter(user_id=user.pk).first()


def _pounds_from_state(state: Optional[dict]) -> str:
    if not state:
        return "—"
    raw = state.get("pounds_balance_v1")
    if raw is None or raw == "":
        return "—"
    try:
        v = float(str(raw).strip())
        return f"${v:.2f}"
    except (TypeError, ValueError):
        return str(raw)


@admin.register(GeneratedChallenge)
class GeneratedChallengeAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(ReferralRestore)
class ReferralRestoreAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(UserAgentDailyQuote)
class UserAgentDailyQuoteAdmin(AllFieldsListDisplayAdmin):
    list_select_related = ("user",)
    search_fields = ["user__username", "user__email"]
    ordering = ["-quote_date"]


@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(AllFieldsListDisplayAdmin):
    search_fields = ["device_id", "display_name"]


@admin.register(UserDeviceMindsetContext)
class UserDeviceMindsetContextAdmin(AllFieldsListDisplayAdmin):
    search_fields = ["device_id"]


@admin.register(AgentDailyQuote)
class AgentDailyQuoteAdmin(AllFieldsListDisplayAdmin):
    ordering = ["-quote_date"]


@admin.register(AdminAssignedTask)
class AdminAssignedTaskAdmin(AllFieldsListDisplayAdmin):
    list_filter = ["active", "created_at"]
    search_fields = ["title", "description"]


@admin.register(AdminTaskSubmission)
class AdminTaskSubmissionAdmin(AllFieldsListDisplayAdmin):
    list_select_related = ("task",)
    list_filter = ["status", "points_claimed", "submitted_at"]
    search_fields = ["device_id", "task__title", "response_text"]
    autocomplete_fields = ["task", "reviewed_by"]
    readonly_fields = [
        "completion_time_display",
        "started_at",
        "elapsed_seconds",
        "submitted_at",
        "result_preview",
    ]
    fieldsets = (
        (
            "Submission",
            {
                "fields": (
                    "task",
                    "device_id",
                    "completion_time_display",
                    "response_text",
                    "attachment",
                    "status",
                    "result_preview",
                )
            },
        ),
        (
            "Review",
            {
                "fields": (
                    "awarded_points",
                    "review_notes",
                    "reviewed_by",
                    "reviewed_at",
                    "points_claimed",
                )
            },
        ),
        (
            "Timing (raw)",
            {
                "description": (
                    "Bonus posted = task created time. Elapsed = seconds from bonus posted to submit (stored on save). "
                    "Device started = optional client timestamp when the user opened the task in the app."
                ),
                "fields": ("started_at", "elapsed_seconds", "submitted_at"),
            },
        ),
    )

    @admin.display(description="After bonus posted")
    def time_after_bonus_display(self, obj: AdminTaskSubmission) -> str:
        posted = obj.task.created_at if obj.task_id else None
        submitted = obj.submitted_at
        if posted is not None and submitted is not None:
            sec = max(0, int((submitted - posted).total_seconds()))
        else:
            sec = int(obj.elapsed_seconds or 0)
        human = _format_elapsed(sec)
        if human:
            return f"{human} ({sec}s)"
        return f"{sec}s"

    @admin.display(description="Time to complete")
    def completion_time_display(self, obj: AdminTaskSubmission) -> str:
        if obj is None or obj.pk is None:
            return "—"
        posted = obj.task.created_at if obj.task_id else None
        submitted = obj.submitted_at
        if posted is not None and submitted is not None:
            delta_sec = max(0, int((submitted - posted).total_seconds()))
        else:
            delta_sec = int(obj.elapsed_seconds or 0)
        human = _format_elapsed(delta_sec)
        if delta_sec > 0 and human:
            head = format_html(
                '<p style="margin:0 0 6px 0;font-size:15px;"><strong>{}</strong> <span style="opacity:.85">({} seconds from bonus post → submit)</span></p>',
                human,
                delta_sec,
            )
        else:
            head = format_html(
                '<p style="margin:0 0 6px 0;opacity:.9"><strong>0s</strong> <span style="opacity:.85">(submitted in the same second the bonus was posted, or missing timestamps)</span></p>'
            )
        client_note = ""
        if obj.started_at is not None:
            client_note = format_html(
                '<p style="margin:6px 0 0 0;font-size:12px;line-height:1.45;opacity:.75">Device reported open: {} <span style="opacity:.7">(optional client clock)</span></p>',
                _dt_display(obj.started_at),
            )
        lines = format_html(
            '<p style="margin:0;font-size:13px;line-height:1.5;opacity:.88">Bonus posted (admin): {}<br/>User submitted: {}</p>',
            _dt_display(posted),
            _dt_display(submitted),
        )
        return format_html("{}{}{}", head, lines, client_note)

    @admin.display(description="User result")
    def result_summary(self, obj: AdminTaskSubmission) -> str:
        return Truncator(obj.response_text or "").chars(48)

    @admin.display(description="Submission result")
    def result_preview(self, obj: AdminTaskSubmission) -> str:
        text = (obj.response_text or "").strip()
        if not text:
            return "-"
        # Keep full response readable in detail view without editing it here.
        return text


# --- User + Syndicate progress (staff can inspect streak / points / level / pounds) ---


try:
    admin.site.unregister(User)
except NotRegistered:
    pass


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = tuple(BaseUserAdmin.list_display) + ("syndicate_streak_short", "syndicate_points_short")
    readonly_fields = tuple(getattr(BaseUserAdmin, "readonly_fields", ()) or ()) + (
        "syndicate_streak_display",
        "syndicate_points_display",
        "syndicate_level_display",
        "syndicate_pounds_display",
        "syndicate_last_activity_display",
    )
    fieldsets = tuple(BaseUserAdmin.fieldsets) + (
        (
            "Syndicate (read-only)",
            {
                "description": "Values from SyndicateUserProgress (and pounds from synced JSON state).",
                "fields": (
                    "syndicate_streak_display",
                    "syndicate_points_display",
                    "syndicate_level_display",
                    "syndicate_pounds_display",
                    "syndicate_last_activity_display",
                ),
            },
        ),
    )

    @admin.display(description="Streak")
    def syndicate_streak_short(self, obj: User) -> str:
        sp = _syndicate_progress_for_user(obj)
        return "—" if not sp else str(sp.streak_count)

    @admin.display(description="Points")
    def syndicate_points_short(self, obj: User) -> str:
        sp = _syndicate_progress_for_user(obj)
        return "—" if not sp else str(int(sp.points_total or 0))

    @admin.display(description="Streak (consecutive days)")
    def syndicate_streak_display(self, obj: User) -> str:
        sp = _syndicate_progress_for_user(obj)
        if not sp:
            return "— (no Syndicate progress row yet — user has not synced progress)"
        return str(sp.streak_count)

    @admin.display(description="Total points")
    def syndicate_points_display(self, obj: User) -> str:
        sp = _syndicate_progress_for_user(obj)
        if not sp:
            return "—"
        return str(int(sp.points_total or 0))

    @admin.display(description="Level (backend)")
    def syndicate_level_display(self, obj: User) -> str:
        sp = _syndicate_progress_for_user(obj)
        if not sp:
            return "—"
        return str(int(sp.level or 0))

    @admin.display(description="Pounds balance (from synced state)")
    def syndicate_pounds_display(self, obj: User) -> str:
        sp = _syndicate_progress_for_user(obj)
        if not sp:
            return "—"
        return _pounds_from_state(sp.state or {})

    @admin.display(description="Last activity date (streak)")
    def syndicate_last_activity_display(self, obj: User) -> str:
        sp = _syndicate_progress_for_user(obj)
        if not sp or sp.last_activity_date is None:
            return "—"
        return sp.last_activity_date.isoformat()


@admin.register(SyndicateUserProgress)
class SyndicateUserProgressAdmin(AllFieldsListDisplayAdmin):
    list_select_related = ("user",)
    search_fields = ["user__username", "user__email"]
    ordering = ["-updated_at"]
    readonly_fields = ["user", "state", "points_total", "level", "streak_count", "last_activity_date", "updated_at"]

    @admin.display(description="Pounds (synced)")
    def pounds_list_display(self, obj: SyndicateUserProgress) -> str:
        return _pounds_from_state(obj.state or {})

    def has_add_permission(self, request) -> bool:
        return False
