from django.db import migrations


def ensure_streamplaylistattachment_table(apps, schema_editor):
    """Create attachments table if a deploy skipped migration 0032 (Postgres production)."""
    StreamPlaylistAttachment = apps.get_model("video_streaming", "StreamPlaylistAttachment")
    table = StreamPlaylistAttachment._meta.db_table
    existing = set(schema_editor.connection.introspection.table_names())
    if table in existing:
        return
    schema_editor.create_model(StreamPlaylistAttachment)


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0032_streamplaylistattachment"),
    ]

    operations = [
        migrations.RunPython(ensure_streamplaylistattachment_table, migrations.RunPython.noop),
    ]
