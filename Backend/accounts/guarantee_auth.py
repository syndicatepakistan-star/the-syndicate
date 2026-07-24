"""Public Bulletproof Guarantee verify helpers (email OTP, no full login session)."""

from __future__ import annotations

import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils import timezone

from accounts.models import LoginOTP
from accounts.syndicate_otp_mailer import build_syndicate_otp_email_html, queue_syndicate_otp_html_email

logger = logging.getLogger(__name__)

GUARANTEE_TOKEN_SALT = "syndicate-guarantee-apply-v1"
GUARANTEE_TOKEN_MAX_AGE = 60 * 30  # 30 minutes


def _signer() -> TimestampSigner:
  return TimestampSigner(salt=GUARANTEE_TOKEN_SALT)


def make_guarantee_token(*, user_id: int, email: str) -> str:
  return _signer().sign(f"{int(user_id)}:{str(email).strip().lower()}")


def parse_guarantee_token(token: str) -> tuple[int, str] | None:
  raw = (token or "").strip()
  if not raw:
    return None
  try:
    value = _signer().unsign(raw, max_age=GUARANTEE_TOKEN_MAX_AGE)
  except (BadSignature, SignatureExpired):
    return None
  if ":" not in value:
    return None
  uid_s, email = value.split(":", 1)
  try:
    return int(uid_s), email.strip().lower()
  except ValueError:
    return None


def _generate_otp() -> str:
  return f"{secrets.randbelow(1_000_000):06d}"


def create_and_email_guarantee_otp(email: str, username: str) -> str:
  """Reuse LoginOTP table + syndicate OTP email template. Returns the OTP code."""
  import html as html_lib

  otp_code = _generate_otp()
  expires_at = timezone.now() + timedelta(minutes=getattr(settings, "OTP_EXPIRES_MINUTES", 10))
  LoginOTP.objects.update_or_create(
    email=email,
    defaults={"otp_code": otp_code, "otp_expires_at": expires_at},
  )
  # Keep OTP in DB even if email delivery is slow; only the emailed code is valid for users.
  if getattr(settings, "DEBUG", False):
    logger.info("[Guarantee OTP] queued for %s", email)

  display = (username or "").strip() or (email.split("@")[0] or "Operator")
  safe_name = html_lib.escape(display)
  expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  html_body = build_syndicate_otp_email_html(
    header_badge="Bulletproof Guarantee",
    greeting_line=f'Operator <span style="color:#fef3c7;">{safe_name}</span>,',
    intro_paragraph="Verify your email to apply for the Syndicate Guarantee. Use this one-time code.",
    otp_box_label="One-time Code",
    otp_code=otp_code,
    expires_minutes=expires_minutes,
    ignore_line="If you did not request a guarantee application, you can safely ignore this email.",
  )
  queue_syndicate_otp_html_email(
    email,
    "Your Syndicate Guarantee verification code",
    html_body,
    dev_log_code=otp_code,
  )
  return otp_code


def verify_guarantee_otp(email: str, otp: str) -> bool:
  try:
    login_otp = LoginOTP.objects.get(email=email)
  except LoginOTP.DoesNotExist:
    return False
  if login_otp.otp_expires_at < timezone.now():
    login_otp.delete()
    return False
  if login_otp.otp_code != otp:
    return False
  login_otp.delete()
  return True
