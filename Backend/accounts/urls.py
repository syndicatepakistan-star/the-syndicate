from django.urls import path

from .views import (
  checkout_success_view,
  claim_checkout_send_otp_view,
  claim_checkout_verify_otp_view,
  create_checkout_session_view,
  login_view,
  resend_signup_otp_view,
  signup_view,
  verify_login_otp_view,
  verify_signup_otp_view,
)

urlpatterns = [
  path("signup/", signup_view, name="signup"),
  path("signup/resend-otp/", resend_signup_otp_view, name="signup-resend-otp"),
  path("signup/verify-otp/", verify_signup_otp_view, name="signup-verify-otp"),
  path("checkout/create-session/", create_checkout_session_view, name="checkout-create-session"),
  path("checkout/success/", checkout_success_view, name="checkout-success"),
  path("checkout/claim/send-otp/", claim_checkout_send_otp_view, name="checkout-claim-send-otp"),
  path("checkout/claim/verify-otp/", claim_checkout_verify_otp_view, name="checkout-claim-verify-otp"),
  path("login/", login_view, name="login"),
  # Keep compatibility with frontend calls that use `/api/auth/otp-login/`.
  path("otp-login/", login_view, name="otp-login"),
  path("otp-login", login_view, name="otp-login-noslash"),
  path("verify-login-otp/", verify_login_otp_view, name="verify-login-otp"),
]
