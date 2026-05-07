from django.urls import path

from apps.video_streaming import views

# Mounted at /api/streaming/ (see api/urls.py). Course lesson progress stays at /api/videos/<id>/progress/.
urlpatterns = [
    path("uploads/start/", views.StreamVideoMultipartUploadStartView.as_view(), name="streaming-uploads-start"),
    path("uploads/sign-part/", views.StreamVideoMultipartUploadSignPartView.as_view(), name="streaming-uploads-sign-part"),
    path("uploads/complete/", views.StreamVideoMultipartUploadCompleteView.as_view(), name="streaming-uploads-complete"),
    path("uploads/abort/", views.StreamVideoMultipartUploadAbortView.as_view(), name="streaming-uploads-abort"),
    path("playlists/purchases/", views.StreamPlaylistPurchaseHistoryView.as_view(), name="streaming-playlists-purchases"),
    path("playlists/<int:playlist_id>/checkout/", views.StreamPlaylistCheckoutSessionView.as_view(), name="streaming-playlists-checkout"),
    path("playlists/checkout/success/", views.StreamPlaylistCheckoutSuccessView.as_view(), name="streaming-playlists-checkout-success"),
    path("public-playlists/", views.public_stream_playlists_view, name="streaming-playlists-public"),
    path("playlists/<int:pk>/", views.StreamPlaylistDetailView.as_view(), name="streaming-playlists-detail"),
    path("playlists/", views.StreamPlaylistListView.as_view(), name="streaming-playlists-list"),
    path(
        "videos/hls/<int:video_id>/<path:rel_path>",
        views.StreamHlsMediaView.as_view(),
        name="streaming-hls-media",
    ),
    path("videos/stream/<int:pk>/", views.StreamVideoStreamView.as_view(), name="streaming-videos-stream"),
    path("videos/<int:pk>/", views.StreamVideoDetailView.as_view(), name="streaming-videos-detail"),
    path("videos/", views.StreamVideoListView.as_view(), name="streaming-videos-list"),
]
