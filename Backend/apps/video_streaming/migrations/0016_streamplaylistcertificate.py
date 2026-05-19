from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0015_streamvideo_signed_mp4_help_text"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StreamPlaylistCertificate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token_id", models.CharField(db_index=True, max_length=32, unique=True)),
                ("holder_name", models.CharField(max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[("certified", "Certified"), ("revoked", "Revoked")],
                        db_index=True,
                        default="certified",
                        max_length=16,
                    ),
                ),
                ("issued_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "playlist",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="certificates",
                        to="video_streaming.streamplaylist",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stream_playlist_certificates",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-issued_at", "-id"],
            },
        ),
        migrations.AddConstraint(
            model_name="streamplaylistcertificate",
            constraint=models.UniqueConstraint(
                fields=("user", "playlist"),
                name="video_streaming_certificate_user_playlist",
            ),
        ),
    ]
