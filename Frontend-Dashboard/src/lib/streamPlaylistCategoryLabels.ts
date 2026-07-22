import type { StreamPlaylistListItem } from "@/lib/streaming-api";

/** User-facing playlist column / filter labels (DB key stays `business_psychology`). */
export const STREAM_PLAYLIST_CATEGORY_LABELS = {
  business_model: "Real World Business Models",
  business_psychology: "Business Behaviour Psychology",
} as const;

/** Two-line desktop headings (all caps via CSS `uppercase`). */
export const STREAM_PLAYLIST_CATEGORY_HEADING_LINES = {
  business_psychology: ["Business Behaviour", "Psychology"] as const,
  business_model: ["Real World", "Business Models"] as const,
} as const;

/** Column title glow + scale (programs library + dashboard grids). */
export const PLAYLIST_CATEGORY_HEADING_CLASS = {
  psychology:
    "public-heading-lightning public-heading-lightning--fuchsia playlist-category-heading-lightning text-center font-mono font-black uppercase tracking-[0.1em] sm:tracking-[0.14em]",
  businessModels:
    "public-heading-lightning public-heading-lightning--cyan playlist-category-heading-lightning text-center font-mono font-black uppercase tracking-[0.1em] sm:tracking-[0.14em]",
  /** Side-by-side headers (mobile / iPad before xl). */
  splitSize: "text-[14pt] leading-[1.05] md:text-[28pt] md:leading-[1.05]",
  /** Stacked column headers (desktop xl). */
  columnSize: "text-[28pt] leading-[1.05]",
  /** Equal-height slot — split view centers headings; desktop columns align to card grid. */
  splitHeadingSlot:
    "playlist-category-heading-slot playlist-category-heading-slot--split flex w-full justify-center px-1 text-center",
  columnHeadingSlot:
    "playlist-category-heading-slot playlist-category-heading-slot--column flex w-full items-end justify-center pb-1 text-center",
  /** Shared two-line stack (mobile + desktop). */
  twoLineStack: "playlist-category-two-line",
  twoLineLead: "playlist-category-two-line__lead",
  twoLineTail: "playlist-category-two-line__tail",
  /** @deprecated use splitHeadingSlot or columnHeadingSlot */
  headingSlot:
    "playlist-category-heading-slot flex w-full min-h-[calc(14pt*3.2)] items-center justify-center px-1 text-center md:min-h-[calc(28pt*2.1)] xl:min-h-[calc(28pt*2.1)] xl:items-end xl:pb-1",
} as const;

export type StreamPlaylistCategoryKey = keyof typeof STREAM_PLAYLIST_CATEGORY_LABELS;

export function streamPlaylistCategoryLabel(
  category: StreamPlaylistListItem["category"] | StreamPlaylistCategoryKey
): string {
  return STREAM_PLAYLIST_CATEGORY_LABELS[category] ?? category;
}

export function streamPlaylistCategoryTwoLine(
  category: StreamPlaylistCategoryKey,
): { lead: string; tail: string } {
  const lines = STREAM_PLAYLIST_CATEGORY_HEADING_LINES[category];
  return { lead: lines[0], tail: lines[1] };
}
