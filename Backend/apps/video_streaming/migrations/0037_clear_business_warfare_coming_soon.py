from django.db import migrations
from django.db.models import Q


def clear_business_warfare_coming_soon(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamPlaylist.objects.filter(
        Q(title__iexact="Business Warfare")
        | Q(slug__iexact="business-warfare")
        | Q(slug__iexact="level1-psych-09")
    ).filter(is_coming_soon=True).update(is_coming_soon=False)


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0036_vault_module_unit_pricing"),
    ]

    operations = [
        migrations.RunPython(clear_business_warfare_coming_soon, migrations.RunPython.noop),
    ]
