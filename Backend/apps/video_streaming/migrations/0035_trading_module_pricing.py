"""Set Trading Advanced Technical Analysis module playlists to $99 each."""

from decimal import Decimal

from django.db import migrations

TRADING_MODULE_SLUGS = (
    "trading_master_secrets",
    "trading_master_setups",
    "trading_master_strategies",
    "trading_scalpel_protocol",
)


def apply_prices(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamPlaylist.objects.filter(vault_plan_slug__in=TRADING_MODULE_SLUGS).update(
        price=Decimal("99.00")
    )


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0034_level1_unit_pricing"),
    ]

    operations = [
        migrations.RunPython(apply_prices, migrations.RunPython.noop),
    ]
