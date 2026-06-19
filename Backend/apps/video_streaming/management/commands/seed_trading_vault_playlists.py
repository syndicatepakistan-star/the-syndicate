"""
Seed Trading Advanced Technical Analysis vault playlists (modules + nested submodule lessons).

Delegates to seed_vault_playlists (trading portion only).

Usage (from Backend/):
  python manage.py seed_trading_vault_playlists
  python manage.py seed_trading_vault_playlists --publish
"""

from django.core.management.base import BaseCommand

from apps.video_streaming.services.vault_playlist_seed import seed_trading_vault, VaultSeedStats


class Command(BaseCommand):
    help = "Seed trading vault module + submodule playlists and video stubs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Mark created playlists as published (default: unpublished until media is attached).",
        )
        parser.add_argument(
            "--no-link-r2",
            action="store_true",
            help="Skip probing R2 for source MP4 keys.",
        )

    def handle(self, *args, **options):
        stats = VaultSeedStats()
        seed_trading_vault(
            publish=bool(options["publish"]),
            link_r2=not bool(options["no_link_r2"]),
            stats=stats,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Trading vault seed complete. videos_created={stats.videos_created} "
                f"videos_updated={stats.videos_updated} "
                f"videos_linked={stats.videos_linked} "
                f"submodule_playlists={stats.submodule_playlists} "
                f"submodule_playlists_updated={stats.submodule_playlists_updated} "
                f"module_playlists={stats.module_playlists} "
                f"publish={bool(options['publish'])}"
            )
        )
