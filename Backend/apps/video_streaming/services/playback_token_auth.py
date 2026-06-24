"""
Fast-path cache for signed playback tokens (HLS manifests + many segment Range requests).

After the first successful entitlement check for a token, segment proxies skip repeat DB work
until the token expires.
"""

from __future__ import annotations

import hashlib
import time

from django.core.cache import cache

from apps.video_streaming.models import StreamVideo
from apps.video_streaming.playback_access import (
    user_can_play_membership_stream_video,
    user_can_play_programs_stream_video,
)
from apps.video_streaming.services.playback_delivery import verify_playback_token


def _token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()[:32]


def _grant_cache_key(*, video_id: int, token: str) -> str:
    return f"strm_ptok:{int(video_id)}:{_token_fingerprint(token)}"


def _grant_cache_ttl(exp: int) -> int:
    now = int(time.time())
    remaining = int(exp) - now
    return max(5, min(remaining, 3600))


def mark_playback_token_granted(*, video_id: int, token: str, exp: int) -> None:
    ttl = _grant_cache_ttl(exp)
    if ttl <= 0:
        return
    cache.set(_grant_cache_key(video_id=video_id, token=token), 1, timeout=ttl)


def playback_token_granted(*, video_id: int, token: str) -> bool:
    return cache.get(_grant_cache_key(video_id=video_id, token=token)) is not None


def authorize_stream_video_for_playback_token(
    *,
    token: str,
    video_id: int,
) -> tuple[StreamVideo, dict] | None:
    """
    Validate signed playback token + entitlements. Uses a short-lived cache so HLS segment
  storms do not repeat user/video entitlement queries on every .ts request.
    """
    claims = verify_playback_token(token=token, video_id=video_id)
    if not claims:
        return None

    exp = int(claims["exp"])
    if playback_token_granted(video_id=video_id, token=token):
        try:
            video = StreamVideo.objects.only(
                "id",
                "status",
                "playback_kind",
                "original_video",
                "show_in_programs",
                "show_in_membership",
            ).get(pk=int(video_id))
        except StreamVideo.DoesNotExist:
            return None
        return video, claims

    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        user = User.objects.get(pk=int(claims["u"]))
    except (User.DoesNotExist, TypeError, ValueError, KeyError):
        return None

    try:
        video = StreamVideo.objects.get(pk=int(video_id))
    except StreamVideo.DoesNotExist:
        return None

    mode = str(claims.get("m") or "programs").strip() or "programs"
    if mode == "membership":
        if not user_can_play_membership_stream_video(user, video):
            return None
    elif not user_can_play_programs_stream_video(user, video):
        return None

    mark_playback_token_granted(video_id=video_id, token=token, exp=exp)
    return video, claims
