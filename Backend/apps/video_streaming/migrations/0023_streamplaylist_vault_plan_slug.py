from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0022_create_micro_business_protocol"),
    ]

    operations = [
        migrations.AddField(
            model_name="streamplaylist",
            name="vault_plan_slug",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text=(
                    "Optional vault module checkout slug (e.g. agentic_ai_c01, trading_scalpel_protocol). "
                    "Links this playlist to mid-ticket pack modules for unlock + Open from the vault modal."
                ),
                max_length=48,
            ),
        ),
        migrations.AddConstraint(
            model_name="streamplaylist",
            constraint=models.UniqueConstraint(
                condition=~Q(vault_plan_slug=""),
                fields=("vault_plan_slug",),
                name="video_streaming_playlist_unique_vault_plan_slug",
            ),
        ),
    ]
