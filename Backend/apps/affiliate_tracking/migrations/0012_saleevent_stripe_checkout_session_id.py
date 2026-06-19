from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ("affiliate_tracking", "0011_alter_sectionreferral_section"),
    ]

    operations = [
        migrations.AddField(
            model_name="saleevent",
            name="stripe_checkout_session_id",
            field=models.CharField(blank=True, db_index=True, default="", max_length=255),
        ),
        migrations.AddConstraint(
            model_name="saleevent",
            constraint=models.UniqueConstraint(
                condition=~Q(stripe_checkout_session_id=""),
                fields=("referral", "stripe_checkout_session_id"),
                name="affiliate_sale_unique_stripe_checkout_session",
            ),
        ),
    ]
