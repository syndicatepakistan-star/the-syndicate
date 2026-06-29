import { resolveClientApiUrl, resolvePortalProxyUrl } from "@/lib/portal-api";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";
import {
  isVaultPackKey,
  vaultCoursesForPack,
  vaultDisplayGroupsForPack,
  vaultPackForPlanSlug,
} from "@/components/programs/vaultPackCatalog";
import { userHasVaultPlanAccess } from "@/components/programs/vaultUnlock";
import {
  isTradingModuleSlug,
  tradingParentModuleForSlug,
} from "@/components/programs/tradingVaultCatalog";

export type VaultPlaylistUnlockContext = {
  purchasedSlugs?: ReadonlySet<string>;
  accessTier?: string | null;
  moneyMasteryActive?: boolean | null;
};

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

export function buildDashboardPackHref(packSlug: string): string {
  const pack = packSlug.trim().toLowerCase();
  return `/dashboard?section=programs&pack=${encodeURIComponent(pack)}`;
}

/** First module playlist in catalog order (used after full-pack checkout). */
export function vaultDefaultPlaylistIdForPack(
  packSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
): number | null {
  const key = packSlug.trim().toLowerCase();
  if (!isVaultPackKey(key)) return null;

  if (key === "trading_technical_analysis") {
    for (const group of vaultDisplayGroupsForPack(key)) {
      if (!group.parent) continue;
      const id = vaultPlaylistIdForPlan(group.parent.plan, map);
      if (id) return id;
    }
  }

  for (const course of vaultCoursesForPack(key)) {
    const id = vaultPlaylistIdForPlan(course.plan, map);
    if (id) return id;
  }
  return null;
}

/** First owned module playlist for a pack; falls back to catalog default. */
export function vaultFirstUnlockedPlaylistIdForPlan(
  planSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
  context?: VaultPlaylistUnlockContext,
): number | null {
  const key = planSlug.trim().toLowerCase();
  if (!isVaultPackKey(key)) {
    return vaultPlaylistIdForPlan(key, map);
  }

  const purchasedSlugs = context?.purchasedSlugs ?? new Set<string>();
  const { accessTier, moneyMasteryActive } = context ?? {};
  const pickIfAccessible = (modulePlan: string): number | null => {
    if (!userHasVaultPlanAccess(modulePlan, purchasedSlugs, accessTier, moneyMasteryActive, key)) {
      return null;
    }
    return vaultPlaylistIdForPlan(modulePlan, map);
  };

  if (key === "trading_technical_analysis") {
    for (const group of vaultDisplayGroupsForPack(key)) {
      if (group.parent) {
        const id = pickIfAccessible(group.parent.plan);
        if (id) return id;
      }
    }
  }

  for (const course of vaultCoursesForPack(key)) {
    const id = pickIfAccessible(course.plan);
    if (id) return id;
  }

  return vaultDefaultPlaylistIdForPack(key, map);
}

/** After checkout or Open: packs and modules route to their lesson playlist. */
export function buildVaultModulePlaylistHref(
  planSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
  fallbackPath = "/dashboard?section=programs",
  context?: VaultPlaylistUnlockContext,
): string {
  const key = planSlug.trim().toLowerCase();
  const playlistId = isVaultPackKey(key)
    ? vaultFirstUnlockedPlaylistIdForPlan(key, map, context) ?? vaultDefaultPlaylistIdForPack(key, map)
    : vaultPlaylistIdForPlan(key, map);
  if (!playlistId) {
    return isVaultPackKey(key) ? buildDashboardPackHref(key) : fallbackPath;
  }
  return `/dashboard?section=programs&playlist=${playlistId}`;
}
