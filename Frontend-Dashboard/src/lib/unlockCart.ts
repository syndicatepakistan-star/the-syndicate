import {
  isKnightPlanSlug,
  PLAN_OFFERS,
  type CheckoutOfferKey,
  type PlanOfferDef,
  type VaultPackKey,
} from "@/components/programs/planOfferCatalog";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";
import { formatPrice } from "@/lib/currency";

const VAULT_PACK_SLUGS = new Set<VaultPackKey>([
  "agentic_ai",
  "ai_content_automation",
  "trading_technical_analysis",
]);

const TRADING_MODULE_SLUGS = new Set<CheckoutOfferKey>([
  "trading_scalpel_protocol",
  "trading_master_strategies",
  "trading_master_setups",
  "trading_master_secrets",
]);

export type UnlockCartPlanItem = {
  kind: "plan";
  plan: CheckoutOfferKey;
  title: string;
  displayPrice: string;
  checkoutAmount: string;
  imageSrc?: string;
  vaultPackPlan?: VaultPackKey;
};

export type UnlockCartPlaylistItem = {
  kind: "playlist";
  playlistId: number;
  title: string;
  displayPrice: string;
  checkoutAmount: string;
  imageSrc?: string;
};

export type UnlockCartItem = UnlockCartPlanItem | UnlockCartPlaylistItem;

export type UnlockChoiceTarget =
  | { kind: "plan"; offer: PlanOfferDef }
  | { kind: "playlist"; playlist: StreamPlaylistListItem; title: string; teaser?: string };

export const UNLOCK_CART_STORAGE_KEY = "syndicate:unlock-cart:v2";

function isVaultPackSlug(plan: string): plan is VaultPackKey {
  return VAULT_PACK_SLUGS.has(plan as VaultPackKey);
}

function isVaultCourseSlugLocal(value: string): boolean {
  const v = value.trim();
  if (/^agentic_ai_c\d{2}$/.test(v) || /^ai_content_c\d{2}$/.test(v)) return true;
  if (/^trading_(secrets|setups|strategies|scalpel)_\d{2}$/.test(v)) return true;
  return TRADING_MODULE_SLUGS.has(v as CheckoutOfferKey);
}

function isTradingSubmoduleSlugLocal(value: string): boolean {
  return /^trading_(secrets|setups|strategies|scalpel)_\d{2}$/.test(value.trim());
}

export function isUnlockCartEligible(offer: Pick<PlanOfferDef, "plan">): boolean {
  const plan = String(offer.plan).trim();
  if (!plan || isKnightPlanSlug(plan)) return false;
  // Money Mastery uses the same unlock-bucket → checkout path as vault modules.
  if (plan === "bundle") return true;
  if (isTradingSubmoduleSlugLocal(plan)) return false;
  if (isVaultPackSlug(plan)) return true;
  if (isVaultCourseSlugLocal(plan)) return true;
  if (TRADING_MODULE_SLUGS.has(plan as CheckoutOfferKey)) return true;
  return false;
}

export function isPlaylistUnlockCartEligible(playlist: Pick<StreamPlaylistListItem, "is_unlocked" | "is_coming_soon" | "price">): boolean {
  if (playlist.is_unlocked || playlist.is_coming_soon) return false;
  const price = Number(playlist.price);
  return Number.isFinite(price) && price > 0;
}

export function cartItemKey(item: UnlockCartItem): string {
  return item.kind === "playlist" ? `playlist:${item.playlistId}` : `plan:${item.plan}`;
}

export function offerToCartItem(offer: PlanOfferDef): UnlockCartPlanItem {
  return {
    kind: "plan",
    plan: offer.plan,
    title: offer.title,
    displayPrice: offer.displayPrice,
    checkoutAmount: offer.checkoutAmount,
    imageSrc: offer.imageSrc,
    vaultPackPlan: offer.vaultPackPlan,
  };
}

export function playlistToCartItem(
  playlist: StreamPlaylistListItem,
  title: string,
  imageSrc?: string,
): UnlockCartPlaylistItem {
  const amount = Number(playlist.price);
  const checkoutAmount = Number.isFinite(amount) ? String(amount) : "0";
  const cover = typeof playlist.cover_image_url === "string" ? playlist.cover_image_url.trim() : "";
  return {
    kind: "playlist",
    playlistId: playlist.id,
    title,
    displayPrice: formatPrice(checkoutAmount),
    checkoutAmount,
    imageSrc: imageSrc?.trim() || cover || undefined,
  };
}

export function findPackOfferForModule(offer: PlanOfferDef): PlanOfferDef | null {
  const packKey = offer.vaultPackPlan;
  if (!packKey) return null;
  return PLAN_OFFERS.find((row) => row.plan === packKey) ?? null;
}

export function cartItemTotal(items: readonly UnlockCartItem[]): number {
  return items.reduce((sum, item) => sum + Number(item.checkoutAmount || 0), 0);
}

export function formatCartTotal(items: readonly UnlockCartItem[]): string {
  const total = cartItemTotal(items);
  if (!Number.isFinite(total) || total <= 0) return formatPrice(0);
  return formatPrice(total);
}

function parseStoredCartItem(entry: unknown): UnlockCartItem | null {
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title : "";
  const displayPrice = typeof row.displayPrice === "string" ? row.displayPrice : "";
  const checkoutAmount = typeof row.checkoutAmount === "string" ? row.checkoutAmount : "";
  if (!title || !checkoutAmount) return null;

  if (row.kind === "playlist" || typeof row.playlistId === "number") {
    const playlistId = Number(row.playlistId);
    if (!Number.isFinite(playlistId) || playlistId <= 0) return null;
    return {
      kind: "playlist",
      playlistId,
      title,
      displayPrice,
      checkoutAmount,
      imageSrc: typeof row.imageSrc === "string" ? row.imageSrc : undefined,
    };
  }

  const plan = typeof row.plan === "string" ? (row.plan as CheckoutOfferKey) : null;
  if (!plan) return null;
  return {
    kind: "plan",
    plan,
    title,
    displayPrice,
    checkoutAmount,
    imageSrc: typeof row.imageSrc === "string" ? row.imageSrc : undefined,
    vaultPackPlan: typeof row.vaultPackPlan === "string" ? (row.vaultPackPlan as VaultPackKey) : undefined,
  };
}

export function readUnlockCartFromStorage(): UnlockCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(UNLOCK_CART_STORAGE_KEY);
    if (!raw) {
      const legacy = window.sessionStorage.getItem("syndicate:unlock-cart:v1");
      if (!legacy) return [];
      const parsedLegacy = JSON.parse(legacy) as unknown;
      if (!Array.isArray(parsedLegacy)) return [];
      return parsedLegacy
        .map((entry) => parseStoredCartItem({ ...(entry as object), kind: "plan" }))
        .filter((item): item is UnlockCartItem => item !== null);
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseStoredCartItem).filter((item): item is UnlockCartItem => item !== null);
  } catch {
    return [];
  }
}

export function writeUnlockCartToStorage(items: readonly UnlockCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (!items.length) {
      window.sessionStorage.removeItem(UNLOCK_CART_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(UNLOCK_CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota / private mode errors.
  }
}

/** Drop cart rows the user already owns (plan slugs and/or unlocked playlists). */
export function filterOwnedUnlockCartItems(
  items: readonly UnlockCartItem[],
  owned: {
    planSlugs?: ReadonlySet<string> | readonly string[];
    unlockedPlaylistIds?: ReadonlySet<number> | readonly number[];
  },
): UnlockCartItem[] {
  const slugSet =
    owned.planSlugs instanceof Set
      ? owned.planSlugs
      : new Set(
          Array.from(owned.planSlugs ?? [])
            .map((s) => String(s).trim().toLowerCase())
            .filter(Boolean),
        );
  const playlistSet =
    owned.unlockedPlaylistIds instanceof Set
      ? owned.unlockedPlaylistIds
      : new Set(
          Array.from(owned.unlockedPlaylistIds ?? [])
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0),
        );

  return items.filter((item) => {
    if (item.kind === "plan") {
      const plan = String(item.plan || "").trim().toLowerCase();
      if (!plan) return true;
      if (slugSet.has(plan)) return false;
      if (item.vaultPackPlan && slugSet.has(String(item.vaultPackPlan).trim().toLowerCase())) return false;
      return true;
    }
    return !playlistSet.has(item.playlistId);
  });
}

export function clearUnlockCartStorage(): void {
  writeUnlockCartToStorage([]);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem("syndicate:unlock-cart:v1");
  } catch {
    // Ignore storage exceptions.
  }
}

export function cartContainsKey(items: readonly UnlockCartItem[], key: string): boolean {
  return items.some((item) => cartItemKey(item) === key);
}

export function resolvePlanOfferBySlug(plan: CheckoutOfferKey): PlanOfferDef | undefined {
  const direct = PLAN_OFFERS.find((row) => row.plan === plan);
  if (direct) return direct;

  const { vaultCoursesForPack } = require("@/components/programs/vaultPackCatalog") as typeof import("@/components/programs/vaultPackCatalog");
  const { allTradingSubmoduleOffers } = require("@/components/programs/tradingVaultCatalog") as typeof import("@/components/programs/tradingVaultCatalog");

  for (const pack of VAULT_PACK_SLUGS) {
    const found = vaultCoursesForPack(pack).find((row) => row.plan === plan);
    if (found) return found;
  }
  return allTradingSubmoduleOffers().find((row) => row.plan === plan);
}

export function resolvePlanOfferByTitle(title: string): PlanOfferDef | undefined {
  const needle = title.trim().toLowerCase();
  if (!needle) return undefined;
  const direct = PLAN_OFFERS.find((row) => row.title.trim().toLowerCase() === needle);
  if (direct) return direct;

  const { vaultCoursesForPack } = require("@/components/programs/vaultPackCatalog") as typeof import("@/components/programs/vaultPackCatalog");
  const { allTradingSubmoduleOffers } = require("@/components/programs/tradingVaultCatalog") as typeof import("@/components/programs/tradingVaultCatalog");

  for (const pack of VAULT_PACK_SLUGS) {
    const found = vaultCoursesForPack(pack).find((row) => row.title.trim().toLowerCase() === needle);
    if (found) return found;
  }
  return allTradingSubmoduleOffers().find((row) => row.title.trim().toLowerCase() === needle);
}
