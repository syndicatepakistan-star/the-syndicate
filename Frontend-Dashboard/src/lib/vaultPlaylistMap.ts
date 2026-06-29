import type { VaultPackKey } from "@/components/programs/planOfferCatalog";
import { PLAN_OFFERS_VAULT } from "@/components/programs/planOfferCatalog";
import {
  isVaultPackKey,
  vaultPackForPlanSlug,
} from "@/components/programs/vaultPackCatalog";
import { userHasVaultPlanAccess } from "@/components/programs/vaultUnlock";
import {
  isTradingModuleSlug,
  tradingParentModuleForSlug,
} from "@/components/programs/tradingVaultCatalog";
import { isVaultSubmoduleStreamPlaylist } from "@/lib/programPlaylistThumbnails";
import { resolveClientApiUrl, resolvePortalProxyUrl } from "@/lib/portal-api";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

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

function packTitleNeedle(pack: VaultPackKey): string {
  const offer = PLAN_OFFERS_VAULT.find((item) => item.plan === pack);
  return (offer?.title ?? pack.replace(/_/g, " ")).trim().toLowerCase();
}

function titleMatchesPack(title: string, pack: VaultPackKey): boolean {
  const needle = packTitleNeedle(pack);
  const hay = title.trim().toLowerCase();
  if (!hay || !needle) return false;
  return hay === needle || hay.includes(needle) || needle.includes(hay);
}

/** Pack-level StreamPlaylist (e.g. live id 289 Agentic AI) — never a submodule lesson row. */
export function resolveVaultPackPlaylistId(
  pack: VaultPackKey,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
  streamPlaylists?: readonly StreamPlaylistListItem[],
): number | null {
  const direct = map.get(pack);
  if (direct?.id) return direct.id;

  if (streamPlaylists?.length) {
    for (const pl of streamPlaylists) {
      const vaultSlug = (pl.vault_plan_slug ?? "").trim().toLowerCase();
      if (vaultSlug === pack) return pl.id;
      if (isVaultSubmoduleStreamPlaylist(pl.vault_plan_slug)) continue;
      if (titleMatchesPack(pl.title ?? "", pack)) return pl.id;
    }
  }
  return null;
}

export function vaultPlaylistIdForPlan(
  planSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
  streamPlaylists?: readonly StreamPlaylistListItem[],
): number | null {
  const key = planSlug.trim().toLowerCase();
  const direct = map.get(key);
  if (direct?.id) return direct.id;

  if (isVaultPackKey(key)) {
    return resolveVaultPackPlaylistId(key, map, streamPlaylists);
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

/** Pack-level playlist for OPEN / post-checkout (not agentic_ai_c01-style submodule rows). */
export function vaultDefaultPlaylistIdForPack(
  packSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
  streamPlaylists?: readonly StreamPlaylistListItem[],
): number | null {
  const key = packSlug.trim().toLowerCase();
  if (!isVaultPackKey(key)) return null;
  return resolveVaultPackPlaylistId(key, map, streamPlaylists);
}

/** Module OPEN: route to that module's playlist. Pack OPEN: route to pack playlist only. */
export function vaultFirstUnlockedPlaylistIdForPlan(
  planSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
  context?: VaultPlaylistUnlockContext,
  streamPlaylists?: readonly StreamPlaylistListItem[],
): number | null {
  const key = planSlug.trim().toLowerCase();
  if (isVaultPackKey(key)) {
    return resolveVaultPackPlaylistId(key, map, streamPlaylists);
  }

  const purchasedSlugs = context?.purchasedSlugs ?? new Set<string>();
  const { accessTier, moneyMasteryActive } = context ?? {};
  const pack = vaultPackForPlanSlug(key);
  if (
    pack &&
    userHasVaultPlanAccess(key, purchasedSlugs, accessTier, moneyMasteryActive, pack)
  ) {
    const moduleId = vaultPlaylistIdForPlan(key, map, streamPlaylists);
    if (moduleId) return moduleId;
  }

  return vaultPlaylistIdForPlan(key, map, streamPlaylists);
}

/** After checkout or Open: packs → pack playlist; modules → module playlist. */
export function buildVaultModulePlaylistHref(
  planSlug: string,
  map: ReadonlyMap<string, VaultPlaylistMapEntry>,
  fallbackPath = "/dashboard?section=programs",
  context?: VaultPlaylistUnlockContext,
  streamPlaylists?: readonly StreamPlaylistListItem[],
): string {
  const key = planSlug.trim().toLowerCase();
  const playlistId = vaultFirstUnlockedPlaylistIdForPlan(key, map, context, streamPlaylists);
  if (!playlistId) {
    return isVaultPackKey(key) ? buildDashboardPackHref(key) : fallbackPath;
  }
  return `/dashboard?section=programs&playlist=${playlistId}`;
}
