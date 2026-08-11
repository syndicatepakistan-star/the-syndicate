"""TEMP test prices for GTM/ads — revert with migration reverse after testing.

- WhatsApp Agent (agentic_ai_c02): restore $14
- ai_content_c02, trading_scalpel_protocol, Business Warfare, level1-model-01: $0.50
Money Mastery (bundle) is frontend/selected_amount only — not in this migration.
"""

from decimal import Decimal

from django.db import migrations
from django.db.models import Q


def apply_temp_prices(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    # Restore WhatsApp Agent if still on promo
    StreamPlaylist.objects.filter(vault_plan_slug="agentic_ai_c02").update(price=Decimal("14.00"))
    whatsapp_video_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="agentic_ai_c02"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=whatsapp_video_ids).update(price=Decimal("14.00"))

    promo_slugs = ("ai_content_c02", "trading_scalpel_protocol")
    StreamPlaylist.objects.filter(vault_plan_slug__in=promo_slugs).update(price=Decimal("0.50"))
    promo_video_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug__in=promo_slugs
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=promo_video_ids).update(price=Decimal("0.50"))

    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-psych-09")
        | Q(slug__iexact="business-warfare")
        | Q(title__iexact="Business Warfare")
    ).update(price=Decimal("0.50"))

    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-model-01")
        | Q(title__iexact="AI content Automation for Businesses")
        | Q(title__iexact="N8N AI Automation")
        | Q(title__iexact="A.I Content Automation for Business")
    ).update(price=Decimal("0.50"))


def revert_temp_prices(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    StreamPlaylist.objects.filter(vault_plan_slug="agentic_ai_c02").update(price=Decimal("14.00"))
    StreamPlaylist.objects.filter(vault_plan_slug="ai_content_c02").update(price=Decimal("14.00"))
    StreamPlaylist.objects.filter(vault_plan_slug="trading_scalpel_protocol").update(
        price=Decimal("99.00")
    )

    ai_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="ai_content_c02"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=ai_ids).update(price=Decimal("14.00"))

    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-psych-09")
        | Q(slug__iexact="business-warfare")
        | Q(title__iexact="Business Warfare")
    ).update(price=Decimal("99.00"))

    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-model-01")
        | Q(title__iexact="AI content Automation for Businesses")
        | Q(title__iexact="N8N AI Automation")
        | Q(title__iexact="A.I Content Automation for Business")
    ).update(price=Decimal("75.00"))


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0038_whatsapp_agent_promo_price"),
    ]

    operations = [
        migrations.RunPython(apply_temp_prices, revert_temp_prices),
    ]
