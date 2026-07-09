import type { CheckoutOfferKey, PlanOfferAccent, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import { resolveVaultModuleDetail, resolveVaultModuleTeaser } from "@/components/programs/vaultModuleCopy";
import { VAULT_SUB_COURSE_NEON_ACCENTS } from "@/components/programs/vaultPackCatalog";

const PACKS_BASE = "/assets/programs/packs courses";

const TRADING_LESSON_UNIT = 3;
const TRADING_LESSON_COMPARE = 5;

function tradingRootThumb(filename: string): string {
  return `${PACKS_BASE}/trading/${encodeURIComponent(filename)}`;
}

function tradingLessonThumb(subfolder: string, filename: string): string {
  return `${PACKS_BASE}/trading/${encodeURIComponent(subfolder)}/${encodeURIComponent(filename)}`;
}

type SubmoduleRow = { title: string; filename: string; image: string };

const SECRETS_ROWS: SubmoduleRow[] = [
  { title: "The Confirmation Signal", filename: "Secrets_M1_Final.mp4", image: tradingLessonThumb("secrets pack", "Confirmation Signal.jpg") },
  { title: "Drawing Proper Trendlines", filename: "Secrets_M2_Final.mp4", image: tradingLessonThumb("secrets pack", "drawing trendlines.jpg") },
  { title: "Scene of the Crime Retrace", filename: "Secrets_M3.mp4", image: tradingLessonThumb("secrets pack", "Scene of the Crime Retrace.jpg") },
  { title: "Measured Move", filename: "Secrets_M4.mp4", image: tradingLessonThumb("secrets pack", "Measured Move.jpg") },
  { title: "Three Tail Theory", filename: "Secrets_M5.mp4", image: tradingLessonThumb("secrets pack", "Three Tail Theory.jpg") },
  { title: "Trading Parallels", filename: "Secrets_M6.mp4", image: tradingLessonThumb("secrets pack", "Trading Parallels.jpg") },
  { title: "Major vs Minor Support and Resistance", filename: "Secrets_M7.mp4", image: tradingLessonThumb("secrets pack", "major vs minor.jpg") },
  { title: "Multi-Hit Methodology", filename: "Secrets_M8.mp4", image: tradingLessonThumb("secrets pack", "Multi HIt methodology.jpg") },
  { title: "Trading the Hit and Kiss of a Level", filename: "Secrets_M9.mp4", image: tradingLessonThumb("secrets pack", "The Hit & Kiss.jpg") },
  { title: "Macro Versus Micro Patterns", filename: "Secrets_M10.mp4", image: tradingLessonThumb("secrets pack", "macro vs micro patterns.jpg") },
  { title: "Bull and Bear Flag Flips", filename: "Secrets_M11.mp4", image: tradingLessonThumb("secrets pack", "Bull & Bear Flag Flips.jpg") },
  { title: "Trading RSI Divergences", filename: "Secrets_M12.mp4", image: tradingLessonThumb("secrets pack", "RSI Divergences.jpg") },
  { title: "Time Counts", filename: "Secrets_M13.mp4", image: tradingLessonThumb("secrets pack", "Time Counts.jpg") },
  { title: "The Biggest Moves Come from Failed Moves", filename: "Secrets_M14.mp4", image: tradingLessonThumb("secrets pack", "Biggest moves come from failed moves.jpg") },
  { title: "Time Value of a Level", filename: "Secrets_M15.mp4", image: tradingLessonThumb("secrets pack", "Time Value of level.jpg") },
  { title: "Fine-Tuning Entry Points", filename: "Secrets_M16.mp4", image: tradingLessonThumb("secrets pack", "fine tunning.jpg") },
  { title: "Goals and Expectations", filename: "Secrets_Goals.mp4", image: tradingLessonThumb("secrets pack", "Goals & Expectations.jpg") },
];

const SETUPS_ROWS: SubmoduleRow[] = [
  { title: "Introduction", filename: "Setups_Intro.mp4", image: tradingLessonThumb("setups pack", "introduction.jpg") },
  { title: "Setups of a Master Trader", filename: "Setups_M1_Final.mp4", image: tradingLessonThumb("setups pack", "setup.jpg") },
  { title: "Bull and Bear Flag Setups", filename: "Setups_M2_Final.mp4", image: tradingLessonThumb("setups pack", "bull & bear flag.jpg") },
  { title: "Cup and Handle Setups", filename: "Setups_M3_Final.mp4", image: tradingLessonThumb("setups pack", "cup and handle.jpg") },
  { title: "Mature Versus Immature Patterns and Setups", filename: "Setups_M4_final.mp4", image: tradingLessonThumb("setups pack", "mature vs immature.jpg") },
  { title: "Megaphone and Consolidation Patterns", filename: "Setups_M5_Final.mp4", image: tradingLessonThumb("setups pack", "megaphone & consolidation.jpg") },
  { title: "Downsloping and Upsloping Channels", filename: "Setups_M6_Final.mp4", image: tradingLessonThumb("setups pack", "downsloping & upsloping.jpg") },
  { title: "Double Tops and Double Bottoms", filename: "Setups_M7_Final.mp4", image: tradingLessonThumb("setups pack", "double tops & double bottoms.jpg") },
  { title: "Triple Tops and Beyond", filename: "Setups_M8_Final.mp4", image: tradingLessonThumb("setups pack", "triple tops.jpg") },
  { title: "The M-A Pattern", filename: "Setups_M9_Final.mp4", image: tradingLessonThumb("setups pack", "The M-A pattern.jpg") },
  { title: "The W-V Pattern", filename: "Setups_M10_Final.mp4", image: tradingLessonThumb("setups pack", "The W-V pattern.jpg") },
  { title: "Gaps and Gap Fills", filename: "Setups_M11_Final.mp4", image: tradingLessonThumb("setups pack", "gaps & gap filler.jpg") },
  { title: "The Power of the Move", filename: "Setups_M12_Final.mp4", image: tradingLessonThumb("setups pack", "power of the move.jpg") },
  { title: "Trading the Golden and Death Cross Setup", filename: "Setups_13_Final.mp4", image: tradingLessonThumb("setups pack", "Golden & Death setup.jpg") },
  { title: "Trading Doji Candle Setups", filename: "Setusp_M14_final.mp4", image: tradingLessonThumb("setups pack", "doji candle.jpg") },
  { title: "Topping and Bottoming Tail Setups", filename: "Setups_M15_Final.mp4", image: tradingLessonThumb("setups pack", "topping and bottoming tail.jpg") },
  { title: "Engulfing Candle Setups", filename: "Setups_M16_Final.mp4", image: tradingLessonThumb("setups pack", "Engulfing candle.jpg") },
  { title: "Wise Words for Master Setups", filename: "Setups_Closing_Final.mp4", image: tradingLessonThumb("setups pack", "wise words for master setups.jpg") },
];

const STRATEGIES_ROWS: SubmoduleRow[] = [
  { title: "Strategies of a Master Trader", filename: "Strategies_M1.mp4", image: tradingLessonThumb("strategies pack", "strategies.jpg") },
  { title: "The Keys to Building Wealth", filename: "Strategies_M2.mp4", image: tradingLessonThumb("strategies pack", "the keys to building wealth.jpg") },
  { title: "Favorite Trading Indicators", filename: "Strategies_M3.mp4", image: tradingLessonThumb("strategies pack", "favourite trading indicators.jpg") },
  { title: "Charting Strategies for Indicators", filename: "Strategies_M4.mp4", image: tradingLessonThumb("strategies pack", "charting strategies.jpg") },
  { title: "Support & Resistance Strategies", filename: "Strategies_M5.mp4", image: tradingLessonThumb("strategies pack", "support & resistance.jpg") },
  { title: "Candlestick Trading Strategies", filename: "Strategies_M6.mp4", image: tradingLessonThumb("strategies pack", "candlestick.jpg") },
  { title: "Risk vs Rewards & Rules to Trade", filename: "Strategies_M7.mp4", image: tradingLessonThumb("strategies pack", "risk, rewards & rules.jpg") },
  { title: "Extract the Market Capital", filename: "StrategiesM8.mp4", image: tradingLessonThumb("strategies pack", "Extract the market capital.jpg") },
];

const SCALPEL_ROWS: SubmoduleRow[] = [
  { title: "Chapter 1 — Introduction", filename: "1. Chapter 1 - Introduction Course.mp4", image: tradingLessonThumb("1- min pack", "introduction.jpg") },
  { title: "Chapter 2 — Bull and Bear Flags", filename: "2. Chapter 2 - Bull and Bear Flags.mp4", image: tradingLessonThumb("1- min pack", "bull & bear.jpg") },
  { title: "Chapter 3 — Falling Wedges", filename: "3. Chapter 3 - Falling Wedges.mp4", image: tradingLessonThumb("1- min pack", "falling.jpg") },
  { title: "Chapter 4 — Rising Wedges", filename: "4. Chapter 4 - Rising Wedges.mp4", image: tradingLessonThumb("1- min pack", "rising.jpg") },
  { title: "Chapter 5 — Moving Averages Strategies", filename: "5. Chapter 5 - Moving Averages Strategies.mp4", image: tradingLessonThumb("1- min pack", "averages.jpg") },
  { title: "Chapter 6 — Parallels and Channels", filename: "6. Module 6 Parallels and Channels.mp4", image: tradingLessonThumb("1- min pack", "parallels.jpg") },
  { title: "Chapter 7 — Final Protocol", filename: "7. Module chapter 7 final video.mp4", image: tradingLessonThumb("1- min pack", "final protocol.jpg") },
  { title: "Chapter 8 — Retrace to the Scene of Crime", filename: "8. Chapter 8 - Retrace to the Scene of Crime.mp4", image: tradingLessonThumb("1- min pack", "retrace.jpg") },
  { title: "Chapter 9 — Risk Management", filename: "9. Chapter 9 - Risk Management.mp4", image: tradingLessonThumb("1- min pack", "risk.jpg") },
  { title: "Chapter 10 — Final Execution", filename: "10. Module chapter 10_final video.mp4", image: tradingLessonThumb("1- min pack", "final execution.jpg") },
];

export type TradingModuleSlug =
  | "trading_master_secrets"
  | "trading_master_setups"
  | "trading_master_strategies"
  | "trading_scalpel_protocol";

export type TradingSubmoduleDef = {
  slug: CheckoutOfferKey;
  title: string;
  filename: string;
  image: string;
  parentModule: TradingModuleSlug;
  unitPrice: number;
  comparePrice: number;
};

function indexedSubmodules(
  prefix: string,
  parent: TradingModuleSlug,
  rows: SubmoduleRow[]
): TradingSubmoduleDef[] {
  return rows.map((row, index) => ({
    slug: `${prefix}_${String(index + 1).padStart(2, "0")}` as CheckoutOfferKey,
    title: row.title,
    filename: row.filename,
    image: row.image,
    parentModule: parent,
    unitPrice: TRADING_LESSON_UNIT,
    comparePrice: TRADING_LESSON_COMPARE,
  }));
}

export const TRADING_SUBMODULES: readonly TradingSubmoduleDef[] = [
  ...indexedSubmodules("trading_secrets", "trading_master_secrets", SECRETS_ROWS),
  ...indexedSubmodules("trading_setups", "trading_master_setups", SETUPS_ROWS),
  ...indexedSubmodules("trading_strategies", "trading_master_strategies", STRATEGIES_ROWS),
  ...indexedSubmodules("trading_scalpel", "trading_scalpel_protocol", SCALPEL_ROWS),
];

export const TRADING_MODULE_META: Record<
  TradingModuleSlug,
  { title: string; image: string; slug: TradingModuleSlug }
> = {
  trading_master_secrets: {
    title: "Secrets of a Master Trader",
    image: tradingRootThumb("secrets.jpg"),
    slug: "trading_master_secrets",
  },
  trading_master_setups: {
    title: "Setups of a Master Trader",
    image: tradingRootThumb("setup.jpg"),
    slug: "trading_master_setups",
  },
  trading_master_strategies: {
    title: "Strategies of a Master Trader",
    image: tradingRootThumb("strategies.jpg"),
    slug: "trading_master_strategies",
  },
  trading_scalpel_protocol: {
    title: "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
    image: tradingRootThumb("1- min.jpg"),
    slug: "trading_scalpel_protocol",
  },
};

const PARENT_BY_SLUG = new Map<string, TradingModuleSlug>(
  TRADING_SUBMODULES.map((row) => [row.slug as string, row.parentModule])
);

export function isTradingSubmoduleSlug(slug: string): boolean {
  return PARENT_BY_SLUG.has(slug.trim().toLowerCase());
}

export function isTradingModuleSlug(slug: string): boolean {
  return slug.trim().toLowerCase() in TRADING_MODULE_META;
}

export function tradingParentModuleForSlug(slug: string): TradingModuleSlug | null {
  return PARENT_BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

export function tradingSubmodulesForModule(moduleSlug: TradingModuleSlug): readonly TradingSubmoduleDef[] {
  return TRADING_SUBMODULES.filter((row) => row.parentModule === moduleSlug);
}

function submoduleToOffer(row: TradingSubmoduleDef, accentIndex: number): PlanOfferDef {
  const price = String(row.unitPrice);
  return {
    plan: row.slug,
    title: row.title,
    imageSrc: row.image,
    teaser: resolveVaultModuleTeaser(row.title, "trading_technical_analysis", row.slug),
    displayPrice: `$${row.unitPrice}`,
    comparePrice: `$${row.comparePrice}`,
    billingLabel: "/lifetime",
    checkoutAmount: price,
    billing: "monthly",
    openLabel: "Unlock",
    accent: VAULT_SUB_COURSE_NEON_ACCENTS[accentIndex % VAULT_SUB_COURSE_NEON_ACCENTS.length],
    detailTitle: row.title.toUpperCase(),
    detailDescription: resolveVaultModuleDetail(row.title, "trading_technical_analysis", row.slug),
    detailFeatures: [row.title, "Single lesson lifetime access", row.filename],
    grantsEntitlement: false,
    vaultPackPlan: "trading_technical_analysis",
  };
}

export function tradingSubmoduleOffersForModule(moduleSlug: TradingModuleSlug): readonly PlanOfferDef[] {
  return tradingSubmodulesForModule(moduleSlug).map((row, index) => submoduleToOffer(row, index));
}

export function tradingSubmoduleOfferBySlug(slug: CheckoutOfferKey): PlanOfferDef | undefined {
  const row = TRADING_SUBMODULES.find((entry) => entry.slug === slug);
  if (!row) return undefined;
  const index = TRADING_SUBMODULES.indexOf(row);
  return submoduleToOffer(row, index);
}

export function allTradingSubmoduleOffers(): readonly PlanOfferDef[] {
  return TRADING_SUBMODULES.map((row, index) => submoduleToOffer(row, index));
}
