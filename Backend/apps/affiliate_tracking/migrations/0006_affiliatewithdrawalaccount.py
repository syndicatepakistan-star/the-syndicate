from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("affiliate_tracking", "0005_withdrawalrequest_requested_amount"),
    ]

    operations = [
        migrations.CreateModel(
            name="AffiliateWithdrawalAccount",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("bank_name", models.CharField(max_length=160)),
                ("account_name", models.CharField(max_length=160)),
                ("account_number", models.CharField(max_length=80)),
                ("iban", models.CharField(max_length=80)),
                ("phone_number", models.CharField(max_length=40)),
                ("branch_name", models.CharField(blank=True, default="", max_length=160)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "profile",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="withdrawal_account",
                        to="affiliate_tracking.affiliateprofile",
                    ),
                ),
            ],
        ),
    ]
