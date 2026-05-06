from django.core.management.base import BaseCommand

from apps.video_streaming.models import StreamPlaylist


class Command(BaseCommand):
    help = "Populate empty playlist cover_image from first playlist video thumbnail."

    def handle(self, *args, **options):
        updated = 0
        checked = 0
        playlists = StreamPlaylist.objects.prefetch_related("items__stream_video").all()
        for playlist in playlists:
            checked += 1
            if playlist.cover_image and getattr(playlist.cover_image, "name", ""):
                continue
            first_thumb_name = ""
            for item in playlist.items.all().order_by("order", "id"):
                thumb_name = getattr(item.stream_video.thumbnail, "name", "") or ""
                if thumb_name:
                    first_thumb_name = thumb_name
                    break
            if not first_thumb_name:
                continue
            playlist.cover_image.name = first_thumb_name
            playlist.save(update_fields=["cover_image", "updated_at"])
            updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Checked {checked} playlists; updated {updated} cover image(s).")
        )
