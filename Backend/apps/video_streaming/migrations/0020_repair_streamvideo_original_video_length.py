from django.db import migrations


def widen_original_video_column(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
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
            return
        current_max = row[0]
        if current_max is not None and current_max >= 2048:
            return

        cursor.execute(
            """
            ALTER TABLE public.video_streaming_streamvideo
            ALTER COLUMN original_video TYPE varchar(2048)
            """
        )


class Migration(migrations.Migration):

    dependencies = [
        ("video_streaming", "0019_streamvideo_original_video_max_length"),
    ]

    operations = [
        migrations.RunPython(widen_original_video_column, migrations.RunPython.noop),
    ]
