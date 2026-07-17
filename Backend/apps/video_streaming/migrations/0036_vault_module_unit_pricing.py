"""Set Agentic AI + AI Content Automation vault module playlists to $14 each."""

from decimal import Decimal

from django.db import migrations
from django.db.models import Q


def apply_prices(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamPlaylist.objects.filter(
        Q(vault_plan_slug__startswith="agentic_ai_c")
        | Q(vault_plan_slug__startswith="ai_content_c")
    ).update(price=Decimal("14.00"))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0035_trading_module_pricing"),
    ]

    operations = [
        migrations.RunPython(apply_prices, migrations.RunPython.noop),
    ]
