from __future__ import annotations

from decimal import Decimal

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class ApiToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="affiliate_api_tokens")
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at


class AffiliateProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="affiliate_profile")
    display_name = models.CharField(max_length=120)
    # Frozen from the first email local-part; used to keep referral ids stable even if display name changes.
    referral_base = models.CharField(max_length=48, db_index=True, blank=True, default="")
    earnings_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    points_total = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class SectionReferral(models.Model):
    SECTION_CHOICES = [
        ("complete", "Complete Programs Affiliate"),
        ("single", "Single Program"),
        ("pawn", "The Pawn"),
        ("king", "The Knight"),
        ("exclusive", "Exclusive Content of Gussy Bahi (Legacy)"),
    ]

    profile = models.ForeignKey(AffiliateProfile, on_delete=models.CASCADE, related_name="section_referrals")
    section = models.CharField(max_length=24, choices=SECTION_CHOICES)
    referral_id = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("profile", "section")


class ClickEvent(models.Model):
    referral = models.ForeignKey(SectionReferral, on_delete=models.CASCADE, related_name="click_events")
    visitor_id = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("referral", "visitor_id")


class LeadEvent(models.Model):
    """
    Capture distinct lead milestones for a referred visitor.

    Two slots are recognised per (referral, visitor_id):
      - `diagnosis`  -> "Syn Diagnosis lead" (email captured during the funnel quiz)
      - `auth`       -> "Sign up lead" or "Login lead" (account creation / login)
    """

    KIND_DIAGNOSIS = "diagnosis"
    KIND_AUTH = "auth"
    KIND_CHOICES = [
        (KIND_DIAGNOSIS, "Syn Diagnosis lead"),
        (KIND_AUTH, "Sign up / Login lead"),
    ]

    referral = models.ForeignKey(SectionReferral, on_delete=models.CASCADE, related_name="lead_events")
    visitor_id = models.CharField(max_length=128)
    email = models.EmailField()
    lead_kind = models.CharField(max_length=24, choices=KIND_CHOICES, default=KIND_AUTH)
    # Human-friendly label shown in the affiliate dashboard (e.g. "Sign up lead", "Login lead").
    lead_label = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("referral", "visitor_id", "lead_kind")


class SaleEvent(models.Model):
    referral = models.ForeignKey(SectionReferral, on_delete=models.CASCADE, related_name="sale_events")
    visitor_id = models.CharField(max_length=128)
    email = models.EmailField()
    # Commission credited to the affiliate for this sale.
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    # Gross checkout amount paid by the buyer (optional for legacy rows).
    purchase_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    subscription_name = models.CharField(max_length=280, blank=True, default="")
    currency = models.CharField(max_length=8, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["referral", "visitor_id"]),
            models.Index(fields=["referral", "created_at"]),
        ]


class WithdrawalRequest(models.Model):
    profile = models.ForeignKey(AffiliateProfile, on_delete=models.CASCADE, related_name="withdrawal_requests")
    section_referral = models.ForeignKey(SectionReferral, on_delete=models.CASCADE, related_name="withdrawal_requests")
    bank_name = models.CharField(max_length=160)
    account_name = models.CharField(max_length=160)
    account_number = models.CharField(max_length=80)
    iban = models.CharField(max_length=80)
    phone_number = models.CharField(max_length=40)
    branch_name = models.CharField(max_length=160, blank=True, default="")
    requested_amount = models.DecimalField(max_digits=12, decimal_places=2)
    earnings_snapshot = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=24, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    transferred_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Set automatically when status changes to complete (admin wire sent).",
    )

    def save(self, *args, **kwargs):
        if self.pk:
            prev = (
                WithdrawalRequest.objects.filter(pk=self.pk)
                .values_list("status", "transferred_at")
                .first()
            )
            if prev is not None:
                old_status = (prev[0] or "").strip().lower()
                new_status = (self.status or "").strip().lower()
                if new_status == "complete" and old_status != "complete" and not self.transferred_at:
                    from django.utils import timezone

                    self.transferred_at = timezone.now()
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=["profile", "created_at"]),
            models.Index(fields=["section_referral", "created_at"]),
        ]


class AffiliateWithdrawalAccount(models.Model):
    profile = models.OneToOneField(AffiliateProfile, on_delete=models.CASCADE, related_name="withdrawal_account")
    bank_name = models.CharField(max_length=160)
    account_name = models.CharField(max_length=160)
    account_number = models.CharField(max_length=80)
    iban = models.CharField(max_length=80)
    phone_number = models.CharField(max_length=40)
    branch_name = models.CharField(max_length=160, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
