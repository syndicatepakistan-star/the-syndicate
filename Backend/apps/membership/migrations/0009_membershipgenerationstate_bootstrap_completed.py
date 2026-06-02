from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("membership", "0008_membershipstreamvideo"),
    ]

    operations = [
        migrations.AddField(
            model_name="membershipgenerationstate",
            name="membership_articles_bootstrap_completed_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Set after the one-time deploy bootstrap (generate_membership_articles on Railway). Prevents re-running on later deploys.",
                null=True,
            ),
        ),
    ]
