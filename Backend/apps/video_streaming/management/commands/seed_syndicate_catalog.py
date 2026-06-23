"""
Rebuild Syndicate stream catalog from scratch (Level 1 + mid-ticket vault + trading nested).

Usage:
  python manage.py seed_syndicate_catalog --purge --publish
  python manage.py seed_syndicate_catalog --purge --publish --link-r2
  python manage.py seed_syndicate_catalog --with-videos --link-r2
"""

from django.core.management.base import BaseCommand

from apps.video_streaming.services.catalog_seed import manifest_json, seed_syndicate_catalog


class Command(BaseCommand):
    help = "Purge (optional) and seed Level 1 + vault + trading playlist structure."

    def add_arguments(self, parser):
        parser.add_argument(
            "--purge",
            action="store_true",
            help="Delete all existing stream playlists/videos before seeding.",
        )
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Mark playlists as published (default: unpublished stubs).",
        )
        parser.add_argument(
            "--link-r2",
            action="store_true",
            help="Probe R2 for index.m3u8 manifests and link StreamVideo rows when found.",
        )
        parser.add_argument(
            "--with-videos",
            action="store_true",
            help="Create StreamVideo + playlist item rows (default: playlists only for manual linking).",
        )
        parser.add_argument(
            "--write-manifest",
            metavar="PATH",
            help="Write catalog_slug → playlist_id JSON manifest to this path.",
        )

    def handle(self, *args, **options):
        publish = bool(options["publish"])
        stats = seed_syndicate_catalog(
            purge_first=bool(options["purge"]),
            publish=publish,
            link_r2=bool(options["link_r2"]),
            playlists_only=not bool(options["with_videos"]),
        )
        vs = stats.vault_stats
        self.stdout.write(
            self.style.SUCCESS(
                "Catalog seed complete. "
                f"level1_playlists={stats.level1_playlists} "
                f"vault_submodules={vs.submodule_playlists if vs else 0} "
                f"vault_modules={vs.module_playlists if vs else 0} "
                f"publish={publish} "
                f"playlists_only={not options['with_videos']}"
            )
        )
        manifest = manifest_json(stats)
        if options.get("write_manifest"):
            path = options["write_manifest"]
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(manifest)
            self.stdout.write(self.style.SUCCESS(f"Wrote manifest -> {path}"))
        else:
            self.stdout.write(manifest)
