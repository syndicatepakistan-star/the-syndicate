/** Split `total` dollars across `count` items (integer dollars; remainder distributed +$1). */
export function distributeDollarPrices(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export const VAULT_PACK_CHECKOUT_USD = 150;
export const VAULT_PACK_COMPARE_USD = 250;
/** Flat à la carte price for Agentic AI + AI Content Automation modules. */
export const VAULT_MODULE_UNIT_USD = 14;
export const VAULT_ALACARTE_AGENTIC_USD = VAULT_MODULE_UNIT_USD * 26;
export const VAULT_ALACARTE_AI_CONTENT_USD = VAULT_MODULE_UNIT_USD * 29;
/** @deprecated Use pack-specific totals above. */
export const VAULT_ALACARTE_TOTAL_USD = VAULT_ALACARTE_AGENTIC_USD;

export const LEVEL1_PROGRAMS_PER_CATEGORY = 11;

/** Business Behaviour Psychology — $99 per program. */
export const BUSINESS_PSYCHOLOGY_UNIT_USD = 99;

/** Business Model — $75 per program. */
export const BUSINESS_MODEL_UNIT_USD = 75;

/** Unlock-all category packs (bundle vs à la carte). */
export const BUSINESS_PSYCHOLOGY_UNLOCK_ALL_USD = 199;
/** Display compare total for psychology unlock-all (11 × $99). */
export const BUSINESS_PSYCHOLOGY_SEPARATE_TOTAL_USD = 1089;
export const BUSINESS_MODELS_UNLOCK_ALL_USD = 175;
/** Display compare total for models unlock-all (marketing copy). */
export const BUSINESS_MODELS_SEPARATE_TOTAL_USD = 824;

export const LEVEL1_BUSINESS_PSYCHOLOGY_PACK_PLAN = "level1_business_psychology" as const;
export const LEVEL1_BUSINESS_MODELS_PACK_PLAN = "level1_business_models" as const;

/** @deprecated Prefer per-program unit prices above. */
export const LEVEL1_CATEGORY_CHECKOUT_USD =
  BUSINESS_MODEL_UNIT_USD * LEVEL1_PROGRAMS_PER_CATEGORY;

/** Business Behaviour Psychology — 11 programs. */
export const BUSINESS_PSYCHOLOGY_PLAYLIST_IDS: readonly number[] = [
  3, 6, 31, 30, 99, 1, 12, 2, 9, 7, 8,
];

/** Business Model — 11 programs. */
export const BUSINESS_MODEL_PLAYLIST_IDS: readonly number[] = [
  21, 28, 25, 20, 14, 23, 19, 24, 13, 16, 17,
];

export const BUSINESS_PSYCHOLOGY_PLAYLIST_PRICES = Array.from(
  { length: BUSINESS_PSYCHOLOGY_PLAYLIST_IDS.length },
  () => BUSINESS_PSYCHOLOGY_UNIT_USD
);

export const BUSINESS_MODEL_PLAYLIST_PRICES = Array.from(
  { length: BUSINESS_MODEL_PLAYLIST_IDS.length },
  () => BUSINESS_MODEL_UNIT_USD
);

export function comparePriceForUnit(unitPrice: number): number {
  return Math.max(unitPrice + 2, Math.round(unitPrice * 1.35));
}
