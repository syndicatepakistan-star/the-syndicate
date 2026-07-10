import catalogEntries from "@/data/stream-playlist-catalog.json";
import { curatedBusinessPsychologyDescription } from "@/data/businessPsychologyProgramDescriptions";
import { curatedBusinessModelDescription } from "@/data/businessModelProgramDescriptions";
import {
  curatedAgenticAiDescription,
  curatedAgenticVaultPackDescription,
} from "@/data/agenticAiVaultProgramDescriptions";
import {
  curatedAiContentDescription,
  curatedAiContentVaultPackDescription,
} from "@/data/aiContentVaultProgramDescriptions";
import { curatedTradingVaultDescription } from "@/components/programs/tradingVaultCopy";
import { curatedTradingVaultPackDescription } from "@/data/tradingVaultPackProgramDescriptions";
import { vaultCourseByTitle } from "@/components/programs/vaultPackCatalog";
import {
  getProgramDisplayTitle,
  getProgramPlaylistThumbnail,
  getVaultModuleThumbnail,
  isHiddenProgramPlaylist,
  isVaultSubmoduleStreamPlaylist,
} from "@/lib/programPlaylistThumbnails";
import {
  LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG,
  LEVEL1_CANONICAL_TITLES,
  LEVEL1_SLUG_DISPLAY_ORDER,
  PUBLIC_LEVEL1_PLAYLIST_SLUGS,
} from "@/lib/level1ProgramCatalog";
import { cleanProgramDescription } from "@/lib/descriptionText";
import { extractProgrammeIntroductionTeaser } from "@/lib/structuredDescription";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

export type ProgramPlaylistCatalogEntry = {
  id: number;
  slug: string;
  title: string;
  description: string;
};

export type ProgramPlaylistLike = {
  id: number;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  vault_plan_slug?: string | null;
};

const ENTRIES = catalogEntries as ProgramPlaylistCatalogEntry[];

const BY_ID = new Map<number, ProgramPlaylistCatalogEntry>(
  ENTRIES.map((entry) => [entry.id, entry])
);

const BY_SLUG = new Map<string, ProgramPlaylistCatalogEntry>(
  ENTRIES.map((entry) => [entry.slug.toLowerCase(), entry])
);

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Match catalog row when API ids shift but slug/title stay stable. */
export function findProgramCatalogEntry(
  playlist: ProgramPlaylistLike
): ProgramPlaylistCatalogEntry | undefined {
  const slug = playlist.slug?.trim().toLowerCase();
  if (slug) {
    const bySlug = BY_SLUG.get(slug);
    if (bySlug) return bySlug;
  }
  const byId = BY_ID.get(playlist.id);
  if (byId) return byId;

  const titleNorm = playlist.title ? normalizeTitle(playlist.title) : "";
  if (!titleNorm) return undefined;

  for (const entry of ENTRIES) {
    const entryNorm = normalizeTitle(entry.title);
    if (entryNorm === titleNorm) return entry;
    if (entryNorm.includes(titleNorm) || titleNorm.includes(entryNorm)) return entry;
  }
  return undefined;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}

/** True when API copy is usable (structured or long enough, not spam-repeated). */
export function isSubstantialProgramDescription(description: string | null | undefined): boolean {
  const text = (description ?? "").trim();
  if (!text) return false;
  if (/programme introduction/i.test(text) || /introduction/i.test(text) || /the hook/i.test(text) || /what you will learn/i.test(text) || /programme description/i.test(text) || /the core protocol/i.test(text)) {
    return true;
  }
  if (text.length < 72) return false;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 10) return false;
  const unique = new Set(words);
  return unique.size / words.length >= 0.38;
}

export function extractProgramSummary(description: string, maxLen = 168): string {
  const normalized = description.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";

  const hookParagraph = extractProgrammeIntroductionTeaser(normalized);
  if (hookParagraph && hookParagraph.length > 36) {
    return truncate(hookParagraph, maxLen);
  }

  const firstParagraph = normalized
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .find((p) => p.length > 36);
  if (firstParagraph) return truncate(firstParagraph, maxLen);

  const flat = normalized.replace(/\s+/g, " ").trim();
  return flat.length > 36 ? truncate(flat, maxLen) : flat;
}

export function resolveProgramPlaylistTitle(playlist: ProgramPlaylistLike): string {
  const catalog = findProgramCatalogEntry(playlist);
  const id = catalog?.id ?? playlist.id;
  const fromApi = playlist.title?.trim();
  const catalogTitle = catalog?.title?.trim();
  return getProgramDisplayTitle(id, fromApi ?? catalogTitle, playlist.slug);
}

export function resolveProgramPlaylistDescription(playlist: ProgramPlaylistLike): string {
  const catalog = findProgramCatalogEntry(playlist);
  const legacyLevel1Slug = LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[playlist.id];
  const rawSlug = playlist.slug?.trim().toLowerCase();
  const slug =
    (rawSlug && PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(rawSlug) ? rawSlug : undefined) ??
    legacyLevel1Slug ??
    (catalog?.id ? LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[catalog.id] : undefined) ??
    rawSlug ??
    catalog?.slug ??
    null;
  const title = catalog?.title ?? playlist.title ?? null;
  const psychology = curatedBusinessPsychologyDescription(slug, title);
  if (psychology) return finalizeProgramDescription(psychology);
  const businessModel = curatedBusinessModelDescription(slug, title);
  if (businessModel) return finalizeProgramDescription(businessModel);
  const trading = curatedTradingVaultDescription(slug, title);
  if (trading) return finalizeProgramDescription(trading);
  const agentic = curatedAgenticAiDescription(slug, title);
  if (agentic) return finalizeProgramDescription(agentic);
  const aiContent = curatedAiContentDescription(slug, title);
  if (aiContent) return finalizeProgramDescription(aiContent);
  const tradingPack = slug === "trading_technical_analysis" ? curatedTradingVaultPackDescription("trading_technical_analysis") : undefined;
  if (tradingPack) return finalizeProgramDescription(tradingPack);
  const agenticPack = slug === "agentic_ai" ? curatedAgenticVaultPackDescription("agentic_ai") : undefined;
  if (agenticPack) return finalizeProgramDescription(agenticPack);
  const aiContentPack =
    slug === "ai_content_automation" ? curatedAiContentVaultPackDescription("ai_content_automation") : undefined;
  if (aiContentPack) return finalizeProgramDescription(aiContentPack);
  const fromApi = (playlist.description ?? "").trim();
  if (isSubstantialProgramDescription(fromApi)) return finalizeProgramDescription(fromApi);
  if (catalog?.description?.trim()) return finalizeProgramDescription(catalog.description.trim());
  return finalizeProgramDescription(fromApi);
}

/** Fix legacy mojibake where em dashes were stored as ù. */
function sanitizeLegacyDescriptionEncoding(text: string): string {
  return text
    .replace(/ù/g, "—")
    .replace(/Æ/g, "'")
    .replace(/û/g, "—");
}

function finalizeProgramDescription(text: string): string {
  return cleanProgramDescription(sanitizeLegacyDescriptionEncoding(text));
}

export function resolveProgramPlaylistSummary(playlist: ProgramPlaylistLike): string {
  const description = resolveProgramPlaylistDescription(playlist);
  const summary = extractProgramSummary(description);
  if (summary) return summary;
  const title = resolveProgramPlaylistTitle(playlist);
  return `Explore ${title} — structured lessons and tactical frameworks inside the Syndicate library.`;
}

/**
 * Cover for program cards and path tiles.
 * Curated static assets (homepage globe) win over Django admin uploads so public pages stay in sync.
 */
export function resolveProgramPlaylistThumbnail(
  playlist: ProgramPlaylistLike,
  djangoCover?: string | null
): string | undefined {
  const vaultSlug = playlist.vault_plan_slug?.trim().toLowerCase();
  if (vaultSlug) {
    const vaultThumb = getVaultModuleThumbnail(vaultSlug);
    if (vaultThumb) return vaultThumb;
  }
  const title = playlist.title?.trim();
  if (title) {
    const vaultCourse = vaultCourseByTitle(title);
    if (vaultCourse?.imageSrc) return vaultCourse.imageSrc;
  }
  const catalog = findProgramCatalogEntry(playlist);
  const thumbId = catalog?.id ?? playlist.id;
  const staticThumb = getProgramPlaylistThumbnail(thumbId, playlist.slug);
  if (staticThumb) return staticThumb;
  const cover = (djangoCover ?? "").trim();
  return cover || undefined;
}

/** Merge API playlist with catalog fallbacks for UI. */
export function enrichProgramPlaylist<T extends ProgramPlaylistLike>(playlist: T): T {
  return {
    ...playlist,
    title: resolveProgramPlaylistTitle(playlist),
    description: resolveProgramPlaylistDescription(playlist),
  };
}

function level1SlugCategory(slug: string): StreamPlaylistListItem["category"] {
  return slug.includes("model") ? "business_model" : "business_psychology";
}

function titleMatchesCanonical(playlistTitle: string, slug: string): boolean {
  const canonical = LEVEL1_CANONICAL_TITLES[slug];
  if (!canonical) return false;
  const a = normalizeTitle(playlistTitle);
  const b = normalizeTitle(canonical);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aTokens = a.split(" ").filter((t) => t.length > 2);
  const bTokens = b.split(" ").filter((t) => t.length > 2);
  if (aTokens.length === 0 || bTokens.length === 0) return false;
  const overlap = bTokens.filter((t) => aTokens.includes(t)).length;
  return overlap / bTokens.length >= 0.72;
}

function stubPlaylistForLevel1Slug(slug: string): StreamPlaylistListItem | null {
  const legacyId = Number(
    Object.entries(LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG).find(([, value]) => value === slug)?.[0],
  );
  if (!Number.isFinite(legacyId)) return null;
  const entry = BY_ID.get(legacyId);
  if (!entry) return null;
  return {
    id: entry.id,
    title: getProgramDisplayTitle(entry.id, entry.title, slug),
    slug,
    category: level1SlugCategory(slug),
    description: entry.description,
    price:
      entry.id === 99
        ? "49.00"
        : entry.id === 31
          ? "39.00"
          : entry.id === 30
            ? "40.00"
            : "40.00",
    rating: "4.0",
    cover_image_url: null,
    video_count: 0,
    is_published: true,
    is_coming_soon: entry.id === 99,
    created_at: "1970-01-01T00:00:00.000Z",
  };
}

function findPlaylistForLevel1Slug(
  slug: string,
  pool: StreamPlaylistListItem[],
  usedIds: Set<number>,
): StreamPlaylistListItem | undefined {
  const bySlug = pool.find((pl) => !usedIds.has(pl.id) && pl.slug?.trim().toLowerCase() === slug);
  if (bySlug) return bySlug;

  const byTitle = pool.find(
    (pl) => !usedIds.has(pl.id) && pl.title && titleMatchesCanonical(pl.title, slug),
  );
  if (byTitle) return byTitle;

  return pool.find((pl) => {
    if (usedIds.has(pl.id)) return false;
    return LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[pl.id] === slug;
  });
}

/**
 * One card per Level 1 program (11 psychology + 11 business model).
 * Deduplicates legacy numeric ids vs seeded level1-* slugs from the API.
 */
export function normalizeLevel1ProgramPlaylists(
  playlists: StreamPlaylistListItem[],
): StreamPlaylistListItem[] {
  const pool = playlists.filter((pl) => {
    if (isVaultSubmoduleStreamPlaylist(pl.vault_plan_slug)) return false;
    if (
      isHiddenProgramPlaylist(pl.id, {
        slug: pl.slug,
        title: pl.title,
        vault_plan_slug: pl.vault_plan_slug,
      })
    ) {
      return false;
    }
    const slug = pl.slug?.trim().toLowerCase();
    if (slug && PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(slug)) return true;
    if (LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[pl.id]) return true;
    return Object.keys(LEVEL1_CANONICAL_TITLES).some((key) =>
      titleMatchesCanonical(pl.title ?? "", key),
    );
  });

  const usedIds = new Set<number>();
  const out: StreamPlaylistListItem[] = [];

  for (const slug of LEVEL1_SLUG_DISPLAY_ORDER) {
    const match = findPlaylistForLevel1Slug(slug, pool, usedIds);
    let row: StreamPlaylistListItem;
    if (match) {
      usedIds.add(match.id);
      row = {
        ...match,
        slug,
        category: level1SlugCategory(slug),
        title: getProgramDisplayTitle(match.id, match.title, slug),
      };
    } else {
      const stub = stubPlaylistForLevel1Slug(slug);
      if (!stub) continue;
      row = stub;
    }
    out.push(enrichProgramPlaylist(row));
  }

  return out;
}

/** Owned mid-ticket vault modules surface in the dashboard Business Model grid. */
export function ownedVaultSubmodulePlaylistsForDashboard(
  playlists: StreamPlaylistListItem[],
): StreamPlaylistListItem[] {
  return playlists
    .filter((pl) => {
      if (!isVaultSubmoduleStreamPlaylist(pl.vault_plan_slug)) return false;
      if (pl.is_coming_soon) return false;
      return !!pl.is_unlocked;
    })
    .map((pl) => {
      const slug = pl.slug?.trim().toLowerCase() ?? "";
      return enrichProgramPlaylist({
        ...pl,
        category: "business_model",
        title: getProgramDisplayTitle(pl.id, pl.title, slug || undefined),
      });
    });
}

/** Map legacy ?program= id or direct API id → playlist id for highlight / checkout. */
export function resolveProgramPlaylistHighlightId(
  playlists: StreamPlaylistListItem[],
  requestedId: number,
): number | undefined {
  const normalized = normalizeLevel1ProgramPlaylists(playlists);
  const direct = normalized.find((pl) => pl.id === requestedId);
  if (direct) return direct.id;
  const slug = LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[requestedId];
  if (!slug) return undefined;
  return normalized.find((pl) => pl.slug?.trim().toLowerCase() === slug)?.id;
}

/** Resolve ?slug=level1-psych-03 → playlist id for card highlight. */
export function resolveProgramPlaylistHighlightSlug(
  playlists: StreamPlaylistListItem[],
  slug: string,
): number | undefined {
  const normalized = normalizeLevel1ProgramPlaylists(playlists);
  const key = slug.trim().toLowerCase();
  if (!key) return undefined;
  return normalized.find((pl) => pl.slug?.trim().toLowerCase() === key)?.id;
}

/** @deprecated Use normalizeLevel1ProgramPlaylists */
export function fillMissingPublicProgramPlaylists(
  playlists: StreamPlaylistListItem[],
): StreamPlaylistListItem[] {
  return normalizeLevel1ProgramPlaylists(playlists);
}
