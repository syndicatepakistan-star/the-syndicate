from django.test import SimpleTestCase

from apps.video_streaming.services.bucket_reference import normalize_bucket_object_key


class NormalizeBucketObjectKeyTests(SimpleTestCase):
    def test_plain_key(self):
        self.assertEqual(
            normalize_bucket_object_key("stream_videos/originals/a.mp4"),
            "stream_videos/originals/a.mp4",
        )

    def test_leading_slash(self):
        self.assertEqual(
            normalize_bucket_object_key("/stream_videos/originals/a.mp4"),
            "stream_videos/originals/a.mp4",
        )

    def test_r2_https_url_strips_bucket(self):
        url = "https://abc123.r2.cloudflarestorage.com/syndicate-videos/stream_videos/originals/a.mp4"
        self.assertEqual(
            normalize_bucket_object_key(url, bucket_name="syndicate-videos"),
            "stream_videos/originals/a.mp4",
        )

    def test_s3_uri(self):
        self.assertEqual(
            normalize_bucket_object_key("s3://syndicate-videos/stream_videos/a.mp4", bucket_name="syndicate-videos"),
            "stream_videos/a.mp4",
        )
