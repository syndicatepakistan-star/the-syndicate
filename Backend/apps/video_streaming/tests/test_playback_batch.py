from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import RequestFactory, TestCase, override_settings
from rest_framework.test import force_authenticate

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamPlaylistPurchase, StreamVideo
from apps.video_streaming.services.playback_delivery import build_playback_token
from apps.video_streaming.services.playback_token_auth import (
    authorize_stream_video_for_playback_token,
    playback_token_granted,
)
from apps.video_streaming.views import StreamVideoStreamBatchView


class PlaybackTokenAuthCacheTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="tokuser", password="pass")
        self.video = StreamVideo.objects.create(
            title="HLS lesson",
            status=StreamVideo.Status.READY,
            show_in_programs=True,
            playback_kind=StreamVideo.PlaybackKind.HLS,
        )
        self.video.original_video.name = "Business Models/Test/index.m3u8"
        self.video.save(update_fields=["original_video"])
        self.playlist = StreamPlaylist.objects.create(
            title="Test playlist",
            slug="test-playlist-token",
            is_published=True,
            price="10.00",
        )
        StreamPlaylistItem.objects.create(playlist=self.playlist, stream_video=self.video, order=0)
        StreamPlaylistPurchase.objects.create(
            user=self.user,
            playlist=self.playlist,
            status=StreamPlaylistPurchase.Status.PAID,
            amount_paid="10.00",
        )

    def test_token_grant_cache_skips_repeat_auth(self):
        exp = 9_999_999_999
        token = build_playback_token(user_id=self.user.id, video_id=self.video.id, exp=exp)
        cache.clear()
        first = authorize_stream_video_for_playback_token(token=token, video_id=self.video.id)
        self.assertIsNotNone(first)
        self.assertTrue(playback_token_granted(video_id=self.video.id, token=token))

        second = authorize_stream_video_for_playback_token(token=token, video_id=self.video.id)
        self.assertIsNotNone(second)
        self.assertEqual(second[0].pk, self.video.pk)


class StreamVideoStreamBatchViewTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="batchuser", password="pass")
        self.staff = User.objects.create_user(username="staff", password="pass", is_staff=True)
        self.video_a = StreamVideo.objects.create(
            title="A",
            status=StreamVideo.Status.READY,
            show_in_programs=True,
            playback_kind=StreamVideo.PlaybackKind.HLS,
        )
        self.video_a.original_video.name = "a/index.m3u8"
        self.video_a.save(update_fields=["original_video"])
        self.video_b = StreamVideo.objects.create(
            title="B",
            status=StreamVideo.Status.READY,
            show_in_programs=True,
            playback_kind=StreamVideo.PlaybackKind.HLS,
        )
        self.video_b.original_video.name = "b/index.m3u8"
        self.video_b.save(update_fields=["original_video"])
        self.playlist = StreamPlaylist.objects.create(
            title="Batch playlist",
            slug="batch-playlist",
            is_published=True,
            price="12.00",
        )
        StreamPlaylistItem.objects.create(playlist=self.playlist, stream_video=self.video_a, order=0)
        StreamPlaylistItem.objects.create(playlist=self.playlist, stream_video=self.video_b, order=1)
        StreamPlaylistPurchase.objects.create(
            user=self.user,
            playlist=self.playlist,
            status=StreamPlaylistPurchase.Status.PAID,
            amount_paid="12.00",
        )

    def test_batch_returns_multiple_playback_urls(self):
        rf = RequestFactory()
        request = rf.post(
            "/api/streaming/videos/stream/batch/",
            data={"video_ids": [self.video_a.id, self.video_b.id, 99999]},
            content_type="application/json",
        )
        force_authenticate(request, user=self.user)
        with override_settings(SECRET_KEY="test-secret"):
            response = StreamVideoStreamBatchView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        playbacks = response.data.get("playbacks") or {}
        self.assertIn(str(self.video_a.id), playbacks)
        self.assertIn(str(self.video_b.id), playbacks)
        self.assertTrue(playbacks[str(self.video_a.id)]["playback_url"])
        self.assertEqual(playbacks[str(self.video_a.id)]["playback_type"], "hls")
