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

/** Match dashboard / programs library titles (substring, case-insensitive). */
const PATH_MATCH_KEYWORDS: Record<GoalId, string[]> = {
  web_dev: ["crypto", "trade", "trading", "technical", "forex", "stock", "chart", "market", "portfolio"],
  digital_marketing: ["wordpress", "blog", "canva", "content", "social", "graphics", "design", "growth", "media"],
  youtube: ["python", "react", "flutter", "app", "automation", "ai", "openai", "agent", "build"],
  money_online: ["money", "mastery", "print", "demand", "monet", "wealth", "finance", "cashflow", "business"],
  ai_automation: ["autom", "ai", "python", "react", "flutter", "project", "demand", "print", "crypto", "youtube"],
};

/** Syndicate-style program titles aligned with public programs / home catalog naming. */
const PATH_FALLBACK_POOL: Record<GoalId, { title: string; outcome: string; earningHint: string }[]> = {
  web_dev: [
    {
      title: "Crypto Trading with Technical Analysis",
      outcome: "Read structure, volatility, and risk before size — build a repeatable playbook.",
      earningHint: "Skilled: sim → funded splits · $400–$3k/mo as stats stabilize",
    },
    {
      title: "Market structure & execution lab",
      outcome: "Sessions, liquidity, journaling — professional hygiene first.",
      earningHint: "Skilled: combine payouts · $800–$5k/mo with discipline",
    },
    {
      title: "Risk & position management sprint",
      outcome: "Fixed % risk, checklists, post-trade review loops.",
      earningHint: "Skilled: prop-style splits · $1.2k–$8k/mo",
    },
    {
      title: "Technical analysis deep track",
      outcome: "Confluence systems, invalidation, and trade review metrics.",
      earningHint: "Skilled: desk-level path · $3k–$18k+/mo (capital + edge)",
    },
  ],
  digital_marketing: [
    {
      title: "WordPress Blog",
      outcome: "Owned distribution: publish once, atomize everywhere.",
      earningHint: "Skilled: retainers · $500–$2.5k/mo",
    },
    {
      title: "Graphics Design using Canva",
      outcome: "Template systems + brand-safe batch production.",
      earningHint: "Skilled: productized packs · $400–$2k/mo",
    },
    {
      title: "Content Automation pipeline",
      outcome: "Scheduling, approvals, repurposing from a single pillar asset.",
      earningHint: "Skilled: stack installs · $1k–$6k/mo",
    },
    {
      title: "Social & growth systems",
      outcome: "Measure what ships; kill vanity cadence.",
      earningHint: "Skilled: operator engagements · $2k–$9k/mo",
    },
  ],
  youtube: [
    {
      title: "AI Automations",
      outcome: "Agents, APIs, guardrails — ship workflows that survive production.",
      earningHint: "Skilled: integration retainers · $1.5k–$7k/mo",
    },
    {
      title: "Python Programming",
      outcome: "Tooling, scripts, and evaluation harnesses for reliable outputs.",
      earningHint: "Skilled: contract builds · $900–$4.5k/mo",
    },
    {
      title: "Building Apps using React JS",
      outcome: "UI surfaces for copilots, dashboards, and member tools.",
      earningHint: "Skilled: sprint rates · $1.2k–$6k/mo",
    },
    {
      title: "App Building using Flutter",
      outcome: "Ship cross-platform utilities clients can feel.",
      earningHint: "Skilled: product lanes · $2k–$8k/mo",
    },
  ],
  money_online: [
    {
      title: "Print on Demand Clothing",
      outcome: "Offer stack + fulfillment rhythm without inventory drag.",
      earningHint: "Skilled: brand ladders · $800–$4k/mo",
    },
    {
      title: "Money Mastery — cashflow systems",
      outcome: "Buckets, buffers, and reinvestment rules you can defend.",
      earningHint: "Skilled: operator income · $1.5k–$8k/mo",
    },
    {
      title: "Dystopian Demand — offer economics",
      outcome: "Positioning, pricing power, and proof assets.",
      earningHint: "Skilled: high-ticket funnels · $3k–$15k/mo",
    },
    {
      title: "New Project — monetization sprint",
      outcome: "Launch, measure, iterate with one owned channel.",
      earningHint: "Skilled: portfolio mix · $5k–$25k+/mo blended",
    },
  ],
  ai_automation: [
    {
      title: "AI Automations",
      outcome: "Automate delivery, support, and ops without losing margin.",
      earningHint: "Skilled: retainers · $1.5k–$8k/mo",
    },
    {
      title: "Print on Demand Clothing",
      outcome: "Productized SKUs + creative throughput at scale.",
      earningHint: "Skilled: store + ads stack · $1k–$6k/mo",
    },
    {
      title: "WordPress Blog",
      outcome: "SEO + email capture as compounding equity.",
      earningHint: "Skilled: niche authority · $600–$4k/mo",
    },
    {
      title: "Building Apps using React JS",
      outcome: "Ship tools, templates, and micro-SaaS from one codebase.",
      earningHint: "Skilled: product + services · $2k–$12k/mo",
    },
    {
      title: "Python Programming",
      outcome: "Scripts, scrapers, and glue between your stack.",
      earningHint: "Skilled: technical gigs · $900–$5k/mo",
    },
  ],
};

const TONE_CYCLE: OpportunityTone[] = ["amber", "fuchsia", "cyan"];

function defaultCopyForTitle(title: string): { outcome: string; earningHint: string } {
  return {
    outcome: `Work this playlist end-to-end: ${title} — stack proof, then raise rates with receipts.`,
    earningHint: "Skilled path: compounding retainers + launches as reputation hardens",
  };
}

function mergeProgramPool(goal: GoalId, courses: { id: string; title: string }[]): { id: string; title: string; outcome: string; earningHint: string }[] {
  const kws = PATH_MATCH_KEYWORDS[goal];
  const seen = new Set<string>();
  const out: { id: string; title: string; outcome: string; earningHint: string }[] = [];

  const push = (row: { id: string; title: string; outcome: string; earningHint: string }) => {
    const key = row.title.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(row);
  };

  for (const c of courses) {
    const t = c.title.toLowerCase();
    if (!kws.some((kw) => t.includes(kw))) continue;
    const d = defaultCopyForTitle(c.title);
    push({ id: c.id, title: c.title, outcome: d.outcome, earningHint: d.earningHint });
  }

  for (const f of PATH_FALLBACK_POOL[goal]) {
    push({
      id: `fallback-${goal}-${f.title.slice(0, 24).replace(/\W+/g, "-").toLowerCase()}`,
      title: f.title,
      outcome: f.outcome,
      earningHint: f.earningHint,
    });
  }

  return out;
}

/**
 * Three program cards for a stage index — titles prefer live `/programs` library matches from `courses`,
 * padded with Syndicate catalog fallbacks. Tones cycle amber / fuchsia / cyan (Our Methods energy).
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

/** @deprecated Program titles now come from matched playlists only. */
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
