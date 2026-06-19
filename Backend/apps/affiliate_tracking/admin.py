from django.contrib import admin

from .models import AffiliateProfile, AffiliateWithdrawalAccount, ApiToken, ClickEvent, EmailOTP, LeadEvent, SaleEvent, SectionReferral, WithdrawalRequest
from .withdrawal_status import ensure_withdrawal_transferred_fields


def _all_model_field_names(model) -> tuple[str, ...]:
    return tuple(
        field.name
        for field in model._meta.get_fields()
        if ((field.concrete and not field.auto_created) or field.many_to_many)
    )


class AllFieldsListDisplayAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return _all_model_field_names(self.model)


@admin.register(AffiliateProfile)
class AffiliateProfileAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("display_name", "user__email", "user__username")


@admin.register(SectionReferral)
class SectionReferralAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("referral_id",)


@admin.register(ClickEvent)
class ClickEventAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(LeadEvent)
class LeadEventAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(SaleEvent)
class SaleEventAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(ApiToken)
class ApiTokenAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(EmailOTP)
class EmailOTPAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "profile",
        "section_referral",
        "requested_amount",
        "earnings_snapshot",
        "status",
        "account_name",
        "bank_name",
        "created_at",
        "transferred_at",
    )
    search_fields = (
        "profile__display_name",
        "profile__user__email",
        "section_referral__referral_id",
        "account_name",
        "iban",
    )
    list_filter = ("status", "created_at", "transferred_at")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
    list_editable = ("status",)
    actions = ("mark_as_transferred",)

    @admin.action(description="Mark selected as transferred (wire sent)")
    def mark_as_transferred(self, request, queryset):
        for withdrawal in queryset:
            withdrawal.status = "transferred"
            withdrawal.status, withdrawal.transferred_at = ensure_withdrawal_transferred_fields(
                status=withdrawal.status,
                transferred_at=withdrawal.transferred_at,
            )
            withdrawal.save()

    def save_model(self, request, obj, form, change):
        obj.status, obj.transferred_at = ensure_withdrawal_transferred_fields(
            status=obj.status,
            transferred_at=obj.transferred_at,
            old_status=form.initial.get("status") if change else None,
        )
        super().save_model(request, obj, form, change)


@admin.register(AffiliateWithdrawalAccount)
class AffiliateWithdrawalAccountAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("profile__display_name", "account_name", "iban")
