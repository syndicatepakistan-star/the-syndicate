"""
Seed Trading Advanced Technical Analysis vault playlists (modules + nested submodule lessons).

Creates StreamVideo stubs, submodule playlists (1 lesson each), and module container playlists.

Usage (from Backend/):
  python manage.py seed_trading_vault_playlists
  python manage.py seed_trading_vault_playlists --publish
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from accounts.trading_vault_catalog import (
    TRADING_MODULE_TITLES,
    TRADING_SUBMODULES,
    TRADING_SUBMODULE_PARENT,
)
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamVideo


def _unique_playlist_slug(base: str) -> str:
    slug = slugify(base)[:180] or "playlist"
    candidate = slug
    n = 2
    while StreamPlaylist.objects.filter(slug=candidate).exists():
        candidate = f"{slug}-{n}"
        n += 1
    return candidate


class Command(BaseCommand):
    help = "Seed trading vault module + submodule playlists and video stubs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Mark created playlists as published (default: unpublished until media is attached).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        publish = bool(options["publish"])
        videos_created = 0
        videos_updated = 0
        submodule_playlists = 0
        submodule_playlists_updated = 0
        module_playlists = 0

        video_by_slug: dict[str, StreamVideo] = {}

        for submodule_slug, (title, filename) in sorted(TRADING_SUBMODULES.items()):
            video_title = f"{title} ({filename})"
            video = StreamVideo.objects.filter(title=video_title).first()
            if not video:
                video = (
                    StreamVideo.objects.filter(title__endswith=f"({filename})")
                    .order_by("id")
                    .first()
                )
            if not video:
                video = StreamVideo.objects.create(
                    title=video_title,
                    description=f"Trading vault lesson source file: {filename}",
                    price=Decimal("9.00"),
                    status=StreamVideo.Status.PROCESSING,
                    transcode_message="Awaiting admin upload of source MP4.",
                    show_in_programs=True,
                    show_in_membership=False,
                )
                videos_created += 1
            elif video.title != video_title:
                video.title = video_title
                video.description = f"Trading vault lesson source file: {filename}"
                video.save(update_fields=["title", "description", "updated_at"])
                videos_updated += 1
            video_by_slug[submodule_slug] = video

            playlist = StreamPlaylist.objects.filter(vault_plan_slug=submodule_slug).first()
            if not playlist:
                playlist = StreamPlaylist.objects.create(
                    title=title,
                    slug=_unique_playlist_slug(f"trading-{submodule_slug}"),
                    vault_plan_slug=submodule_slug,
                    category=StreamPlaylist.Category.BUSINESS_MODEL,
                    price=Decimal("9.00"),
                    rating=Decimal("4.5"),
                    description=f"Single lesson — {filename}",
                    is_published=publish,
                    is_coming_soon=not publish,
                )
                submodule_playlists += 1
            elif playlist.title != title:
                playlist.title = title
                playlist.description = f"Single lesson — {filename}"
                playlist.save(update_fields=["title", "description", "updated_at"])
                submodule_playlists_updated += 1
            StreamPlaylistItem.objects.get_or_create(
                playlist=playlist,
                stream_video=video,
                defaults={"order": 0},
            )

        for module_slug, module_title in TRADING_MODULE_TITLES.items():
            child_slugs = [
                slug
                for slug, parent in TRADING_SUBMODULE_PARENT.items()
                if parent == module_slug
            ]
            playlist = StreamPlaylist.objects.filter(vault_plan_slug=module_slug).first()
            if not playlist:
                playlist = StreamPlaylist.objects.create(
                    title=module_title,
                    slug=_unique_playlist_slug(f"trading-module-{module_slug}"),
                    vault_plan_slug=module_slug,
                    category=StreamPlaylist.Category.BUSINESS_MODEL,
                    price=Decimal("35.00"),
                    rating=Decimal("4.7"),
                    description=f"Full module — {len(child_slugs)} lessons.",
                    is_published=publish,
                    is_coming_soon=not publish,
                )
                module_playlists += 1

            for order, child_slug in enumerate(sorted(child_slugs)):
                video = video_by_slug.get(child_slug)
                if not video:
                    continue
                StreamPlaylistItem.objects.get_or_create(
                    playlist=playlist,
                    stream_video=video,
                    defaults={"order": order},
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Trading vault seed complete. videos_created={videos_created} "
                f"videos_updated={videos_updated} "
                f"submodule_playlists={submodule_playlists} "
                f"submodule_playlists_updated={submodule_playlists_updated} "
                f"module_playlists={module_playlists} "
                f"publish={publish}"
            )
        )
