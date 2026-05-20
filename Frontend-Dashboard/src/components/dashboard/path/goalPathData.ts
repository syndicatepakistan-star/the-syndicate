import { formatProgramDisplayTitle } from "@/lib/programDisplayTitle";

export type GoalId = "web_dev" | "digital_marketing" | "youtube" | "money_online" | "ai_automation";

/** Visual channel for opportunity cards (Our Methods timeline family). */
export type OpportunityTone = "amber" | "rose" | "fuchsia" | "cyan" | "blue";

export type RoadmapStep = {
  id: string;
  title: string;
  outcome: string;
  why: string;
  earningAfter: string;
  icon: string;
};

export type CourseRec = {
  id: string;
  title: string;
  outcome: string;
  earningHint: string;
  tone: OpportunityTone;
};

/** Carousel / step count (fixed stages; content comes from program pool). */
export const GOAL_PATH_STAGE_COUNT = 6;

export const GOAL_OPTIONS: { id: GoalId; label: string; short: string }[] = [
  { id: "web_dev", label: "Trader", short: "Trade" },
  { id: "digital_marketing", label: "Content Automation", short: "Auto" },
  { id: "youtube", label: "Ai Agents", short: "Agents" },
  { id: "money_online", label: "Money Mastery", short: "Vault" },
  { id: "ai_automation", label: "Make Money Online", short: "MMO" },
];

/** Path selector tiles: each goal has its own neon channel (idle + selected). */
export const PATH_CARD_SKIN: Record<
  GoalId,
  { active: string; idle: string; subOn: string; subOff: string }
> = {
  web_dev: {
    active:
      "z-[1] border-2 border-amber-400/70 bg-gradient-to-br from-amber-500/22 to-black/92 text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_32px_rgba(251,191,36,0.35),0_0_72px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-amber-400/30 bg-gradient-to-br from-amber-950/25 to-black/60 text-amber-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-amber-400/55 hover:shadow-[0_0_28px_rgba(251,191,36,0.2)]",
    subOn: "text-amber-200/90 [text-shadow:0_0_12px_rgba(251,191,36,0.35)]",
    subOff: "text-amber-200/55",
  },
  digital_marketing: {
    active:
      "z-[1] border-2 border-cyan-400/70 bg-gradient-to-br from-cyan-500/20 to-black/92 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_32px_rgba(34,211,238,0.32),0_0_72px_rgba(6,182,212,0.14),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-cyan-400/32 bg-gradient-to-br from-cyan-950/22 to-black/60 text-cyan-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-cyan-400/55 hover:shadow-[0_0_28px_rgba(34,211,238,0.22)]",
    subOn: "text-cyan-200/90 [text-shadow:0_0_12px_rgba(34,211,238,0.35)]",
    subOff: "text-cyan-200/55",
  },
  youtube: {
    active:
      "z-[1] border-2 border-violet-400/70 bg-gradient-to-br from-violet-500/22 to-black/92 text-violet-50 shadow-[0_0_0_1px_rgba(167,139,250,0.45),0_0_32px_rgba(167,139,250,0.32),0_0_72px_rgba(139,92,246,0.16),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-violet-400/32 bg-gradient-to-br from-violet-950/25 to-black/60 text-violet-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-violet-400/55 hover:shadow-[0_0_28px_rgba(167,139,250,0.22)]",
    subOn: "text-violet-200/90 [text-shadow:0_0_12px_rgba(196,181,253,0.4)]",
    subOff: "text-violet-200/55",
  },
  money_online: {
    active:
      "z-[1] border-2 border-emerald-400/70 bg-gradient-to-br from-emerald-500/20 to-black/92 text-emerald-50 shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_0_32px_rgba(52,211,153,0.3),0_0_72px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-emerald-400/32 bg-gradient-to-br from-emerald-950/22 to-black/60 text-emerald-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-emerald-400/55 hover:shadow-[0_0_28px_rgba(52,211,153,0.2)]",
    subOn: "text-emerald-200/90 [text-shadow:0_0_12px_rgba(52,211,153,0.35)]",
    subOff: "text-emerald-200/55",
  },
  ai_automation: {
    active:
      "z-[1] border-2 border-rose-400/70 bg-gradient-to-br from-rose-500/20 to-black/92 text-rose-50 shadow-[0_0_0_1px_rgba(251,113,133,0.45),0_0_32px_rgba(251,113,133,0.3),0_0_72px_rgba(244,63,94,0.14),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-rose-400/32 bg-gradient-to-br from-rose-950/22 to-black/60 text-rose-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-rose-400/55 hover:shadow-[0_0_28px_rgba(251,113,133,0.2)]",
    subOn: "text-rose-200/90 [text-shadow:0_0_12px_rgba(251,113,133,0.35)]",
    subOff: "text-rose-200/55",
  },
};

/**
 * Syndicate catalog grouped for YOUR PATH — order preserved per focus.
 * Titles are matched loosely against live playlist/course API names.
 */
export const PATH_PROGRAM_TITLES: Record<GoalId, readonly string[]> = {
  web_dev: ["Trading with Technical Analysis Course", "THE 1 MINUTE SCALPEL"],
  digital_marketing: [
    "Faceless YouTube AI Content Creator Course",
    "WordPress Blog",
    "Graphics Design Using Canva",
  ],
  youtube: ["How To Build A.I Agents", "Prompt Engineering", "AI Automations"],
  money_online: [
    "Hustle Hard",
    "Mastering Consistency",
    "Syndicate 13 Business Rules",
    "Syndicate Money Philosophy",
    "The 9 to 5 Exit Strategy",
    "The Art of Critical Thinking",
    "The Compound Effect",
    "The Secret To Transformation",
    "Zero to One Million",
  ],
  ai_automation: [
    "Affiliate Marketing",
    "App Building (using Flutter)",
    "Block Chain and Smart Contract Building with Solidity",
    "Book Publishing On Amazon (KINDLE)",
    "Building Apps using React JS",
    "Building Games Using Unreal Engine",
    "Framer Crash Course",
    "Print On Demand Clothing",
    "Python Programming",
  ],
};

/** Placeholder roadmap — length drives UI only; program cards use `opportunityTriplesForStage`. */
export const ROADMAPS: Record<GoalId, RoadmapStep[]> = Object.fromEntries(
  (GOAL_OPTIONS.map((g) => g.id) as GoalId[]).map((gid) => [
    gid,
    Array.from({ length: GOAL_PATH_STAGE_COUNT }, (_, i) => ({
      id: `${gid}-stage-${i}`,
      title: `Stage ${i + 1}`,
      outcome: "",
      why: "",
      earningAfter: "",
      icon: "·",
    })),
  ]),
) as Record<GoalId, RoadmapStep[]>;

const TONE_CYCLE: OpportunityTone[] = ["amber", "fuchsia", "cyan"];

function normTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleMatches(courseTitle: string, canonical: string): boolean {
  const a = normTitle(courseTitle);
  const b = normTitle(canonical);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aTokens = a.split(" ").filter((t) => t.length > 2);
  const bTokens = b.split(" ").filter((t) => t.length > 2);
  if (aTokens.length === 0 || bTokens.length === 0) return false;
  const overlap = bTokens.filter((t) => aTokens.includes(t)).length;
  return overlap / bTokens.length >= 0.72;
}

function defaultCopyForTitle(title: string): { outcome: string; earningHint: string } {
  return {
    outcome: `Follow the ${title} track in Programs — build proof, then stack the next module.`,
    earningHint: "Skilled path: compounding skills + launches as reputation hardens",
  };
}

function mergeProgramPool(
  goal: GoalId,
  courses: { id: string; title: string }[],
): { id: string; title: string; outcome: string; earningHint: string }[] {
  const seen = new Set<string>();
  const out: { id: string; title: string; outcome: string; earningHint: string }[] = [];

  for (const canonical of PATH_PROGRAM_TITLES[goal]) {
    const match = courses.find((c) => titleMatches(c.title, canonical));
    const title = formatProgramDisplayTitle(match?.title ?? canonical);
    const key = normTitle(title);
    if (seen.has(key)) continue;
    seen.add(key);
    const copy = defaultCopyForTitle(title);
    out.push({
      id: match?.id ?? `path-${goal}-${key.replace(/\s+/g, "-")}`,
      title,
      outcome: copy.outcome,
      earningHint: copy.earningHint,
    });
  }

  return out;
}

/** All programs in the active path focus (for manual browse controls). */
export function getPathProgramPool(goal: GoalId, courses: { id: string; title: string }[]) {
  return mergeProgramPool(goal, courses);
}

/**
 * Three program cards for a stage index — titles from the active path catalog,
 * preferring live Programs API matches when available.
 */
export function opportunityTriplesForStage(
  goal: GoalId,
  stageIndex: number,
  courses: { id: string; title: string }[],
): [CourseRec, CourseRec, CourseRec] {
  const pool = mergeProgramPool(goal, courses);
  const n = pool.length;
  const base = Math.max(0, stageIndex) % Math.max(1, n);

  const pick = (offset: number): CourseRec => {
    const row = pool[(base + offset) % n]!;
    const tone = TONE_CYCLE[offset % TONE_CYCLE.length]!;
    return {
      id: `${goal}-s${stageIndex}-o${offset}-${row.id}`,
      title: row.title,
      outcome: row.outcome,
      earningHint: row.earningHint,
      tone,
    };
  };

  return [pick(0), pick(1), pick(2)];
}

/** @deprecated Use opportunityTriplesForStage — kept for any stray imports. */
export function coursesForGoalStep(goal: GoalId, stepIndex: number): CourseRec[] {
  return [...opportunityTriplesForStage(goal, stepIndex, [])];
}

/** @deprecated Program titles now come from PATH_PROGRAM_TITLES. */
export function personalizeCourses(
  goal: GoalId,
  stepIdx: number,
  triple: [CourseRec, CourseRec, CourseRec],
  courses: { title: string }[],
): [CourseRec, CourseRec, CourseRec] {
  void goal;
  void stepIdx;
  void courses;
  return triple;
}
