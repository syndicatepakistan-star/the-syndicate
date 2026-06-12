import { djangoStreamingApiUrl } from "@/lib/djangoBackendOrigin";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

export type VaultPlaylistMapEntry = StreamPlaylistListItem & {
  vault_plan_slug?: string;
};

type VaultPlaylistMapResponse = {
  map?: Record<string, VaultPlaylistMapEntry>;
};

const CACHE_TTL_MS = 2 * 60 * 1000;
let cachedMap: Map<string, VaultPlaylistMapEntry> | null = null;
let cachedAt = 0;
let inflight: Promise<Map<string, VaultPlaylistMapEntry>> | null = null;

function normalizeMap(payload: VaultPlaylistMapResponse): Map<string, VaultPlaylistMapEntry> {
  const raw = payload.map ?? {};
  const out = new Map<string, VaultPlaylistMapEntry>();
  for (const [slug, entry] of Object.entries(raw)) {
    const key = slug.trim().toLowerCase();
    if (!key || !entry?.id) continue;
    out.set(key, entry);
  }
  return out;
}

export async function fetchVaultPlaylistMap(options?: {
  forceRefresh?: boolean;
}): Promise<Map<string, VaultPlaylistMapEntry>> {
  const forceRefresh = options?.forceRefresh === true;
  const now = Date.now();
  if (!forceRefresh && cachedMap && now - cachedAt < CACHE_TTL_MS) {
    return cachedMap;
  }
  if (!forceRefresh && inflight) {
    return inflight;
  }

  inflight = (async () => {
    const url = djangoStreamingApiUrl("/vault-playlist-map/");
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (!response.ok) {
      throw new Error("Could not load vault playlist map.");
    }
    const payload = (await response.json()) as VaultPlaylistMapResponse;
    const map = normalizeMap(payload);
    cachedMap = map;
    cachedAt = Date.now();
    return map;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function vaultPlaylistIdForPlan(
  planSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>
): number | null {
  const entry = map.get(planSlug.trim().toLowerCase());
  return entry?.id ?? null;
}

export function buildVaultModulePlaylistHref(
  planSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
  fallbackPath = "/dashboard?section=programs"
): string {
  const playlistId = vaultPlaylistIdForPlan(planSlug, map);
  if (!playlistId) return fallbackPath;
  return `/dashboard?section=programs&playlist=${playlistId}`;
}
