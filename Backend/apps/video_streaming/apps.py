from django.apps import AppConfig


class VideoStreamingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.video_streaming"
    verbose_name = "Video streaming (signed MP4)"

    def ready(self) -> None:
        from apps.video_streaming import signals  # noqa: F401
