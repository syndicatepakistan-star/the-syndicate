"""Set Level 1 prices: Business Models $75 each, Business Behaviour Psychology $99 each."""

from decimal import Decimal

from django.db import migrations


def apply_prices(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamPlaylist.objects.filter(category="business_model").update(price=Decimal("75.00"))
    StreamPlaylist.objects.filter(category="business_psychology").update(price=Decimal("99.00"))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0033_repair_streamplaylistattachment_table"),
    ]

    operations = [
        migrations.RunPython(apply_prices, migrations.RunPython.noop),
    ]
