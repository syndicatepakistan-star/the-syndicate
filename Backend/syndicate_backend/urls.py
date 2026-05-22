"""
URL configuration for syndicate_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to the urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to the urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to the urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from accounts import views as accounts_views
from apps.portal import views as portal_views

from syndicate_backend.admin_forms import EmailAsUsernameAdminLoginForm

admin.site.login_form = EmailAsUsernameAdminLoginForm


def api_root(_request):
    """Helps verify the public Railway URL points at this Django app (not the Next.js service)."""
    return JsonResponse(
        {
            "service": "syndicate-backend",
            "health": "/api/health/",
            "admin": "/admin/",
            "affiliate_track": "/api/track/health",
            "affiliate_auth": "/api/affiliate/auth/request-otp",
            "streaming_videos": "/api/streaming/videos/",
        }
    )


urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    # Explicit routes (do not rely on include) so /api/auth/login/ always resolves (JWT portal).
    path("api/auth/login/", portal_views.LoginView.as_view(), name="auth-login"),
    path("api/auth/refresh/", portal_views.RefreshView.as_view(), name="auth-refresh"),
    path("api/auth/logout/", portal_views.LogoutView.as_view(), name="auth-logout"),
    path("api/auth/me/", portal_views.MeView.as_view(), name="auth-me"),
    path("api/auth/billing-purchases/", portal_views.BillingPurchasesView.as_view(), name="auth-billing-purchases"),
    path("api/auth/login", portal_views.LoginView.as_view(), name="auth-login-noslash"),
    path("api/auth/refresh", portal_views.RefreshView.as_view(), name="auth-refresh-noslash"),
    path("api/auth/logout", portal_views.LogoutView.as_view(), name="auth-logout-noslash"),
    path("api/auth/me", portal_views.MeView.as_view(), name="auth-me-noslash"),
    path("api/auth/billing-purchases", portal_views.BillingPurchasesView.as_view(), name="auth-billing-purchases-noslash"),
    # Accounts OTP auth flow (kept separate from JWT /api/auth/login/ above).
    path("api/auth/otp-login/", accounts_views.login_view, name="auth-otp-login"),
    path("api/auth/verify-login-otp/", accounts_views.verify_login_otp_view, name="auth-verify-login-otp"),
    path("api/auth/signup/", accounts_views.signup_view, name="auth-signup"),
    path("api/auth/signup/verify-otp/", accounts_views.verify_signup_otp_view, name="auth-signup-verify-otp"),
    path("api/auth/checkout/create-session/", accounts_views.create_checkout_session_view, name="auth-checkout-create"),
    path("api/auth/checkout/success/", accounts_views.checkout_success_view, name="auth-checkout-success"),
    path("api/auth/checkout/create-session", accounts_views.create_checkout_session_view, name="auth-checkout-create-noslash"),
    path("api/auth/checkout/success", accounts_views.checkout_success_view, name="auth-checkout-success-noslash"),
    path("api/portal/", include("apps.portal.urls")),
    path("api/challenges/", include("apps.challenges.urls")),
    path("api/track/", include("apps.affiliate_tracking.urls_track")),
    path("api/affiliate/auth/", include("apps.affiliate_tracking.urls_auth")),
    path("api/support/", include("apps.support.urls")),
    path("api/", include("api.urls")),
]

# WhiteNoise middleware serves /static/ in production; no extra django.views.static route needed.

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
