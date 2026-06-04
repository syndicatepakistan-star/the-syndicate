import apps.video_streaming.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0018_cloudinary_image_storage"),
    ]

    operations = [
        migrations.AlterField(
            model_name="streamvideo",
            name="original_video",
            field=models.FileField(
                blank=True,
                help_text="Original MP4 (or other supported format). Stored privately; served only via signed playback URLs.",
                max_length=2048,
                upload_to=apps.video_streaming.models.stream_video_original_upload_to,
            ),
        ),
    ]
