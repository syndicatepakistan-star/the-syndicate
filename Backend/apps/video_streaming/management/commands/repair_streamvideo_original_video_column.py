from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = (
        "Ensure video_streaming_streamvideo.original_video is wide enough for long R2 object keys "
        "(PostgreSQL varchar(2048))."
    )

    def handle(self, *args, **options):
        if connection.vendor != "postgresql":
            self.stdout.write("Skipping (not PostgreSQL).")
            return

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'video_streaming_streamvideo'
                  AND column_name = 'original_video'
                """
            )
            row = cursor.fetchone()
            if not row:
                self.stdout.write("Column original_video not found; skipping.")
                return

            current_max = row[0]
            if current_max is not None and current_max >= 2048:
                self.stdout.write(
                    f"original_video already varchar({current_max}); nothing to do."
                )
                return

            self.stdout.write(
                f"Widening original_video from varchar({current_max or 'unknown'}) to varchar(2048)…"
            )
            cursor.execute(
                """
                ALTER TABLE public.video_streaming_streamvideo
                ALTER COLUMN original_video TYPE varchar(2048)
                """
            )
            self.stdout.write(self.style.SUCCESS("original_video widened to varchar(2048)."))
