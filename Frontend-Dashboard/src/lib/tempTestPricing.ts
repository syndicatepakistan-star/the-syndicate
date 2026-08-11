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
 * WhatsApp Agent (agentic_ai_c02) intentionally omitted → stays $14.
 */
export const TEMP_TEST_PRICE_BY_KEY: Readonly<Record<string, number>> = {
  bundle: TEMP_TEST_PRICE_USD,
  ai_content_c02: TEMP_TEST_PRICE_USD,
  trading_scalpel_protocol: TEMP_TEST_PRICE_USD,
  "level1-psych-09": TEMP_TEST_PRICE_USD,
  "level1-model-01": TEMP_TEST_PRICE_USD,
  "business-warfare": TEMP_TEST_PRICE_USD,
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
