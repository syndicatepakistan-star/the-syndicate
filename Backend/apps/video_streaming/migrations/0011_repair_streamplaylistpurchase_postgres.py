from django.db import migrations


def repair_streamplaylistpurchase_postgres(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    table = "video_streaming_streamplaylistpurchase"
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = %s
            )
            """,
            [table],
        )
        row = cursor.fetchone()
        if not row or not row[0]:
            return

        cursor.execute(
            """
            ALTER TABLE public.video_streaming_streamplaylistpurchase
            ADD COLUMN IF NOT EXISTS stripe_session_id varchar(255) NOT NULL DEFAULT ''
            """
        )

        cursor.execute(
            """
            UPDATE public.video_streaming_streamplaylistpurchase
               SET stripe_session_id = stripe_checkout_session_id
             WHERE (stripe_session_id IS NULL OR stripe_session_id = '')
               AND stripe_checkout_session_id IS NOT NULL
            """
        )


class Migration(migrations.Migration):
    dependencies = [
        ("video_streaming", "0010_sync_legacy_stripe_session_id"),
    ]

    operations = [
        migrations.RunPython(
            repair_streamplaylistpurchase_postgres,
            migrations.RunPython.noop,
        ),
    ]

