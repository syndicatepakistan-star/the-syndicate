import json
from pathlib import Path

from django.db import migrations

DESCRIPTIONS_FILE = (
    Path(__file__).resolve().parent.parent / "data" / "business_psychology_program_descriptions.json"
)

TITLE_ALIASES: dict[str, tuple[str, ...]] = {
    "mastering-risk-and-uncertainty": ("Mastering Risk and Uncertainty",),
    "the-secret-to-transformation": ("The Secret To Transformation",),
    "the-micro-business-protocol": (
        "The Micro Business Protocol",
        "Micro Business Protocols",
    ),
    "mastering-consistency": ("Mastering Consistency",),
    "the-compound-effect": ("The Compound Effect",),
    "the-9-to-5-exit-strategy": ("The 9 to 5 Exit Strategy",),
    "hustle-hard": ("Hustle Hard",),
    "zero-to-one-million": ("Zero to One Million",),
}


def update_business_psychology_descriptions(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    if not DESCRIPTIONS_FILE.is_file():
        return
    descriptions = json.loads(DESCRIPTIONS_FILE.read_text(encoding="utf-8"))
    for _slug, titles in TITLE_ALIASES.items():
        body = descriptions.get(_slug, "").strip()
        if not body:
            continue
        for title in titles:
            StreamPlaylist.objects.filter(title__iexact=title).update(description=body)


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0028_alter_streamplaylist_category"),
    ]

    operations = [
        migrations.RunPython(update_business_psychology_descriptions, migrations.RunPython.noop),
    ]
