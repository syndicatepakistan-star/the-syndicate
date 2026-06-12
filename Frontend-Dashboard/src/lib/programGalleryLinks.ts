import type { StreamPlaylistListItem } from "@/lib/streaming-api";
import {
  CURATED_GLOBE_TILES,
  type CuratedGlobeTile,
  programPlaylistDeepLink,
} from "@/lib/programPlaylistThumbnails";

export type ProgramGalleryImage = CuratedGlobeTile;

/** Filename → playlist title hints when auto-match is ambiguous. */
const FILE_HINTS: Record<string, string> = {
  "wordpress-blog": "WordPress Blog",
  "canvics-to-canva": "Graphics Design Using Canva",
  "flutter-app-building": "App Building (using Flutter)",
  "automaton-name-change": "AI Automations",
  "N8N Ai": "N8N Ai Automation",
  "cyber-dystopian-city": "Amazon KDP",
  "print on demand": "Print On Demand",
};

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(candidate: string, playlistTitle: string): number {
  const a = normalizeTitle(candidate);
  const b = normalizeTitle(playlistTitle);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 72;
  const aTokens = new Set(a.split(" ").filter((t) => t.length > 2));
  const bTokens = new Set(b.split(" ").filter((t) => t.length > 2));
  if (!aTokens.size || !bTokens.size) return 0;
  let overlap = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) overlap += 1;
  }
  return Math.round((overlap / Math.max(aTokens.size, bTokens.size)) * 65);
}

export function matchPlaylistIdForGalleryImage(
  fileName: string,
  alt: string,
  playlists: StreamPlaylistListItem[]
): number | undefined {
  if (!playlists.length) return undefined;

  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const hintTitle = FILE_HINTS[baseName] ?? FILE_HINTS[baseName.toLowerCase()];
  const candidates = [hintTitle, alt, baseName].filter(Boolean) as string[];

  let bestId: number | undefined;
  let bestScore = 0;

  for (const pl of playlists) {
    if (pl.is_coming_soon) continue;
    for (const candidate of candidates) {
      const score = scoreMatch(candidate, pl.title);
      if (score > bestScore) {
        bestScore = score;
        bestId = pl.id;
      }
    }
  }

  return bestScore >= 55 ? bestId : undefined;
}

/** Homepage globe tiles (curated allowlist with explicit hrefs). */
export function getLinkedGlobeGalleryImages(): ProgramGalleryImage[] {
  return [...CURATED_GLOBE_TILES];
}

/** @deprecated Homepage uses CURATED_GLOBE_TILES directly. */
export function attachProgramLinksToGalleryImages(
  images: Array<{ src: string; alt: string; fileName: string }>,
  playlists: StreamPlaylistListItem[]
): ProgramGalleryImage[] {
  return images.map((img) => {
    const programId = matchPlaylistIdForGalleryImage(img.fileName, img.alt, playlists);
    return {
      ...img,
      programId,
      href: programId ? programPlaylistDeepLink(programId) : "/programs",
    };
  });
}
