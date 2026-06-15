from decimal import Decimal

from django.db import migrations

MICRO_SLUG = "the-micro-business-protocol"
MICRO_TITLE = "Micro Business Protocols"


def set_micro_business_price(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    row = StreamPlaylist.objects.filter(slug__iexact=MICRO_SLUG).first()
    if row is None:
        row = StreamPlaylist.objects.filter(title__icontains="micro business").first()
    if row is None:
        return
    row.title = MICRO_TITLE
    row.price = Decimal("39.00")
    row.save(update_fields=["title", "price", "updated_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0023_streamplaylist_vault_plan_slug"),
    ]

    operations = [
        migrations.RunPython(set_micro_business_price, migrations.RunPython.noop),
    ]
