"""Restore production prices after TEMP $0.50 GTM/ads testing.

- Money Mastery bundle: frontend $333 (CHECKOUT_AMOUNT_PENCE / selected_amount)
- New YouTube Policy (ai_content_c02): $14
- Scalpel Protocol (trading_scalpel_protocol): $99
- AI content Automation for Businesses (level1-model-01): $75
- Business Warfare (level1-psych-09 / business-warfare): $99
"""

from decimal import Decimal

from django.db import migrations
from django.db.models import Q


def restore_production_prices(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

    StreamPlaylist.objects.filter(vault_plan_slug="ai_content_c02").update(price=Decimal("14.00"))
    StreamPlaylist.objects.filter(vault_plan_slug="trading_scalpel_protocol").update(
        price=Decimal("99.00")
    )

    ai_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="ai_content_c02"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=ai_ids).update(price=Decimal("14.00"))

    trading_ids = StreamPlaylistItem.objects.filter(
        playlist__vault_plan_slug="trading_scalpel_protocol"
    ).values_list("stream_video_id", flat=True)
    StreamVideo.objects.filter(id__in=trading_ids).update(price=Decimal("99.00"))

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
        | Q(title__iexact="Business and Content A.I Automation")
    ).update(price=Decimal("75.00"))


def reapply_temp_prices(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    StreamVideo = apps.get_model("video_streaming", "StreamVideo")
    StreamPlaylistItem = apps.get_model("video_streaming", "StreamPlaylistItem")

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


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0039_temp_test_pricing"),
    ]

    operations = [
        migrations.RunPython(restore_production_prices, reapply_temp_prices),
    ]
