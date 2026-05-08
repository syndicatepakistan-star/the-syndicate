from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0012_streamvideo_transcode_progress"),
    ]

    operations = [
        migrations.AddField(
            model_name="streamvideo",
            name="transcode_message",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Human-readable pipeline status shown in admin during processing.",
                max_length=255,
            ),
        ),
    ]
