import {
  OFFER_PLAN_THUMB_AGENTIC_AI,
  OFFER_PLAN_THUMB_AI_CONTENT_AUTOMATION,
  OFFER_PLAN_THUMB_MONEY_MASTERY,
  OFFER_PLAN_THUMB_THE_KNIGHT,
  OFFER_PLAN_THUMB_TRADING,
} from "@/components/programs/offerPlanThumbnails";
import type { GamingBenefitItem, GamingBenefitTone } from "@/components/GamingBenefitCards";
import {
  LEVEL1_BUSINESS_MODEL_PROGRAM_TITLES,
  LEVEL1_PSYCHOLOGY_PROGRAM_TITLES,
} from "@/lib/level1ProgramCatalog";
import {
  formatTempAwareAmount,
  formatTempAwareDisplayPrice,
} from "@/lib/tempTestPricing";

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
  | `ai_content_c${string}`
  | "level1_business_psychology"
  | "level1_business_models";

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

export const MONEY_MASTERY_WHAT_YOU_GET_TITLE = "What You Get";
export const MONEY_MASTERY_PLUS_YOU_GET_TITLE = "Plus You Get";

export const MONEY_MASTERY_WHAT_YOU_GET_FOOTER =
  "133 videos in total · One lifetime price — no hidden fees, no strings attached, no hidden obligation.";

/** Card / teaser stats grid — large neon figure + unit + label (matches What You Get layout). */
export type MoneyMasteryStatBlock = {
  value: string;
  unit: string;
  label: string;
  label2?: string;
  tone: GamingBenefitTone;
};

export const MONEY_MASTERY_CARD_WHAT_YOU_GET: readonly MoneyMasteryStatBlock[] = [
  { value: "11", unit: "Videos", label: "Business Models Programmes", tone: "gold" },
  { value: "26", unit: "Videos", label: "A.I Agentic Pack", label2: "Build 30 AI Projects", tone: "green" },
  { value: "29", unit: "Videos", label: "A.I Content Automation Pack", label2: "Build 28 Real Projects", tone: "pink" },
  { value: "11", unit: "Videos", label: "Business Behaviour Psychology", tone: "violet" },
];

export const MONEY_MASTERY_CARD_PLUS_YOU_GET: readonly MoneyMasteryStatBlock[] = [
  { value: "53", unit: "Videos", label: "Technical Trading Pack", label2 : "Learn 23 Advanced Trading Strategies", tone: "cyan" },
];

/** Summary pack overview shown at the top of Money Mastery details (separate from lifetime-access cards). */
export const MONEY_MASTERY_WHAT_YOU_GET_ITEMS: readonly GamingBenefitItem[] = [
  {
    tone: "amber",
    title: "Full Agentic AI Pack",
    desc: "26 videos · Total video length: 29hrs 15min 50s · Building 30 AI projects ($364 if purchased separately)",
  },
  {
    tone: "green",
    title: "Full AI Content Automation Pack",
    desc: "29 videos · Total video length: 12hrs 49min 32s · Building faceless content systems ($406 if purchased separately)",
  },
  {
    tone: "gold",
    title: "Full Real World Business Models Pack",
    desc: "11 different business models · 11 videos ($825 if purchased separately)",
  },
  {
    tone: "pink",
    title: "Full Business Behavioural Psychology Programmes Pack",
    desc: "11 different behavioural programmes · 11 videos ($1,089 if purchased separately)",
  },
  {
    tone: "cyan",
    title: "Full Advanced Technical Trading Pack",
    desc: "53 videos · Total video length: 20hrs 46min 48s ($396 if purchased separately)",
  },
  {
    tone: "violet",
    title: "Platform Access Included",
    desc: "Syndicate Dashboard · Syndicate Affiliate Programmes · Syndicate Certification",
  },
];

/** Plain-text card teaser mirroring the What You Get / Plus You Get stats grid. */
export const MONEY_MASTERY_CARD_TEASER = [
  MONEY_MASTERY_WHAT_YOU_GET_TITLE,
  ...MONEY_MASTERY_CARD_WHAT_YOU_GET.map((b) => `${b.value} ${b.unit} — ${b.label}`),
  MONEY_MASTERY_PLUS_YOU_GET_TITLE,
  ...MONEY_MASTERY_CARD_PLUS_YOU_GET.map((b) => `${b.value} ${b.unit} — ${b.label}`),
].join("\n");

export const MONEY_MASTERY_LIFETIME_FEATURES: readonly string[] = [
  "130 Individual Video Lessons Total",
  "11 Business Behavioral Psychology Programs",
  "11 Business Model Programs",
  "26 Videos – Agentic Ai Pack",
  "29 Videos – Ai Content Automation Pack",
  "53 Lessons – Advanced Candlestick Technical Analysis Pack (4 video packs)",
  "Access to Syndicate Dashboard",
  "Access to Syndicate Affiliate Opportunities",
  "Syndicate Certification",
];

const AGENTIC_PROJECT_HIGHLIGHTS = [
  "The Automated Gmail Sorter and Optimizer",
  "The Personal Customer Relationship Manager",
  "The Automated Newsletter Publisher",
  "The Social Media Reply Engine",
  "The Competitor Price Tracker",
  "The Dynamic Real Estate and Asset Scraper",
  "The Telegram-to-WordPress Blogging Bot",
  "The Live WhatsApp AI Assistant",
  "The Dynamic Lead Generation Funnel",
  "The Custom Knowledge Chatbot — Chat with Your Docs",
  "The Brand Voice Enforcer System",
  "The Trend Intelligence Dashboard",
] as const;

const AI_CONTENT_BUILD_HIGHLIGHTS = [
  "Complete Automation System",
  "Your Perfect Topic Plan",
  "First Automated Channel Setup",
  "Bulk Short Video Machine",
  "Viral Script Template",
  "High-Earning Finance Video",
  "Short AI Movie",
  "3D Animated Story",
  "Wisdom and Advice Video",
  "3D Style Documentary",
  "Space Documentary",
  "Animated Map Video",
  "Deep Thoughts Video",
  "Stickman Animation Video",
  "Moving Graphics Video",
  "Travel Documentary",
] as const;

const TRADING_LEARNING_HIGHLIGHTS = [
  "1-minute Scalpel Protocol — precision entries on micro charts",
  "Flag flips, wedges & measured-move setups that pay",
  "RSI divergences & multi-hit methodology for confirmation",
  "Golden / Death Cross + engulfing candle execution systems",
  "Risk vs reward rules that protect capital under pressure",
  "Macro vs micro pattern recognition for timing big moves",
] as const;

const DASHBOARD_FEATURE_HIGHLIGHTS = [
  "Track every program, progress, and unlock in one vault",
  "Operator command center for goals, streams & execution",
  "Permanent billing record of lifetime access",
  "Controlled entitlement across packs and Level 1 courses",
] as const;

const AFFILIATE_BENEFIT_HIGHLIGHTS = [
  "Earn referral revenue promoting Syndicate programmes",
  "Private affiliate dashboard for assets & performance",
  "Commission tracking and withdrawal controls",
  "Built for operators monetising trusted recommendations",
] as const;

/** Lifetime-access cards (bottom section) — program lists and pack detail. Order is intentional. */
export const MONEY_MASTERY_LIFETIME_BENEFIT_ITEMS: readonly GamingBenefitItem[] = [
  {
    tone: "orange",
    title: "130 Individual Video Lessons Total",
    desc: "The complete Money Mastery lifetime vault — every pack below in one pack.",
    bullets: [
      "26 Agentic AI lessons",
      "29 AI Content Automation lessons",
      "11 Business Model programmes",
      "11 Behavioural Psychology programmes",
      "53 Advanced Technical Trading lessons",
      "One checkout. Lifetime access. No recurring fees.",
    ],
  },
  {
    tone: "pink",
    title: "11 Business Behavioural Psychology Programmes",
    desc: "Master how elite operators think under pressure — every programme included:",
    bullets: LEVEL1_PSYCHOLOGY_PROGRAM_TITLES,
  },
  {
    tone: "gold",
    title: "11 Real World Business Model Programmes",
    desc: "Eleven different models — pick the lanes that fit your edge:",
    bullets: LEVEL1_BUSINESS_MODEL_PROGRAM_TITLES,
  },
  {
    tone: "amber",
    title: "Agentic AI Pack — 26 Videos",
    titleLine2: "Build 30 AI Projects",
    desc: "Some of the Real World Agentic Projects You will Build",
    bullets: AGENTIC_PROJECT_HIGHLIGHTS,
    ctaPackPlan: "agentic_ai",
    ctaHint: "View all 30 Projects to Build",
    ctaLabel: "Details",
  },
  {
    tone: "green",
    title: "AI Content Automation Pack — 29 Videos",
    titleLine2: "Build 28 Projects",
    desc: "Some of the Faceless Ai Content Projects You will Build",
    bullets: AI_CONTENT_BUILD_HIGHLIGHTS,
    ctaPackPlan: "ai_content_automation",
    ctaHint: "View all 28 Projects to Build",
    ctaLabel: "Details",
  },
  {
    tone: "cyan",
    title: "Advanced Technical Trading Pack — 53 Videos",
    titleLine2: "Learn 23 Strategies",
    desc: "Advanced strategies, setups, secrets & patterns you learn:",
    bullets: TRADING_LEARNING_HIGHLIGHTS,
    ctaPackPlan: "trading_technical_analysis",
    ctaHint: "View all 23 Strategies",
    ctaLabel: "Details",
  },
  {
    tone: "cyan",
    title: "Syndicate Dashboard",
    desc: "Your operator command center:",
    bullets: DASHBOARD_FEATURE_HIGHLIGHTS,
  },
  {
    tone: "violet",
    title: "Syndicate Affiliate Opportunities",
    desc: "Monetise trust with Syndicate referral paths:",
    bullets: AFFILIATE_BENEFIT_HIGHLIGHTS,
  },
  {
    tone: "gold",
    title: "Syndicate Certification",
    desc: "Credential your completion inside the vault — proof of discipline, not vanity paper.",
    bullets: [
      "Certificate pathways on completed programmes",
      "Operator-grade proof of execution",
      "Tied to real progress in your dashboard",
    ],
  },
];

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

/** Compact card face — keeps Money Mastery / Knight equal height with buttons visible. */
export const KNIGHT_CARD_FEATURES: readonly string[] = KNIGHT_MEMBERSHIP_FEATURES.slice(0, 4);

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
      intro: "",
      whatYouGetTitle: MONEY_MASTERY_WHAT_YOU_GET_TITLE,
      whatYouGetItems: MONEY_MASTERY_WHAT_YOU_GET_ITEMS,
      whatYouGetFooter: MONEY_MASTERY_WHAT_YOU_GET_FOOTER,
      benefitsTitle: "You Will Gain Lifetime Access To",
      items: MONEY_MASTERY_LIFETIME_BENEFIT_ITEMS,
      frameTone: "green" as const,
      titleLightning: "cyan" as const,
    };
  }
  return {
    intro: `${KNIGHT_SUBSCRIPTION_COPY} ${KNIGHT_EXECUTION_COPY.join(" ")}`,
    whatYouGetTitle: null as string | null,
    whatYouGetItems: null as readonly GamingBenefitItem[] | null,
    whatYouGetFooter: null as string | null,
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
    teaser: MONEY_MASTERY_CARD_TEASER,
    displayPrice: formatTempAwareDisplayPrice("bundle", 333),
    comparePrice: "$555",
    billingLabel: "/lifetime",
    checkoutAmount: formatTempAwareAmount("bundle", 333),
    billing: "monthly",
    openLabel: "Unlock",
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
    comparePrice: "$222",
    billingLabel: "/lifetime",
    checkoutAmount: "150",
    billing: "monthly",
    openLabel: "Unlock Full Pack",
    openAction: "vault_picker",
    detailsLabel: "View All Videos",
    accent: "pink",
    detailTitle: "AGENTIC AI",
    detailDescription:
      "Agentic AI is not a single course — it is a vault of autonomous systems. Buy once for $150 and unlock every module below: n8n agents, Claude Code doctrine, MCP workflows, RAG pipelines, and business automations built for operators who refuse manual execution. Dashboard access records immediately; full library entitlement activates as each protocol deploys. Deploy à la carte across the vault at $14 per module if you prefer surgical strikes over total vault capture.",
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
    comparePrice: "$222",
    billingLabel: "/lifetime",
    checkoutAmount: "150",
    billing: "monthly",
    openLabel: "Unlock Full Pack",
    openAction: "vault_picker",
    detailsLabel: "View All Videos",
    accent: "green",
    detailTitle: "AI CONTENT AUTOMATION",
    detailDescription:
      "AI Content Automation is the faceless operator's arsenal. Buy the full vault for $150 and unlock every module below — YouTube automation, Shorts at scale, viral documentaries, finance niches, NotebookLM clones, and bulk publishing blueprints. No vanity access: every purchase records to your dashboard with controlled entitlement as modules go live. Prefer precision? Deploy individual protocols à la carte at $14 each.",
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
    comparePrice: "$222",
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
