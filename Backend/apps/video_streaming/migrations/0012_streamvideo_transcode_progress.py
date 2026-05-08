from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0011_repair_streamplaylistpurchase_postgres"),
    ]

    operations = [
        migrations.AddField(
            model_name="streamvideo",
            name="transcode_progress",
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text="Estimated FFmpeg progress percentage while status is Processing.",
                validators=[MinValueValidator(0), MaxValueValidator(100)],
            ),
        ),
    ]
