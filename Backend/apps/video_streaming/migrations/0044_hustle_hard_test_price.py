"""TEMP: Hustle Hard (level1-psych-03) → $0.50 for checkout testing.

Restore with reverse: python manage.py migrate video_streaming 0043
"""

from decimal import Decimal

from django.db import migrations
from django.db.models import Q


def apply_temp_price(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-psych-03")
        | Q(slug__iexact="hustle-hard")
        | Q(title__iexact="Hustle Hard")
    ).update(price=Decimal("0.50"))


def restore_production_price(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-psych-03")
        | Q(slug__iexact="hustle-hard")
        | Q(title__iexact="Hustle Hard")
    ).update(price=Decimal("99.00"))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0043_restore_agentic_ai_pack_price_150"),
    ]

    operations = [
        migrations.RunPython(apply_temp_price, restore_production_price),
    ]
