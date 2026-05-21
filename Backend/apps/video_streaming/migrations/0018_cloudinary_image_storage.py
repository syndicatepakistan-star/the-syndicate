import apps.video_streaming.models
import syndicate_backend.media_storages
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0017_merge_20260521"),
    ]

    operations = [
        migrations.AlterField(
            model_name="streamvideo",
            name="thumbnail",
            field=models.ImageField(
                blank=True,
                null=True,
                storage=syndicate_backend.media_storages.get_image_storage,
                upload_to=apps.video_streaming.models.stream_video_thumbnail_upload_to,
            ),
        ),
        migrations.AlterField(
            model_name="streamplaylist",
            name="cover_image",
            field=models.ImageField(
                blank=True,
                help_text="Optional. Shown on the Programs grid; falls back to the first video thumbnail.",
                null=True,
                storage=syndicate_backend.media_storages.get_image_storage,
                upload_to=apps.video_streaming.models.stream_playlist_cover_upload_to,
            ),
        ),
    ]
