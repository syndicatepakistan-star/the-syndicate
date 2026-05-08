from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver
import logging

from apps.video_streaming.models import StreamPlaylistItem, StreamVideo
from apps.video_streaming.transcode_policy import enqueue_stream_video_transcode

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=StreamVideo)
def _stream_video_remember_original_name(sender, instance: StreamVideo, **kwargs) -> None:
    if instance.pk:
        try:
            prev = StreamVideo.objects.only("original_video", "thumbnail").get(pk=instance.pk)
            instance._pre_save_original_video_name = prev.original_video.name or ""
            instance._pre_save_thumbnail_name = prev.thumbnail.name or ""
        except StreamVideo.DoesNotExist:
            instance._pre_save_original_video_name = ""
            instance._pre_save_thumbnail_name = ""
    else:
        instance._pre_save_original_video_name = ""
        instance._pre_save_thumbnail_name = ""


@receiver(post_save, sender=StreamVideo)
def _stream_video_enqueue_transcode(sender, instance: StreamVideo, created: bool, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    if getattr(instance, "_skip_auto_transcode", False):
        return
    if not instance.original_video or not instance.original_video.name:
        return
    prev = getattr(instance, "_pre_save_original_video_name", "")
    if not created and instance.original_video.name == prev:
        return
    def _trigger(vid: int) -> None:
        try:
            enqueue_stream_video_transcode(vid)
        except Exception:
            logger.exception("Could not enqueue HLS transcoding for video %s", vid)
            StreamVideo.objects.filter(pk=vid).update(
                status=StreamVideo.Status.FAILED,
                transcode_progress=0,
                transcode_message="Could not queue job. Verify Celery worker and Redis broker.",
                last_error="Could not start transcoding (Celery broker unavailable). Run a worker or check REDIS_URL.",
            )

    # Defer until commit so the DB row + storage are consistent before FFmpeg runs.
    transaction.on_commit(lambda vid=instance.pk: _trigger(vid))


def _sync_playlist_cover_from_first_thumbnail(playlist_id: int) -> None:
    """When no custom cover exists, mirror the first playlist video thumbnail."""
    if not playlist_id:
        return
    item = (
        StreamPlaylistItem.objects.select_related("playlist", "stream_video")
        .filter(playlist_id=playlist_id)
        .order_by("order", "id")
        .first()
    )
    if not item:
        return
    playlist = item.playlist
    if playlist.cover_image and getattr(playlist.cover_image, "name", ""):
        return
    thumbnail_name = getattr(item.stream_video.thumbnail, "name", "") or ""
    if not thumbnail_name:
        return
    playlist.cover_image.name = thumbnail_name
    playlist.save(update_fields=["cover_image", "updated_at"])


@receiver(post_save, sender=StreamPlaylistItem)
def _stream_playlist_item_sync_cover(sender, instance: StreamPlaylistItem, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    transaction.on_commit(lambda playlist_id=instance.playlist_id: _sync_playlist_cover_from_first_thumbnail(playlist_id))


@receiver(post_delete, sender=StreamPlaylistItem)
def _stream_playlist_item_deleted_sync_cover(sender, instance: StreamPlaylistItem, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    transaction.on_commit(lambda playlist_id=instance.playlist_id: _sync_playlist_cover_from_first_thumbnail(playlist_id))


@receiver(post_save, sender=StreamVideo)
def _stream_video_thumbnail_sync_playlist_covers(sender, instance: StreamVideo, created: bool, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    current_thumb = (instance.thumbnail.name or "") if instance.thumbnail else ""
    previous_thumb = getattr(instance, "_pre_save_thumbnail_name", "")
    if not created and current_thumb == previous_thumb:
        return
    playlist_ids = list(
        StreamPlaylistItem.objects.filter(stream_video_id=instance.pk)
        .values_list("playlist_id", flat=True)
        .distinct()
    )
    if not playlist_ids:
        return
    def _run(ids: list[int]) -> None:
        for playlist_id in ids:
            _sync_playlist_cover_from_first_thumbnail(playlist_id)

    transaction.on_commit(lambda ids=playlist_ids: _run(ids))


def _delete_s3_prefix(client, bucket: str, prefix: str) -> None:
    continuation_token = None
    while True:
        kwargs = {"Bucket": bucket, "Prefix": prefix, "MaxKeys": 1000}
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token
        response = client.list_objects_v2(**kwargs)
        contents = response.get("Contents") or []
        if contents:
            client.delete_objects(
                Bucket=bucket,
                Delete={"Objects": [{"Key": obj["Key"]} for obj in contents], "Quiet": True},
            )
        if not response.get("IsTruncated"):
            break
        continuation_token = response.get("NextContinuationToken")


@receiver(post_delete, sender=StreamVideo)
def _stream_video_delete_bucket_objects(sender, instance: StreamVideo, **kwargs) -> None:
    if kwargs.get("raw"):
        return

    original_key = (getattr(instance.original_video, "name", "") or "").strip()
    thumbnail_key = (getattr(instance.thumbnail, "name", "") or "").strip()
    hls_prefix = f"hls/{instance.pk}/"
    if not any([original_key, thumbnail_key, instance.pk]):
        return

    def _run_cleanup() -> None:
        from django.conf import settings
        from apps.video_streaming.services.r2_hls import _s3_client

        if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
            return
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", "") or "").strip()
        if not bucket:
            return
        client = _s3_client()
        if client is None:
            return
        try:
            keys = [k for k in [original_key, thumbnail_key] if k]
            if keys:
                client.delete_objects(
                    Bucket=bucket,
                    Delete={"Objects": [{"Key": k} for k in keys], "Quiet": True},
                )
            _delete_s3_prefix(client, bucket, hls_prefix)
        except Exception:
            logger.exception("Failed deleting bucket objects for StreamVideo %s", instance.pk)

    transaction.on_commit(_run_cleanup)
