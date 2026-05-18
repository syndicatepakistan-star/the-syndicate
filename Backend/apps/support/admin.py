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
    list_display = ("id", "user", "priority", "status", "created_at", "updated_at")
    list_filter = ("priority", "status", "created_at")
    search_fields = ("id", "user__email", "user__username", "messages__body")
    readonly_fields = ("id", "created_at", "updated_at", "red_confirmed_at")
    inlines = [SupportMessageInline]
    ordering = ("-created_at",)

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
