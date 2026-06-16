from django.db import migrations

WARFARE_TITLE = "Business Warfare"
WARFARE_SLUG = "business-warfare"
PSYCH_CATEGORY = "business_psychology"


def create_business_warfare_playlist(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    exists = StreamPlaylist.objects.filter(
        slug__iexact=WARFARE_SLUG
    ).exists() or StreamPlaylist.objects.filter(
        title__iexact=WARFARE_TITLE
    ).exists()
    if exists:
        return
    StreamPlaylist.objects.create(
        title=WARFARE_TITLE,
        slug=WARFARE_SLUG,
        category=PSYCH_CATEGORY,
        description=(
            "Business Warfare — control your emotions, make decisive moves, and stay steady "
            "when markets and competition turn hostile."
        ),
        price="49.00",
        rating="4.0",
        cover_image="",
        is_published=True,
        is_coming_soon=True,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0024_micro_business_protocol_price"),
    ]

    operations = [
        migrations.RunPython(create_business_warfare_playlist, migrations.RunPython.noop),
    ]
