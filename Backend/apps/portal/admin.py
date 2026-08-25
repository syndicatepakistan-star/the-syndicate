from django.contrib import admin

from apps.portal.models import (
    Mission,
    Note,
    PortalPermission,
    PortalRole,
    Reminder,
    SocialLink,
    UserPlanPurchase,
    UserPortalRole,
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


@admin.register(PortalPermission)
class PortalPermissionAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("codename", "name")


@admin.register(PortalRole)
class PortalRoleAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("name", "display_name")
    filter_horizontal = ("permissions",)


@admin.register(UserPortalRole)
class UserPortalRoleAdmin(AllFieldsListDisplayAdmin):
    autocomplete_fields = ("user", "role")


@admin.register(SocialLink)
class SocialLinkAdmin(AllFieldsListDisplayAdmin):
    list_filter = ("platform", "is_active")


@admin.register(Mission)
class MissionAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(Reminder)
class ReminderAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(Note)
class NoteAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(UserPlanPurchase)
class UserPlanPurchaseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_email",
        "plan_slug",
        "product_title",
        "status",
        "amount_paid",
        "currency",
        "paid_at",
        "created_at",
        "stripe_checkout_session_id",
    )
    list_display_links = ("id", "user_email", "product_title")
    list_filter = ("status", "plan_slug", "currency", "paid_at", "created_at")
    search_fields = (
        "user__email",
        "user__username",
        "plan_slug",
        "product_title",
        "stripe_checkout_session_id",
    )
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "paid_at"
    ordering = ("-paid_at", "-id")
    list_per_page = 50

    @admin.display(description="Buyer email", ordering="user__email")
    def user_email(self, obj: UserPlanPurchase) -> str:
        user = obj.user
        return (getattr(user, "email", None) or getattr(user, "username", None) or str(user.pk))
