"""Promo: Build a WhatsApp Agent with n8n (agentic_ai_c02) → $0.50."""

from decimal import Decimal

from django.db import migrations


def apply_promo_price(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    StreamPlaylist.objects.filter(vault_plan_slug="agentic_ai_c02").update(price=Decimal("0.50"))
    video_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="agentic_ai_c02"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=video_ids).update(price=Decimal("0.50"))


def revert_promo_price(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    StreamPlaylist.objects.filter(vault_plan_slug="agentic_ai_c02").update(price=Decimal("14.00"))
    video_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="agentic_ai_c02"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=video_ids).update(price=Decimal("14.00"))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0037_clear_business_warfare_coming_soon"),
    ]

    operations = [
        migrations.RunPython(apply_promo_price, revert_promo_price),
    ]
