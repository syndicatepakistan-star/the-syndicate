import json
from pathlib import Path

from django.db import migrations

DESCRIPTIONS_FILE = (
    Path(__file__).resolve().parent.parent / "data" / "business_model_program_descriptions.json"
)

TITLE_ALIASES: dict[str, tuple[str, ...]] = {
    "n8n-ai-automation": ("N8N AI Automation", "How To Build A.I Agents"),
    "ai-automations": ("AI Automations",),
    "building-games-using-unreal-engine": ("Building Games Using Unreal Engine",),
    "framer-crash-course": ("Framer Crash Course",),
}


def update_business_model_descriptions(apps, schema_editor):
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
        ("video_streaming", "0029_business_psychology_program_descriptions"),
    ]

    operations = [
        migrations.RunPython(update_business_model_descriptions, migrations.RunPython.noop),
    ]
