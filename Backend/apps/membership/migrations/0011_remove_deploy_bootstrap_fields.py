from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("membership", "0010_membershipgenerationstate_bootstrap_dataset"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="membershipgenerationstate",
            name="membership_articles_bootstrap_completed_at",
        ),
        migrations.RemoveField(
            model_name="membershipgenerationstate",
            name="membership_articles_bootstrap_dataset",
        ),
    ]
