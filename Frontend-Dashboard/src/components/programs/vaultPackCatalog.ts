import type { CheckoutOfferKey, PlanOfferAccent, PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import { resolveVaultModuleDetail, resolveVaultModuleTeaser } from "@/components/programs/vaultModuleCopy";
import { TRADING_PACK_DESCRIPTION } from "@/components/programs/tradingVaultCopy";
import {
  comparePriceForUnit,
  distributeDollarPrices,
  VAULT_ALACARTE_AGENTIC_USD,
  VAULT_ALACARTE_AI_CONTENT_USD,
} from "@/lib/packPricing";
import {
  allTradingSubmoduleOffers,
  isTradingModuleSlug,
  tradingSubmoduleOfferBySlug,
  tradingSubmoduleOffersForModule,
  type TradingModuleSlug,
} from "@/components/programs/tradingVaultCatalog";

const PACKS_BASE = "/assets/programs/packs courses";

type VaultCourseRow = {
  title: string;
  image: string;
  slug: CheckoutOfferKey;
  unitPrice: number;
  comparePrice: number;
};

function packThumb(folder: string, filename: string): string {
  return `${PACKS_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}

function slugIndex(prefix: string, index: number): CheckoutOfferKey {
  return `${prefix}_c${String(index).padStart(2, "0")}` as CheckoutOfferKey;
}

/** Rotating neon accents for vault sub-course cards (gold, pink, green, purple, cyan, red, orange, blue). */
export const VAULT_SUB_COURSE_NEON_ACCENTS: readonly PlanOfferAccent[] = [
  "amber",
  "pink",
  "green",
  "purple",
  "cyan",
  "red",
  "orange",
  "blue",
];

function toOffer(
  row: VaultCourseRow,
  accent: PlanOfferAccent,
  packPlan: VaultPackKey
): PlanOfferDef {
  const price = String(row.unitPrice);
  const teaser = resolveVaultModuleTeaser(row.title, packPlan, row.slug);
  return {
    plan: row.slug,
    title: row.title,
    imageSrc: row.image,
    teaser,
    displayPrice: `$${row.unitPrice}`,
    comparePrice: `$${row.comparePrice}`,
    billingLabel: "/lifetime",
    checkoutAmount: price,
    billing: "monthly",
    openLabel: "Unlock",
    accent,
    detailTitle: row.title.toUpperCase().slice(0, 80),
    detailDescription: resolveVaultModuleDetail(row.title, packPlan, row.slug),
    detailFeatures: [row.title, "Lifetime access for this module", "Dashboard billing record after checkout"],
    grantsEntitlement: false,
    vaultPackPlan: packPlan,
  };
}

function mapVaultCourses(rows: VaultCourseRow[], packPlan: VaultPackKey): PlanOfferDef[] {
  return rows.map((row, index) =>
    toOffer(row, VAULT_SUB_COURSE_NEON_ACCENTS[index % VAULT_SUB_COURSE_NEON_ACCENTS.length], packPlan)
  );
}

const AGENTIC_UNIT_PRICES = distributeDollarPrices(VAULT_ALACARTE_AGENTIC_USD, 26);

const AGENTIC_ROWS: VaultCourseRow[] = [
  ["Build a Blog Writing Agent With N8N", "blog writing n8n.jpg"],
  ["Build a WhatsApp Agent with n8n", "whatsapp agent.jpg"],
  ["Build Apps With secret Claude Code Skill", "secret claude.jpg"],
  ["Claude Code + Consensus for INSANE $50k+ App Ideas", "insane 50k.jpg"],
  ["Is Claude Code Better than n8n", "claude better.jpg"],
  ["Claude Code Memory Change", "claude memory.jpg"],
  ["Claude Cowork Automations", "claude cowork.jpg"],
  ["Scrap Any Website with N8N", "scrap website.jpg"],
  ["Set up Google Credentials in n8n", "n8n 37 tips.jpg"],
  ["Google Antigravity FULL COURSE 2 HOURS", "google antigravity.jpg"],
  ["n8n Tutorial 37 Tips and Tricks (n8n Masterclass)", "n8n 37 tips.jpg"],
  ["CLAUDE CODE ADVANCED COURSE — 3 HOURS", "claude advanced.jpg"],
  ["CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)", "claude full.jpg"],
  ["4 Claude Code Hacks To Make Any Website Look 10 by 10", "4 claude code hacks.jpg"],
  ["12 Ways to Fix Context in Claude Code", "12 ways.jpg"],
  ["27 Claude Code TIPS", "27 claude.jpg"],
  ["Automated Faceless Shorts with AI", "faceless shorts ai.jpg"],
  ["Claude Cowork Marketing", "claude marketing.jpg"],
  ["From Zero to RAG Agent", "rag agent.jpg"],
  ["Insane Youtube Automations", "insane youtube automation.jpg"],
  ["n8n Blogging Automation: Generate SEO Blogs in Minutes", "n8n seo.jpg"],
  ["n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)", "mcp server.jpg"],
  ["Never label gmail emails again", "label gmail.jpg"],
  ["Alternatives to N8N in 2026", "stop n8n.jpg"],
  ["VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity", "vibe coding.jpg"],
  ["Agentic Workflow for Businesses", "agentic workflow.jpg"],
].map(([title, image], i) => {
  const unitPrice = AGENTIC_UNIT_PRICES[i] ?? 8;
  return {
    title,
    image: packThumb("agentic ai", image),
    slug: slugIndex("agentic_ai", i + 1),
    unitPrice,
    comparePrice: comparePriceForUnit(unitPrice),
  };
});

const AI_CONTENT_UNIT_PRICES = distributeDollarPrices(VAULT_ALACARTE_AI_CONTENT_USD, 29);

const AI_CONTENT_ROWS: VaultCourseRow[] = [
  ["Beginners Guide to Faceless YouTube in 2026 (3 hours)", "faceless youtube.jpg"],
  ["New YouTube Policy ENDS Those Faceless YouTube Channels", "youtube policy.jpg"],
  ["How to Start YouTube Automation in 2026 (Step By Step) NO FACE | FREE COURSE", "start youtube automation.jpg"],
  ["How to Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)", "genspark ai.jpg"],
  ["How to Build a VIRAL AI Movie Channel Using Only AI Tools", "movie channel.jpg"],
  ["How to Create Viral High RPM Finance Videos Using AI (Full Blueprint)", "rpm finance.jpg"],
  ["How to Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)", "3d animated videos.jpg"],
  ["How to Build a Viral AI Influencer Like Aitana Lopez (AI Instagram Model)", "aitana lopez instagram.jpg"],
  ["How to Make a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)", "ai documentory.jpg"],
  ["How to Build a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)", "philosphy channel.jpg"],
  ["How to Use AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)", "perhistoric channel.jpg"],
  ["How to Clone a VIRAL 3D Documentary Channel Using AI (Full Course)", "cloned 3d.jpg"],
  ["How to Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)", "geography.jpg"],
  ["How to Build a Viral Universe Documentary Channel Using Only AI (Step by Step!)", "universe channel.jpg"],
  ["How To ACTUALLY Go Viral", "5000 studied.jpg"],
  ["50 Easy Faceless Niches Explained in 19 Minutes", "50 niches.jpg"],
  ["Create 1,000 YouTube Shorts in 13 Minutes Using FREE AI — Free Auto Shorts in Bulk", "1000 shorts.jpg"],
  ["How to Crack The NEW Algorithm", "70+ crack algo.jpg"],
  ["These Faceless YouTube Niches Are Now BANNED", "banned.jpg"],
  ["How to Write Faceless YouTube Scripts That Get 100s Of Millions Of Views", "100 millions views.jpg"],
  ["The Smart Way to Build a Faceless Finance Channel", "nick invests exposed.jpg"],
  ["New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)", "exploding.jpg"],
  ["How to create Motion Graphics videos in MINUTES with AI", "motion graphics.jpg"],
  ["Viral Faceless Stickman POV", "stickan pov.jpg"],
  ["The Secret NotebookLM Workflow Every YouTuber Needs!", "youtuber need!.jpg"],
  ["How to create viral 3D documentary videos using ai(FERN 3D STYLE)", "fern 3d style.jpg"],
  ["How to make VIRAL Life Advice Videos Using Only FREE AI Tools", "life advice.jpg"],
  ["Create Viral inspirational finance Videos with Free AI Tools", "inspirational finance.jpg"],
  ["Clone ANY YouTube Channel With AI (NotebookLM Hack)", "clone any channel.jpg"],
].map(([title, image], i) => {
  const unitPrice = AI_CONTENT_UNIT_PRICES[i] ?? 7;
  return {
    title,
    image: packThumb("ai content automation", image),
    slug: slugIndex("ai_content", i + 1),
    unitPrice,
    comparePrice: comparePriceForUnit(unitPrice),
  };
});

const TRADING_MODULE_UNIT = 50;
const TRADING_MODULE_COMPARE = 65;

const TRADING_ROWS: VaultCourseRow[] = [
  {
    title: "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
    image: packThumb("trading", "1- min.jpg"),
    slug: "trading_scalpel_protocol",
    unitPrice: TRADING_MODULE_UNIT,
    comparePrice: TRADING_MODULE_COMPARE,
  },
  {
    title: "Strategies of a Master Trader",
    image: packThumb("trading", "strategies.jpg"),
    slug: "trading_master_strategies",
    unitPrice: TRADING_MODULE_UNIT,
    comparePrice: TRADING_MODULE_COMPARE,
  },
  {
    title: "Setups of a Master Trader",
    image: packThumb("trading", "setup.jpg"),
    slug: "trading_master_setups",
    unitPrice: TRADING_MODULE_UNIT,
    comparePrice: TRADING_MODULE_COMPARE,
  },
  {
    title: "Secrets of a Master Trader",
    image: packThumb("trading", "secrets.jpg"),
    slug: "trading_master_secrets",
    unitPrice: TRADING_MODULE_UNIT,
    comparePrice: TRADING_MODULE_COMPARE,
  },
];

export const VAULT_PACK_COURSES: Record<VaultPackKey, readonly PlanOfferDef[]> = {
  agentic_ai: mapVaultCourses(AGENTIC_ROWS, "agentic_ai"),
  ai_content_automation: mapVaultCourses(AI_CONTENT_ROWS, "ai_content_automation"),
  trading_technical_analysis: mapVaultCourses(TRADING_ROWS, "trading_technical_analysis"),
};

export const VAULT_PACK_MODAL_COPY: Record<
  VaultPackKey,
  { title: string; subtitle: string; borderClass: string; labelClass: string; closeBtnClass: string }
> = {
  agentic_ai: {
    title: "Agentic AI",
    subtitle:
      "This is not a course drop — it is an autonomous systems vault. Unlock the full protocol stack for $150 or deploy individual modules à la carte (about $200 if bought separately). Every purchase records to your command dashboard; curriculum activates as the vault deploys.",
    borderClass: "border-fuchsia-400/45 shadow-[0_0_56px_rgba(236,72,153,0.35)]",
    labelClass: "text-fuchsia-300/85",
    closeBtnClass: "border-fuchsia-400/35 text-fuchsia-100 hover:border-fuchsia-300/60",
  },
  ai_content_automation: {
    title: "AI Content Automation",
    subtitle:
      "Content without a machine behind it is manual labour — this vault wires faceless YouTube, Shorts, documentaries, and finance niches into AI pipelines that scale. Full pack $150 or modules à la carte (about $200 separately). One checkout. Controlled entitlement under your Syndicate identity.",
    borderClass: "border-emerald-400/45 shadow-[0_0_56px_rgba(52,211,153,0.35)]",
    labelClass: "text-emerald-300/85",
    closeBtnClass: "border-emerald-400/35 text-emerald-100 hover:border-emerald-300/60",
  },
  trading_technical_analysis: {
    title: "Trading Advanced Technical Analysis",
    subtitle: TRADING_PACK_DESCRIPTION,
    borderClass: "border-violet-400/45 shadow-[0_0_56px_rgba(168,85,247,0.35)]",
    labelClass: "text-violet-300/85",
    closeBtnClass: "border-violet-400/35 text-violet-100 hover:border-violet-300/60",
  },
};

export function vaultCoursesForPack(pack: VaultPackKey): readonly PlanOfferDef[] {
  return VAULT_PACK_COURSES[pack] ?? [];
}

/** Grouped rows for vault detail modal — trading pack expands every lesson inline. */
export type VaultPackDisplayGroup = {
  parent?: PlanOfferDef;
  offers: readonly PlanOfferDef[];
};

export function vaultDisplayGroupsForPack(pack: VaultPackKey): readonly VaultPackDisplayGroup[] {
  const parents = vaultCoursesForPack(pack);
  if (pack !== "trading_technical_analysis") {
    return parents.map((offer) => ({ offers: [offer] as const }));
  }
  return parents.map((parent) => {
    const moduleSlug = parent.plan as TradingModuleSlug;
    const lessons = isTradingModuleSlug(moduleSlug)
      ? tradingSubmoduleOffersForModule(moduleSlug)
      : [];
    return { parent, offers: lessons };
  });
}

/** Total purchasable rows shown in the vault detail modal (modules + nested lessons). */
export function vaultPackDisplayOfferCount(pack: VaultPackKey): number {
  return vaultDisplayGroupsForPack(pack).reduce((sum, group) => sum + group.offers.length, 0);
}

export function isVaultPackKey(plan: string): plan is VaultPackKey {
  return plan === "agentic_ai" || plan === "ai_content_automation" || plan === "trading_technical_analysis";
}

/** Parent mid-ticket pack for a vault module / lesson slug (mirrors backend vault_plan_catalog). */
export function vaultPackForPlanSlug(plan: string): VaultPackKey | null {
  const p = (plan || "").trim().toLowerCase();
  if (!p) return null;
  if (isVaultPackKey(p)) return p;
  if (/^agentic_ai_c\d{2}$/.test(p)) return "agentic_ai";
  if (/^ai_content_c\d{2}$/.test(p)) return "ai_content_automation";
  if (
    p.startsWith("trading_") ||
    p === "trading_scalpel_protocol" ||
    p === "trading_master_strategies" ||
    p === "trading_master_setups" ||
    p === "trading_master_secrets"
  ) {
    return "trading_technical_analysis";
  }
  return null;
}

export function vaultCourseBySlug(slug: CheckoutOfferKey): PlanOfferDef | undefined {
  const submodule = tradingSubmoduleOfferBySlug(slug);
  if (submodule) return submodule;
  for (const pack of Object.keys(VAULT_PACK_COURSES) as VaultPackKey[]) {
    const hit = VAULT_PACK_COURSES[pack].find((c) => c.plan === slug);
    if (hit) return hit;
  }
  return undefined;
}

function normalizeVaultCourseTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve vault pack module thumbnail when API id/slug differs (e.g. Knight program picker). */
export function vaultCourseByTitle(title: string): PlanOfferDef | undefined {
  const target = normalizeVaultCourseTitle(title);
  if (!target) return undefined;
  for (const pack of Object.keys(VAULT_PACK_COURSES) as VaultPackKey[]) {
    for (const course of VAULT_PACK_COURSES[pack]) {
      const courseNorm = normalizeVaultCourseTitle(course.title);
      if (courseNorm === target || courseNorm.includes(target) || target.includes(courseNorm)) {
        return course;
      }
    }
  }
  for (const offer of allTradingSubmoduleOffers()) {
    const offerNorm = normalizeVaultCourseTitle(offer.title);
    if (offerNorm === target || offerNorm.includes(target) || target.includes(offerNorm)) {
      return offer;
    }
  }
  return undefined;
}

export function isVaultCourseSlug(value: string): boolean {
  const v = value.trim();
  if (/^agentic_ai_c\d{2}$/.test(v) || /^ai_content_c\d{2}$/.test(v)) return true;
  if (/^trading_(secrets|setups|strategies|scalpel)_\d{2}$/.test(v)) return true;
  return (
    v === "trading_scalpel_protocol" ||
    v === "trading_master_strategies" ||
    v === "trading_master_setups" ||
    v === "trading_master_secrets"
  );
}

/** Sum of à la carte module prices for a pack (trading: modules only, not every lesson). */
export function vaultPackAlaCarteTotal(pack: VaultPackKey): number {
  if (pack === "trading_technical_analysis") {
    return vaultCoursesForPack(pack).reduce((sum, c) => sum + Number(c.checkoutAmount), 0);
  }
  return vaultCoursesForPack(pack).reduce((sum, c) => sum + Number(c.checkoutAmount), 0);
}

/** All purchasable lesson rows inside trading modules (for admin / search). */
export function tradingLessonOfferCount(): number {
  return allTradingSubmoduleOffers().length;
}
