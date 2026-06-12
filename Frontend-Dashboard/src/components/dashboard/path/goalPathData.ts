import { formatProgramDisplayTitle } from "@/lib/programDisplayTitle";
import {
  resolveProgramPlaylistSummary,
  resolveProgramPlaylistThumbnail,
} from "@/lib/programPlaylistCatalog";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";
import {
  planOfferByKey,
  type CheckoutOfferKey,
  type PlanOfferKey,
  type VaultPackKey,
} from "@/components/programs/planOfferCatalog";
import { vaultCoursesForPack } from "@/components/programs/vaultPackCatalog";
import { resolveVaultModuleTeaser } from "@/components/programs/vaultModuleCopy";
import { planOfferDeepLink, type GlobePackKey } from "@/lib/programPlaylistThumbnails";

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
  /** Backend playlist id — used on /programs for globe-style deep links. */
  programId?: number;
  posterSrc?: string;
  price?: number;
  summary?: string;
  /** Syndicate Elite pack, vault module, or library program. */
  offerKind?: "program" | "pack" | "module";
  packPlan?: PlanOfferKey;
  modulePlan?: CheckoutOfferKey;
  vaultPackPlan?: VaultPackKey;
  deepLinkHref?: string;
};

/** Carousel / step count (fixed stages; content comes from program pool). */
export const GOAL_PATH_STAGE_COUNT = 6;

export const GOAL_OPTIONS: { id: GoalId; label: string; short: string }[] = [
  { id: "web_dev", label: "Trader", short: "Trade" },
  { id: "digital_marketing", label: "Content Automation", short: "Content" },
  { id: "youtube", label: "Ai Agents", short: "Agents" },
  { id: "money_online", label: "Money Mastery", short: "Vault" },
  { id: "ai_automation", label: "Make Money Online", short: "MMO" },
];

/** Path + Next Opportunities copy — matches Syndicate Elite / affiliate operator tone. */
export const PATH_GOAL_INTRO: Record<
  GoalId,
  { path: string; opportunities: string }
> = {
  web_dev: {
    path: "Chart warfare, risk rails, and capital discipline — trading vault protocols stacked with psychology programs that harden operators.",
    opportunities:
      "Deploy the Trading vault, individual chart protocols, and risk programs — asymmetric edges without retail noise.",
  },
  digital_marketing: {
    path: "Faceless content machines and AI publishing pipelines — the Content Automation vault plus library programs that scale off-camera.",
    opportunities:
      "Unlock the AI Content vault, viral Shorts modules, and supporting library tracks — publish at scale while you stay invisible.",
  },
  youtube: {
    path: "Autonomous agents and workflow systems — Agentic AI vault modules wired to N8N and AI Automations in the library.",
    opportunities:
      "Stack the Agentic AI vault, n8n agent modules, and automation programs — stop babysitting tasks agents should execute.",
  },
  money_online: {
    path: "Total ecosystem command — Money Mastery and The Knight elite offers plus the Business Psychology library that compounds mindset into capital.",
    opportunities:
      "Capture full vault access or advance through psychology programs — ownership over rented progress, one protocol at a time.",
  },
  ai_automation: {
    path: "Digital income architecture — Print On Demand, KDP, dev stacks, and publishing programs from the Business Model library.",
    opportunities:
      "Build online revenue rails through curated MMO programs — launch assets, code products, and publishing machines without guesswork.",
  },
};

type PathItemRef =
  | { type: "program"; title: string }
  | { type: "pack"; plan: PlanOfferKey }
  | { type: "module"; pack: VaultPackKey; title: string };

/**
 * Syndicate catalog grouped for YOUR PATH — programs, elite packs, and vault modules.
 * Titles are matched loosely against live playlist/course API names.
 */
export const PATH_CATALOG: Record<GoalId, readonly PathItemRef[]> = {
  web_dev: [
    { type: "pack", plan: "trading_technical_analysis" },
    {
      type: "module",
      pack: "trading_technical_analysis",
      title: "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
    },
    { type: "module", pack: "trading_technical_analysis", title: "Strategies of a Master Trader" },
    { type: "module", pack: "trading_technical_analysis", title: "Setups of a Master Trader" },
    { type: "module", pack: "trading_technical_analysis", title: "Secrets of a Master Trader" },
    { type: "program", title: "Mastering Risk and Uncertainty" },
    { type: "program", title: "The Micro Business Protocol" },
  ],
  digital_marketing: [
    { type: "pack", plan: "ai_content_automation" },
    {
      type: "module",
      pack: "ai_content_automation",
      title: "Beginners Guide to Faceless YouTube in 2026 (3 hours)",
    },
    {
      type: "module",
      pack: "ai_content_automation",
      title: "How I Create Viral High RPM Finance Videos Using AI (Full Blueprint)",
    },
    {
      type: "module",
      pack: "ai_content_automation",
      title: "Create 1,000 YouTube Shorts in 13 Minutes Using FREE AI — Free Auto Shorts in Bulk",
    },
    {
      type: "module",
      pack: "ai_content_automation",
      title: "I Studied 5,000 Faceless YouTube Videos — Here's How To ACTUALLY Go Viral",
    },
    { type: "program", title: "Print On Demand" },
    { type: "program", title: "Graphics Design Using Canva" },
    {
      type: "module",
      pack: "ai_content_automation",
      title: "Clone ANY YouTube Channel With AI (NotebookLM Hack) | Automation 2.0",
    },
  ],
  youtube: [
    { type: "pack", plan: "agentic_ai" },
    { type: "module", pack: "agentic_ai", title: "Build a WhatsApp Agent with n8n" },
    { type: "module", pack: "agentic_ai", title: "From Zero to RAG Agent" },
    {
      type: "module",
      pack: "agentic_ai",
      title: "CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)",
    },
    { type: "module", pack: "agentic_ai", title: "Agentic Workflow for Businesses" },
    { type: "program", title: "N8N Ai Automation" },
    { type: "program", title: "AI Automations" },
    { type: "module", pack: "agentic_ai", title: "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)" },
  ],
  money_online: [
    { type: "pack", plan: "bundle" },
    { type: "pack", plan: "king" },
    { type: "program", title: "Hustle Hard" },
    { type: "program", title: "Mastering Consistency" },
    { type: "program", title: "Zero to One Million" },
    { type: "program", title: "The Compound Effect" },
    { type: "program", title: "The 9 to 5 Exit Strategy" },
    { type: "program", title: "Mastering Risk and Uncertainty" },
    { type: "program", title: "The Micro Business Protocol" },
    { type: "program", title: "The Secret To Transformation" },
  ],
  ai_automation: [
    { type: "program", title: "Print On Demand" },
    { type: "program", title: "Amazon KDP" },
    { type: "program", title: "WordPress Blog" },
    { type: "program", title: "Framer Crash Course" },
    { type: "program", title: "App Building (using Flutter)" },
    { type: "program", title: "Building Apps using React JS" },
    { type: "program", title: "Python Programming" },
    { type: "program", title: "Building Games Using Unreal Engine" },
  ],
};

/** @deprecated Use PATH_CATALOG — program titles only. */
export const PATH_PROGRAM_TITLES = {
  web_dev: PATH_CATALOG.web_dev
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  digital_marketing: PATH_CATALOG.digital_marketing
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  youtube: PATH_CATALOG.youtube
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  money_online: PATH_CATALOG.money_online
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  ai_automation: PATH_CATALOG.ai_automation
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
} satisfies Record<GoalId, readonly string[]>;

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

const PATH_EARNING_HINTS: Record<GoalId, string> = {
  web_dev: "Asymmetric edge: chart discipline compounds when retail noise fades",
  digital_marketing: "Invisible leverage: machines publish while influence scales off-camera",
  youtube: "Autonomous systems: agents execute while you architect the empire",
  money_online: "Total ownership: psychology + vault access under one Syndicate identity",
  ai_automation: "Digital rails: launch assets that earn without trading hours for output",
};

const PACK_TONE: Partial<Record<PlanOfferKey, OpportunityTone>> = {
  bundle: "amber",
  king: "cyan",
  agentic_ai: "fuchsia",
  ai_content_automation: "cyan",
  trading_technical_analysis: "fuchsia",
};

function defaultCopyForTitle(title: string, goal: GoalId): { outcome: string; earningHint: string } {
  return {
    outcome: `Deploy ${title} inside your command dashboard — controlled entitlement, measurable progress, no vanity consumption.`,
    earningHint: PATH_EARNING_HINTS[goal],
  };
}

function parsePlaylistPrice(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function findPlaylistMatch(
  playlists: StreamPlaylistListItem[] | undefined,
  canonical: string,
): StreamPlaylistListItem | undefined {
  if (!playlists?.length) return undefined;
  return playlists.find((pl) => titleMatches(pl.title, canonical));
}

function resolvePathItem(
  item: PathItemRef,
  goal: GoalId,
  courses: { id: string; title: string }[],
  playlists?: StreamPlaylistListItem[],
): CourseRec | null {
  if (item.type === "pack") {
    const offer = planOfferByKey(item.plan);
    if (!offer) return null;
    const copy = defaultCopyForTitle(offer.title, goal);
    const deepLink =
      item.plan === "king" && offer.openHref
        ? offer.openHref
        : planOfferDeepLink(item.plan as GlobePackKey);
    return {
      id: `pack-${offer.plan}`,
      title: offer.title,
      outcome: offer.teaser,
      earningHint: copy.earningHint,
      tone: PACK_TONE[item.plan] ?? "amber",
      offerKind: "pack",
      packPlan: item.plan,
      posterSrc: offer.imageSrc,
      price: parsePlaylistPrice(offer.checkoutAmount),
      summary: offer.teaser,
      deepLinkHref: deepLink,
    };
  }

  if (item.type === "module") {
    const moduleOffer = vaultCoursesForPack(item.pack).find((row) =>
      titleMatches(row.title, item.title),
    );
    if (!moduleOffer) return null;
    const teaser = resolveVaultModuleTeaser(moduleOffer.title, item.pack);
    const copy = defaultCopyForTitle(moduleOffer.title, goal);
    return {
      id: `module-${moduleOffer.plan}`,
      title: moduleOffer.title,
      outcome: teaser,
      earningHint: copy.earningHint,
      tone: PACK_TONE[item.pack] ?? "amber",
      offerKind: "module",
      modulePlan: moduleOffer.plan,
      vaultPackPlan: item.pack,
      posterSrc: moduleOffer.imageSrc,
      price: parsePlaylistPrice(moduleOffer.checkoutAmount),
      summary: teaser,
      deepLinkHref: planOfferDeepLink(item.pack),
    };
  }

  const playlistMatch = findPlaylistMatch(playlists, item.title);
  const courseMatch = courses.find((c) => titleMatches(c.title, item.title));
  const title = formatProgramDisplayTitle(
    playlistMatch?.title ?? courseMatch?.title ?? item.title,
  );
  const copy = defaultCopyForTitle(title, goal);
  const summary = playlistMatch ? resolveProgramPlaylistSummary(playlistMatch) : copy.outcome;
  return {
    id: playlistMatch
      ? String(playlistMatch.id)
      : (courseMatch?.id ?? `path-${goal}-${normTitle(title).replace(/\s+/g, "-")}`),
    title,
    outcome: summary,
    earningHint: copy.earningHint,
    tone: "amber",
    offerKind: "program",
    programId: playlistMatch?.id,
    posterSrc: playlistMatch ? resolveProgramPlaylistThumbnail(playlistMatch) : undefined,
    price: playlistMatch ? parsePlaylistPrice(playlistMatch.price) : undefined,
    summary,
  };
}

function mergeProgramPool(
  goal: GoalId,
  courses: { id: string; title: string }[],
  playlists?: StreamPlaylistListItem[],
): CourseRec[] {
  const seen = new Set<string>();
  const out: CourseRec[] = [];

  for (const item of PATH_CATALOG[goal]) {
    const row = resolvePathItem(item, goal, courses, playlists);
    if (!row) continue;
    const key = normTitle(row.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  return out;
}

/** All programs in the active path focus (for manual browse controls). */
export function getPathProgramPool(
  goal: GoalId,
  courses: { id: string; title: string }[],
  playlists?: StreamPlaylistListItem[],
) {
  return mergeProgramPool(goal, courses, playlists);
}

/**
 * Three program cards for a stage index — titles from the active path catalog,
 * preferring live Programs API matches when available.
 */
export function opportunityTriplesForStage(
  goal: GoalId,
  stageIndex: number,
  courses: { id: string; title: string }[],
  playlists?: StreamPlaylistListItem[],
): [CourseRec, CourseRec, CourseRec] {
  const pool = mergeProgramPool(goal, courses, playlists);
  const n = pool.length;
  const base = Math.max(0, stageIndex) % Math.max(1, n);

  const pick = (offset: number): CourseRec => {
    const row = pool[(base + offset) % n]!;
    const tone = TONE_CYCLE[offset % TONE_CYCLE.length]!;
    return {
      ...row,
      id: `${goal}-s${stageIndex}-o${offset}-${row.id}`,
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
