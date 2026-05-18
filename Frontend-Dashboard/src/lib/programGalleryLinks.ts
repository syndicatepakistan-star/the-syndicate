import type { StreamPlaylistListItem } from "@/lib/streaming-api";
import {
  GLOBE_FILENAME_TO_PROGRAM_ID,
  programPlaylistDeepLink,
} from "@/lib/programPlaylistThumbnails";

export type ProgramGalleryImage = {
  src: string;
  alt: string;
  fileName: string;
  programId?: number;
  href?: string;
};

/** Filename → playlist title hints when auto-match is ambiguous. */
const FILE_HINTS: Record<string, string> = {
  "wordpress-blog": "WordPress Blog",
  "canvics-to-canva": "Graphics Design Using Canva",
  "flutter-app-building": "App Building (using Flutter)",
  "automaton-name-change": "AI Automations",
  "new-project": "Crypto Trading with Technical Analysis Course",
  "dystopian-demand": "Print On Demand Clothing",
  "make_best_thumbnails_or_cover_image_of_program_python_programming__dystopian_cyber__pds64wpqtzleuu2ucwkp_0":
    "Python Programming",
  "new-project (12)": "Building Apps using React JS",
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

function programHref(programId: number): string {
  return programPlaylistDeepLink(programId);
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
  const mapped = GLOBE_FILENAME_TO_PROGRAM_ID[fileName];
  if (mapped != null) return mapped;

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

export function attachProgramLinksToGalleryImages(
  images: Array<{ src: string; alt: string; fileName: string }>,
  playlists: StreamPlaylistListItem[]
): ProgramGalleryImage[] {
  return images.map((img) => {
    const programId =
      GLOBE_FILENAME_TO_PROGRAM_ID[img.fileName] ??
      matchPlaylistIdForGalleryImage(img.fileName, img.alt, playlists);
    return {
      ...img,
      programId,
      href: programId ? programHref(programId) : "/programs",
    };
  });
}
