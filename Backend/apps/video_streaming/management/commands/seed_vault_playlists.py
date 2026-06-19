"""
Seed mid-ticket vault playlists (Agentic AI, AI Content, Trading) with nested module/lesson structure.

Creates StreamPlaylist rows per vault_plan_slug, StreamVideo rows, and links R2 object keys when present.

Usage (from Backend/):
  python manage.py seed_vault_playlists
  python manage.py seed_vault_playlists --publish
  python manage.py seed_vault_playlists --no-link-r2
"""

from django.core.management.base import BaseCommand

from apps.video_streaming.services.vault_playlist_seed import seed_all_vault_playlists


class Command(BaseCommand):
    help = "Seed Agentic AI, AI Content, and Trading vault playlists (+ optional R2 video linking)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Mark created playlists as published (default: unpublished until media is ready).",
        )
        parser.add_argument(
            "--no-link-r2",
            action="store_true",
            help="Skip probing R2 for source MP4 keys (only create playlist/video stubs).",
        )
        parser.add_argument(
            "--keep-legacy",
            action="store_true",
            help="Do not unpublish legacy mid-ticket stream playlists (ids 15–18, 29 fixture slugs).",
        )

    def handle(self, *args, **options):
        stats = seed_all_vault_playlists(
            publish=bool(options["publish"]),
            link_r2=not bool(options["no_link_r2"]),
            retire_legacy=not bool(options["keep_legacy"]),
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Vault playlist seed complete. "
                f"videos_created={stats.videos_created} "
                f"videos_updated={stats.videos_updated} "
                f"videos_linked={stats.videos_linked} "
                f"submodule_playlists={stats.submodule_playlists} "
                f"submodule_playlists_updated={stats.submodule_playlists_updated} "
                f"module_playlists={stats.module_playlists} "
                f"legacy_retired={stats.legacy_retired} "
                f"publish={bool(options['publish'])} "
                f"link_r2={not bool(options['no_link_r2'])}"
            )
        )
