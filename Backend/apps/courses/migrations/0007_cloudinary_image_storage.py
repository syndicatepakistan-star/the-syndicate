import apps.courses.models
import syndicate_backend.media_storages
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0006_coursecertificate"),
    ]

    operations = [
        migrations.AlterField(
            model_name="course",
            name="cover_image",
            field=models.ImageField(
                blank=True,
                help_text="Programs grid cover. Use a high-resolution file (e.g. JPEG/PNG at least ~1200px on the short edge, or 1600px+ wide) so it stays sharp on retina screens; small images are stretched and look soft.",
                null=True,
                storage=syndicate_backend.media_storages.get_image_storage,
                upload_to=apps.courses.models.course_cover_upload_to,
            ),
        ),
        migrations.AlterField(
            model_name="video",
            name="thumbnail",
            field=models.ImageField(
                blank=True,
                help_text="Optional. Shown in the lesson list.",
                null=True,
                storage=syndicate_backend.media_storages.get_image_storage,
                upload_to=apps.courses.models.video_thumbnail_upload_to,
            ),
        ),
    ]
