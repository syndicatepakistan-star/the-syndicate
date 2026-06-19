"""Vault lesson source filenames + R2 object key candidates (sync with frontend vaultPackCatalog.ts / tradingVaultCatalog.ts)."""

from __future__ import annotations

from pathlib import PurePosixPath

from accounts.trading_vault_catalog import TRADING_SUBMODULES
from accounts.vault_plan_catalog import AGENTIC_AI_COURSE_TITLES, AI_CONTENT_COURSE_TITLES

# (thumbnail basename) — mirrors Frontend-Dashboard vaultPackCatalog AGENTIC_ROWS / AI_CONTENT_ROWS
AGENTIC_THUMB_FILES: tuple[str, ...] = (
    "blog writing n8n.jpg",
    "whatsapp agent.jpg",
    "secret claude.jpg",
    "insane 50k.jpg",
    "claude better.jpg",
    "claude memory.jpg",
    "claude cowork.jpg",
    "scrap website.jpg",
    "n8n 37 tips.jpg",
    "google antigravity.jpg",
    "n8n 37 tips.jpg",
    "claude advanced.jpg",
    "claude full.jpg",
    "4 claude code hacks.jpg",
    "12 ways.jpg",
    "27 claude.jpg",
    "faceless shorts ai.jpg",
    "claude marketing.jpg",
    "rag agent.jpg",
    "insane youtube automation.jpg",
    "n8n seo.jpg",
    "mcp server.jpg",
    "label gmail.jpg",
    "stop n8n.jpg",
    "vibe coding.jpg",
    "agentic workflow.jpg",
)

AI_CONTENT_THUMB_FILES: tuple[str, ...] = (
    "faceless youtube.jpg",
    "youtube policy.jpg",
    "start youtube automation.jpg",
    "genspark ai.jpg",
    "movie channel.jpg",
    "rpm finance.jpg",
    "3d animated videos.jpg",
    "aitana lopez instagram.jpg",
    "ai documentory.jpg",
    "philosphy channel.jpg",
    "perhistoric channel.jpg",
    "cloned 3d.jpg",
    "geography.jpg",
    "universe channel.jpg",
    "5000 studied.jpg",
    "50 niches.jpg",
    "1000 shorts.jpg",
    "70+ crack algo.jpg",
    "banned.jpg",
    "100 millions views.jpg",
    "nick invests exposed.jpg",
    "exploding.jpg",
    "motion graphics.jpg",
    "stickan pov.jpg",
    "youtuber need!.jpg",
    "fern 3d style.jpg",
    "life advice.jpg",
    "inspirational finance.jpg",
    "clone any channel.jpg",
)

VAULT_R2_PREFIX = "stream_videos/vault"

LEGACY_MID_TICKET_PLAYLIST_SLUGS: frozenset[str] = frozenset(
    {
        "faceless-youtube-ai-content-creator-course",
        "ai-automations",
        "how-to-build-ai-agents",
        "crypto-trading-with-technical-analysis-course",
        "the-1-minute-scalpel",
    }
)


def _thumb_to_mp4(thumb_filename: str) -> str:
    stem = PurePosixPath(thumb_filename).stem
    return f"{stem}.mp4"


def _slug_index(prefix: str, index: int) -> str:
    return f"{prefix}_c{index:02d}"


def agentic_course_rows() -> tuple[tuple[str, str, str], ...]:
    """(slug, title, thumb_filename)"""
    rows: list[tuple[str, str, str]] = []
    for i, title in enumerate(AGENTIC_AI_COURSE_TITLES, start=1):
        thumb = AGENTIC_THUMB_FILES[i - 1] if i - 1 < len(AGENTIC_THUMB_FILES) else f"{_slug_index('agentic_ai', i)}.jpg"
        rows.append((_slug_index("agentic_ai", i), title, thumb))
    return tuple(rows)


def ai_content_course_rows() -> tuple[tuple[str, str, str], ...]:
    rows: list[tuple[str, str, str]] = []
    for i, title in enumerate(AI_CONTENT_COURSE_TITLES, start=1):
        thumb = AI_CONTENT_THUMB_FILES[i - 1] if i - 1 < len(AI_CONTENT_THUMB_FILES) else f"{_slug_index('ai_content', i)}.jpg"
        rows.append((_slug_index("ai_content", i), title, thumb))
    return tuple(rows)


def vault_r2_key_candidates(
    *,
    pack_folder: str,
    slug: str,
    source_filename: str | None = None,
    thumb_filename: str | None = None,
) -> tuple[str, ...]:
    """
    Ordered R2 object keys to probe when linking StreamVideo.original_video.

    Convention:
    - ``stream_videos/vault/{pack}/{slug}.mp4`` for indexed courses
    - ``stream_videos/vault/{pack}/{source_filename}`` for trading catalog filenames
    - ``stream_videos/vault/{pack}/{thumb_stem}.mp4`` from pack thumbnail basename
    - bare ``{source_filename}`` for legacy uploads at bucket root
    """
    pack = (pack_folder or "").strip().strip("/")
    slug_key = (slug or "").strip().lower()
    candidates: list[str] = []
    seen: set[str] = set()

    def add(key: str) -> None:
        key = (key or "").strip().lstrip("/")
        if not key or key in seen:
            return
        seen.add(key)
        candidates.append(key)

    if pack and slug_key:
        add(f"{VAULT_R2_PREFIX}/{pack}/{slug_key}.mp4")
    if pack and source_filename:
        add(f"{VAULT_R2_PREFIX}/{pack}/{source_filename}")
    if pack and thumb_filename:
        add(f"{VAULT_R2_PREFIX}/{pack}/{_thumb_to_mp4(thumb_filename)}")
    if source_filename:
        add(source_filename)
        add(f"stream_videos/originals/{source_filename}")
    if slug_key:
        add(f"{VAULT_R2_PREFIX}/{slug_key}.mp4")
    return tuple(candidates)


def trading_r2_key_candidates(submodule_slug: str) -> tuple[str, ...]:
    row = TRADING_SUBMODULES.get(submodule_slug)
    if not row:
        return ()
    _title, filename = row
    return vault_r2_key_candidates(
        pack_folder="trading",
        slug=submodule_slug,
        source_filename=filename,
    )
