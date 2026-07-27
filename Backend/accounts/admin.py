from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db.models import Exists, OuterRef

from .models import LoginOTP, PendingSignup, RefundApplication, ReturningCheckout, SignupOTP
from .pending_signup import abandoned_pending_signup_queryset, purge_stale_pending_signups

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


@admin.register(PendingSignup)
class PendingSignupAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("email", "username", "stripe_checkout_session_id")
    actions = ("purge_stale_pending_signups",)

    @admin.action(description="Remove rows whose email already has a User account")
    def purge_stale_pending_signups(self, request, queryset):
        count = purge_stale_pending_signups()
        self.message_user(request, f"Removed {count} stale pending signup row(s).")

    def get_queryset(self, request):
        purge_stale_pending_signups()
        return abandoned_pending_signup_queryset()


@admin.register(LoginOTP)
class LoginOTPAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("email",)


@admin.register(SignupOTP)
class SignupOTPAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("email",)

    def get_queryset(self, request):
        registered = User.objects.filter(email__iexact=OuterRef("email"))
        return SignupOTP.objects.filter(~Exists(registered))


@admin.register(ReturningCheckout)
class ReturningCheckoutAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("email", "stripe_checkout_session_id")


@admin.register(RefundApplication)
class RefundApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "created_at",
        "status",
        "request_type",
        "member_email",
        "member_name",
        "program_label",
        "short_description",
        "email_sent",
    )
    list_display_links = ("id", "member_email", "created_at")
    list_filter = ("status", "request_type", "email_sent", "created_at")
    search_fields = ("member_email", "member_name", "program_label", "message", "purchase_key", "admin_notes")
    readonly_fields = (
        "user",
        "member_email",
        "member_name",
        "request_type",
        "program_label",
        "purchase_key",
        "message",
        "purchases_summary",
        "email_sent",
        "created_at",
        "updated_at",
    )
    list_editable = ("status",)
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    list_per_page = 50
    fieldsets = (
        (
            "Review",
            {
                "description": "Update status and leave internal notes while reviewing this application.",
                "fields": ("status", "admin_notes"),
            },
        ),
        (
            "Applicant request",
            {
                "fields": (
                    "member_email",
                    "member_name",
                    "request_type",
                    "program_label",
                    "purchase_key",
                    "message",
                )
            },
        ),
        (
            "Member purchases",
            {"fields": ("user", "purchases_summary")},
        ),
        (
            "Meta",
            {"fields": ("email_sent", "created_at", "updated_at")},
        ),
    )

    @admin.display(description="Description")
    def short_description(self, obj: RefundApplication) -> str:
        text = (obj.message or "").strip().replace("\n", " ")
        if len(text) <= 72:
            return text
        return f"{text[:72]}…"