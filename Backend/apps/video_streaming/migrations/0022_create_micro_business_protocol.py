from django.db import migrations


MICRO_TITLE = "The Micro Business Protocol"
MICRO_SLUG = "the-micro-business-protocol"
PSYCH_CATEGORY = "business_psychology"


def create_micro_business_protocol(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    exists = StreamPlaylist.objects.filter(
        slug__iexact=MICRO_SLUG
    ).exists() or StreamPlaylist.objects.filter(
        title__iexact=MICRO_TITLE
    ).exists()
    if exists:
        return
    StreamPlaylist.objects.create(
        title=MICRO_TITLE,
        slug=MICRO_SLUG,
        category=PSYCH_CATEGORY,
        description=(
            "The Micro Business Protocol — strategic psychology and execution framework "
            "for building lean, high-leverage micro businesses without corporate overhead."
        ),
        price="40.00",
        rating="4.0",
        cover_image="",
        is_published=True,
        is_coming_soon=False,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0021_free_ticket_playlist_titles"),
    ]

    operations = [
        migrations.RunPython(create_micro_business_protocol, migrations.RunPython.noop),
    ]
