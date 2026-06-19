from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0006_alter_userdashboardentitlement_access_tier"),
    ]

    operations = [
        migrations.AddField(
            model_name="userdashboardentitlement",
            name="king_subscription_expires_at",
            field=models.DateTimeField(
                blank=True,
                db_index=True,
                help_text="When The Knight monthly membership ends (Syndicate Mode + Membership).",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="userdashboardentitlement",
            name="money_mastery_lifetime",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text="Lifetime Money Mastery — all programs and vault modules.",
            ),
        ),
        migrations.AddField(
            model_name="userdashboardentitlement",
            name="stripe_knight_subscription_id",
            field=models.CharField(blank=True, db_index=True, default="", max_length=255),
        ),
    ]
