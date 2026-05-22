"""
Load program playlist catalog from fixtures/stream_playlist_backup.json.

Usage (from Backend/):
  python manage.py load_stream_playlists

Railway (one-time, backend service shell or `railway run`):
  python manage.py load_stream_playlists
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand

from apps.video_streaming.models import StreamPlaylist


class Command(BaseCommand):
    help = "Import Stream playlists from fixtures/stream_playlist_backup.json (skips if playlists already exist unless --force)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Run loaddata even when playlists already exist (may error on duplicate primary keys).",
        )

    def handle(self, *args, **options):
        count = StreamPlaylist.objects.count()
        if count > 0 and not options["force"]:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipping: {count} playlist(s) already in the database. "
                    "Add/edit in Django admin, or run with --force on an empty DB only."
                )
            )
            return
        self.stdout.write("Loading fixtures/stream_playlist_backup.json …")
        call_command("loaddata", "fixtures/stream_playlist_backup.json", verbosity=1)
        after = StreamPlaylist.objects.filter(is_published=True).count()
        self.stdout.write(self.style.SUCCESS(f"Done. Published playlists: {after}"))
