"""Restore Agentic AI full pack price back to $150 after checkout testing."""

from decimal import Decimal

from django.db import migrations


def apply_price_150(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    StreamPlaylist.objects.filter(vault_plan_slug="agentic_ai").update(price=Decimal("150.00"))
    video_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="agentic_ai"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=video_ids).update(price=Decimal("150.00"))


def revert_price_050(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    StreamPlaylist.objects.filter(vault_plan_slug="agentic_ai").update(price=Decimal("0.50"))
    video_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="agentic_ai"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=video_ids).update(price=Decimal("0.50"))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0042_agentic_ai_pack_test_price"),
    ]

    operations = [
        migrations.RunPython(apply_price_150, revert_price_050),
    ]

