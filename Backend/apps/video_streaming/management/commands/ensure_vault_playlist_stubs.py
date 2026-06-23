"""
Create unpublished StreamPlaylist rows for every vault module slug (if missing).

Prefer ``seed_vault_playlists`` for full mid-ticket structure (videos + nested playlists).

Usage (from Backend/):
  python manage.py ensure_vault_playlist_stubs
  python manage.py ensure_vault_playlist_stubs --publish
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from accounts.vault_plan_catalog import VAULT_COURSE_TITLES
from apps.video_streaming.models import StreamPlaylist


def _default_price_for_slug(slug: str) -> Decimal:
    if slug.startswith("agentic_ai"):
        return Decimal("19.00")
    if slug.startswith("ai_content"):
        return Decimal("15.00")
    if slug.startswith("trading_"):
        return Decimal("35.00")
    return Decimal("19.00")


class Command(BaseCommand):
    help = "Ensure one StreamPlaylist stub exists per vault module slug (vault_plan_slug)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Mark created stubs as published (default: unpublished until videos are added).",
        )

    def handle(self, *args, **options):
        publish = bool(options["publish"])
        created = 0
        updated = 0
        skipped = 0

        for module_slug, title in sorted(VAULT_COURSE_TITLES.items()):
            slug = module_slug.strip().lower()
            existing = StreamPlaylist.objects.filter(vault_plan_slug=slug).first()
            if existing:
                if publish and not existing.is_published:
                    existing.is_published = True
                    existing.is_coming_soon = not existing.items.exists()
                    existing.save(update_fields=["is_published", "is_coming_soon", "updated_at"])
                    updated += 1
                skipped += 1
                continue

            base_slug = slugify(title)[:200] or slug
            playlist_slug = base_slug
            n = 2
            while StreamPlaylist.objects.filter(slug=playlist_slug).exists():
                playlist_slug = f"{base_slug}-{n}"
                n += 1

            StreamPlaylist.objects.create(
                title=title,
                slug=playlist_slug,
                vault_plan_slug=slug,
                category=StreamPlaylist.Category.BUSINESS_MODEL,
                price=_default_price_for_slug(slug),
                rating=Decimal("4.5"),
                description="",
                is_published=publish,
                is_coming_soon=not publish,
            )
            created += 1
            self.stdout.write(f"Created stub: {slug} -> {title}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. created={created} updated={updated} skipped_existing={skipped} publish={publish}"
            )
        )
