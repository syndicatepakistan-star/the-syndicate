import { OFFER_PLAN_THUMB_MONEY_MASTERY, OFFER_PLAN_THUMB_THE_KNIGHT } from "@/components/programs/offerPlanThumbnails";

export type PlanOfferKey = "bundle" | "king";

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
  accent: "amber" | "cyan";
  /** Large display title in the Details modal. */
  detailTitle: string;
  detailDescription: string;
  detailFeatures: readonly string[];
};

export const PLAN_OFFERS: readonly PlanOfferDef[] = [
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
  },
] as const;

export function planOfferByKey(plan: PlanOfferKey): PlanOfferDef | undefined {
  return PLAN_OFFERS.find((o) => o.plan === plan);
}
