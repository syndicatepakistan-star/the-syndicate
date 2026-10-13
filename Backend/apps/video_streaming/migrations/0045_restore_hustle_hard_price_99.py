"""Restore Hustle Hard (level1-psych-03) production price → $99."""

from decimal import Decimal

from django.db import migrations
from django.db.models import Q


def restore_hustle_hard(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-psych-03")
        | Q(slug__iexact="hustle-hard")
        | Q(title__iexact="Hustle Hard")
    ).update(price=Decimal("99.00"))


def reapply_temp_price(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-psych-03")
        | Q(slug__iexact="hustle-hard")
        | Q(title__iexact="Hustle Hard")
    ).update(price=Decimal("0.50"))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0044_hustle_hard_test_price"),
    ]

    operations = [
        migrations.RunPython(restore_hustle_hard, reapply_temp_price),
    ]
