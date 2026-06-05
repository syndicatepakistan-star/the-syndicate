from django.db import migrations


MICRO_TITLE = "The Micro Business Protocol"
MICRO_SLUG = "the-micro-business-protocol"
RISK_TITLE = "Mastering Risk and Uncertainty"
RISK_SLUG = "mastering-risk-and-uncertainty"
PSYCH_CATEGORY = "business_psychology"


def _find_by_slug_or_title(StreamPlaylist, slug: str, title: str):
    row = StreamPlaylist.objects.filter(slug__iexact=slug).first()
    if row is not None:
        return row
    return StreamPlaylist.objects.filter(title__iexact=title).first()


def _normalize_row(row, *, title: str, slug: str) -> None:
    row.title = title
    row.category = PSYCH_CATEGORY
    slug_taken = (
        row.__class__.objects.filter(slug=slug).exclude(pk=row.pk).exists()
    )
    if slug_taken:
        row.save(update_fields=["title", "category", "updated_at"])
        return
    row.slug = slug
    row.save(update_fields=["title", "slug", "category", "updated_at"])


def align_free_ticket_playlist_titles(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")

    micro = _find_by_slug_or_title(StreamPlaylist, MICRO_SLUG, MICRO_TITLE)
    if micro is not None:
        _normalize_row(micro, title=MICRO_TITLE, slug=MICRO_SLUG)

    risk = _find_by_slug_or_title(StreamPlaylist, RISK_SLUG, RISK_TITLE)
    if risk is not None:
        _normalize_row(risk, title=RISK_TITLE, slug=RISK_SLUG)
    else:
        StreamPlaylist.objects.create(
            title=RISK_TITLE,
            slug=RISK_SLUG,
            category=PSYCH_CATEGORY,
            description=(
                "Mastering Risk and Uncertainty — turn fear and operational friction into "
                "data-driven decisions that protect your war chest and compound leverage."
            ),
            price="40.00",
            rating="4.0",
            cover_image="",
            is_published=True,
            is_coming_soon=False,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0020_repair_streamvideo_original_video_length"),
    ]

    operations = [
        migrations.RunPython(align_free_ticket_playlist_titles, migrations.RunPython.noop),
    ]
