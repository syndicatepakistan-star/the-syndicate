"""Sync Level-1 Business Model (+ Micro Business) display titles to the renamed catalog.

R2 folders stay unchanged (outer folder names in level1_program_catalog). Admin / API /
quiz matching use StreamPlaylist.title — keep those aligned with frontend overrides.
"""

from django.db import migrations


TITLE_BY_SLUG = {
    "level1-model-01": "AI content Automation for Businesses",
    "level1-model-02": "Social Media Content Automation",
    "level1-model-03": "App Building for Business (Vibe Coding)",
    "level1-model-04": "The Custom App Blueprint for Business",
    "level1-model-05": "eBook Business Blueprint (Monetize Your Knowledge)",
    "level1-model-06": "The Gaming Business Blueprint (Build, Launch, and Sell)",
    "level1-model-07": "Rapid Web Building For Business (Vibe Coding)",
    "level1-model-08": "Graphics Design for Business (Graphics That Convert to Sales)",
    "level1-model-09": "The Zero-Inventory Clothing Business Blueprint",
    "level1-model-10": "Basics Python for Small Business",
    "level1-model-11": "The Profitable Blogging Blueprint",
    "level1-psych-07": "Micro Business Protocols",
}


def apply_titles(apps, schema_editor):
    StreamPlaylist = apps.get_model("video_streaming", "StreamPlaylist")
    for slug, title in TITLE_BY_SLUG.items():
        StreamPlaylist.objects.filter(slug__iexact=slug).update(title=title)


def noop_reverse(apps, schema_editor):
    # Display-title sync only — do not invent prior titles on reverse.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0040_restore_production_prices"),
    ]

    operations = [
        migrations.RunPython(apply_titles, noop_reverse),
    ]
