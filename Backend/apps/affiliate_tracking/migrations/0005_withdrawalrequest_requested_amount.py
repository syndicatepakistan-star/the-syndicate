from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("affiliate_tracking", "0004_withdrawalrequest"),
    ]

    operations = [
        migrations.AddField(
            model_name="withdrawalrequest",
            name="requested_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
            preserve_default=False,
        ),
    ]
