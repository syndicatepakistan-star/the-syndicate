import { resolveClientApiUrl, resolvePortalProxyUrl } from "@/lib/portal-api";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";
import { vaultPackForPlanSlug } from "@/components/programs/vaultPackCatalog";
import {
  isTradingModuleSlug,
  tradingParentModuleForSlug,
} from "@/components/programs/tradingVaultCatalog";

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
    const apiPath = "/api/streaming/vault-playlist-map/";
    const url =
      typeof window !== "undefined"
        ? resolvePortalProxyUrl(apiPath)
        : resolveClientApiUrl(apiPath);
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

export function clearVaultPlaylistMapCache(): void {
  cachedMap = null;
  cachedAt = 0;
  inflight = null;
}

export function vaultPlaylistIdForPlan(
  planSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>
): number | null {
  const key = planSlug.trim().toLowerCase();
  const direct = map.get(key);
  if (direct?.id) return direct.id;

  const pack = vaultPackForPlanSlug(key);
  if (pack && key === pack) {
    for (const [slug, entry] of map.entries()) {
      if (vaultPackForPlanSlug(slug) === pack && entry?.id) {
        return entry.id;
      }
    }
  }

  if (isTradingModuleSlug(key)) {
    for (const [slug, entry] of map.entries()) {
      if (tradingParentModuleForSlug(slug) === key && entry?.id) {
        return entry.id;
      }
    }
  }

  const modulePrefix = `${key}_c`;
  for (const [slug, entry] of map.entries()) {
    if (slug.startsWith(modulePrefix) && entry?.id) {
      return entry.id;
    }
  }
  return null;
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
