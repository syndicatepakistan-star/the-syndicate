from unittest.mock import MagicMock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase

from apps.video_streaming.admin import StreamVideoAdmin, StreamVideoAdminForm
from apps.video_streaming.models import StreamVideo


class StreamVideoAdminBucketLinkTests(TestCase):
    def test_form_accepts_plain_object_key(self):
        form = StreamVideoAdminForm(
            data={
                "title": "Test",
                "description": "",
                "price": "0",
                "status": "processing",
                "transcode_progress": "0",
                "show_in_programs": True,
                "show_in_membership": False,
                "player_layout": "auto",
                "bucket_video_url_or_key": "bg.mp4",
            }
        )
        with patch(
            "apps.video_streaming.admin.bucket_object_exists",
            return_value=True,
        ):
            self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["_resolved_bucket_key"], "bg.mp4")

    @patch("apps.video_streaming.admin.bucket_object_exists", return_value=True)
    def test_save_model_links_bucket_key_without_empty_upload(self, _exists):
        admin = StreamVideoAdmin(StreamVideo, None)
        request = RequestFactory().post("/admin/")
        request.user = MagicMock()
        obj = StreamVideo(title="BG video", price=0)
        form = StreamVideoAdminForm(
            data={
                "title": "BG video",
                "description": "",
                "price": "0",
                "status": "processing",
                "transcode_progress": "0",
                "show_in_programs": True,
                "show_in_membership": False,
                "player_layout": "auto",
                "bucket_video_url_or_key": "bg.mp4",
            }
        )
        self.assertTrue(form.is_valid(), form.errors)
        with patch("apps.video_streaming.admin.messages.success"):
            admin.save_model(request, obj, form, change=False)
        obj.refresh_from_db()
        self.assertEqual(obj.original_video.name, "bg.mp4")
        self.assertEqual(obj.status, StreamVideo.Status.READY)
        self.assertEqual(obj.playback_kind, StreamVideo.PlaybackKind.MP4)

    @patch("apps.video_streaming.admin.validate_hls_manifest_in_bucket", return_value=(True, ""))
    def test_form_accepts_hls_manifest_key(self, _validate):
        form = StreamVideoAdminForm(
            data={
                "title": "HLS",
                "description": "",
                "price": "0",
                "status": "processing",
                "transcode_progress": "0",
                "show_in_programs": True,
                "show_in_membership": False,
                "player_layout": "auto",
                "bucket_video_url_or_key": "test/my-video/index.m3u8",
            }
        )
        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["_resolved_bucket_key"], "test/my-video/index.m3u8")
        self.assertEqual(form.cleaned_data["_playback_kind"], "hls")

    @patch("apps.video_streaming.admin.validate_hls_manifest_in_bucket", return_value=(True, ""))
    @patch("apps.video_streaming.admin.messages.success")
    def test_save_model_links_hls_manifest(self, _msg, _validate):
        admin = StreamVideoAdmin(StreamVideo, None)
        request = RequestFactory().post("/admin/")
        request.user = MagicMock()
        obj = StreamVideo(title="HLS video", price=0)
        form = StreamVideoAdminForm(
            data={
                "title": "HLS video",
                "description": "",
                "price": "0",
                "status": "processing",
                "transcode_progress": "0",
                "show_in_programs": True,
                "show_in_membership": False,
                "player_layout": "auto",
                "bucket_video_url_or_key": "test/my-video/index.m3u8",
            }
        )
        self.assertTrue(form.is_valid(), form.errors)
        admin.save_model(request, obj, form, change=False)
        obj.refresh_from_db()
        self.assertEqual(obj.original_video.name, "test/my-video/index.m3u8")
        self.assertEqual(obj.playback_kind, StreamVideo.PlaybackKind.HLS)
        self.assertEqual(obj.hls_path, "test/my-video/index.m3u8")
