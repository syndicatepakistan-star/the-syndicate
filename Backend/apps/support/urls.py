from django.urls import path

from . import views

urlpatterns = [
    path("threads/", views.support_threads, name="support-threads"),
    path("threads/<uuid:thread_id>/", views.support_thread_detail, name="support-thread-detail"),
]
