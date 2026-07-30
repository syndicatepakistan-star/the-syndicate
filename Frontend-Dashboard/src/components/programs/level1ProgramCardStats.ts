import type { MoneyMasteryStatBlock } from "@/components/programs/planOfferCatalog";
import {
  LEVEL1_BUSINESS_MODEL_SLUGS,
  LEVEL1_PSYCHOLOGY_SLUGS,
  LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG,
  PUBLIC_LEVEL1_PLAYLIST_SLUGS,
} from "@/lib/level1ProgramCatalog";
import { lookupCuratedDurationSeconds } from "@/lib/programVideoDurations";

const PSYCH_SLUGS = new Set<string>(LEVEL1_PSYCHOLOGY_SLUGS);
const MODEL_SLUGS = new Set<string>(LEVEL1_BUSINESS_MODEL_SLUGS);

/** Display video counts from reviewer sheet (prefer over API `video_count`). */
const LEVEL1_VIDEO_COUNTS: Record<string, number> = {
  "level1-psych-01": 6,
  "level1-psych-02": 7,
  "level1-psych-03": 6,
  "level1-psych-04": 10,
  "level1-psych-05": 6,
  "level1-psych-06": 7,
  "level1-psych-07": 7,
  "level1-psych-08": 11,
  "level1-psych-09": 9,
  "level1-psych-10": 13,
  "level1-psych-11": 11,
  "level1-model-01": 7,
  "level1-model-02": 13,
  "level1-model-03": 22,
  "level1-model-04": 1,
  "level1-model-05": 1,
  "level1-model-06": 1,
  "level1-model-07": 1,
  "level1-model-08": 1,
  "level1-model-09": 1,
  "level1-model-10": 1,
  "level1-model-11": 1,
};

/** Build Projects — from curated programme descriptions. */
const LEVEL1_PROJECT_COUNTS: Record<string, number> = {
  "level1-model-01": 4,
  "level1-model-02": 6,
  "level1-model-03": 6,
  "level1-model-04": 4,
  "level1-model-05": 5,
  "level1-model-06": 7,
  "level1-model-07": 4,
  "level1-model-08": 4,
  "level1-model-09": 4,
  "level1-model-10": 4,
  "level1-model-11": 4,
};

/** Legacy / display slugs → stable level1-* catalog slug. */
const SLUG_ALIASES: Record<string, string> = {
  "hustle-hard": "level1-psych-03",
  "mastering-consistency": "level1-psych-04",
  "mastering-risk-and-uncertainty": "level1-psych-08",
  "the-micro-business-protocol": "level1-psych-07",
  "the-9-to-5-exit-strategy": "level1-psych-01",
  "zero-to-one-million": "level1-psych-02",
  "the-secret-to-transformation": "level1-psych-05",
  "the-compound-effect": "level1-psych-06",
  "business-warfare": "level1-psych-09",
  "syndicate-13-business-rules": "level1-psych-10",
  "syndicate-money-philosophy": "level1-psych-11",
  "n8n-ai-automation": "level1-model-01",
  "how-to-build-ai-agents": "level1-model-01",
  "ai-automations": "level1-model-02",
  "app-building-using-flutter": "level1-model-03",
  "building-apps-using-react-js": "level1-model-04",
  "book-publishing-on-amazon-kindle": "level1-model-05",
  "amazon-kdp": "level1-model-05",
  "building-games-using-unreal-engine": "level1-model-06",
  "framer-crash-course": "level1-model-07",
  "graphics-design-using-canva": "level1-model-08",
  "print-on-demand": "level1-model-09",
  "print-on-demand-clothing": "level1-model-09",
  "python-programming": "level1-model-10",
  "wordpress-blog": "level1-model-11",
};

/**
 * Card watch-time digit: under 1h → minutes; otherwise rounded hours.
 * (e.g. 1h7m → 1 Hrs, 8h58m → 9 Hrs, 54m → 54 Min).
 */
function watchDigit(totalSeconds: number | undefined): { value: string; unit: string } {
  if (typeof totalSeconds !== "number" || totalSeconds <= 0) {
    return { value: "—", unit: "Hrs" };
  }
  if (totalSeconds >= 3600) {
    const hours = Math.max(1, Math.round(totalSeconds / 3600));
    return { value: String(hours), unit: "Hrs" };
  }
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return { value: String(minutes), unit: "Min" };
}

export function resolveLevel1Slug(options?: {
  id?: number | null;
  slug?: string | null;
}): string | null {
  const raw = options?.slug?.trim().toLowerCase() ?? "";
  if (raw && PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(raw)) return raw;
  if (raw && SLUG_ALIASES[raw]) return SLUG_ALIASES[raw]!;
  if (options?.id != null && LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[options.id]) {
    return LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[options.id]!;
  }
  return null;
}

export function isLevel1PsychologySlug(slug: string | null | undefined): boolean {
  return !!slug && PSYCH_SLUGS.has(slug.trim().toLowerCase());
}

export function isLevel1BusinessModelSlug(slug: string | null | undefined): boolean {
  return !!slug && MODEL_SLUGS.has(slug.trim().toLowerCase());
}

export function level1ProgramProjectCount(slug: string): number {
  return LEVEL1_PROJECT_COUNTS[slug] ?? 0;
}

function level1ProgramVideoCount(slug: string, apiCount?: number | null): number {
  if (LEVEL1_VIDEO_COUNTS[slug] != null) return LEVEL1_VIDEO_COUNTS[slug]!;
  return Math.max(1, Number(apiCount) || 1);
}

/**
 * Neon stats for one Level 1 program card (not pack aggregates).
 * Psychology: Videos + Watch Time
 * Business Models: Videos + Projects + Watch Time
 */
export function level1ProgramNeonStats(options: {
  id?: number | null;
  slug?: string | null;
  videoCount?: number | null;
}): MoneyMasteryStatBlock[] | null {
  const slug = resolveLevel1Slug(options);
  if (!slug) return null;

  const videos = level1ProgramVideoCount(slug, options.videoCount);
  const watch = watchDigit(lookupCuratedDurationSeconds(slug));

  if (isLevel1PsychologySlug(slug)) {
    return [
      { value: String(videos), unit: "", label: "No. of Videos", tone: "gold" },
      { value: watch.value, unit: watch.unit, label: "Watch Time", tone: "pink" },
    ];
  }

  if (isLevel1BusinessModelSlug(slug)) {
    const projects = Math.max(1, level1ProgramProjectCount(slug));
    return [
      { value: String(videos), unit: "", label: "No. of Videos", tone: "gold" },
      { value: String(projects), unit: "", label: "Build Projects", tone: "green" },
      { value: watch.value, unit: watch.unit, label: "Watch Time", tone: "pink" },
    ];
  }

  return null;
}
