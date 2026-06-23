from django.test import RequestFactory, SimpleTestCase, override_settings
from django.urls import reverse

from apps.video_streaming.services.hls_playback import rewrite_hls_manifest_text


class HlsManifestRewriteTests(SimpleTestCase):
    def test_rewrite_segment_uris_to_signed_proxy(self):
        rf = RequestFactory()
        request = rf.get("/")
        manifest = (
            "#EXTM3U\n"
            "#EXT-X-VERSION:3\n"
            "#EXT-X-TARGETDURATION:6\n"
            "#EXTINF:6.0,\n"
            "segment_000.ts\n"
            "segment_001.ts\n"
        )
        with override_settings(ALLOWED_HOSTS=["testserver"]):
            out = rewrite_hls_manifest_text(
                manifest,
                manifest_key="test/video/index.m3u8",
                request=request,
                video_id=42,
                token="tok",
                exp=9999999999,
            )
        self.assertIn("segment_000.ts", manifest)
        self.assertNotIn("segment_000.ts\n", out.split("token=")[0])  # rewritten to URL
        self.assertIn("token=tok", out)
        media_path = reverse(
            "streaming-video-playback-hls-media",
            kwargs={"video_id": 42, "media_path": "segment_000.ts"},
        )
        self.assertIn(media_path, out)
