/**
 * TEMPORARY test pricing — flip `TEMP_TEST_PRICING_ENABLED` to false (or empty the map)
 * when you want production prices restored on the frontend.
 *
 * Also run the matching video_streaming migration reverse / new migration after tests.
 */

export const TEMP_TEST_PRICING_ENABLED = true;

/** Flat promo amount used for every temp override below. */
export const TEMP_TEST_PRICE_USD = 0.5;

/**
 * Plan / vault_plan_slug / level1 playlist slug → test price.
 * Production restore: set ENABLED false and empty this map.
 */
export const TEMP_TEST_PRICE_BY_KEY: Readonly<Record<string, number>> = {
  // Restore Agentic AI pack back to $150 (promo mode for other products can stay enabled).
  agentic_ai: 150,
};

export function tempTestPrice(key: string | null | undefined, normal: number): number {
  if (!TEMP_TEST_PRICING_ENABLED || !key) return normal;
  const override = TEMP_TEST_PRICE_BY_KEY[key.trim().toLowerCase()];
  return typeof override === "number" ? override : normal;
}

export function formatTempAwareAmount(key: string | null | undefined, normal: number): string {
  const n = tempTestPrice(key, normal);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function formatTempAwareDisplayPrice(key: string | null | undefined, normal: number): string {
  const n = tempTestPrice(key, normal);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
