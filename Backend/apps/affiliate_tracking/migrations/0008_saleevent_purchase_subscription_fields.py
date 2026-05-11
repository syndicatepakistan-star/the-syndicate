from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("affiliate_tracking", "0007_rename_affiliate_tr_profile_425e0f_idx_affiliate_t_profile_b2965f_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="saleevent",
            name="purchase_amount",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="saleevent",
            name="subscription_name",
            field=models.CharField(blank=True, default="", max_length=280),
        ),
        migrations.AddField(
            model_name="saleevent",
            name="currency",
            field=models.CharField(blank=True, default="", max_length=8),
        ),
    ]
