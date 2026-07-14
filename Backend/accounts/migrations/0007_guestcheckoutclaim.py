# Generated manually for GuestCheckoutClaim

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0006_alter_pendingsignup_is_paid"),
    ]

    operations = [
        migrations.CreateModel(
            name="GuestCheckoutClaim",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stripe_checkout_session_id", models.CharField(db_index=True, max_length=255, unique=True)),
                ("email", models.EmailField(db_index=True, max_length=254)),
                ("selected_plan", models.CharField(blank=True, max_length=120)),
                ("playlist_id", models.CharField(blank=True, max_length=32)),
                ("claimed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="guest_checkout_claims",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
