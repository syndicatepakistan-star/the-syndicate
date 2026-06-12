import catalogEntries from "@/data/stream-playlist-catalog.json";
import {
  getProgramDisplayTitle,
  getProgramPlaylistThumbnail,
  PUBLIC_BUSINESS_MODEL_PROGRAM_ORDER,
  PUBLIC_PROGRAMS_PAGE_IDS,
} from "@/lib/programPlaylistThumbnails";
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
  if (/the hook/i.test(text) || /what you will learn/i.test(text) || /the core protocol/i.test(text)) {
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

  const hookMatch = normalized.match(
    /(?:^|\n)\s*The Hook\s*\n+([\s\S]*?)(?=\n\s*\n\s*(?:The Core Protocol|What you will|$))/i
  );
  const hookParagraph = hookMatch?.[1]?.replace(/\s+/g, " ").trim();
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
  return getProgramDisplayTitle(id, fromApi ?? catalogTitle);
}

export function resolveProgramPlaylistDescription(playlist: ProgramPlaylistLike): string {
  const fromApi = (playlist.description ?? "").trim();
  const catalog = findProgramCatalogEntry(playlist);
  if (isSubstantialProgramDescription(fromApi)) return fromApi;
  if (catalog?.description?.trim()) return catalog.description.trim();
  return fromApi;
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
  const catalog = findProgramCatalogEntry(playlist);
  const thumbId = catalog?.id ?? playlist.id;
  const staticThumb = getProgramPlaylistThumbnail(thumbId);
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

function publicPlaylistCategory(id: number): StreamPlaylistListItem["category"] {
  return PUBLIC_BUSINESS_MODEL_PROGRAM_ORDER.includes(id) ? "business_model" : "business_psychology";
}

/** Ensure allowlisted public programs render even when the API omits them. */
export function fillMissingPublicProgramPlaylists(
  playlists: StreamPlaylistListItem[]
): StreamPlaylistListItem[] {
  const byId = new Map(playlists.map((playlist) => [playlist.id, playlist]));
  const merged = [...playlists];

  for (const id of PUBLIC_PROGRAMS_PAGE_IDS) {
    if (byId.has(id)) continue;
    const entry = BY_ID.get(id);
    if (!entry) continue;
    merged.push({
      id: entry.id,
      title: getProgramDisplayTitle(entry.id, entry.title),
      slug: entry.slug,
      category: publicPlaylistCategory(entry.id),
      description: entry.description,
      price: "40.00",
      rating: "4.0",
      cover_image_url: null,
      video_count: 0,
      is_published: true,
      is_coming_soon: false,
      created_at: "1970-01-01T00:00:00.000Z",
    });
  }

  return merged;
}
