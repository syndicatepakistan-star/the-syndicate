"""Purge + seed Syndicate stream catalog (Level 1, mid-ticket vault, trading nested)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.utils import timezone

from accounts.level1_program_catalog import (
    LEVEL1_ALL_PROGRAMS,
    LEVEL1_BUSINESS_MODEL_UNIT_USD,
    LEVEL1_BUSINESS_PSYCHOLOGY_UNIT_USD,
    Level1ProgramRow,
)
from accounts.r2_path_catalog import (
    agentic_hls_candidates,
    ai_content_hls_candidates,
    all_hls_candidates_for_plan_slug,
    level1_hls_candidates,
    level1_hls_manifest_key,
    trading_hls_candidates,
)
from accounts.trading_vault_catalog import TRADING_MODULE_TITLES, TRADING_SUBMODULES, TRADING_SUBMODULE_PARENT
from accounts.vault_plan_catalog import AGENTIC_AI_COURSE_TITLES, AI_CONTENT_COURSE_TITLES
from accounts.vault_video_catalog import agentic_course_rows, ai_content_course_rows
from apps.video_streaming.models import (
    StreamPlaylist,
    StreamPlaylistCertificate,
    StreamPlaylistItem,
    StreamPlaylistPurchase,
    StreamVideo,
)
from apps.video_streaming.services.vault_playlist_seed import (
    VaultSeedStats,
    ensure_lesson_video,
    ensure_submodule_playlist,
    link_bucket_key_if_exists,
    seed_all_vault_playlists,
    unique_playlist_slug,
)


@dataclass
class CatalogSeedStats:
    purged_playlists: int = 0
    purged_videos: int = 0
    purchases_restored: int = 0
    level1_playlists: int = 0
    vault_stats: VaultSeedStats | None = None
    manifest: list[dict] = field(default_factory=list)


@dataclass(frozen=True)
class PaidPurchaseSnapshot:
    user_id: int
    playlist_slug: str
    amount_paid: Decimal
    currency: str
    paid_at: Any
    stripe_session_id: str
    stripe_checkout_session_id: str


def snapshot_paid_playlist_purchases() -> list[PaidPurchaseSnapshot]:
    """Capture paid purchases by stable playlist slug before catalog purge."""
    rows: list[PaidPurchaseSnapshot] = []
    qs = (
        StreamPlaylistPurchase.objects.filter(status=StreamPlaylistPurchase.Status.PAID)
        .select_related("playlist")
        .exclude(stripe_session_id__startswith="quiz_ticket_")
    )
    for purchase in qs:
        slug = (getattr(purchase.playlist, "slug", None) or "").strip()
        if not slug:
            continue
        rows.append(
            PaidPurchaseSnapshot(
                user_id=int(purchase.user_id),
                playlist_slug=slug,
                amount_paid=purchase.amount_paid or Decimal("0"),
                currency=(purchase.currency or "").strip() or "usd",
                paid_at=purchase.paid_at,
                stripe_session_id=(purchase.stripe_session_id or "").strip(),
                stripe_checkout_session_id=(purchase.stripe_checkout_session_id or "").strip(),
            )
        )
    return rows


def restore_paid_playlist_purchases(snapshots: list[PaidPurchaseSnapshot]) -> int:
    """Re-link paid purchases to playlists recreated with the same slug."""
    restored = 0
    for row in snapshots:
        playlist = StreamPlaylist.objects.filter(slug=row.playlist_slug).first()
        if playlist is None:
            continue
        paid_at = row.paid_at or timezone.now()
        purchase, created = StreamPlaylistPurchase.objects.get_or_create(
            user_id=row.user_id,
            playlist=playlist,
            defaults={
                "status": StreamPlaylistPurchase.Status.PAID,
                "stripe_session_id": row.stripe_session_id,
                "stripe_checkout_session_id": row.stripe_checkout_session_id,
                "amount_paid": row.amount_paid,
                "currency": row.currency,
                "paid_at": paid_at,
            },
        )
        if not created and purchase.status != StreamPlaylistPurchase.Status.PAID:
            purchase.status = StreamPlaylistPurchase.Status.PAID
            purchase.amount_paid = row.amount_paid
            purchase.currency = row.currency
            purchase.paid_at = paid_at
            if row.stripe_session_id:
                purchase.stripe_session_id = row.stripe_session_id
            if row.stripe_checkout_session_id:
                purchase.stripe_checkout_session_id = row.stripe_checkout_session_id
            purchase.save(
                update_fields=[
                    "status",
                    "amount_paid",
                    "currency",
                    "paid_at",
                    "stripe_session_id",
                    "stripe_checkout_session_id",
                    "updated_at",
                ]
            )
        restored += 1
    return restored


def distribute_level1_prices(total: Decimal, count: int) -> list[Decimal]:
    if count <= 0:
        return []
    base = int(total // count)
    remainder = int(total) - base * count
    return [Decimal(base + (1 if i < remainder else 0)) for i in range(count)]


def purge_stream_catalog() -> CatalogSeedStats:
    stats = CatalogSeedStats()
    stats.purged_playlists = StreamPlaylist.objects.count()
    stats.purged_videos = StreamVideo.objects.count()
    StreamPlaylistCertificate.objects.all().delete()
    StreamPlaylistPurchase.objects.all().delete()
    StreamPlaylistItem.objects.all().delete()
    StreamPlaylist.objects.all().delete()
    StreamVideo.objects.all().delete()
    return stats


def _append_manifest(
    manifest: list[dict],
    *,
    kind: str,
    catalog_slug: str,
    title: str,
    playlist_id: int | None,
    parent_slug: str = "",
    r2_hint: str = "",
) -> None:
    manifest.append(
        {
            "kind": kind,
            "catalog_slug": catalog_slug,
            "parent_slug": parent_slug,
            "title": title,
            "playlist_id": playlist_id,
            "r2_hint": r2_hint,
        }
    )


def seed_level1_playlists(
    *,
    publish: bool,
    link_r2: bool,
    create_videos: bool,
    stats: CatalogSeedStats,
) -> None:
    for row in LEVEL1_ALL_PROGRAMS:
        price = (
            LEVEL1_BUSINESS_PSYCHOLOGY_UNIT_USD
            if row.category == StreamPlaylist.Category.BUSINESS_PSYCHOLOGY
            else LEVEL1_BUSINESS_MODEL_UNIT_USD
        )
        playlist = StreamPlaylist.objects.filter(slug=row.catalog_slug).first()
        if not playlist:
            playlist = StreamPlaylist.objects.create(
                title=row.title,
                slug=row.catalog_slug,
                category=row.category,
                price=price,
                rating=Decimal("4.5"),
                description=f"Level 1 program — {row.title}",
                vault_plan_slug="",
                is_published=publish,
                is_coming_soon=not publish,
            )
            stats.level1_playlists += 1
        else:
            playlist.title = row.title
            playlist.category = row.category
            playlist.price = price
            if publish:
                playlist.is_published = True
            playlist.save()

        r2_hint = level1_hls_manifest_key(row)
        _append_manifest(
            stats.manifest,
            kind="level1_psychology" if row.category == StreamPlaylist.Category.BUSINESS_PSYCHOLOGY else "level1_business_model",
            catalog_slug=row.catalog_slug,
            title=row.title,
            playlist_id=playlist.id,
            r2_hint=r2_hint,
        )

        if not create_videos:
            continue

        candidates = level1_hls_candidates(row)
        video = ensure_lesson_video(
            title=row.title,
            description=f"Level 1 — {row.catalog_slug}",
            price=price,
            r2_candidates=candidates,
            link_r2=link_r2,
            stats=stats.vault_stats or VaultSeedStats(),
        )
        StreamPlaylistItem.objects.get_or_create(
            playlist=playlist,
            stream_video=video,
            defaults={"order": 0},
        )
        if link_r2:
            key = (getattr(video.original_video, "name", None) or "").strip()
            if key and video.status == StreamVideo.Status.READY:
                playlist.is_coming_soon = False
                playlist.save(update_fields=["is_coming_soon", "updated_at"])


def build_manifest_from_db() -> list[dict]:
    manifest: list[dict] = []
    for row in LEVEL1_ALL_PROGRAMS:
        pl = StreamPlaylist.objects.filter(slug=row.catalog_slug).first()
        if pl:
            _append_manifest(
                manifest,
                kind="level1",
                catalog_slug=row.catalog_slug,
                title=pl.title,
                playlist_id=pl.id,
                r2_hint=level1_hls_manifest_key(row),
            )
    for slug in sorted(StreamPlaylist.objects.exclude(vault_plan_slug="").values_list("vault_plan_slug", flat=True)):
        pl = StreamPlaylist.objects.filter(vault_plan_slug=slug).first()
        if not pl:
            continue
        parent = ""
        parent_mod = TRADING_SUBMODULE_PARENT.get(slug)
        if parent_mod:
            parent = parent_mod
        elif slug.startswith("agentic_ai_c"):
            parent = "agentic_ai"
        elif slug.startswith("ai_content_c"):
            parent = "ai_content_automation"
        kind = "vault_pack" if slug in {"agentic_ai", "ai_content_automation", "trading_technical_analysis"} else "vault_module"
        if slug in TRADING_MODULE_TITLES:
            kind = "trading_module"
        elif parent_mod:
            kind = "trading_lesson"
        elif slug.startswith("agentic_ai_c") or slug.startswith("ai_content_c"):
            kind = "vault_lesson"
        manifest.append(
            {
                "kind": kind,
                "catalog_slug": slug,
                "parent_slug": parent,
                "title": pl.title,
                "playlist_id": pl.id,
                "r2_hint": "",
            }
        )
    return manifest


@transaction.atomic
def seed_syndicate_catalog(
    *,
    purge_first: bool = False,
    publish: bool = True,
    link_r2: bool = False,
    playlists_only: bool = True,
) -> CatalogSeedStats:
    stats = CatalogSeedStats(vault_stats=VaultSeedStats())
    purchase_snapshots: list[PaidPurchaseSnapshot] = []
    if purge_first:
        purchase_snapshots = snapshot_paid_playlist_purchases()
        purge_stream_catalog()

    create_videos = not playlists_only
    seed_level1_playlists(
        publish=publish,
        link_r2=link_r2,
        create_videos=create_videos,
        stats=stats,
    )

    if playlists_only:
        vault_stats = seed_vault_playlists_structure_only(publish=publish)
    else:
        vault_stats = seed_all_vault_playlists(publish=publish, link_r2=link_r2, retire_legacy=False)
    stats.vault_stats = vault_stats

    if purchase_snapshots:
        stats.purchases_restored = restore_paid_playlist_purchases(purchase_snapshots)

    for entry in build_manifest_from_db():
        if not any(e.get("catalog_slug") == entry.get("catalog_slug") for e in stats.manifest):
            stats.manifest.append(entry)

    return stats


def seed_vault_playlists_structure_only(*, publish: bool) -> VaultSeedStats:
    """Create vault/trading playlists without StreamVideo rows (admin links media manually)."""
    stats = VaultSeedStats()

    agentic_prices = [Decimal("14.00")] * len(AGENTIC_AI_COURSE_TITLES)
    # Promo: Build a WhatsApp Agent with n8n (agentic_ai_c02) → $0.50
    if len(agentic_prices) >= 2:
        agentic_prices[1] = Decimal("0.50")
    ai_prices = [Decimal("14.00")] * len(AI_CONTENT_COURSE_TITLES)

    for (plan_slug, title, _thumb), price in zip(agentic_course_rows(), agentic_prices, strict=True):
        ensure_submodule_playlist(
            plan_slug=plan_slug,
            title=title,
            description=f"Agentic AI vault lesson — {plan_slug}",
            price=price,
            publish=publish,
            stats=stats,
        )

    for i, ((plan_slug, title, _thumb), price) in enumerate(zip(ai_content_course_rows(), ai_prices, strict=True), start=1):
        ensure_submodule_playlist(
            plan_slug=plan_slug,
            title=title,
            description=f"AI Content vault lesson — {plan_slug}",
            price=price,
            publish=publish,
            stats=stats,
        )

    for submodule_slug, (title, _filename) in sorted(TRADING_SUBMODULES.items()):
        ensure_submodule_playlist(
            plan_slug=submodule_slug,
            title=title,
            description=f"Trading lesson — {submodule_slug}",
            price=Decimal("9.00"),
            publish=publish,
            stats=stats,
        )

    for module_slug, module_title in TRADING_MODULE_TITLES.items():
        child_count = sum(1 for p in TRADING_SUBMODULE_PARENT.values() if p == module_slug)
        playlist = StreamPlaylist.objects.filter(vault_plan_slug=module_slug).first()
        if not playlist:
            StreamPlaylist.objects.create(
                title=module_title,
                slug=unique_playlist_slug(f"trading-module-{module_slug}"),
                vault_plan_slug=module_slug,
                category=StreamPlaylist.Category.BUSINESS_MODEL,
                price=Decimal("99.00"),
                rating=Decimal("4.7"),
                description=f"Trading module — {child_count} lessons.",
                is_published=publish,
                is_coming_soon=not publish,
            )
            stats.module_playlists += 1

    return stats


def manifest_json(stats: CatalogSeedStats) -> str:
    return json.dumps(stats.manifest, indent=2)
