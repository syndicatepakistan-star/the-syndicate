from django.test import SimpleTestCase

from apps.video_streaming.models import StreamVideo
from apps.video_streaming.services.bucket_reference import bucket_key_resolution_candidates
from apps.video_streaming.services.playback_delivery import video_playback_kind


class VideoPlaybackKindOverrideTests(SimpleTestCase):
    def test_m3u8_key_overrides_stored_mp4_kind(self):
        video = StreamVideo(playback_kind=StreamVideo.PlaybackKind.MP4)
        video.original_video.name = "Business Models/Unreal Engine/index.m3u8"
        self.assertEqual(video_playback_kind(video), "hls")

    def test_bucket_key_candidates_add_business_models_prefix(self):
        candidates = bucket_key_resolution_candidates("Unreal Engine/index.m3u8")
        self.assertIn("Unreal Engine/index.m3u8", candidates)
        self.assertIn("Business Models/Unreal Engine/index.m3u8", candidates)
