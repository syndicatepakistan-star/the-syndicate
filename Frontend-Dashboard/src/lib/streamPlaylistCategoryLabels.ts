import type { StreamPlaylistListItem } from "@/lib/streaming-api";

/** User-facing playlist column / filter labels (DB key stays `business_psychology`). */
export const STREAM_PLAYLIST_CATEGORY_LABELS = {
  business_model: "Business Model",
  business_psychology: "Business Behaviour Psychology",
} as const;

export type StreamPlaylistCategoryKey = keyof typeof STREAM_PLAYLIST_CATEGORY_LABELS;

export function streamPlaylistCategoryLabel(
  category: StreamPlaylistListItem["category"] | StreamPlaylistCategoryKey
): string {
  return STREAM_PLAYLIST_CATEGORY_LABELS[category] ?? category;
}
