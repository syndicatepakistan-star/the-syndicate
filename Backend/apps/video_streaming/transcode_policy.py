"""
When to run HLS transcoding synchronously (no Celery worker / broker).

Used by post_save signals and playback views so local dev does not depend on Redis
or CELERY_TASK_ALWAYS_EAGER being set in the environment.
"""

from __future__ import annotations

import os

from django.conf import settings


def inline_stream_transcode_enabled() -> bool:
    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        return True
    if getattr(settings, "DEBUG", False):
        return True
    v = (os.environ.get("STREAM_SYNC_TRANSCODE_ON_PLAYBACK") or "").strip().lower()
    return v in ("1", "true", "yes")


def schedule_stream_video_transcode(video_id: int) -> None:
    """
    Run HLS transcoding inline when ``inline_stream_transcode_enabled()`` (DEBUG, eager Celery,
    or STREAM_SYNC_TRANSCODE_ON_PLAYBACK); otherwise enqueue ``process_stream_video_to_hls`` on Celery.

    Bucket-key / multipart admin saves skip the post_save signal and must call this explicitly.
    In production with DEBUG off, run a Celery worker or set STREAM_SYNC_TRANSCODE_ON_PLAYBACK for sync fallback.
    """
    from apps.video_streaming.tasks import process_stream_video_to_hls

    if inline_stream_transcode_enabled():
        process_stream_video_to_hls(video_id)
    else:
        process_stream_video_to_hls.delay(video_id)
