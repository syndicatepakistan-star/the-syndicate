from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("affiliate_tracking", "0009_leadevent_lead_kind_and_label"),
    ]

    operations = [
        migrations.AddField(
            model_name="withdrawalrequest",
            name="transferred_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Set automatically when status changes to complete (admin wire sent).",
                null=True,
            ),
        ),
    ]
