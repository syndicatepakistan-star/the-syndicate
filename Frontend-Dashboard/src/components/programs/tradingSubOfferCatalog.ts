import {
  OFFER_PLAN_THUMB_TRADING,
} from "@/components/programs/offerPlanThumbnails";
import type { PlanOfferDef, TradingSubOfferKey } from "@/components/programs/planOfferCatalog";

const COURSES_BASE = "/assets/programs/cources imnages";

export const TRADING_SUB_THUMB_SCALPEL = `${COURSES_BASE}/${encodeURIComponent("1 minute scalpel.jpeg")}`;
export const TRADING_SUB_THUMB_STRATEGIES = `${COURSES_BASE}/${encodeURIComponent("trading with technical analysis.png")}`;
export const TRADING_SUB_THUMB_SETUPS = OFFER_PLAN_THUMB_TRADING;
export const TRADING_SUB_THUMB_SECRETS = `${COURSES_BASE}/secret.png`;

/** Individual protocols inside the Trading Advanced Technical Analysis vault. */
export const TRADING_SUB_OFFERS: readonly PlanOfferDef[] = [
  {
    plan: "trading_scalpel_protocol",
    title: "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
    imageSrc: TRADING_SUB_THUMB_SCALPEL,
    teaser:
      "Overnight exposure is institutional bait — this protocol weaponizes the 1-minute chart for surgical entries, defined exits, and capital extraction without macro guesswork",
    displayPrice: "$39",
    comparePrice: "$59",
    billingLabel: "/lifetime",
    checkoutAmount: "39",
    billing: "monthly",
    openLabel: "Unlock",
    accent: "purple",
    detailTitle: "THE SCALPEL PROTOCOL",
    detailDescription:
      "Buy once — unlock the full 1-minute scalping masterclass. Support and resistance, flags, wedges, channels, gap fills, and risk rails built for hyper-focused day trading.",
    detailFeatures: [
      "Technical analysis fundamentals — support & resistance",
      "Bull and bear flags",
      "Falling wedges — the money-making machines",
      "Rising wedges and powerful reversals",
      "Moving average strategies",
      "Parallels, channels, and gap fills",
      "Risk management and trade execution",
      "Live demonstrations and conclusion",
    ],
    grantsEntitlement: false,
  },
  {
    plan: "trading_master_strategies",
    title: "Strategies of a Master Trader",
    imageSrc: TRADING_SUB_THUMB_STRATEGIES,
    teaser:
      "Retail traders react — master traders architect probability stacks — this vault installs the strategic frameworks that turn noise into repeatable edge",
    displayPrice: "$29",
    comparePrice: "$49",
    billingLabel: "/lifetime",
    checkoutAmount: "29",
    billing: "monthly",
    openLabel: "Unlock",
    accent: "purple",
    detailTitle: "STRATEGIES OF A MASTER TRADER",
    detailDescription:
      "Buy once — unlock the strategic playbook master traders use before a single order hits the book. Probability, positioning, and execution logic stripped of retail mythology.",
    detailFeatures: [
      "Strategic market read — trend vs range regimes",
      "Probability stacking before entry",
      "Risk-reward architecture for asymmetric trades",
      "Multi-timeframe alignment protocols",
      "Capital deployment and position sizing rules",
      "When to stand down — preserving edge",
    ],
    grantsEntitlement: false,
  },
  {
    plan: "trading_master_setups",
    title: "Setups of a Master Trader",
    imageSrc: TRADING_SUB_THUMB_SETUPS,
    teaser:
      "A strategy without a trigger is philosophy — this protocol delivers the exact chart setups master traders wait for before committing capital",
    displayPrice: "$29",
    comparePrice: "$49",
    billingLabel: "/lifetime",
    checkoutAmount: "29",
    billing: "monthly",
    openLabel: "Unlock",
    accent: "purple",
    imageObjectPosition: "center center",
    detailTitle: "SETUPS OF A MASTER TRADER",
    detailDescription:
      "Buy once — unlock the high-conviction setup library. Every module maps a repeatable chart pattern to a defined entry, invalidation, and target.",
    detailFeatures: [
      "Breakout and retest setups",
      "Pullback entries in strong trends",
      "Reversal triggers at key levels",
      "Volume and momentum confirmation filters",
      "Setup grading — A+ vs noise",
      "Execution checklist before every trade",
    ],
    grantsEntitlement: false,
  },
  {
    plan: "trading_master_secrets",
    title: "Secrets of a Master Trader",
    imageSrc: TRADING_SUB_THUMB_SECRETS,
    teaser:
      "The crowd sees candles — the elite see the playbook — this vault exposes the hidden execution rules that separate liquidity from leverage",
    displayPrice: "$29",
    comparePrice: "$49",
    billingLabel: "/lifetime",
    checkoutAmount: "29",
    billing: "monthly",
    openLabel: "Unlock",
    accent: "purple",
    detailTitle: "SECRETS OF A MASTER TRADER",
    detailDescription:
      "Buy once — unlock the insider execution layer. Psychology, journaling, institutional tells, and the operational habits that keep master traders in the game.",
    detailFeatures: [
      "Emotional circuit breakers under live fire",
      "Trade journal protocols that compound edge",
      "Reading institutional footprint on the chart",
      "Session routines and pre-market prep",
      "Scaling winners without giving back gains",
      "The compounding mindset — playing infinite games",
    ],
    grantsEntitlement: false,
  },
] as const;

export function tradingSubOfferByKey(plan: TradingSubOfferKey): PlanOfferDef | undefined {
  return TRADING_SUB_OFFERS.find((o) => o.plan === plan);
}

export function isTradingSubOfferKey(value: string): value is TradingSubOfferKey {
  return TRADING_SUB_OFFERS.some((o) => o.plan === value.trim());
}
