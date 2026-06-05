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

export type PlanOfferAccent = "amber" | "cyan" | "pink" | "green" | "purple";

export type PlanOfferDef = {
  plan: PlanOfferKey;
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
      "Most men spend their lives trading finite hours for flat returns, trapped in the linear delusion of buying one playlist at a time",
    displayPrice: "$333",
    comparePrice: "$555",
    billingLabel: "/lifetime",
    checkoutAmount: "333",
    billing: "monthly",
    openLabel: "Open",
    accent: "amber",
    detailTitle: "MONEY MASTERY",
    detailDescription:
      "You will access everything with full lifetime coverage across the complete Syndicate ecosystem.",
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
      "Membership is not a PDF drop — it is the live command surface: Syndicate Mode, your curriculum, and the full goals deck behind one tier",
    displayPrice: "$19.99",
    comparePrice: "$99.99",
    billingLabel: "/mo",
    checkoutAmount: "19.99",
    billing: "monthly",
    openLabel: "Open",
    openHref: "/membership",
    accent: "cyan",
    detailTitle: "The Knight",
    detailDescription:
      "Your membership, your curriculum: hand-pick 4–5 courses, then stay inside weekly drops, the dashboard, articles, and Syndicate Mode challenges.",
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
      "Stop babysitting every workflow — deploy autonomous agents that execute, scale, and compound leverage while you architect the empire",
    displayPrice: "$199",
    comparePrice: "$349",
    billingLabel: "/lifetime",
    checkoutAmount: "199",
    billing: "monthly",
    openLabel: "Open",
    accent: "pink",
    detailTitle: "AGENTIC AI",
    detailDescription:
      "Buy Agentic AI once — unlock every course in the vault below. n8n agents, Claude Code, MCP workflows, RAG pipelines, and business automations. Dashboard access after checkout; full library unlocks as courses go live.",
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
      "Content without a machine behind it is manual labor — this protocol wires AI pipelines that publish, repurpose, and scale while you stay invisible",
    displayPrice: "$149",
    comparePrice: "$249",
    billingLabel: "/lifetime",
    checkoutAmount: "149",
    billing: "monthly",
    openLabel: "Open",
    accent: "green",
    detailTitle: "AI CONTENT AUTOMATION",
    detailDescription:
      "Buy AI Content Automation once — unlock every course in the vault below. Faceless YouTube, Shorts at scale, viral documentaries, finance niches, NotebookLM clones, and full automation blueprints. Dashboard access after checkout; full library unlocks as courses go live.",
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
      "Retail noise is designed to liquidate you — this protocol installs chart discipline, risk rails, and execution math built for asymmetric market warfare",
    displayPrice: "$99",
    comparePrice: "$199",
    billingLabel: "/lifetime",
    checkoutAmount: "99",
    billing: "monthly",
    openLabel: "Open",
    accent: "purple",
    imageObjectPosition: "center center",
    detailTitle: "TRADING ADVANCED TECHNICAL ANALYSIS",
    detailDescription:
      "Reserve lifetime access to the Trading Advanced Technical Analysis vault. Checkout unlocks dashboard access; the full curriculum unlocks when the program is published.",
    detailFeatures: [
      "Lifetime access reservation for Trading Advanced Technical Analysis",
      "Full dashboard login after checkout",
      "Program unlock when the curriculum launches",
      "Billing history in your account",
    ],
    grantsEntitlement: false,
  },
] as const;

export const PLAN_OFFERS: readonly PlanOfferDef[] = [...PLAN_OFFERS_PRIMARY, ...PLAN_OFFERS_VAULT];

export function planOfferByKey(plan: PlanOfferKey): PlanOfferDef | undefined {
  return PLAN_OFFERS.find((o) => o.plan === plan);
}
