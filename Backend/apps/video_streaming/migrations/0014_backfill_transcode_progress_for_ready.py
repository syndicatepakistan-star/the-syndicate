from django.db import migrations


def _forward(apps, schema_editor):
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamVideo.objects.filter(status="ready", transcode_progress__lt=100).update(
        transcode_progress=100,
        transcode_message="Ready for playback.",
    )


def _backward(apps, schema_editor):
    # Keep backwards migration non-destructive; no rollback needed for derived progress values.
    return


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0013_streamvideo_transcode_message"),
    ]

    operations = [
        migrations.RunPython(_forward, _backward),
    ]

