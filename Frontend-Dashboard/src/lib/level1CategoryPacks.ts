import {
  BUSINESS_MODELS_SEPARATE_TOTAL_USD,
  BUSINESS_MODELS_UNLOCK_ALL_USD,
  BUSINESS_PSYCHOLOGY_SEPARATE_TOTAL_USD,
  BUSINESS_PSYCHOLOGY_UNLOCK_ALL_USD,
  LEVEL1_BUSINESS_MODELS_PACK_PLAN,
  LEVEL1_BUSINESS_PSYCHOLOGY_PACK_PLAN,
} from "@/lib/packPricing";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

export type Level1CategoryPackKey = "business_psychology" | "business_model";

export type Level1CategoryPackDef = {
  category: Level1CategoryPackKey;
  plan: typeof LEVEL1_BUSINESS_PSYCHOLOGY_PACK_PLAN | typeof LEVEL1_BUSINESS_MODELS_PACK_PLAN;
  checkoutAmount: string;
  unlockAllUsd: number;
  separateTotalUsd: number;
  accent: "psychology" | "models";
  shortLabel: string;
  buttonLead: string;
};

export const LEVEL1_CATEGORY_PACKS: Record<Level1CategoryPackKey, Level1CategoryPackDef> = {
  business_psychology: {
    category: "business_psychology",
    plan: LEVEL1_BUSINESS_PSYCHOLOGY_PACK_PLAN,
    checkoutAmount: String(BUSINESS_PSYCHOLOGY_UNLOCK_ALL_USD),
    unlockAllUsd: BUSINESS_PSYCHOLOGY_UNLOCK_ALL_USD,
    separateTotalUsd: BUSINESS_PSYCHOLOGY_SEPARATE_TOTAL_USD,
    accent: "psychology",
    shortLabel: "Business Behaviour Psychology",
    buttonLead: "Unlock all Business Behaviour Psychology programs",
  },
  business_model: {
    category: "business_model",
    plan: LEVEL1_BUSINESS_MODELS_PACK_PLAN,
    checkoutAmount: String(BUSINESS_MODELS_UNLOCK_ALL_USD),
    unlockAllUsd: BUSINESS_MODELS_UNLOCK_ALL_USD,
    separateTotalUsd: BUSINESS_MODELS_SEPARATE_TOTAL_USD,
    accent: "models",
    shortLabel: "Business Models",
    buttonLead: "Unlock all Business Models programs",
  },
};

export function isLevel1CategoryPackPlan(plan: string): boolean {
  const p = plan.trim().toLowerCase();
  return p === LEVEL1_BUSINESS_PSYCHOLOGY_PACK_PLAN || p === LEVEL1_BUSINESS_MODELS_PACK_PLAN;
}

/** True when every listed playlist in the category is already unlocked (or none remain to buy). */
export function categoryPlaylistsFullyUnlocked(
  playlists: readonly StreamPlaylistListItem[],
  category: Level1CategoryPackKey,
): boolean {
  const inCategory =
    category === "business_model"
      ? playlists.filter((pl) => pl.category === "business_model")
      : playlists.filter((pl) => pl.category !== "business_model");
  const purchasable = inCategory.filter((pl) => !pl.is_coming_soon && Number(pl.price) > 0);
  if (purchasable.length === 0) return false;
  return purchasable.every((pl) => pl.is_unlocked);
}
