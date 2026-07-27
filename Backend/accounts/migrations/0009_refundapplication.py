# Generated manually for RefundApplication

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0008_guestcheckoutreceipt"),
    ]

    operations = [
        migrations.CreateModel(
            name="RefundApplication",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("member_email", models.EmailField(db_index=True, max_length=254)),
                ("member_name", models.CharField(blank=True, max_length=200)),
                (
                    "request_type",
                    models.CharField(
                        choices=[
                            ("Founder Audit", "Founder Audit"),
                            ("Full Refund", "Full Refund"),
                            ("Replacement Program", "Replacement Program"),
                        ],
                        db_index=True,
                        default="Founder Audit",
                        max_length=80,
                    ),
                ),
                ("program_label", models.CharField(max_length=200)),
                ("purchase_key", models.CharField(blank=True, max_length=120)),
                ("message", models.TextField()),
                ("purchases_summary", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("in_review", "In Review"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("completed", "Completed"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("admin_notes", models.TextField(blank=True)),
                ("email_sent", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="refund_applications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Refund application",
                "verbose_name_plural": "Refund applications",
                "ordering": ["-created_at"],
            },
        ),
    ]
