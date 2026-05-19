from django.urls import path

from apps.courses import views

urlpatterns = [
    path("certificates/verify/", views.CourseCertificateVerifyView.as_view(), name="courses-certificate-verify"),
    # Next.js strips trailing slashes on proxied `/api/*` — POST must not 308-redirect (body is lost).
    path("certificates/verify", views.CourseCertificateVerifyView.as_view(), name="courses-certificate-verify-noslash"),
    path("certificates/mine/", views.MyCertificatesListView.as_view(), name="courses-certificates-mine"),
    path("certificates/mine", views.MyCertificatesListView.as_view(), name="courses-certificates-mine-noslash"),
    path("<int:pk>/videos/", views.CourseVideosListView.as_view(), name="courses-videos"),
    path("<int:pk>/", views.CourseDetailView.as_view(), name="courses-detail"),
    path("", views.CourseListCreateView.as_view(), name="courses-list"),
]
