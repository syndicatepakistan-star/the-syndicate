import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("membership", "0009_membershipgenerationstate_bootstrap_completed"),
    ]

    operations = [
        migrations.AddField(
            model_name="membershipgenerationstate",
            name="membership_articles_bootstrap_dataset",
            field=models.ForeignKey(
                blank=True,
                help_text="Active keyword dataset used for the last deploy bootstrap (re-runs when you activate a different dataset).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to="membership.articlekeyworddataset",
            ),
        ),
        migrations.AlterField(
            model_name="membershipgenerationstate",
            name="membership_articles_bootstrap_completed_at",
            field=models.DateTimeField(
                blank=True,
                help_text="Set after deploy bootstrap generated articles for membership_articles_bootstrap_dataset.",
                null=True,
            ),
        ),
    ]
