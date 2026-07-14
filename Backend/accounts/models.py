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
