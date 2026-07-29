/**
 * Stable Level 1 program slugs — sync with Backend/accounts/level1_program_catalog.py
 * After seed_syndicate_catalog, playlist IDs change; slugs stay fixed.
 */

export const LEVEL1_PSYCHOLOGY_SLUGS = [
  "level1-psych-01",
  "level1-psych-02",
  "level1-psych-03",
  "level1-psych-04",
  "level1-psych-05",
  "level1-psych-06",
  "level1-psych-07",
  "level1-psych-08",
  "level1-psych-09",
  "level1-psych-10",
  "level1-psych-11",
] as const;

export const LEVEL1_BUSINESS_MODEL_SLUGS = [
  "level1-model-01",
  "level1-model-02",
  "level1-model-03",
  "level1-model-04",
  "level1-model-05",
  "level1-model-06",
  "level1-model-07",
  "level1-model-08",
  "level1-model-09",
  "level1-model-10",
  "level1-model-11",
] as const;

export const PUBLIC_LEVEL1_PLAYLIST_SLUGS = new Set<string>([
  ...LEVEL1_PSYCHOLOGY_SLUGS,
  ...LEVEL1_BUSINESS_MODEL_SLUGS,
]);

/** Display order on /programs (Business Psychology column) — all 11. */
export const PUBLIC_PSYCHOLOGY_SLUG_ORDER: readonly string[] = [
  "level1-psych-03",
  "level1-psych-04",
  "level1-psych-08",
  "level1-psych-07",
  "level1-psych-09",
  "level1-psych-10",
  "level1-psych-11",
  "level1-psych-01",
  "level1-psych-06",
  "level1-psych-02",
  "level1-psych-05",
];

/** Canonical titles — sync with Backend/accounts/level1_program_catalog.py */
export const LEVEL1_CANONICAL_TITLES: Record<string, string> = {
  "level1-psych-01": "The 9 to 5 Exit Strategy",
  "level1-psych-02": "Zero to One Million",
  "level1-psych-03": "Hustle Hard",
  "level1-psych-04": "Mastering Consistency",
  "level1-psych-05": "The Secret To Transformation",
  "level1-psych-06": "The Compound Effect",
  "level1-psych-07": "The Micro Business Protocol",
  "level1-psych-08": "Mastering Risk and Uncertainty",
  "level1-psych-09": "Business Warfare",
  "level1-psych-10": "Syndicate 13 Business Rules",
  "level1-psych-11": "Syndicate Money Philosophy",
  "level1-model-01": "N8N AI Automation",
  "level1-model-02": "AI Automations",
  "level1-model-03": "App Building (using Flutter)",
  "level1-model-04": "Building Apps using React JS",
  "level1-model-05": "Book Publishing On Amazon (KINDLE)",
  "level1-model-06": "Building Games Using Unreal Engine",
  "level1-model-07": "Framer Crash Course",
  "level1-model-08": "Graphics Design Using Canva",
  "level1-model-09": "Print On Demand Clothing",
  "level1-model-10": "Python Programming",
  "level1-model-11": "WordPress Blog",
};

/**
 * Legacy stream-playlist-catalog.json ids → stable level1 slug (deep links / globe tiles).
 * API playlist ids after seed may differ; slug is the canonical key.
 */
export const LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG: Record<number, string> = {
  1: "level1-psych-01",
  2: "level1-psych-02",
  3: "level1-psych-03",
  6: "level1-psych-04",
  9: "level1-psych-05",
  12: "level1-psych-06",
  31: "level1-psych-07",
  30: "level1-psych-08",
  99: "level1-psych-09",
  7: "level1-psych-10",
  8: "level1-psych-11",
  17: "level1-model-01",
  16: "level1-model-02",
  21: "level1-model-03",
  28: "level1-model-04",
  25: "level1-model-05",
  20: "level1-model-06",
  14: "level1-model-07",
  23: "level1-model-08",
  19: "level1-model-09",
  24: "level1-model-10",
  13: "level1-model-11",
};

/** Display order on /programs (Business Model column). */
export const PUBLIC_BUSINESS_MODEL_SLUG_ORDER: readonly string[] = [
  "level1-model-01",
  "level1-model-02",
  "level1-model-03",
  "level1-model-04",
  "level1-model-05",
  "level1-model-06",
  "level1-model-07",
  "level1-model-08",
  "level1-model-09",
  "level1-model-10",
  "level1-model-11",
];

export const LEVEL1_SLUG_DISPLAY_ORDER: readonly string[] = [
  ...PUBLIC_PSYCHOLOGY_SLUG_ORDER,
  ...PUBLIC_BUSINESS_MODEL_SLUG_ORDER,
];

export const LEVEL1_PSYCHOLOGY_PROGRAM_TITLES: readonly string[] = LEVEL1_PSYCHOLOGY_SLUGS.map(
  (slug) => LEVEL1_CANONICAL_TITLES[slug] ?? slug
);

export const LEVEL1_BUSINESS_MODEL_PROGRAM_TITLES: readonly string[] = LEVEL1_BUSINESS_MODEL_SLUGS.map(
  (slug) => LEVEL1_CANONICAL_TITLES[slug] ?? slug
);

export const LEVEL1_SLUG_THUMBNAILS: Record<string, string> = {
  "level1-psych-01": "/assets/programs/cources%20imnages/9-5.jpg",
  "level1-psych-02": "/assets/programs/cources%20imnages/0%20to%201M.jpg",
  "level1-psych-03": "/assets/programs/cources%20imnages/hustle.jpg",
  "level1-psych-04": "/assets/programs/cources%20imnages/consistency.jpg",
  "level1-psych-05": "/assets/programs/cources%20imnages/secret.jpg",
  "level1-psych-06": "/assets/programs/cources%20imnages/compound%20effect.jpg",
  "level1-psych-07": "/assets/programs/cources%20imnages/micro%20business.jpg",
  "level1-psych-08": "/assets/programs/cources%20imnages/uncertainty.jpg",
  "level1-psych-09": "/assets/programs/cources%20imnages/warfare.jpg",
  "level1-psych-10": "/assets/programs/cources%20imnages/13rules.jpg",
  "level1-psych-11": "/assets/programs/cources%20imnages/money-philosophy.jpg",
  "level1-model-01": "/assets/programs/cources%20imnages/business-content-n8n-ai-automation.png",
  "level1-model-02": "/assets/programs/cources%20imnages/ai-content-automation-business.png",
  "level1-model-03": "/assets/programs/cources%20imnages/app-building-vibe-coding.png",
  "level1-model-04": "/assets/programs/cources%20imnages/custom-app-blueprint.png",
  "level1-model-05": "/assets/programs/cources%20imnages/ebook-business-blueprint.png",
  "level1-model-06": "/assets/programs/cources%20imnages/gaming-business-blueprint.png",
  "level1-model-07": "/assets/programs/cources%20imnages/rapid-noncode-web-building.png",
  "level1-model-08": "/assets/programs/cources%20imnages/graphics-design-for-business.png",
  "level1-model-09": "/assets/programs/cources%20imnages/zero-inventory-clothing-blueprint.png",
  "level1-model-10": "/assets/programs/cources%20imnages/basics-python-small-business.png",
  "level1-model-11": "/assets/programs/cources%20imnages/profitable-blogging-blueprint.png",
};

export const LEVEL1_SLUG_TITLE_OVERRIDES: Record<string, string> = {
  "level1-model-01": "AI content Automation for Businesses",
  "level1-model-02": "Social Media Content Automation",
  "level1-model-03": "App Building for Business (Vibe Coding)",
  "level1-model-04": "The Custom App Blueprint for Business",
  "level1-model-05": "eBook Business Blueprint (Monetize Your Knowledge)",
  "level1-model-06": "The Gaming Business Blueprint (Build, Launch, and Sell)",
  "level1-model-07": "Rapid Non-code Web Building (For Business)",
  "level1-model-08": "Graphics Design for Business (Graphics That Convert to Sales)",
  "level1-model-09": "The Zero-Inventory Clothing Business Blueprint",
  "level1-model-10": "Basics Python for Small Business",
  "level1-model-11": "The Profitable Blogging Blueprint",
  "level1-psych-07": "Micro Business Protocols",
};
