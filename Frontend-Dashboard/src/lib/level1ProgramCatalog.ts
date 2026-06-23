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

/** Display order on /programs (Business Psychology column). */
export const PUBLIC_PSYCHOLOGY_SLUG_ORDER: readonly string[] = [
  "level1-psych-03",
  "level1-psych-04",
  "level1-psych-08",
  "level1-psych-07",
  "level1-psych-09",
  "level1-psych-01",
  "level1-psych-06",
  "level1-psych-02",
  "level1-psych-05",
];

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

export const LEVEL1_SLUG_THUMBNAILS: Record<string, string> = {
  "level1-psych-01": "/assets/programs/cources%20imnages/9-5.png",
  "level1-psych-02": "/assets/programs/cources%20imnages/0%20to%201M.jpg",
  "level1-psych-03": "/assets/programs/cources%20imnages/hustle.png",
  "level1-psych-04": "/assets/programs/cources%20imnages/consistency.jpg",
  "level1-psych-05": "/assets/programs/cources%20imnages/secret.png",
  "level1-psych-06": "/assets/programs/cources%20imnages/compound%20effect.jpg",
  "level1-psych-07": "/assets/programs/cources%20imnages/micro%20business.jpg",
  "level1-psych-08": "/assets/programs/cources%20imnages/uncertainty.jpg",
  "level1-psych-09": "/assets/programs/cources%20imnages/warfare.jpg",
  "level1-psych-10": "/assets/programs/cources%20imnages/13rules.png",
  "level1-psych-11": "/assets/programs/cources%20imnages/money-philosophy.jpeg",
  "level1-model-01": "/assets/programs/cources%20imnages/N8N%20Ai.jpg",
  "level1-model-02": "/assets/programs/cources%20imnages/ai%20automations.png",
  "level1-model-03": "/assets/programs/cources%20imnages/flutter-app-building.png",
  "level1-model-04": "/assets/programs/cources%20imnages/react.jpeg",
  "level1-model-05": "/assets/programs/cources%20imnages/cyber-dystopian-city.png",
  "level1-model-06": "/assets/programs/cources%20imnages/unreal%20engine.png",
  "level1-model-07": "/assets/programs/cources%20imnages/framer.png",
  "level1-model-08": "/assets/programs/cources%20imnages/canvics-to-canva.png",
  "level1-model-09": "/assets/programs/cources%20imnages/print%20on%20demand.png",
  "level1-model-10": "/assets/programs/cources%20imnages/python.png",
  "level1-model-11": "/assets/programs/cources%20imnages/wordpress-blog.png",
};

export const LEVEL1_SLUG_TITLE_OVERRIDES: Record<string, string> = {
  "level1-model-02": "AI Automations",
  "level1-model-01": "N8N AI Automation",
  "level1-model-05": "Amazon KDP",
  "level1-psych-08": "Micro Business Protocols",
};
