import { djangoStreamingApiUrl } from "@/lib/djangoBackendOrigin";
import { resolveClientApiUrl } from "@/lib/portal-api";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

export async function fetchPublicPlaylistsServer(): Promise<StreamPlaylistListItem[]> {
  try {
    const url =
      djangoStreamingApiUrl("public-playlists") ||
      resolveClientApiUrl("/api/streaming/public-playlists/");
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as StreamPlaylistListItem[]) : [];
  } catch {
    return [];
  }
}
