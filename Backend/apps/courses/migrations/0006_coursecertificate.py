from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("courses", "0005_course_show_in_programs"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CourseCertificate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token_id", models.CharField(db_index=True, max_length=32, unique=True)),
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
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="certificates",
                        to="courses.course",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="course_certificates",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(fields=("user", "course"), name="courses_certificate_user_course"),
                ],
            },
        ),
    ]
