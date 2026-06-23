import apps.video_streaming.models
from django.db import migrations, models

from apps.video_streaming.services.playback_kinds import detect_playback_kind


def backfill_playback_kind(apps, schema_editor):
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    for video in StreamVideo.objects.all().only("id", "original_video", "playback_kind"):
        key = (getattr(video.original_video, "name", None) or "").strip()
        kind = detect_playback_kind(key)
        if video.playback_kind != kind:
            StreamVideo.objects.filter(pk=video.pk).update(playback_kind=kind)


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0025_create_business_warfare_playlist"),
    ]

    operations = [
        migrations.AddField(
            model_name="streamvideo",
            name="playback_kind",
            field=models.CharField(
                choices=[("mp4", "MP4 file"), ("hls", "HLS package (m3u8 + segments)")],
                db_index=True,
                default="mp4",
                help_text="Auto-set from the linked bucket key (.mp4 vs .m3u8).",
                max_length=8,
            ),
        ),
        migrations.AlterField(
            model_name="streamvideo",
            name="hls_path",
            field=models.URLField(
                blank=True,
                default="",
                help_text="Legacy field. For HLS rows, stores the manifest object key mirror (optional).",
                max_length=2048,
            ),
        ),
        migrations.AlterField(
            model_name="streamvideo",
            name="original_video",
            field=models.FileField(
                blank=True,
                help_text=(
                    "Private bucket object key: MP4 file (e.g. test/lesson.mp4) or HLS manifest "
                    "(e.g. test/my-video/index.m3u8). Served only via signed playback URLs."
                ),
                max_length=2048,
                upload_to=apps.video_streaming.models.stream_video_original_upload_to,
            ),
        ),
        migrations.RunPython(backfill_playback_kind, migrations.RunPython.noop),
    ]
