from django.test import SimpleTestCase

from apps.video_streaming.services.r2_catalog_protection import (
    is_protected_r2_catalog_key,
    r2_keys_safe_to_delete_on_video_row_removal,
)


class R2CatalogProtectionTests(SimpleTestCase):
    def test_course_manifest_keys_are_protected(self):
        key = "Business Models/Ai Automation/Intro/index.m3u8"
        self.assertTrue(is_protected_r2_catalog_key(key))
        self.assertEqual(r2_keys_safe_to_delete_on_video_row_removal(key), [])

    def test_internal_transcode_keys_may_be_deleted(self):
        key = "hls/319/segment_000.ts"
        self.assertFalse(is_protected_r2_catalog_key(key))
        self.assertEqual(r2_keys_safe_to_delete_on_video_row_removal(key), [key])

    def test_legacy_stream_videos_path_not_protected(self):
        key = "stream_videos/originals/lesson.mp4"
        self.assertFalse(is_protected_r2_catalog_key(key))
        self.assertEqual(r2_keys_safe_to_delete_on_video_row_removal(key), [key])
