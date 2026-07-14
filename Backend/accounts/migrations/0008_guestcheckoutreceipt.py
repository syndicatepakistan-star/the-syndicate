# Generated manually for GuestCheckoutReceipt

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_guestcheckoutclaim"),
    ]

    operations = [
        migrations.CreateModel(
            name="GuestCheckoutReceipt",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stripe_checkout_session_id", models.CharField(db_index=True, max_length=255, unique=True)),
                ("items_json", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
