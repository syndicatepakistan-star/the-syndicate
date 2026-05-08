"""
HLS transcoding policy: when to run inline vs queue vs background thread.

Playback views may still run transcoding synchronously on first request when
``inline_stream_transcode_enabled()`` is true. Admin saves, signals, and API
completion handlers use ``enqueue_stream_video_transcode`` so HTTP workers are
not blocked for hours by FFmpeg (which looks like the app "stopped").
"""

from __future__ import annotations

import logging
import os
import threading

from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger(__name__)


def inline_stream_transcode_enabled() -> bool:
    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        return True
    if getattr(settings, "DEBUG", False):
        return True
    v = (os.environ.get("STREAM_SYNC_TRANSCODE_ON_PLAYBACK") or "").strip().lower()
    return v in ("1", "true", "yes")


def _transcode_would_run_in_current_thread() -> bool:
    """True when ``.delay()`` would execute the task synchronously here (eager/DEBUG/sync-playback policy)."""
    return inline_stream_transcode_enabled()


def enqueue_stream_video_transcode(video_id: int) -> None:
    """
    Start ``process_stream_video_to_hls`` without blocking the caller.

    - Production (real Celery worker): ``.delay()`` onto the broker.
    - DEBUG / CELERY_TASK_ALWAYS_EAGER / STREAM_SYNC_TRANSCODE_ON_PLAYBACK: run in a
      daemon thread so admin and API responses return immediately (large FFmpeg jobs
      no longer kill the web process or hit HTTP timeouts).
    """
    from apps.video_streaming.tasks import process_stream_video_to_hls

    if not _transcode_would_run_in_current_thread():
        process_stream_video_to_hls.delay(video_id)
        return

    def _run() -> None:
        close_old_connections()
        try:
            process_stream_video_to_hls.apply(args=[video_id])
        except Exception:
            logger.exception("Background HLS transcoding failed for video %s", video_id)
        finally:
            close_old_connections()

    threading.Thread(
        target=_run,
        name=f"hls-transcode-{video_id}",
        daemon=True,
    ).start()


def schedule_stream_video_transcode(video_id: int) -> None:
    """
    Run transcoding in the current thread (blocks). Prefer ``enqueue_stream_video_transcode``
    for admin/API; keep this for code paths that must finish before returning.
    """
    from apps.video_streaming.tasks import process_stream_video_to_hls

    if _transcode_would_run_in_current_thread():
        process_stream_video_to_hls(video_id)
    else:
        process_stream_video_to_hls.delay(video_id)
