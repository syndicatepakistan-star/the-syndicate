"""TEMP: Agentic AI full pack → $0.50 for checkout testing.

Restore with reverse: python manage.py migrate video_streaming 0041
"""

from decimal import Decimal

from django.db import migrations


def apply_temp_price(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    StreamPlaylist.objects.filter(vault_plan_slug="agentic_ai").update(price=Decimal("0.50"))
    video_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="agentic_ai"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=video_ids).update(price=Decimal("0.50"))


def restore_production_price(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    StreamPlaylist.objects.filter(vault_plan_slug="agentic_ai").update(price=Decimal("150.00"))
    video_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="agentic_ai"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=video_ids).update(price=Decimal("150.00"))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0041_sync_level1_display_titles"),
    ]

    operations = [
        migrations.RunPython(apply_temp_price, restore_production_price),
    ]
