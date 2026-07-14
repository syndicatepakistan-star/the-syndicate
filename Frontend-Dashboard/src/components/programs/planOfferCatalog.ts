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

/** Flip to false when The Knight checkout should go live. */
export const KNIGHT_PLAN_COMING_SOON = true;

export const KNIGHT_LAUNCHING_SOON_LABEL = "Launching Soon";

export const KNIGHT_LAUNCHING_SOON_MESSAGE =
  "The Knight membership is launching soon and is not available for purchase yet.";

export function isKnightPlanSlug(plan: string): boolean {
  const p = plan.trim().toLowerCase();
  return p === "king" || p === "knight";
}

export function isKnightCheckoutBlocked(plan: string): boolean {
  return KNIGHT_PLAN_COMING_SOON && isKnightPlanSlug(plan);
}

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
  /** Primary card button when locked (defaults to Details). */
  detailsLabel?: string;
  /** When set, Open navigates here instead of starting Stripe checkout. */
  openHref?: string;
  /** When set to vault_picker, Details opens the vault browser; Unlock starts checkout. */
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
  /** When true, purchase CTAs are disabled and checkout is blocked. */
  isComingSoon?: boolean;
  /** Optional CSS object-position for cover art (e.g. tall PNGs with title text). */
  imageObjectPosition?: string;
  /** Tall portrait cover art — contain on phone/tablet so stacked title text stays visible. */
  imageMobileFit?: "contain" | "cover";
};

export function isPlanOfferComingSoon(offer: Pick<PlanOfferDef, "plan" | "isComingSoon">): boolean {
  if (offer.isComingSoon) return true;
  return KNIGHT_PLAN_COMING_SOON && isKnightPlanSlug(String(offer.plan));
}

export const MONEY_MASTERY_FOUNDATION_COPY =
  "Money Mastery is the complete foundation — a lifetime vault built to sharpen your understanding of wealth creation, financial systems, and strategic execution. One commitment unlocks permanent access to the knowledge, frameworks, and tools required to build your financial advantage.";

export const MONEY_MASTERY_LIFETIME_FEATURES: readonly string[] = [
  "Access to Syndicate Dashboard",
  "Access to Syndicate Affiliate Opportunities",
  "11 Business Model Programs (Learn 11 different business models – choose whichever models suit you best to start your business journey with the best odds of winning)",
  "11 Business Behavioral Phycology Programs (Master business behavioral phycology and become an elite business operator - with the Syndicate secret behavioral correction techniques and strategies – take the way you think about business to an elite level)",
  "26 Videos – Agentic Ai Pack",
  "29 Videos – Ai Content Automation Pack",
  "56 Lessons – Advanced Candlestick Technical Analysis Pack (4 video packs)",
  "Total Videos: 133 Individual Video Lessons",
];

export const MONEY_MASTERY_LIFETIME_BENEFIT_ITEMS = [
  {
    tone: "cyan",
    title: "Syndicate Dashboard",
    desc: "Full operator command center — track programs, progress, and execution in one vault.",
  },
  {
    tone: "violet",
    title: "Syndicate Affiliate Opportunities",
    desc: "Unlock referral revenue streams and Syndicate affiliate monetization paths.",
  },
  {
    tone: "gold",
    title: "11 Business Model Programs",
    desc: "Learn 11 different business models — choose whichever models suit you best to start your business journey with the best odds of winning.",
  },
  {
    tone: "pink",
    title: "11 Business Behavioral Psychology Programs",
    desc: "Master business behavioral psychology with Syndicate secret correction techniques — take how you think about business to an elite level.",
  },
  {
    tone: "amber",
    title: "Agentic AI Pack — 26 Videos",
    desc: "Build agents, automate research, and scrape data into systems that work for you.",
    bullets: [
      "Build blog writing and WhatsApp agents",
      "Learn vibe coding with Google Antigravity",
      "Smart assistant for messages, meetings, and inbox",
      "Automated research to find profitable software ideas",
      "Scrape site data into spreadsheets — no coding",
      "Custom search agents for private databases",
    ],
  },
  {
    tone: "green",
    title: "AI Content Automation Pack — 29 Videos",
    desc: "Faceless YouTube and social automation from beginner to always-on systems.",
    bullets: [
      "Dominate YouTube & social without facing the camera",
      "Automate niches: 3D docs, finance, Shorts, AI influencers",
      "Use NotebookLM & AI video tools for research, scripts, edits",
      "Go from beginner to confident creator with clear systems",
      "Avoid common mistakes and YouTube policy bans",
      "Build content automation that runs around the clock",
    ],
  },
  {
    tone: "cyan",
    title: "Advanced Candlestick Technical Analysis — 56 Lessons",
    desc: "Short-term trading setups with chart patterns, indicators, and strict risk management.",
    bullets: [
      "Master profitable short-term market setups",
      "Read flags, wedges, channels, and key chart patterns",
      "Confirm moves with moving averages & momentum tools",
      "Set clear entry, exit, and stop-loss targets",
      "Replace guesswork with a disciplined mechanical system",
      "Trade with calculated decisions for long-term wealth",
    ],
  },
  {
    tone: "violet",
    title: "133 Individual Video Lessons Total",
    desc: "The complete Money Mastery lifetime vault — every pack above in one commitment.",
  },
] as const;

export const KNIGHT_SUBSCRIPTION_COPY =
  "The Knight Membership Subscription — An elite membership path for business operators who want control over their own destiny. Select your chosen programs, build your private war-chest, receive continuous intelligence drops, and access the dashboard designed to track your progression.";

export const KNIGHT_EXECUTION_COPY: readonly string[] = [
  "This is not passive education.",
  "This is a controlled environment built for action, discipline, and execution.",
  "Every lesson, every strategy, every decision moves you closer to mastering the systems that shape wealth, influence, and power.",
];

export const KNIGHT_MEMBERSHIP_FEATURES: readonly string[] = [
  "Hand Pick 4–5 courses yourself from the selection catalog",
  "Exclusive Weekly content drops",
  "Full dashboard access",
  "Exclusive Membership articles and briefings",
  "Exclusive Membership Section",
  "Goals & Milestone section",
  "Syndicate Challenges Mode",
  "Exclusive access to Q&A business intelligence and advice sessions with the founder",
  "Exclusive opportunities to receive investment for your business venture",
];

const KNIGHT_BENEFIT_TONES = ["green", "cyan", "violet", "gold", "pink", "amber"] as const;

export const KNIGHT_MEMBERSHIP_BENEFIT_ITEMS = KNIGHT_MEMBERSHIP_FEATURES.map((feature, index) => ({
  tone: KNIGHT_BENEFIT_TONES[index % KNIGHT_BENEFIT_TONES.length]!,
  title: feature.length > 48 ? `${feature.slice(0, 45).trim()}…` : feature,
  desc: feature,
}));

export type PrimaryElitePlanKey = "bundle" | "king";

export function isPrimaryElitePlan(plan: string): plan is PrimaryElitePlanKey {
  return plan === "bundle" || plan === "king";
}

export function eliteOfferBenefitPanelProps(plan: PrimaryElitePlanKey) {
  if (plan === "bundle") {
    return {
      intro: MONEY_MASTERY_FOUNDATION_COPY,
      benefitsTitle: "You Will Gain Lifetime Access To",
      items: MONEY_MASTERY_LIFETIME_BENEFIT_ITEMS,
      frameTone: "green" as const,
      titleLightning: "cyan" as const,
    };
  }
  return {
    intro: `${KNIGHT_SUBSCRIPTION_COPY} ${KNIGHT_EXECUTION_COPY.join(" ")}`,
    benefitsTitle: "You Will Gain Access To",
    items: KNIGHT_MEMBERSHIP_BENEFIT_ITEMS,
    frameTone: "cyan" as const,
    titleLightning: "gold" as const,
  };
}

/** Home page Syndicate Elite Offers intro block (read-more paragraphs). */
export const HOME_ELITE_OFFERS_PARAGRAPHS: readonly string[] = [
  MONEY_MASTERY_FOUNDATION_COPY,
  "You will gain lifetime access to:",
  ...MONEY_MASTERY_LIFETIME_FEATURES,
  `Or choose ${KNIGHT_SUBSCRIPTION_COPY}`,
  ...KNIGHT_EXECUTION_COPY,
  "You will gain access to:",
  ...KNIGHT_MEMBERSHIP_FEATURES,
];

/** Row 1 — Money Mastery + The Knight */
export const PLAN_OFFERS_PRIMARY: readonly PlanOfferDef[] = [
  {
    plan: "bundle",
    title: "Money Mastery Bundle",
    imageSrc: OFFER_PLAN_THUMB_MONEY_MASTERY,
    teaser: MONEY_MASTERY_FOUNDATION_COPY,
    displayPrice: "$333",
    comparePrice: "$555",
    billingLabel: "/lifetime",
    checkoutAmount: "333",
    billing: "monthly",
    openLabel: "Unlock Full Pack",
    accent: "amber",
    detailTitle: "MONEY MASTERY",
    detailDescription: MONEY_MASTERY_FOUNDATION_COPY,
    detailFeatures: MONEY_MASTERY_LIFETIME_FEATURES,
    grantsEntitlement: true,
  },
  {
    plan: "king",
    title: "The Knight",
    imageSrc: OFFER_PLAN_THUMB_THE_KNIGHT,
    teaser: KNIGHT_SUBSCRIPTION_COPY,
    displayPrice: "$19.99",
    comparePrice: "$99.99",
    billingLabel: "/mo",
    checkoutAmount: "19.99",
    billing: "monthly",
    openLabel: KNIGHT_LAUNCHING_SOON_LABEL,
    openHref: "/membership",
    isComingSoon: true,
    accent: "cyan",
    detailTitle: "The Knight",
    detailDescription: `${KNIGHT_SUBSCRIPTION_COPY} ${KNIGHT_EXECUTION_COPY.join(" ")}`,
    detailFeatures: KNIGHT_MEMBERSHIP_FEATURES,
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
    displayPrice: "$150",
    comparePrice: "$230",
    billingLabel: "/lifetime",
    checkoutAmount: "150",
    billing: "monthly",
    openLabel: "Unlock Full Pack",
    openAction: "vault_picker",
    detailsLabel: "View All Videos",
    accent: "pink",
    detailTitle: "AGENTIC AI",
    detailDescription:
      "Agentic AI is not a single course — it is a vault of autonomous systems. Buy once for $150 and unlock every module below: n8n agents, Claude Code doctrine, MCP workflows, RAG pipelines, and business automations built for operators who refuse manual execution. Dashboard access records immediately; full library entitlement activates as each protocol deploys. Deploy à la carte across the vault (about $200 if bought separately) if you prefer surgical strikes over total vault capture.",
    detailFeatures: [
      "Build a Blog Writing Agent With N8N",
      "Build a WhatsApp Agent with n8n",
      "Build Apps With secret Claude Code Skill",
      "Claude Code + Consensus for INSANE $50k+ App Ideas",
      "Is Claude Code Better than n8n",
      "Claude Code Memory Change",
      "Claude Cowork Automations",
      "Scrap Any Website with N8N",
      "Set up Google Credentials in n8n",
      "Google Antigravity FULL COURSE 2 HOURS",
      "n8n Tutorial 37 Tips and Tricks (n8n Masterclass)",
      "CLAUDE CODE ADVANCED COURSE — 3 HOURS",
      "CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)",
      "4 Claude Code Hacks To Make Any Website Look Pro",
      "12 Ways to Fix Context in Claude Code",
      "27 Claude Code TIPS",
      "Automated Faceless Shorts with AI",
      "Claude Cowork Marketing",
      "From Zero to RAG Agent",
      "Insane Youtube Automations",
      "n8n Blogging Automation: Generate SEO Blogs in Minutes",
      "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)",
      "Never label gmail emails again",
      "Alternatives to N8N in 2026",
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
    displayPrice: "$150",
    comparePrice: "$250",
    billingLabel: "/lifetime",
    checkoutAmount: "150",
    billing: "monthly",
    openLabel: "Unlock Full Pack",
    openAction: "vault_picker",
    detailsLabel: "View All Videos",
    accent: "green",
    detailTitle: "AI CONTENT AUTOMATION",
    detailDescription:
      "AI Content Automation is the faceless operator's arsenal. Buy the full vault for $150 and unlock every module below — YouTube automation, Shorts at scale, viral documentaries, finance niches, NotebookLM clones, and bulk publishing blueprints. No vanity access: every purchase records to your dashboard with controlled entitlement as modules go live. Prefer precision? Deploy individual protocols à la carte (about $200 if bought separately).",
    detailFeatures: [
      "Beginners Guide to Faceless YouTube in 2026 (3 hours)",
      "New YouTube Policy ENDS These Faceless YouTube Channels",
      "Start YouTube Automation in 2026 (Step By Step) NO FACE",
      "Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)",
      "Build a VIRAL AI Movie Channel Using Only AI Tools",
      "Create Viral High RPM Finance Videos Using AI (Full Blueprint)",
      "Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)",
      "Build a Viral AI Influencer (AI Instagram Models)",
      "Make a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)",
      "Build a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)",
      "Use AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)",
      "Clone a VIRAL 3D Documentary Channel Using AI (Full Course)",
      "Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)",
      "Build a Viral Universe Documentary Channel Using Only AI (Step by Step!)",
      "ACTUALLY Go Viral",
      "50 Easy Faceless Niches",
      "Create 1,000 YouTube Shorts Using FREE AI - Free Auto Shorts in Bulk",
      "Crack The NEW Algorithm",
      "These Faceless YouTube Niches Are Now BANNED",
      "Write Faceless YouTube Scripts That Get 100s Of Millions Of Views",
      "The Smart Way to Build a Faceless Finance Channel",
      "New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)",
      "Create Motion Graphics videos in MINUTES with AI",
      "Viral Faceless Stickman POV",
      "The Secret NotebookLM Workflow Every YouTuber Needs!",
      "Create viral 3D documentary videos using ai(FERN 3D STYLE)",
      "Make VIRAL Life Advice Videos Using Only FREE AI Tools",
      "Create Viral inspirational finance Videos with Free AI Tools",
      "Clone ANY YouTube Channel With AI (NotebookLM Hack)",
    ],
    grantsEntitlement: false,
  },
  {
    plan: "trading_technical_analysis",
    title: "Trading Advanced Technical Analysis",
    imageSrc: OFFER_PLAN_THUMB_TRADING,
    teaser:
      "The financial markets are a battlefield engineered to transfer wealth from the emotional to the disciplined. This protocol is your definitive strategic weapon — master-level technical analysis, high-leverage indicators, and cold, mathematical execution across stocks and crypto.",
    displayPrice: "$150",
    comparePrice: "$200",
    billingLabel: "/lifetime",
    checkoutAmount: "150",
    billing: "monthly",
    openLabel: "Unlock Full Pack",
    openAction: "vault_picker",
    detailsLabel: "View All Videos",
    accent: "purple",
    imageMobileFit: "contain",
    detailTitle: "TRADING ADVANCED TECHNICAL ANALYSIS",
    detailDescription:
      "The financial markets are a battlefield engineered to transfer wealth from the emotional to the disciplined. If you are trading based on hype, hope, or uncalculated intuition, you are not an investor—you are liquidity. The elite do not guess; they execute proven, probabilistic trading strategies that extract capital regardless of economic conditions. You lack the systematic leverage to read the charts and command the market. This protocol is your definitive strategic weapon. It is the ultimate roadmap to strip away emotion, deploy master-level technical analysis, and architect a system for compounding wealth across stocks and crypto. We eliminate the theoretical noise and amateur gambling psychology to deliver the raw, operational mechanics of a professional trading matrix. This is a comprehensive, three-part masterclass in trading architecture. You will master the logic of advanced technical analysis, deploy high-leverage indicators, and command advanced candlestick strategies. Furthermore, you will weaponize complex chart setups—from mature candlestick patterns to confirmation signals and RSI divergences. By internalizing multi-hit methodology, time counts, and flawless entry-point fine-tuning, you are not just learning to trade. You are engineering a ruthless, self-sustaining system that executes your financial will with cold, mathematical precision. Unlock the full stack for $150 — Scalpel Protocol, Master Trader strategies, setups, and classified execution secrets — or buy individual modules at $50 each (about $200 if bought separately).",
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
