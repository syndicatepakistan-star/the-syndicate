from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from apps.video_streaming.models import StreamPlaylistItem, StreamVideo
from apps.video_streaming.transcode_policy import inline_stream_transcode_enabled


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
    if not instance.original_video or not instance.original_video.name:
        return
    prev = getattr(instance, "_pre_save_original_video_name", "")
    if not created and instance.original_video.name == prev:
        return
    from apps.video_streaming.tasks import process_stream_video_to_hls

    def _trigger(vid: int) -> None:
        # Local dev: run inline when DEBUG / eager / STREAM_SYNC_TRANSCODE_ON_PLAYBACK.
        if inline_stream_transcode_enabled():
            process_stream_video_to_hls(vid)
            return
        process_stream_video_to_hls.delay(vid)

    # Inline mode: run on save so admin sees ready status without a worker.
    # Otherwise defer until commit so the file row + storage are consistent before queueing.
    if inline_stream_transcode_enabled():
        _trigger(instance.pk)
    else:
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
