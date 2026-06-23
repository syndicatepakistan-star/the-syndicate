"""
R2 object-key candidates for HLS (index.m3u8) and legacy MP4 uploads.

Bucket layout (syn-bucket):
  Agentic AI/{title}/{inner}/index.m3u8
  Ai Content Automation/{title}/{inner}/index.m3u8
  Business Psychology/{program}/{lesson}/index.m3u8
  Business Models/{program}/{lesson}/index.m3u8
  Trading with Advanced Technical Analysis/{module}/{chapter}/index.m3u8
"""

from __future__ import annotations

from accounts.level1_program_catalog import Level1ProgramRow
from accounts.trading_vault_catalog import TRADING_MODULE_TITLES, TRADING_SUBMODULES
from accounts.vault_plan_catalog import AGENTIC_AI_COURSE_TITLES, AI_CONTENT_COURSE_TITLES

R2_AGENTIC_ROOT = "Agentic AI"
R2_AI_CONTENT_ROOT = "Ai Content Automation"
R2_TRADING_ROOT = "Trading with Advanced Technical Analysis"

TRADING_MODULE_R2_FOLDER: dict[str, str] = {
    "trading_master_secrets": "Secrets",
    "trading_master_setups": "Setups",
    "trading_master_strategies": "Strategies",
    "trading_scalpel_protocol": "The Scalpel Protocol Architecting Wealth on the 1-Minute Chart",
}

# Submodule slug → chapter folder inside the module folder (override when upload name differs).
TRADING_SUBMODULE_R2_FOLDER: dict[str, str] = {
    "trading_scalpel_01": "Chapter 1 - Introduction Course",
    "trading_scalpel_02": "Chapter 2 - Bull and Bear Flags",
    "trading_scalpel_03": "Chapter 3 - Falling Wedges",
    "trading_scalpel_04": "Chapter 4 - Rising Wedges",
    "trading_scalpel_05": "Chapter 5 - Moving Averages Strategies",
    "trading_scalpel_06": "Chapter 6 - Parallels and Channels",
    "trading_scalpel_07": "Chapter 7 - Final Protocol",
    "trading_scalpel_08": "Chapter 8 - Retrace to the Scene of Crime",
    "trading_scalpel_09": "Chapter 9 - Risk Management",
    "trading_scalpel_10": "Chapter 10 - Final Execution",
}

# AI Content lessons where inner folder name differs from the display title.
AI_CONTENT_R2_INNER: dict[int, str] = {
    16: "50 Easy Faceless Niches Explained Final",
}


def _join(*parts: str) -> str:
    return "/".join(p.strip().strip("/") for p in parts if p and p.strip())


def hls_manifest_candidates(*path_parts: str) -> tuple[str, ...]:
    base = _join(*path_parts)
    if not base:
        return ()
    candidates: list[str] = []
    seen: set[str] = set()

    def add(key: str) -> None:
        key = key.strip().lstrip("/")
        if key and key not in seen:
            seen.add(key)
            candidates.append(key)

    add(_join(base, "index.m3u8"))
    add(_join(base, "index.M3U8"))
    return tuple(candidates)


def level1_hls_candidates(row: Level1ProgramRow) -> tuple[str, ...]:
    return hls_manifest_candidates(row.r2_root, row.r2_outer_folder, row.r2_lesson_folder)


def agentic_hls_candidates(title: str, inner_folder: str | None = None) -> tuple[str, ...]:
    inner = (inner_folder or title).strip()
    return hls_manifest_candidates(R2_AGENTIC_ROOT, title, inner)


def ai_content_hls_candidates(title: str, lesson_index: int) -> tuple[str, ...]:
    inner = AI_CONTENT_R2_INNER.get(lesson_index, title)
    return hls_manifest_candidates(R2_AI_CONTENT_ROOT, title, inner)


def trading_hls_candidates(submodule_slug: str) -> tuple[str, ...]:
    row = TRADING_SUBMODULES.get(submodule_slug)
    if not row:
        return ()
    title, _legacy_mp4 = row
    parent = None
    from accounts.trading_vault_catalog import TRADING_SUBMODULE_PARENT

    parent_slug = TRADING_SUBMODULE_PARENT.get(submodule_slug)
    if parent_slug:
        module_folder = TRADING_MODULE_R2_FOLDER.get(parent_slug, parent_slug)
    else:
        module_folder = submodule_slug
    chapter_folder = TRADING_SUBMODULE_R2_FOLDER.get(submodule_slug, title)
    return hls_manifest_candidates(R2_TRADING_ROOT, module_folder, chapter_folder)


def all_hls_candidates_for_plan_slug(plan_slug: str, title: str, *, lesson_index: int = 0) -> tuple[str, ...]:
    """Resolve HLS manifest keys for vault / level1 catalog slugs."""
    plan_slug = (plan_slug or "").strip().lower()
    if plan_slug.startswith("agentic_ai_c"):
        return agentic_hls_candidates(title)
    if plan_slug.startswith("ai_content_c"):
        try:
            idx = int(plan_slug.split("_c")[-1])
        except ValueError:
            idx = lesson_index
        return ai_content_hls_candidates(title, idx)
    if plan_slug.startswith("trading_"):
        return trading_hls_candidates(plan_slug)
    return ()


def legacy_mp4_candidates(*parts: str) -> tuple[str, ...]:
    """Fallback keys for non-segment uploads."""
    base = _join(*parts)
    if not base:
        return ()
    return (
        f"{base}.mp4",
        f"stream_videos/vault/{base}.mp4",
        f"stream_videos/originals/{base}.mp4",
    )
