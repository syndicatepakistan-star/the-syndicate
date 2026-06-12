import {
  OFFER_PLAN_THUMB_AGENTIC_AI,
  OFFER_PLAN_THUMB_AI_CONTENT_AUTOMATION,
  OFFER_PLAN_THUMB_MONEY_MASTERY,
  OFFER_PLAN_THUMB_THE_KNIGHT,
  OFFER_PLAN_THUMB_TRADING,
} from "@/components/programs/offerPlanThumbnails";

export type PlanOfferKey =
  | "bundle"
  | "king"
  | "agentic_ai"
  | "ai_content_automation"
  | "trading_technical_analysis";

export type VaultPackKey = Extract<
  PlanOfferKey,
  "agentic_ai" | "ai_content_automation" | "trading_technical_analysis"
>;

export type TradingSubOfferKey =
  | "trading_scalpel_protocol"
  | "trading_master_strategies"
  | "trading_master_setups"
  | "trading_master_secrets";

export type CheckoutOfferKey =
  | PlanOfferKey
  | TradingSubOfferKey
  | `agentic_ai_c${string}`
  | `ai_content_c${string}`;

export type PlanOfferAccent = "amber" | "cyan" | "pink" | "green" | "purple" | "red" | "orange" | "blue";

export type PlanOfferDef = {
  plan: CheckoutOfferKey;
  title: string;
  imageSrc: string;
  /** Terminal-style teaser on the card (underscore added in UI). */
  teaser: string;
  displayPrice: string;
  comparePrice: string;
  billingLabel: string;
  checkoutAmount: string;
  billing: "monthly";
  openLabel: string;
  /** When set, Open navigates here instead of starting Stripe checkout. */
  openHref?: string;
  /** When set to vault_picker, Open shows sub-program cards instead of checkout. */
  openAction?: "vault_picker";
  /** Parent vault pack when this row is an individual course offer. */
  vaultPackPlan?: VaultPackKey;
  accent: PlanOfferAccent;
  /** Large display title in the Details modal. */
  detailTitle: string;
  detailDescription: string;
  detailFeatures: readonly string[];
  /** When false, checkout records billing only — no program entitlements yet. */
  grantsEntitlement?: boolean;
  /** Optional CSS object-position for cover art (e.g. tall PNGs with title text). */
  imageObjectPosition?: string;
};

/** Row 1 — Money Mastery + The Knight */
export const PLAN_OFFERS_PRIMARY: readonly PlanOfferDef[] = [
  {
    plan: "bundle",
    title: "Money Mastery Bundle",
    imageSrc: OFFER_PLAN_THUMB_MONEY_MASTERY,
    teaser:
      "The linear economy was designed to keep you purchasing forever — one course, one playlist, one dead end. Money Mastery ends that cycle. One vault. One checkout. Full lifetime command of the complete Syndicate arsenal.",
    displayPrice: "$333",
    comparePrice: "$555",
    billingLabel: "/lifetime",
    checkoutAmount: "333",
    billing: "monthly",
    openLabel: "Unlock",
    accent: "amber",
    detailTitle: "MONEY MASTERY",
    detailDescription:
      "This is not à la carte consumption — it is total ecosystem ownership. Money Mastery grants lifetime command across every Syndicate program, every protocol, and every future drop inside the dashboard. No hidden tiers. No monthly rent on your own progress. One checkout records under your identity; your command surface stays unlocked as the vault expands.",
    detailFeatures: [
      "You will access everything",
      "All programs lifetime",
      "Complete Access of Dashboard",
      "Quick Access to all social apps",
    ],
    grantsEntitlement: true,
  },
  {
    plan: "king",
    title: "The Knight",
    imageSrc: OFFER_PLAN_THUMB_THE_KNIGHT,
    teaser:
      "The Knight is not a PDF drop — it is your live operating tier inside The Syndicate. Hand-pick your curriculum, enter Syndicate Mode, run the goals deck, and stay inside weekly drops and member intelligence. One subscription. One command surface.",
    displayPrice: "$19.99",
    comparePrice: "$99.99",
    billingLabel: "/mo",
    checkoutAmount: "19.99",
    billing: "monthly",
    openLabel: "Unlock",
    openHref: "/membership",
    accent: "cyan",
    detailTitle: "The Knight",
    detailDescription:
      "Membership is leverage, not content hoarding. The Knight tier puts you inside the live command surface: select 4–5 courses from the catalog, access weekly member drops, run Syndicate Mode challenges, and operate the full goals and milestone deck. Your dashboard becomes the centre of execution — not a shelf of unfinished playlists.",
    detailFeatures: [
      "Select 4–5 courses yourself from the catalog",
      "Weekly content and member drops",
      "Full dashboard access",
      "Membership articles and briefings",
      "Exclusive Membership Section",
      "Goals & Milestone section",
      "Syndicate Challenges Mode",
    ],
    grantsEntitlement: true,
  },
] as const;

/** Row 2 — upcoming vault programs (checkout + billing; curriculum unlocks later) */
export const PLAN_OFFERS_VAULT: readonly PlanOfferDef[] = [
  {
    plan: "agentic_ai",
    title: "Agentic AI",
    imageSrc: OFFER_PLAN_THUMB_AGENTIC_AI,
    teaser:
      "Manual workflows are wage labour disguised as entrepreneurship — stop babysitting tasks agents should execute. Agentic AI installs autonomous n8n pipelines, Claude Code systems, MCP servers, and RAG stacks that compound leverage while you architect the empire.",
    displayPrice: "$199",
    comparePrice: "$349",
    billingLabel: "/lifetime",
    checkoutAmount: "199",
    billing: "monthly",
    openLabel: "Unlock",
    openAction: "vault_picker",
    accent: "pink",
    detailTitle: "AGENTIC AI",
    detailDescription:
      "Agentic AI is not a single course — it is a vault of autonomous systems. Buy once for $199 and unlock every module below: n8n agents, Claude Code doctrine, MCP workflows, RAG pipelines, and business automations built for operators who refuse manual execution. Dashboard access records immediately; full library entitlement activates as each protocol deploys. Deploy à la carte at $19 each if you prefer surgical strikes over total vault capture.",
    detailFeatures: [
      "Build a Blog Writing Agent With N8N",
      "Build a WhatsApp Agent with n8n",
      "Build Apps With secret Claude Code Skill",
      "Claude Code + Consensus = INSANE $50k+ App Ideas",
      "Claude Code is Better at n8n",
      "Claude Code just changed Memory Forever",
      "Claude Cowork Automations",
      "Scrap Any Website with N8N",
      "Set up Google Credentials in n8n",
      "Google Antigravity FULL COURSE 2 HOURS",
      "n8n Tutorial 37 Tips and Tricks (n8n Masterclass)",
      "CLAUDE CODE ADVANCED COURSE — 3 HOURS",
      "CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)",
      "4 Claude Code Hacks To Make Any Website Look 10 by 10",
      "12 Ways to Fix Context in Claude Code",
      "27 Claude Code TIPS",
      "Automated Faceless Shorts with AI",
      "Claude Cowork just changed Marketing Forever",
      "From Zero to RAG Agent",
      "Insane Youtube Automation!",
      "n8n Blogging Automation: Generate SEO Blogs in Minutes",
      "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)",
      "Never label gmail emails again",
      "Stop Learning n8n in 2026...Learn THIS Instead",
      "VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity",
      "Agentic Workflow for Businesses",
    ],
    grantsEntitlement: false,
  },
  {
    plan: "ai_content_automation",
    title: "AI Content Automation",
    imageSrc: OFFER_PLAN_THUMB_AI_CONTENT_AUTOMATION,
    teaser:
      "Publishing without a machine behind you is invisible labour — this vault wires faceless YouTube, viral Shorts, documentary channels, and finance niches into AI pipelines that scale while you stay off camera. One checkout. Total content warfare capability.",
    displayPrice: "$149",
    comparePrice: "$249",
    billingLabel: "/lifetime",
    checkoutAmount: "149",
    billing: "monthly",
    openLabel: "Unlock",
    openAction: "vault_picker",
    accent: "green",
    detailTitle: "AI CONTENT AUTOMATION",
    detailDescription:
      "AI Content Automation is the faceless operator's arsenal. Buy the full vault for $149 and unlock every module below — YouTube automation, Shorts at scale, viral documentaries, finance niches, NotebookLM clones, and bulk publishing blueprints. No vanity access: every purchase records to your dashboard with controlled entitlement as modules go live. Prefer precision? Deploy individual protocols at $15 each.",
    detailFeatures: [
      "Beginners Guide to Faceless YouTube in 2026 (3 hours)",
      "New YouTube Policy ENDS Those Faceless YouTube Channels",
      "How to Start YouTube Automation in 2026 (Step By Step) NO FACE | FREE COURSE",
      "How I Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)",
      "How I Built a VIRAL AI Movie Channel Using Only AI Tools",
      "How I Create Viral High RPM Finance Videos Using AI (Full Blueprint)",
      "How I Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)",
      "How I Built a Viral AI Influencer Like Aitana Lopez (AI Instagram Model)",
      "How I Made a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)",
      "This Is How I Built a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)",
      "How I Used AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)",
      "I Cloned a VIRAL 3D Documentary Channel Using AI (Full Course)",
      "How I Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)",
      "How I Built a Viral Universe Documentary Channel Using Only AI (Step by Step!)",
      "I Studied 5,000 Faceless YouTube Videos — Here's How To ACTUALLY Go Viral",
      "50 Easy Faceless Niches Explained in 19 Minutes",
      "Create 1,000 YouTube Shorts in 13 Minutes Using FREE AI — Free Auto Shorts in Bulk",
      "I Studied 70+ Faceless Channels To Crack The NEW Algorithm",
      "WARNING: These Faceless YouTube Niches Are Now BANNED",
      "How I Write Faceless YouTube Scripts That Get 100s Of Millions Of Views",
      "The Smart Way to Build a Faceless Finance Channel (Nick Invests EXPOSED!)",
      "I Found a New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)",
      "How I create Motion Graphics videos in MINUTES with AI",
      "This Viral Faceless Stickman POV Niche Is Dominating Youtube (Full Guide)",
      "The Secret NotebookLM Workflow Every YouTuber Needs!",
      "How to create viral 3D documentary videos using ai (FERN 3D STYLE)",
      "How I Make VIRAL Life Advice Videos Using Only FREE AI Tools (FULL COURSE)",
      "Create Viral inspirational finance Videos with Free AI Tools",
      "Clone ANY YouTube Channel With AI (NotebookLM Hack) | Automation 2.0",
    ],
    grantsEntitlement: false,
  },
  {
    plan: "trading_technical_analysis",
    title: "Trading Advanced Technical Analysis",
    imageSrc: OFFER_PLAN_THUMB_TRADING,
    teaser:
      "Retail noise exists to liquidate undisciplined capital — this vault replaces guesswork with chart doctrine, risk rails, and execution math built for asymmetric market warfare. Unlock the full stack or deploy individual edges on your terms.",
    displayPrice: "$99",
    comparePrice: "$199",
    billingLabel: "/lifetime",
    checkoutAmount: "99",
    billing: "monthly",
    openLabel: "Unlock",
    openAction: "vault_picker",
    accent: "purple",
    imageObjectPosition: "center center",
    detailTitle: "TRADING ADVANCED TECHNICAL ANALYSIS",
    detailDescription:
      "Trading Advanced Technical Analysis is a protocol vault, not entertainment. Unlock the full stack for $99 — Scalpel Protocol, Master Trader strategies, setups, and classified execution secrets — or buy individual edges at $35 each. Every purchase records to your command dashboard with billing history and controlled curriculum access as modules deploy. Built for operators who treat the chart as a battlefield, not a casino.",
    detailFeatures: [
      "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
      "Strategies of a Master Trader",
      "Setups of a Master Trader",
      "Secrets of a Master Trader",
      "Full vault bundle — all four protocols in one checkout",
      "Dashboard access and billing history after purchase",
    ],
    grantsEntitlement: false,
  },
] as const;

export const PLAN_OFFERS: readonly PlanOfferDef[] = [...PLAN_OFFERS_PRIMARY, ...PLAN_OFFERS_VAULT];

export function planOfferByKey(plan: PlanOfferKey): PlanOfferDef | undefined {
  return PLAN_OFFERS.find((o) => o.plan === plan);
}
