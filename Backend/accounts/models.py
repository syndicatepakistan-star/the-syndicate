import uuid

from django.db import models


class PendingSignup(models.Model):
  token = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
  username = models.CharField(max_length=150)
  email = models.EmailField(unique=True)
  password_hash = models.CharField(max_length=128)
  is_paid = models.BooleanField(
    default=False,
    help_text="Legacy Stripe flag — row is removed once the user verifies OTP or completes checkout.",
  )
  stripe_checkout_session_id = models.CharField(max_length=255, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self) -> str:
    return f"PendingSignup<{self.email}>"


class LoginOTP(models.Model):
  email = models.EmailField(unique=True)
  otp_code = models.CharField(max_length=6)
  otp_expires_at = models.DateTimeField()
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self) -> str:
    return f"LoginOTP<{self.email}>"


class SignupOTP(models.Model):
  email = models.EmailField(unique=True)
  otp_code = models.CharField(max_length=6)
  otp_expires_at = models.DateTimeField()
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self) -> str:
    return f"SignupOTP<{self.email}>"


class ReturningCheckout(models.Model):
  """Existing customer: Stripe checkout link without OTP (repeat purchase)."""

  token = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
  email = models.EmailField()
  stripe_checkout_session_id = models.CharField(max_length=255, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self) -> str:
    return f"ReturningCheckout<{self.email}>"


class GuestCheckoutClaim(models.Model):
  """Links a paid guest Stripe session to an email/user after OTP claim."""

  stripe_checkout_session_id = models.CharField(max_length=255, unique=True, db_index=True)
  email = models.EmailField(db_index=True)
  user = models.ForeignKey(
    "auth.User",
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name="guest_checkout_claims",
  )
  selected_plan = models.CharField(max_length=120, blank=True)
  playlist_id = models.CharField(max_length=32, blank=True)
  claimed_at = models.DateTimeField(null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self) -> str:
    return f"GuestCheckoutClaim<{self.stripe_checkout_session_id}:{self.email}>"


class GuestCheckoutReceipt(models.Model):
  """Stores display titles/images for a guest Stripe session (metadata size is limited)."""

  stripe_checkout_session_id = models.CharField(max_length=255, unique=True, db_index=True)
  items_json = models.TextField(blank=True, default="")
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self) -> str:
    return f"GuestCheckoutReceipt<{self.stripe_checkout_session_id}>"


class RefundApplication(models.Model):
  """Syndicate Guarantee / refund applications for admin review."""

  class RequestType(models.TextChoices):
    FOUNDER_AUDIT = "Founder Audit", "Founder Audit"
    FULL_REFUND = "Full Refund", "Full Refund"
    FULL_REPLACEMENT = "Full Replacement", "Full Replacement"
    # Legacy value still accepted from older submissions
    REPLACEMENT = "Replacement Program", "Full Replacement (legacy)"

  class Status(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_REVIEW = "in_review", "In Review"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    COMPLETED = "completed", "Completed"

  user = models.ForeignKey(
    "auth.User",
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name="refund_applications",
    verbose_name="Linked account",
  )
  member_email = models.EmailField(db_index=True, verbose_name="Applicant email")
  member_name = models.CharField(max_length=200, blank=True, verbose_name="Applicant name")
  request_type = models.CharField(
    max_length=80,
    choices=RequestType.choices,
    default=RequestType.FULL_REFUND,
    db_index=True,
    verbose_name="Category",
  )
  program_label = models.CharField(max_length=200, verbose_name="Purchase / program")
  purchase_key = models.CharField(max_length=120, blank=True, verbose_name="Purchase key")
  message = models.TextField(verbose_name="Description")
  purchases_summary = models.TextField(blank=True, verbose_name="All paid purchases")
  status = models.CharField(
    max_length=20,
    choices=Status.choices,
    default=Status.PENDING,
    db_index=True,
    verbose_name="Review status",
  )
  admin_notes = models.TextField(blank=True, verbose_name="Admin notes")
  email_sent = models.BooleanField(default=False, verbose_name="Notify email sent")
  created_at = models.DateTimeField(auto_now_add=True, db_index=True)
  updated_at = models.DateTimeField(auto_now=True)

  class Meta:
    ordering = ["-created_at"]
    verbose_name = "Refund application"
    verbose_name_plural = "Refund applications"

  def __str__(self) -> str:
    return f"{self.member_email} · {self.request_type} · {self.status}"
