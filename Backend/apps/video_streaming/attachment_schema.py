"""Schema helpers for optional StreamPlaylistAttachment rollout."""

from __future__ import annotations

from django.apps import apps


def stream_playlist_attachments_table_ready() -> bool:
    """True when migration 0032+ has created the attachments table."""
    try:
        model = apps.get_model("video_streaming", "StreamPlaylistAttachment")
        table = model._meta.db_table
        from django.db import connection

        connection.ensure_connection()
        return table in connection.introspection.table_names()
    except Exception:
        return False
