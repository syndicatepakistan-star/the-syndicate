/**
 * Curated watch durations from reviewer spreadsheet (course name / title → length).
 * Values in seconds. Missing entries are listed in PENDING_WATCH_DURATIONS for future updates.
 */

/** Slugs / plan keys still awaiting reviewer duration data. */
export const PENDING_WATCH_DURATIONS: readonly string[] = [
  "level1-model-trading",
  "level1-model-blockchain",
];

const S = (hours: number, minutes: number, seconds: number): number =>
  hours * 3600 + minutes * 60 + seconds;

/** Level 1 Business Psychology + Business Model (total program watch time). */
const LEVEL1_DURATION_SECONDS: Record<string, number> = {
  "level1-psych-01": S(1, 4, 19),
  "level1-psych-02": S(0, 58, 14),
  "level1-psych-03": S(1, 7, 15),
  "level1-psych-04": S(1, 10, 46),
  "level1-psych-05": S(0, 32, 29),
  "level1-psych-06": S(1, 31, 1),
  "level1-psych-07": S(1, 14, 29),
  "level1-psych-08": S(0, 54, 21),
  "level1-psych-09": S(1, 1, 42),
  "level1-psych-10": S(2, 0, 36),
  "level1-psych-11": S(0, 38, 56),
  "level1-model-01": S(12, 29, 5),
  "level1-model-02": S(11, 58, 23),
  "level1-model-03": S(10, 22, 1),
  "level1-model-04": S(6, 0, 43),
  "level1-model-05": S(3, 44, 16),
  "level1-model-06": S(3, 32, 10),
  "level1-model-07": S(1, 58, 49),
  "level1-model-08": S(1, 58, 33),
  "level1-model-09": S(2, 46, 49),
  "level1-model-10": S(1, 55, 44),
  "level1-model-11": S(1, 47, 1),
};

/** AI Content Automation vault modules (ai_content_c01 … ai_content_c29). */
const AI_CONTENT_MODULE_SECONDS: Record<string, number> = {
  ai_content_c01: S(3, 4, 52),
  ai_content_c02: S(0, 27, 18),
  ai_content_c03: S(1, 14, 35),
  ai_content_c04: S(0, 19, 19),
  ai_content_c05: S(0, 14, 42),
  ai_content_c06: S(0, 19, 13),
  ai_content_c07: S(0, 35, 18),
  ai_content_c08: S(0, 21, 18),
  ai_content_c09: S(0, 25, 3),
  ai_content_c10: S(0, 33, 10),
  ai_content_c11: S(0, 32, 54),
  ai_content_c12: S(0, 27, 33),
  ai_content_c13: S(0, 18, 11),
  ai_content_c14: S(0, 16, 7),
  ai_content_c15: S(0, 15, 47),
  ai_content_c16: S(0, 18, 46),
  ai_content_c17: S(0, 13, 33),
  ai_content_c18: S(0, 9, 18),
  ai_content_c19: S(0, 14, 6),
  ai_content_c20: S(0, 31, 41),
  ai_content_c21: S(0, 7, 14),
  ai_content_c22: S(0, 7, 32),
  ai_content_c23: S(0, 20, 46),
  ai_content_c24: S(0, 17, 18),
  ai_content_c25: S(0, 14, 2),
  ai_content_c26: S(0, 9, 27),
  ai_content_c27: S(0, 19, 6),
  ai_content_c28: S(0, 7, 48),
  ai_content_c29: S(0, 13, 35),
};

/** Agentic AI vault modules — verified durations from reviewer sheet (per title). */
const AGENTIC_MODULE_SECONDS: Record<string, number> = {
  agentic_ai_c01: S(0, 47, 35),
  agentic_ai_c02: S(0, 6, 45),
  agentic_ai_c03: S(0, 34, 14),
  agentic_ai_c04: S(0, 22, 33),
  agentic_ai_c05: S(0, 27, 3),
  agentic_ai_c06: S(0, 23, 4),
  agentic_ai_c07: S(0, 27, 6),
  agentic_ai_c08: S(0, 47, 21),
  agentic_ai_c09: S(0, 4, 55),
  agentic_ai_c10: S(1, 27, 54),
  agentic_ai_c11: S(1, 25, 8),
  agentic_ai_c12: S(2, 38, 35),
  agentic_ai_c13: S(3, 34, 14),
  agentic_ai_c14: S(0, 24, 37),
  agentic_ai_c15: S(0, 14, 25),
  agentic_ai_c16: S(0, 12, 14),
  agentic_ai_c17: S(0, 35, 28),
  agentic_ai_c18: S(0, 23, 6),
  agentic_ai_c19: S(0, 21, 49),
  agentic_ai_c20: S(0, 43, 55),
  agentic_ai_c21: S(0, 18, 9),
  agentic_ai_c22: S(0, 42, 40),
  agentic_ai_c23: S(0, 14, 3),
  agentic_ai_c24: S(0, 18, 21),
  agentic_ai_c25: S(6, 12, 38),
  agentic_ai_c26: S(5, 27, 58),
};

/**
 * Trading Advanced Technical Analysis — reviewer sheet.
 * Module/pack totals are authoritative (they reconcile: 2:19:04 + 7:33:44 + 6:10:10 + 4:43:03 ≈ 20:46).
 */
const TRADING_MODULE_TOTAL_SECONDS: Record<string, number> = {
  trading_technical_analysis: S(20, 46, 0),
  trading_scalpel_protocol: S(2, 19, 4),
  trading_master_secrets: S(7, 33, 44),
  trading_master_setups: S(6, 10, 10),
  trading_master_strategies: S(4, 43, 3),
};

/** Trading lessons (slug order matches tradingVaultCatalog row order). */
const TRADING_LESSON_SECONDS: Record<string, number> = {
  // The Scalpel Protocol (1-minute chart) — chapters 1–10
  trading_scalpel_01: S(0, 2, 11),
  trading_scalpel_02: S(0, 4, 19),
  trading_scalpel_03: S(0, 19, 5),
  trading_scalpel_04: S(0, 3, 37),
  trading_scalpel_05: S(0, 5, 51),
  trading_scalpel_06: S(0, 8, 33),
  trading_scalpel_07: S(0, 6, 38),
  trading_scalpel_08: S(0, 7, 8),
  trading_scalpel_09: S(0, 14, 39),
  trading_scalpel_10: S(0, 7, 46),
  // Secrets of a Master Trader
  trading_secrets_01: S(1, 9, 0), // The Confirmation Signal
  trading_secrets_02: S(0, 26, 47), // Drawing Proper Trendlines
  trading_secrets_03: S(0, 14, 30), // Scene of the Crime Retrace
  trading_secrets_04: S(0, 15, 36), // Measured Move
  trading_secrets_05: S(0, 42, 2), // Three Tail Theory
  trading_secrets_06: S(0, 29, 22), // Trading Parallels
  trading_secrets_07: S(0, 23, 13), // Major vs Minor Support and Resistance
  trading_secrets_08: S(0, 16, 4), // Multi-Hit Methodology
  trading_secrets_09: S(0, 21, 3), // Trading the Hit and Kiss of a Level
  trading_secrets_10: S(0, 29, 6), // Macro Versus Micro Patterns
  trading_secrets_11: S(0, 27, 12), // Bull and Bear Flag Flips
  trading_secrets_12: S(0, 23, 54), // Trading RSI Divergences
  trading_secrets_13: S(0, 33, 42), // Time Counts
  trading_secrets_14: S(0, 16, 17), // The Biggest Moves Come from Failed Moves
  trading_secrets_15: S(0, 21, 10), // Time Value of a Level
  trading_secrets_16: S(0, 26, 2), // Fine-Tuning Entry Points
  trading_secrets_17: S(0, 17, 38), // Goals and Expectations
  // Setups of a Master Trader
  trading_setups_01: S(0, 19, 2), // Introduction
  trading_setups_02: S(0, 47, 32), // Setups of a Master Trader
  trading_setups_03: S(0, 21, 6), // Bull and Bear Flag Setups
  trading_setups_04: S(0, 16, 45), // Cup and Handle Setups
  trading_setups_05: S(0, 14, 52), // Mature Versus Immature Patterns and Setups
  trading_setups_06: S(0, 11, 54), // Megaphone and Consolidation Patterns
  trading_setups_07: S(0, 14, 0), // Downsloping and Upsloping Channels
  trading_setups_08: S(0, 14, 40), // Double Tops and Double Bottoms
  trading_setups_09: S(0, 15, 0), // Triple Tops and Beyond
  trading_setups_10: S(0, 19, 36), // The M-A Pattern
  trading_setups_11: S(0, 18, 58), // The W-V Pattern
  trading_setups_12: S(0, 24, 12), // Gaps and Gap Fills
  trading_setups_13: S(0, 14, 34), // The Power of the Move
  trading_setups_14: S(0, 16, 34), // Trading the Golden and Death Cross Setup
  trading_setups_15: S(0, 21, 14), // Trading Doji Candle Setups
  trading_setups_16: S(0, 45, 28), // Topping and Bottoming Tail Setups
  trading_setups_17: S(0, 23, 29), // Engulfing Candle Setups
  trading_setups_18: S(0, 11, 2), // Wise Words for Master Setups
  // Strategies of a Master Trader
  trading_strategies_01: S(0, 16, 50), // Strategies of a Master Trader
  trading_strategies_02: S(0, 26, 50), // The Keys to Building Wealth
  trading_strategies_03: S(0, 25, 22), // Favorite Trading Indicators
  trading_strategies_04: S(0, 51, 4), // Charting Strategies for Indicators
  trading_strategies_05: S(0, 24, 32), // Support & Resistance Strategies
  trading_strategies_06: S(0, 9, 3), // Candlestick Trading Strategies
  trading_strategies_07: S(1, 1, 0), // Risk vs Rewards & Rules to Trade
  trading_strategies_08: S(0, 7, 51), // Extract the Market Capital
};

const CURATED_DURATION_SECONDS: Record<string, number> = {
  ...LEVEL1_DURATION_SECONDS,
  ...AI_CONTENT_MODULE_SECONDS,
  ...AGENTIC_MODULE_SECONDS,
  ...TRADING_MODULE_TOTAL_SECONDS,
  ...TRADING_LESSON_SECONDS,
};

function sumRecordValues(record: Record<string, number>): number {
  return Object.values(record).reduce((acc, value) => acc + value, 0);
}

/** Pack-level totals derived from sub-module durations. */
export const VAULT_PACK_TOTAL_SECONDS: Record<string, number> = {
  ai_content_automation: sumRecordValues(AI_CONTENT_MODULE_SECONDS),
  agentic_ai: sumRecordValues(AGENTIC_MODULE_SECONDS),
  trading_technical_analysis: TRADING_MODULE_TOTAL_SECONDS.trading_technical_analysis,
};

export function formatDurationSeconds(totalSeconds: number, approximate = false): string {
  const prefix = approximate ? "~" : "";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    if (minutes === 0 && seconds === 0) return `${prefix}${hours}h`;
    if (seconds === 0) return `${prefix}${hours}h ${minutes}m`;
    return `${prefix}${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    if (seconds === 0) return `${prefix}${minutes} min`;
    return `${prefix}${minutes}m ${seconds}s`;
  }
  return `${prefix}${seconds}s`;
}

export function lookupCuratedDurationSeconds(planOrSlug: string): number | undefined {
  return CURATED_DURATION_SECONDS[planOrSlug];
}

export function sumCuratedDurations(
  keys: readonly string[],
): { totalSeconds: number; allKnown: boolean } {
  let totalSeconds = 0;
  let allKnown = true;
  for (const key of keys) {
    const seconds = lookupCuratedDurationSeconds(key);
    if (seconds === undefined) {
      allKnown = false;
      continue;
    }
    totalSeconds += seconds;
  }
  return { totalSeconds, allKnown };
}
