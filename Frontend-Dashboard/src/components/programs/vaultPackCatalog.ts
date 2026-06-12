import type { CheckoutOfferKey, PlanOfferAccent, PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import { resolveVaultModuleDetail, resolveVaultModuleTeaser } from "@/components/programs/vaultModuleCopy";

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
  const teaser = resolveVaultModuleTeaser(row.title, packPlan);
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
    detailDescription: resolveVaultModuleDetail(row.title, packPlan),
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

const AGENTIC_ROWS: VaultCourseRow[] = [
  ["Build a Blog Writing Agent With N8N", "blog writing n8n.jpg"],
  ["Build a WhatsApp Agent with n8n", "whatsapp agent.jpg"],
  ["Build Apps With secret Claude Code Skill", "secret claude.jpg"],
  ["Claude Code + Consensus = INSANE $50k+ App Ideas", "insane 50k.jpg"],
  ["Claude Code is Better at n8n", "claude better.jpg"],
  ["Claude Code just changed Memory Forever", "claude memory.jpg"],
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
  ["Claude Cowork just changed Marketing Forever", "claude marketing.jpg"],
  ["From Zero to RAG Agent", "rag agent.jpg"],
  ["Insane Youtube Automation!", "insane youtube automation.jpg"],
  ["n8n Blogging Automation: Generate SEO Blogs in Minutes", "n8n seo.jpg"],
  ["n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)", "mcp server.jpg"],
  ["Never label gmail emails again", "label gmail.jpg"],
  ["Stop Learning n8n in 2026...Learn THIS Instead", "stop n8n.jpg"],
  ["VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity", "vibe coding.jpg"],
  ["Agentic Workflow for Businesses", "agentic workflow.jpg"],
].map(([title, image], i) => ({
  title,
  image: packThumb("agentic ai", image),
  slug: slugIndex("agentic_ai", i + 1),
  unitPrice: 19,
  comparePrice: 29,
}));

const AI_CONTENT_ROWS: VaultCourseRow[] = [
  ["Beginners Guide to Faceless YouTube in 2026 (3 hours)", "faceless youtube.jpg"],
  ["New YouTube Policy ENDS Those Faceless YouTube Channels", "youtube policy.jpg"],
  ["How to Start YouTube Automation in 2026 (Step By Step) NO FACE | FREE COURSE", "start youtube automation.jpg"],
  ["How I Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)", "genspark ai.jpg"],
  ["How I Built a VIRAL AI Movie Channel Using Only AI Tools", "movie channel.jpg"],
  ["How I Create Viral High RPM Finance Videos Using AI (Full Blueprint)", "rpm finance.jpg"],
  ["How I Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)", "3d animated videos.jpg"],
  ["How I Built a Viral AI Influencer Like Aitana Lopez (AI Instagram Model)", "aitana lopez instagram.jpg"],
  ["How I Made a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)", "ai documentory.jpg"],
  ["This Is How I Built a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)", "philosphy channel.jpg"],
  ["How I Used AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)", "perhistoric channel.jpg"],
  ["I Cloned a VIRAL 3D Documentary Channel Using AI (Full Course)", "cloned 3d.jpg"],
  ["How I Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)", "geography.jpg"],
  ["How I Built a Viral Universe Documentary Channel Using Only AI (Step by Step!)", "universe channel.jpg"],
  ["I Studied 5,000 Faceless YouTube Videos — Here's How To ACTUALLY Go Viral", "5000 studied.jpg"],
  ["50 Easy Faceless Niches Explained in 19 Minutes", "50 niches.jpg"],
  ["Create 1,000 YouTube Shorts in 13 Minutes Using FREE AI — Free Auto Shorts in Bulk", "1000 shorts.jpg"],
  ["I Studied 70+ Faceless Channels To Crack The NEW Algorithm", "70+ crack algo.jpg"],
  ["WARNING: These Faceless YouTube Niches Are Now BANNED", "banned.jpg"],
  ["How I Write Faceless YouTube Scripts That Get 100s Of Millions Of Views", "100 millions views.jpg"],
  ["The Smart Way to Build a Faceless Finance Channel (Nick Invests EXPOSED!)", "nick invests exposed.jpg"],
  ["I Found a New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)", "exploding.jpg"],
  ["How I create Motion Graphics videos in MINUTES with AI", "motion graphics.jpg"],
  ["This Viral Faceless Stickman POV Niche Is Dominating Youtube (Full Guide)", "stickan pov.jpg"],
  ["The Secret NotebookLM Workflow Every YouTuber Needs!", "youtuber need!.jpg"],
  ["How to create viral 3D documentary videos using ai (FERN 3D STYLE)", "fern 3d style.jpg"],
  ["How I Make VIRAL Life Advice Videos Using Only FREE AI Tools (FULL COURSE)", "life advice.jpg"],
  ["Create Viral inspirational finance Videos with Free AI Tools", "inspirational finance.jpg"],
  ["Clone ANY YouTube Channel With AI (NotebookLM Hack) | Automation 2.0", "clone any channel.jpg"],
].map(([title, image], i) => ({
  title,
  image: packThumb("ai content automation", image),
  slug: slugIndex("ai_content", i + 1),
  unitPrice: 15,
  comparePrice: 24,
}));

const TRADING_ROWS: VaultCourseRow[] = [
  {
    title: "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
    image: packThumb("trading", "1- min.jpg"),
    slug: "trading_scalpel_protocol",
    unitPrice: 35,
    comparePrice: 49,
  },
  {
    title: "Strategies of a Master Trader",
    image: packThumb("trading", "strategies.jpg"),
    slug: "trading_master_strategies",
    unitPrice: 35,
    comparePrice: 49,
  },
  {
    title: "Setups of a Master Trader",
    image: packThumb("trading", "setup.jpg"),
    slug: "trading_master_setups",
    unitPrice: 35,
    comparePrice: 49,
  },
  {
    title: "Secrets of a Master Trader",
    image: packThumb("trading", "secrets.jpg"),
    slug: "trading_master_secrets",
    unitPrice: 35,
    comparePrice: 49,
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
      "This is not a course drop — it is an autonomous systems vault. Unlock the full protocol stack for $199 or deploy individual modules at $19 each. Every purchase records to your command dashboard; curriculum activates as the vault deploys.",
    borderClass: "border-fuchsia-400/45 shadow-[0_0_56px_rgba(236,72,153,0.35)]",
    labelClass: "text-fuchsia-300/85",
    closeBtnClass: "border-fuchsia-400/35 text-fuchsia-100 hover:border-fuchsia-300/60",
  },
  ai_content_automation: {
    title: "AI Content Automation",
    subtitle:
      "Content without a machine behind it is manual labour — this vault wires faceless YouTube, Shorts, documentaries, and finance niches into AI pipelines that scale. Full pack $149 or modules at $15 each. One checkout. Controlled entitlement under your Syndicate identity.",
    borderClass: "border-emerald-400/45 shadow-[0_0_56px_rgba(52,211,153,0.35)]",
    labelClass: "text-emerald-300/85",
    closeBtnClass: "border-emerald-400/35 text-emerald-100 hover:border-emerald-300/60",
  },
  trading_technical_analysis: {
    title: "Trading Advanced Technical Analysis",
    subtitle:
      "Retail noise exists to liquidate undisciplined capital — this vault installs chart doctrine, risk rails, and execution math built for asymmetric warfare. Full protocol stack $99 or individual edges at $35 each. Every purchase tracked in your command dashboard.",
    borderClass: "border-violet-400/45 shadow-[0_0_56px_rgba(168,85,247,0.35)]",
    labelClass: "text-violet-300/85",
    closeBtnClass: "border-violet-400/35 text-violet-100 hover:border-violet-300/60",
  },
};

export function vaultCoursesForPack(pack: VaultPackKey): readonly PlanOfferDef[] {
  return VAULT_PACK_COURSES[pack] ?? [];
}

export function isVaultPackKey(plan: string): plan is VaultPackKey {
  return plan === "agentic_ai" || plan === "ai_content_automation" || plan === "trading_technical_analysis";
}

export function vaultCourseBySlug(slug: CheckoutOfferKey): PlanOfferDef | undefined {
  for (const pack of Object.keys(VAULT_PACK_COURSES) as VaultPackKey[]) {
    const hit = VAULT_PACK_COURSES[pack].find((c) => c.plan === slug);
    if (hit) return hit;
  }
  return undefined;
}

export function isVaultCourseSlug(value: string): boolean {
  const v = value.trim();
  if (/^agentic_ai_c\d{2}$/.test(v) || /^ai_content_c\d{2}$/.test(v)) return true;
  return (
    v === "trading_scalpel_protocol" ||
    v === "trading_master_strategies" ||
    v === "trading_master_setups" ||
    v === "trading_master_secrets"
  );
}

/** Sum of à la carte prices for a pack (for display). */
export function vaultPackAlaCarteTotal(pack: VaultPackKey): number {
  return vaultCoursesForPack(pack).reduce((sum, c) => sum + Number(c.checkoutAmount), 0);
}
