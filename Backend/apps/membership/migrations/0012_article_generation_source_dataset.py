import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("membership", "0011_remove_deploy_bootstrap_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="article",
            name="generation_source_dataset",
            field=models.ForeignKey(
                blank=True,
                help_text="Keyword dataset used when this article was generated.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="generated_articles",
                to="membership.articlekeyworddataset",
            ),
        ),
    ]
