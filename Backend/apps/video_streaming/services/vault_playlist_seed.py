"""Shared vault playlist + StreamVideo seeding for mid-ticket packs."""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.utils.text import slugify

from accounts.trading_vault_catalog import (
    TRADING_MODULE_TITLES,
    TRADING_SUBMODULES,
    TRADING_SUBMODULE_PARENT,
)
from accounts.vault_video_catalog import (
    LEGACY_MID_TICKET_PLAYLIST_SLUGS,
    agentic_course_rows,
    ai_content_course_rows,
    trading_r2_key_candidates,
    vault_r2_key_candidates,
)
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamVideo
from apps.video_streaming.services.object_storage import bucket_object_exists
from apps.video_streaming.services.playback_kinds import detect_playback_kind


@dataclass
class VaultSeedStats:
    videos_created: int = 0
    videos_updated: int = 0
    videos_linked: int = 0
    submodule_playlists: int = 0
    submodule_playlists_updated: int = 0
    module_playlists: int = 0
    legacy_retired: int = 0
    errors: list[str] = field(default_factory=list)


def unique_playlist_slug(base: str) -> str:
    slug = slugify(base)[:180] or "playlist"
    candidate = slug
    n = 2
    while StreamPlaylist.objects.filter(slug=candidate).exists():
        candidate = f"{slug}-{n}"
        n += 1
    return candidate


def link_bucket_key_if_exists(video: StreamVideo, candidates: tuple[str, ...]) -> str | None:
    for key in candidates:
        if not bucket_object_exists(key):
            continue
        kind = detect_playback_kind(key)
        StreamVideo.objects.filter(pk=video.pk).update(
            original_video=key,
            playback_kind=StreamVideo.PlaybackKind.HLS if kind == "hls" else StreamVideo.PlaybackKind.MP4,
            status=StreamVideo.Status.READY,
            transcode_progress=100,
            transcode_message="Linked to bucket object. Ready for playback.",
            last_error="",
            hls_path=key if kind == "hls" else "",
        )
        video.refresh_from_db()
        return key
    return None


def ensure_lesson_video(
    *,
    title: str,
    description: str,
    price: Decimal,
    r2_candidates: tuple[str, ...],
    link_r2: bool,
    stats: VaultSeedStats,
) -> StreamVideo:
    video = StreamVideo.objects.filter(title=title).first()
    if not video:
        video = StreamVideo.objects.create(
            title=title,
            description=description,
            price=price,
            status=StreamVideo.Status.PROCESSING,
            transcode_message="Awaiting R2 source MP4.",
            show_in_programs=True,
            show_in_membership=False,
        )
        stats.videos_created += 1
    else:
        changed = False
        if video.description != description:
            video.description = description
            changed = True
        if video.price != price:
            video.price = price
            changed = True
        if changed:
            video.save(update_fields=["description", "price"])
            stats.videos_updated += 1

    if link_r2:
        existing_key = (getattr(video.original_video, "name", None) or "").strip()
        if not existing_key or video.status != StreamVideo.Status.READY:
            linked = link_bucket_key_if_exists(video, r2_candidates)
            if linked:
                stats.videos_linked += 1
    return video


def ensure_submodule_playlist(
    *,
    plan_slug: str,
    title: str,
    description: str,
    price: Decimal,
    publish: bool,
    stats: VaultSeedStats,
) -> StreamPlaylist:
    playlist = StreamPlaylist.objects.filter(vault_plan_slug=plan_slug).first()
    if not playlist:
        playlist = StreamPlaylist.objects.create(
            title=title,
            slug=unique_playlist_slug(f"vault-{plan_slug}"),
            vault_plan_slug=plan_slug,
            category=StreamPlaylist.Category.BUSINESS_MODEL,
            price=price,
            rating=Decimal("4.5"),
            description=description,
            is_published=publish,
            is_coming_soon=not publish,
        )
        stats.submodule_playlists += 1
        return playlist

    changed_fields: list[str] = []
    if playlist.title != title:
        playlist.title = title
        changed_fields.append("title")
    if playlist.description != description:
        playlist.description = description
        changed_fields.append("description")
    if playlist.price != price:
        playlist.price = price
        changed_fields.append("price")
    if publish and not playlist.is_published:
        playlist.is_published = True
        playlist.is_coming_soon = False
        changed_fields.extend(["is_published", "is_coming_soon"])
    if changed_fields:
        changed_fields.append("updated_at")
        playlist.save(update_fields=changed_fields)
        stats.submodule_playlists_updated += 1
    return playlist


def seed_indexed_pack(
    *,
    pack_folder: str,
    rows: tuple[tuple[str, str, str], ...],
    lesson_price: Decimal,
    publish: bool,
    link_r2: bool,
    stats: VaultSeedStats,
) -> None:
    for plan_slug, title, thumb in rows:
        try:
            lesson_index = int(plan_slug.split("_c")[-1])
        except ValueError:
            lesson_index = 0
        r2_candidates = vault_r2_key_candidates(
            pack_folder=pack_folder,
            slug=plan_slug,
            title=title,
            lesson_index=lesson_index,
            thumb_filename=thumb,
        )
        video = ensure_lesson_video(
            title=title,
            description=f"Vault lesson — {plan_slug}",
            price=lesson_price,
            r2_candidates=r2_candidates,
            link_r2=link_r2,
            stats=stats,
        )
        playlist = ensure_submodule_playlist(
            plan_slug=plan_slug,
            title=title,
            description=f"Single lesson — {title}",
            price=lesson_price,
            publish=publish,
            stats=stats,
        )
        StreamPlaylistItem.objects.get_or_create(
            playlist=playlist,
            stream_video=video,
            defaults={"order": 0},
        )


def seed_trading_vault(*, publish: bool, link_r2: bool, stats: VaultSeedStats) -> None:
    video_by_slug: dict[str, StreamVideo] = {}

    for submodule_slug, (title, filename) in sorted(TRADING_SUBMODULES.items()):
        r2_candidates = trading_r2_key_candidates(submodule_slug)
        video = ensure_lesson_video(
            title=title,
            description=f"Trading vault lesson — {filename}",
            price=Decimal("9.00"),
            r2_candidates=r2_candidates,
            link_r2=link_r2,
            stats=stats,
        )
        video_by_slug[submodule_slug] = video

        playlist = ensure_submodule_playlist(
            plan_slug=submodule_slug,
            title=title,
            description=f"Single lesson — {filename}",
            price=Decimal("9.00"),
            publish=publish,
            stats=stats,
        )
        StreamPlaylistItem.objects.get_or_create(
            playlist=playlist,
            stream_video=video,
            defaults={"order": 0},
        )

    for module_slug, module_title in TRADING_MODULE_TITLES.items():
        child_slugs = sorted(
            slug for slug, parent in TRADING_SUBMODULE_PARENT.items() if parent == module_slug
        )
        playlist = StreamPlaylist.objects.filter(vault_plan_slug=module_slug).first()
        if not playlist:
            playlist = StreamPlaylist.objects.create(
                title=module_title,
                slug=unique_playlist_slug(f"trading-module-{module_slug}"),
                vault_plan_slug=module_slug,
                category=StreamPlaylist.Category.BUSINESS_MODEL,
                price=Decimal("99.00"),
                rating=Decimal("4.7"),
                description=f"Full module — {len(child_slugs)} lessons.",
                is_published=publish,
                is_coming_soon=not publish,
            )
            stats.module_playlists += 1

        for order, child_slug in enumerate(child_slugs):
            video = video_by_slug.get(child_slug)
            if not video:
                continue
            StreamPlaylistItem.objects.get_or_create(
                playlist=playlist,
                stream_video=video,
                defaults={"order": order},
            )


def retire_legacy_mid_ticket_playlists(stats: VaultSeedStats) -> None:
    qs = StreamPlaylist.objects.filter(slug__in=LEGACY_MID_TICKET_PLAYLIST_SLUGS)
    for playlist in qs:
        if playlist.is_published or not playlist.is_coming_soon or playlist.vault_plan_slug:
            playlist.is_published = False
            playlist.is_coming_soon = True
            playlist.vault_plan_slug = ""
            playlist.save(update_fields=["is_published", "is_coming_soon", "vault_plan_slug", "updated_at"])
            stats.legacy_retired += 1


@transaction.atomic
def seed_all_vault_playlists(*, publish: bool = False, link_r2: bool = True, retire_legacy: bool = True) -> VaultSeedStats:
    stats = VaultSeedStats()
    seed_indexed_pack(
        pack_folder="agentic_ai",
        rows=agentic_course_rows(),
        lesson_price=Decimal("14.00"),
        publish=publish,
        link_r2=link_r2,
        stats=stats,
    )
    seed_indexed_pack(
        pack_folder="ai_content",
        rows=ai_content_course_rows(),
        lesson_price=Decimal("14.00"),
        publish=publish,
        link_r2=link_r2,
        stats=stats,
    )
    seed_trading_vault(publish=publish, link_r2=link_r2, stats=stats)
    # TEMP test promo prices (revert after ads/GTM testing) — after trading seed so not overwritten
    StreamPlaylist.objects.filter(vault_plan_slug="ai_content_c02").update(price=Decimal("0.50"))
    StreamPlaylist.objects.filter(vault_plan_slug="trading_scalpel_protocol").update(price=Decimal("0.50"))
    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-psych-09")
        | Q(slug__iexact="business-warfare")
        | Q(title__iexact="Business Warfare")
    ).update(price=Decimal("0.50"))
    StreamPlaylist.objects.filter(
        Q(slug__iexact="level1-model-01")
        | Q(title__iexact="AI content Automation for Businesses")
        | Q(title__iexact="N8N AI Automation")
        | Q(title__iexact="A.I Content Automation for Business")
    ).update(price=Decimal("0.50"))
    StreamVideo.objects.filter(
        streamplaylistitem__playlist__vault_plan_slug__in=("ai_content_c02", "trading_scalpel_protocol")
    ).update(price=Decimal("0.50"))
    if retire_legacy:
        retire_legacy_mid_ticket_playlists(stats)
    return stats
