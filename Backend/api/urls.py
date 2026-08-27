from django.urls import include, path

from apps.portal import views as portal_views
from apps.quiz_funnel import views as quiz_funnel_views

from . import auth_views
from . import views

# Fallback when ROOT_URLCONF only mounts `path("api/", include("api.urls"))`.
# Names omitted to avoid clashing with syndicate_backend.urls (same paths, first match wins).
urlpatterns = [
    path("quiz-questions", quiz_funnel_views.fetch_quiz_questions),
    path("submit-answers", quiz_funnel_views.submit_answers),
    path("save-quiz-lead", quiz_funnel_views.save_quiz_lead),
    path("quiz-intake", quiz_funnel_views.fetch_intake_session),
    path("quiz-intake/submit", quiz_funnel_views.submit_intake),
    path("courses/", include("apps.courses.urls")),
    path("streaming/", include("apps.video_streaming.urls")),
    path("videos/", include("apps.courses.urls_videos")),
    # When ROOT_URLCONF only mounts ``path("api/", include("api.urls"))`` (no separate api/challenges prefix).
    path("challenges/", include("apps.challenges.urls")),
    # DRF Token auth for Syndicate login/signup (JWT portal routes are registered first in syndicate_backend.urls).
    path("syndicate-auth/signup/", auth_views.signup),
    path("syndicate-auth/login/", auth_views.login),
    path("syndicate-auth/logout/", auth_views.logout),
    path("syndicate-auth/me/", auth_views.me),
    path("auth/login/", portal_views.LoginView.as_view()),
    path("auth/refresh/", portal_views.RefreshView.as_view()),
    path("auth/logout/", portal_views.LogoutView.as_view()),
    path("auth/me/", portal_views.MeView.as_view()),
    path("portal/", include("apps.portal.urls")),
    path("portal/membership/", include("apps.membership.urls")),
    path("health/", views.health),
    path("mindset/status/", views.mindset_status),
    path("documents/upload/", views.upload_document),
    path("documents/<int:document_id>/download-url/", views.document_download_url),
    path("documents/ingest/", views.ingest_document),
    path("syndicate/bootstrap/", views.syndicate_bootstrap),
]
