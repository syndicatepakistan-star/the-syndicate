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

export type GoalId =
  | "elite_trading"
  | "business_model"
  | "business_psychology"
  | "ai_content"
  | "agentic_ai"
  | "money_mastery"
  | "make_money_online";

/** @deprecated — migrated in GoalPathSystem localStorage reader */
export type LegacyGoalId =
  | "web_dev"
  | "digital_marketing"
  | "youtube"
  | "money_online"
  | "ai_automation";

export const LEGACY_GOAL_ID_MAP: Record<LegacyGoalId, GoalId> = {
  web_dev: "elite_trading",
  digital_marketing: "ai_content",
  youtube: "agentic_ai",
  money_online: "money_mastery",
  ai_automation: "make_money_online",
};

/** Shared YOUR PATH intro — /programs and dashboard programs. */
export const PATH_SECTION_INTRO =
  "Chart business warfare, understand business behavioral phycology, master risk, master trading technical analysis and learn business discipline — master the Syndicate hidden techniques to bend reality to your will. The Syndicate protocols are designed to build elite business operators. Choose any of these specialized pathways to mastery:";

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

export function normalizeGoalId(value: string | undefined | null): GoalId {
  const raw = String(value ?? "").trim();
  if (raw && raw in ROADMAPS) return raw as GoalId;
  if (raw && raw in LEGACY_GOAL_ID_MAP) return LEGACY_GOAL_ID_MAP[raw as LegacyGoalId];
  return "elite_trading";
}

export const GOAL_OPTIONS: { id: GoalId; label: string; short: string }[] = [
  { id: "elite_trading", label: "Elite Technical Trading", short: "Trading" },
  { id: "business_model", label: "Business Model Mastery", short: "Models" },
  {
    id: "business_psychology",
    label: "Business Behavioural Phsycology Mastery",
    short: "Psychology",
  },
  { id: "ai_content", label: "AI Content Automation", short: "Content" },
  { id: "agentic_ai", label: "Agentic Ai", short: "Agents" },
  { id: "money_mastery", label: "Money Mastery", short: "Vault" },
  { id: "make_money_online", label: "Make Money Online MMO", short: "MMO" },
];

/** Path + Next Opportunities copy — matches Syndicate Elite / affiliate operator tone. */
export const PATH_GOAL_INTRO: Record<
  GoalId,
  { path: string; opportunities: string }
> = {
  elite_trading: {
    path: "Elite technical trading — chart warfare, scalpel protocols, and master trader modules from the Trading vault.",
    opportunities:
      "Deploy Trading vault sub-modules only — Scalpel Protocol, Strategies, Setups, and Secrets of a Master Trader.",
  },
  business_model: {
    path: "Business model mastery — eleven build-and-launch programs for apps, automation, publishing, and digital products.",
    opportunities:
      "Flutter, N8N, Social Media Content Automation, Python, WordPress, Unreal Engine, Framer, Amazon KDP, Print On Demand, React, and Canva.",
  },
  business_psychology: {
    path: "Business behavioural phsycology — discipline, risk doctrine, and Syndicate mindset protocols that harden elite operators.",
    opportunities:
      "Zero to One Million, 9 to 5 Exit, Hustle Hard, Syndicate 13 Rules, Money Philosophy, Compound Effect, Consistency, Risk, Micro Business, Transformation, and Business Warfare.",
  },
  ai_content: {
    path: "AI content automation — faceless YouTube, Shorts factories, and viral content modules from the AI Content vault.",
    opportunities:
      "Browse AI Content Automation sub-modules — faceless channels, documentary niches, Shorts systems, and viral content machines à la carte.",
  },
  agentic_ai: {
    path: "Agentic AI — autonomous n8n agents, Claude Code systems, and workflow stacks from the Agentic vault.",
    opportunities:
      "Deploy Agentic AI sub-modules — WhatsApp agents, RAG pipelines, MCP servers, and business automations à la carte.",
  },
  money_mastery: {
    path: "Money Mastery — total Syndicate ecosystem command across every vault, elite offer, and library program.",
    opportunities:
      "Money Mastery foundation, The Knight, all vault packs, and the full program library — ownership over rented progress.",
  },
  make_money_online: {
    path: "Make money online — publishing rails, design tools, and income packs wired for fast digital deployment.",
    opportunities:
      "Print On Demand, Canva, Amazon KDP, Trading pack, Agentic AI pack, AI Content Automation pack, and more MMO rails.",
  },
};

type PathItemRef =
  | { type: "program"; title: string }
  | { type: "pack"; plan: PlanOfferKey }
  | { type: "module"; pack: VaultPackKey; title: string };

function catalogModules(pack: VaultPackKey): readonly PathItemRef[] {
  return vaultCoursesForPack(pack).map((row) => ({
    type: "module" as const,
    pack,
    title: row.title,
  }));
}

/**
 * Syndicate catalog grouped for YOUR PATH — programs, elite packs, and vault modules.
 * Titles are matched loosely against live playlist/course API names.
 */
export const PATH_CATALOG: Record<GoalId, readonly PathItemRef[]> = {
  elite_trading: [
    {
      type: "module",
      pack: "trading_technical_analysis",
      title: "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
    },
    { type: "module", pack: "trading_technical_analysis", title: "Strategies of a Master Trader" },
    { type: "module", pack: "trading_technical_analysis", title: "Setups of a Master Trader" },
    { type: "module", pack: "trading_technical_analysis", title: "Secrets of a Master Trader" },
  ],
  business_model: [
    { type: "program", title: "App Building for Business (Vibe Coding)" },
    { type: "program", title: "AI content Automation for Businesses" },
    { type: "program", title: "Social Media Content Automation" },
    { type: "program", title: "Basics Python for Small Business" },
    { type: "program", title: "The Profitable Blogging Blueprint" },
    { type: "program", title: "The Gaming Business Blueprint (Build, Launch, and Sell)" },
    { type: "program", title: "Rapid Web Building For Business (Vibe Coding)" },
    { type: "program", title: "eBook Business Blueprint (Monetize Your Knowledge)" },
    { type: "program", title: "The Zero-Inventory Clothing Business Blueprint" },
    { type: "program", title: "The Custom App Blueprint for Business" },
    { type: "program", title: "Graphics Design for Business (Graphics That Convert to Sales)" },
  ],
  business_psychology: [
    { type: "program", title: "Zero to One Million" },
    { type: "program", title: "The 9 to 5 Exit Strategy" },
    { type: "program", title: "Hustle Hard" },
    { type: "program", title: "Syndicate 13 Business Rules" },
    { type: "program", title: "Syndicate Money Philosophy" },
    { type: "program", title: "The Compound Effect" },
    { type: "program", title: "Mastering Consistency" },
    { type: "program", title: "Mastering Risk and Uncertainty" },
    { type: "program", title: "Micro Business Protocol" },
    { type: "program", title: "The Secret To Transformation" },
    { type: "program", title: "Business Warfare" },
  ],
  ai_content: catalogModules("ai_content_automation"),
  agentic_ai: [
    { type: "module", pack: "agentic_ai", title: "Build a Blog Writing Agent With N8N" },
    { type: "module", pack: "agentic_ai", title: "Build a WhatsApp Agent with n8n" },
    { type: "module", pack: "agentic_ai", title: "From Zero to RAG Agent" },
    {
      type: "module",
      pack: "agentic_ai",
      title: "CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)",
    },
    { type: "module", pack: "agentic_ai", title: "Agentic Workflow for Businesses" },
    {
      type: "module",
      pack: "agentic_ai",
      title: "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)",
    },
    { type: "module", pack: "agentic_ai", title: "Google Antigravity FULL COURSE 2 HOURS" },
    { type: "module", pack: "agentic_ai", title: "VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity" },
    { type: "module", pack: "agentic_ai", title: "Scrap Any Website with N8N" },
    { type: "module", pack: "agentic_ai", title: "Claude Cowork Automations" },
  ],
  money_mastery: [
    { type: "pack", plan: "bundle" },
    { type: "pack", plan: "king" },
    { type: "pack", plan: "agentic_ai" },
    { type: "pack", plan: "ai_content_automation" },
    { type: "pack", plan: "trading_technical_analysis" },
    { type: "program", title: "Zero to One Million" },
    { type: "program", title: "Hustle Hard" },
    { type: "program", title: "Mastering Consistency" },
    { type: "program", title: "The Compound Effect" },
    { type: "program", title: "Basics Python for Small Business" },
    { type: "program", title: "App Building for Business (Vibe Coding)" },
    { type: "program", title: "The Zero-Inventory Clothing Business Blueprint" },
    { type: "program", title: "Business Warfare" },
    { type: "program", title: "Social Media Content Automation" },
    { type: "program", title: "Rapid Web Building For Business (Vibe Coding)" },
  ],
  make_money_online: [
    { type: "program", title: "The Zero-Inventory Clothing Business Blueprint" },
    { type: "program", title: "Graphics Design for Business (Graphics That Convert to Sales)" },
    { type: "program", title: "eBook Business Blueprint (Monetize Your Knowledge)" },
    { type: "pack", plan: "trading_technical_analysis" },
    { type: "pack", plan: "agentic_ai" },
    { type: "pack", plan: "ai_content_automation" },
    { type: "program", title: "Affiliate Marketing" },
    { type: "program", title: "The Profitable Blogging Blueprint" },
  ],
};

/** @deprecated Use PATH_CATALOG — program titles only. */
export const PATH_PROGRAM_TITLES = {
  elite_trading: PATH_CATALOG.elite_trading
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  business_model: PATH_CATALOG.business_model
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  business_psychology: PATH_CATALOG.business_psychology
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  ai_content: PATH_CATALOG.ai_content
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  agentic_ai: PATH_CATALOG.agentic_ai
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  money_mastery: PATH_CATALOG.money_mastery
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
  make_money_online: PATH_CATALOG.make_money_online
    .filter((item): item is { type: "program"; title: string } => item.type === "program")
    .map((item) => item.title),
} satisfies Record<GoalId, readonly string[]>;

/** Path selector tiles: each goal has its own neon channel (idle + selected). */
export const PATH_CARD_SKIN: Record<
  GoalId,
  { active: string; idle: string; subOn: string; subOff: string }
> = {
  elite_trading: {
    active:
      "z-[1] border-2 border-amber-400/70 bg-gradient-to-br from-amber-500/22 to-black/92 text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_32px_rgba(251,191,36,0.35),0_0_72px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-amber-400/30 bg-gradient-to-br from-amber-950/25 to-black/60 text-amber-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-amber-400/55 hover:shadow-[0_0_28px_rgba(251,191,36,0.2)]",
    subOn: "text-amber-200/90 [text-shadow:0_0_12px_rgba(251,191,36,0.35)]",
    subOff: "text-amber-200/55",
  },
  business_model: {
    active:
      "z-[1] border-2 border-sky-400/70 bg-gradient-to-br from-sky-500/20 to-black/92 text-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.45),0_0_32px_rgba(56,189,248,0.32),0_0_72px_rgba(14,165,233,0.14),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-sky-400/32 bg-gradient-to-br from-sky-950/22 to-black/60 text-sky-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-sky-400/55 hover:shadow-[0_0_28px_rgba(56,189,248,0.22)]",
    subOn: "text-sky-200/90 [text-shadow:0_0_12px_rgba(56,189,248,0.35)]",
    subOff: "text-sky-200/55",
  },
  business_psychology: {
    active:
      "z-[1] border-2 border-orange-400/70 bg-gradient-to-br from-orange-500/20 to-black/92 text-orange-50 shadow-[0_0_0_1px_rgba(251,146,60,0.45),0_0_32px_rgba(251,146,60,0.32),0_0_72px_rgba(249,115,22,0.14),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-orange-400/32 bg-gradient-to-br from-orange-950/22 to-black/60 text-orange-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-orange-400/55 hover:shadow-[0_0_28px_rgba(251,146,60,0.2)]",
    subOn: "text-orange-200/90 [text-shadow:0_0_12px_rgba(251,146,60,0.35)]",
    subOff: "text-orange-200/55",
  },
  ai_content: {
    active:
      "z-[1] border-2 border-cyan-400/70 bg-gradient-to-br from-cyan-500/20 to-black/92 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_32px_rgba(34,211,238,0.32),0_0_72px_rgba(6,182,212,0.14),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-cyan-400/32 bg-gradient-to-br from-cyan-950/22 to-black/60 text-cyan-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-cyan-400/55 hover:shadow-[0_0_28px_rgba(34,211,238,0.22)]",
    subOn: "text-cyan-200/90 [text-shadow:0_0_12px_rgba(34,211,238,0.35)]",
    subOff: "text-cyan-200/55",
  },
  agentic_ai: {
    active:
      "z-[1] border-2 border-violet-400/70 bg-gradient-to-br from-violet-500/22 to-black/92 text-violet-50 shadow-[0_0_0_1px_rgba(167,139,250,0.45),0_0_32px_rgba(167,139,250,0.32),0_0_72px_rgba(139,92,246,0.16),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-violet-400/32 bg-gradient-to-br from-violet-950/25 to-black/60 text-violet-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-violet-400/55 hover:shadow-[0_0_28px_rgba(167,139,250,0.22)]",
    subOn: "text-violet-200/90 [text-shadow:0_0_12px_rgba(196,181,253,0.4)]",
    subOff: "text-violet-200/55",
  },
  money_mastery: {
    active:
      "z-[1] border-2 border-emerald-400/70 bg-gradient-to-br from-emerald-500/20 to-black/92 text-emerald-50 shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_0_32px_rgba(52,211,153,0.3),0_0_72px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.1)]",
    idle:
      "border-2 border-emerald-400/32 bg-gradient-to-br from-emerald-950/22 to-black/60 text-emerald-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-emerald-400/55 hover:shadow-[0_0_28px_rgba(52,211,153,0.2)]",
    subOn: "text-emerald-200/90 [text-shadow:0_0_12px_rgba(52,211,153,0.35)]",
    subOff: "text-emerald-200/55",
  },
  make_money_online: {
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
  elite_trading: "Asymmetric edge: chart discipline compounds when retail noise fades",
  business_model: "Asset architecture: build products and systems that earn without trading hours",
  business_psychology: "Operator mindset: discipline and risk doctrine convert psychology into capital",
  ai_content: "Invisible leverage: machines publish while influence scales off-camera",
  agentic_ai: "Autonomous systems: agents execute while you architect the empire",
  money_mastery: "Total ownership: every vault, elite offer, and library protocol under one identity",
  make_money_online: "Digital rails: launch income assets through publishing, design, and elite packs",
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
    const teaser = resolveVaultModuleTeaser(moduleOffer.title, item.pack, String(moduleOffer.plan));
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
