/**
 * Curated watch durations from reviewer spreadsheet (course name / title → length).
 * Values in seconds. Missing entries are listed in PENDING_WATCH_DURATIONS for future updates.
 */

/** Slugs / plan keys still awaiting reviewer duration data. */
export const PENDING_WATCH_DURATIONS: readonly string[] = [
  "level1-model-trading",
  "level1-model-blockchain",
  "level1-psych-10",
  "level1-psych-11",
  "trading_technical_analysis",
  "trading_scalpel_protocol",
  "trading_master_strategies",
  "trading_master_setups",
  "trading_master_secrets",
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

const CURATED_DURATION_SECONDS: Record<string, number> = {
  ...LEVEL1_DURATION_SECONDS,
  ...AI_CONTENT_MODULE_SECONDS,
  ...AGENTIC_MODULE_SECONDS,
};

function sumRecordValues(record: Record<string, number>): number {
  return Object.values(record).reduce((acc, value) => acc + value, 0);
}

/** Pack-level totals derived from sub-module durations. */
export const VAULT_PACK_TOTAL_SECONDS: Record<string, number> = {
  ai_content_automation: sumRecordValues(AI_CONTENT_MODULE_SECONDS),
  agentic_ai: sumRecordValues(AGENTIC_MODULE_SECONDS),
};

export function formatDurationSeconds(totalSeconds: number, approximate = false): string {
  const prefix = approximate ? "~" : "";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    if (minutes === 0 && seconds === 0) return `${prefix}${hours}h`;
    if (seconds === 0) return `${prefix}${hours}h ${minutes}m`;
    return `${prefix}${hours}h ${minutes}m`;
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
