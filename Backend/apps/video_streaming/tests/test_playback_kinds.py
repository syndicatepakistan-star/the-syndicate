from django.test import SimpleTestCase

from apps.video_streaming.services.playback_kinds import (
    detect_playback_kind,
    iter_hls_manifest_references,
    resolve_hls_relative_key,
    validate_hls_media_path,
)


class PlaybackKindDetectionTests(SimpleTestCase):
    def test_detect_mp4(self):
        self.assertEqual(detect_playback_kind("test/lesson.mp4"), "mp4")

    def test_detect_hls(self):
        self.assertEqual(detect_playback_kind("test/folder/index.m3u8"), "hls")

    def test_resolve_segment_same_folder(self):
        manifest = "test/Claude Cowork Automations-3/index.m3u8"
        self.assertEqual(
            resolve_hls_relative_key(manifest, "segment_000.ts"),
            "test/Claude Cowork Automations-3/segment_000.ts",
        )

    def test_reject_traversal_in_media_path(self):
        with self.assertRaises(ValueError):
            validate_hls_media_path("../secret.ts")

    def test_iter_manifest_segments(self):
        body = "#EXTM3U\n#EXTINF:6.0,\nsegment_000.ts\nsegment_001.ts\n"
        self.assertEqual(iter_hls_manifest_references(body), ["segment_000.ts", "segment_001.ts"])
