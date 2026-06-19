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
