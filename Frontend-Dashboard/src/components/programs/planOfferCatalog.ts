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
      "Secure your seat for the upcoming Agentic AI vault — autonomous systems, agent orchestration, and production-grade AI ops. Dashboard access activates on purchase; program unlock follows when the vault goes live.",
    detailFeatures: [
      "Lifetime access reservation for Agentic AI",
      "Full dashboard login after checkout",
      "Program unlock when the vault launches",
      "Billing history in your account",
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
      "Reserve lifetime access to the AI Content Automation program before launch. Checkout unlocks your dashboard seat; the full curriculum unlocks when the program is published.",
    detailFeatures: [
      "Lifetime access reservation for AI Content Automation",
      "Full dashboard login after checkout",
      "Program unlock when the curriculum launches",
      "Billing history in your account",
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
