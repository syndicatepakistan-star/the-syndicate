from django.contrib import admin
from django.utils import timezone

from .models import SupportMessage, SupportThread


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 1
    fields = ("body", "is_staff", "author", "created_at")
    readonly_fields = ("created_at",)


@admin.register(SupportThread)
class SupportThreadAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "member_name",
        "user_email",
        "priority",
        "status",
        "created_at",
        "updated_at",
    )
    list_display_links = ("id", "member_name", "user_email")
    list_filter = ("priority", "status", "created_at")
    search_fields = (
        "id",
        "user__email",
        "user__username",
        "user__first_name",
        "user__last_name",
        "messages__body",
    )
    readonly_fields = (
        "id",
        "member_name",
        "user_email",
        "created_at",
        "updated_at",
        "red_confirmed_at",
    )
    fields = (
        "id",
        "user",
        "member_name",
        "user_email",
        "priority",
        "status",
        "source",
        "red_confirmed_at",
        "acknowledged_at",
        "resolved_at",
        "created_at",
        "updated_at",
    )
    autocomplete_fields = ("user",)
    inlines = [SupportMessageInline]
    ordering = ("-created_at",)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user")

    @admin.display(description="Name", ordering="user__first_name")
    def member_name(self, obj: SupportThread) -> str:
        user = obj.user
        if user is None:
            return "—"
        full = (user.get_full_name() or "").strip()
        if full:
            return full
        first = (getattr(user, "first_name", None) or "").strip()
        last = (getattr(user, "last_name", None) or "").strip()
        combined = f"{first} {last}".strip()
        if combined:
            return combined
        return (getattr(user, "username", None) or "—").strip() or "—"

    @admin.display(description="Email", ordering="user__email")
    def user_email(self, obj: SupportThread) -> str:
        user = obj.user
        if user is None:
            return "—"
        return (getattr(user, "email", None) or "").strip() or "—"

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in instances:
            if isinstance(obj, SupportMessage) and obj.pk is None:
                if obj.is_staff and not obj.author_id:
                    obj.author = request.user
            obj.save()
        formset.save_m2m()

    @admin.action(description="Mark acknowledged")
    def mark_acknowledged(self, request, queryset):
        now = timezone.now()
        queryset.update(status=SupportThread.STATUS_ACKNOWLEDGED, acknowledged_at=now)

    @admin.action(description="Mark resolved")
    def mark_resolved(self, request, queryset):
        now = timezone.now()
        queryset.update(status=SupportThread.STATUS_RESOLVED, resolved_at=now)

    actions = [mark_acknowledged, mark_resolved]
