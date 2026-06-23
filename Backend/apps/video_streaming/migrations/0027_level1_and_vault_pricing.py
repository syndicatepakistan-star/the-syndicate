"""Set Level 1 playlist prices ($150 across 11 per category) — vault packs use frontend checkout amounts."""

from decimal import Decimal

from django.db import migrations

# Business Behaviour Psychology (11 programs → $150 total: seven @ $14, four @ $13).
PSYCHOLOGY_PRICES: dict[int, str] = {
    3: "14.00",
    6: "14.00",
    31: "14.00",
    30: "14.00",
    99: "14.00",
    1: "14.00",
    12: "14.00",
    2: "13.00",
    9: "13.00",
    7: "13.00",
    8: "13.00",
}

# Business Model (11 programs → $150 total: seven @ $14, four @ $13).
BUSINESS_MODEL_PRICES: dict[int, str] = {
    21: "14.00",
    28: "14.00",
    25: "14.00",
    20: "14.00",
    14: "14.00",
    23: "14.00",
    19: "14.00",
    24: "14.00",
    13: "14.00",
    26: "13.00",
    27: "13.00",
}


def apply_prices(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    for playlist_id, price in {**PSYCHOLOGY_PRICES, **BUSINESS_MODEL_PRICES}.items():
        StreamPlaylist.objects.filter(pk=playlist_id).update(price=Decimal(price))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0026_streamvideo_playback_kind"),
    ]

    operations = [
        migrations.RunPython(apply_prices, migrations.RunPython.noop),
    ]
