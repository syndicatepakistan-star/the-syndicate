import { PUBLIC_PROGRAMS_PAGE_IDS } from "@/lib/programPlaylistThumbnails";

export type KnightPlaylistOption = {
  id: number;
  title: string;
  thumbnail_url?: string | null;
  vault_plan_slug?: string | null;
};

/** Standalone /programs library rows only — no vault or mid-ticket rows. */
export function isKnightSelectablePlaylist(playlist: KnightPlaylistOption): boolean {
  const vaultSlug = (playlist.vault_plan_slug ?? "").trim();
  if (vaultSlug) return false;
  return PUBLIC_PROGRAMS_PAGE_IDS.has(playlist.id);
}

export function filterKnightSelectablePlaylists<T extends KnightPlaylistOption>(playlists: T[]): T[] {
  return playlists.filter(isKnightSelectablePlaylist);
}
