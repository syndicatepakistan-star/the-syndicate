from django.contrib import admin

from .models import AffiliateProfile, ApiToken, ClickEvent, EmailOTP, LeadEvent, SaleEvent, SectionReferral, WithdrawalRequest


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
class WithdrawalRequestAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("profile__display_name", "section_referral__referral_id", "account_name", "iban")
