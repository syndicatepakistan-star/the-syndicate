from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("affiliate_tracking", "0003_alter_saleevent_unique_together_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="WithdrawalRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("bank_name", models.CharField(max_length=160)),
                ("account_name", models.CharField(max_length=160)),
                ("account_number", models.CharField(max_length=80)),
                ("iban", models.CharField(max_length=80)),
                ("phone_number", models.CharField(max_length=40)),
                ("branch_name", models.CharField(blank=True, default="", max_length=160)),
                ("earnings_snapshot", models.DecimalField(decimal_places=2, max_digits=12)),
                ("status", models.CharField(default="pending", max_length=24)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="withdrawal_requests",
                        to="affiliate_tracking.affiliateprofile",
                    ),
                ),
                (
                    "section_referral",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="withdrawal_requests",
                        to="affiliate_tracking.sectionreferral",
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="withdrawalrequest",
            index=models.Index(fields=["profile", "created_at"], name="affiliate_tr_profile_425e0f_idx"),
        ),
        migrations.AddIndex(
            model_name="withdrawalrequest",
            index=models.Index(fields=["section_referral", "created_at"], name="affiliate_tr_section_d2ae49_idx"),
        ),
    ]
