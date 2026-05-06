from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from celery import shared_task
from django.conf import settings

from apps.video_streaming.models import StreamVideo
from apps.video_streaming.services.r2_hls import upload_hls_directory

logger = logging.getLogger(__name__)


def _ffmpeg_executable() -> str:
    """
    Prefer a path from the imageio-ffmpeg PyPI wheel (no system FFmpeg install).
    Override with FFMPEG_BINARY=/path/to/ffmpeg if needed.
    """
    override = (os.environ.get("FFMPEG_BINARY") or "").strip()
    if override:
        return override
    try:
        import imageio_ffmpeg

        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe:
            return exe
    except Exception as exc:
        logger.warning("imageio-ffmpeg unavailable (%s); falling back to PATH ffmpeg", exc)
    found = shutil.which("ffmpeg")
    if not found:
        raise RuntimeError(
            "FFmpeg not found. Install the Python dependency imageio-ffmpeg (pip install -r requirements.txt) "
            "or set FFMPEG_BINARY to an ffmpeg executable."
        )
    return found


def _ffprobe_path() -> str | None:
    ffmpeg_exe = Path(_ffmpeg_executable())
    parent = ffmpeg_exe.parent
    stem = ffmpeg_exe.stem.lower()
    if stem == "ffmpeg":
        for name in ("ffprobe", "ffprobe.exe"):
            p = parent / name
            if p.is_file():
                return str(p)
    return shutil.which("ffprobe")


def _ffprobe_video_dimensions(input_path: Path) -> tuple[int, int] | None:
    probe = _ffprobe_path()
    if not probe:
        return None
    try:
        cp = subprocess.run(
            [
                probe,
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=width,height",
                "-of",
                "csv=p=0:s=x",
                str(input_path),
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except (subprocess.CalledProcessError, OSError, ValueError):
        return None
    line = (cp.stdout or "").strip()
    if "x" not in line:
        return None
    w_s, h_s = line.lower().split("x", 1)
    try:
        w, h = int(w_s), int(h_s)
    except ValueError:
        return None
    if w <= 0 or h <= 0:
        return None
    return w, h


def _public_cdn_base() -> str:
    return (os.environ.get("VIDEO_CDN_PUBLIC_BASE_URL") or "").strip().rstrip("/")


def _run_ffmpeg_hls(input_path: Path, out_dir: Path, playlist_name: str = "index.m3u8") -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    playlist = out_dir / playlist_name
    ffmpeg = _ffmpeg_executable()

    def run(args: list[str]) -> None:
        subprocess.run(
            args,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=int((os.environ.get("FFMPEG_TIMEOUT_SECONDS") or "7200").strip() or "7200"),
        )

    copy_cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(input_path),
        "-codec",
        "copy",
        "-hls_time",
        (os.environ.get("HLS_SEGMENT_SECONDS") or "10").strip(),
        "-hls_list_size",
        "0",
        "-f",
        "hls",
        str(playlist),
    ]
    try:
        run(copy_cmd)
        return
    except subprocess.CalledProcessError as exc:
        tail = ((exc.stderr or "") + (exc.stdout or ""))[-2000:]
        logger.warning("ffmpeg copy-mode HLS failed; retrying with libx264+aac: %s", tail)

    encode_cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(input_path),
        "-c:v",
        "libx264",
        "-preset",
        (os.environ.get("HLS_FFMPEG_PRESET") or "veryfast").strip(),
        "-crf",
        (os.environ.get("HLS_FFMPEG_CRF") or "22").strip(),
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-hls_time",
        (os.environ.get("HLS_SEGMENT_SECONDS") or "10").strip(),
        "-hls_list_size",
        "0",
        "-f",
        "hls",
        str(playlist),
    ]
    run(encode_cmd)


@shared_task(
    bind=True,
    autoretry_for=(OSError, ConnectionError, TimeoutError),
    retry_backoff=90,
    retry_kwargs={"max_retries": 3},
)
def process_stream_video_to_hls(self, video_id: int) -> None:
    try:
        video = StreamVideo.objects.get(pk=video_id)
    except StreamVideo.DoesNotExist:
        return

    if not video.original_video or not video.original_video.name:
        StreamVideo.objects.filter(pk=video_id).update(
            status=StreamVideo.Status.FAILED,
            last_error="No original_video file on record.",
        )
        return

    StreamVideo.objects.filter(pk=video_id).update(
        status=StreamVideo.Status.PROCESSING,
        last_error="",
        hls_path="",
    )

    media_root = Path(settings.MEDIA_ROOT)
    out_dir = media_root / "hls" / str(video_id)
    tmp_input_path: Path | None = None

    try:
        if out_dir.exists():
            shutil.rmtree(out_dir, ignore_errors=True)

        try:
            input_path = Path(video.original_video.path)
        except (NotImplementedError, AttributeError):
            suffix = Path(video.original_video.name).suffix or ".mp4"
            with video.original_video.open("rb") as src:
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    for chunk in src.chunks():
                        tmp.write(chunk)
                    tmp_input_path = Path(tmp.name)
            input_path = tmp_input_path

        probed = _ffprobe_video_dimensions(input_path)
        _run_ffmpeg_hls(input_path, out_dir)

        use_s3 = getattr(settings, "USE_S3_OBJECT_STORAGE", False)
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()

        if use_s3 and bucket:
            upload_hls_directory(out_dir, video_id, bucket)
            shutil.rmtree(out_dir, ignore_errors=True)
            base = _public_cdn_base()
            if not base:
                raise RuntimeError(
                    "VIDEO_CDN_PUBLIC_BASE_URL is required after R2 upload "
                    "(public or custom domain root that maps to the bucket)."
                )
            hls_url = f"{base}/hls/{video_id}/index.m3u8"
        else:
            base = _public_cdn_base()
            if not base:
                raise RuntimeError(
                    "For local/dev without R2, set VIDEO_CDN_PUBLIC_BASE_URL "
                    "(e.g. http://127.0.0.1:8000) so the API can return an absolute HLS URL."
                )
            hls_url = f"{base.rstrip('/')}/media/hls/{video_id}/index.m3u8"

        ready_kwargs: dict = {
            "hls_path": hls_url,
            "status": StreamVideo.Status.READY,
            "last_error": "",
        }
        if probed:
            ready_kwargs["source_width"], ready_kwargs["source_height"] = probed
        StreamVideo.objects.filter(pk=video_id).update(**ready_kwargs)
    except Exception as exc:
        logger.exception("HLS processing failed for video %s", video_id)
        StreamVideo.objects.filter(pk=video_id).update(
            status=StreamVideo.Status.FAILED,
            last_error=str(exc)[:4000],
        )
        raise
    finally:
        if tmp_input_path and tmp_input_path.exists():
            try:
                tmp_input_path.unlink()
            except OSError:
                logger.warning("Could not remove temporary input file: %s", tmp_input_path)
