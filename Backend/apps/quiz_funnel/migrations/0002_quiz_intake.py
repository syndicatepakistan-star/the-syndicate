# Generated manually for quiz intake follow-up

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quiz_funnel", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="intake_ref",
            field=models.CharField(blank=True, db_index=True, max_length=64, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.CharField(blank=True, db_index=True, max_length=255, null=True),
        ),
        migrations.CreateModel(
            name="IntakeResponse",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("answers", models.JSONField(default=dict)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="intake",
                        to="quiz_funnel.user",
                    ),
                ),
            ],
            options={
                "db_table": "quiz_intake_responses",
                "ordering": ("-submitted_at",),
            },
        ),
    ]
