import type { CheckoutOfferKey, PlanOfferAccent, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import { resolveVaultModuleDetail, resolveVaultModuleTeaser } from "@/components/programs/vaultModuleCopy";
import { VAULT_SUB_COURSE_NEON_ACCENTS } from "@/components/programs/vaultPackCatalog";

const PACKS_BASE = "/assets/programs/packs courses";

function packThumb(filename: string): string {
  return `${PACKS_BASE}/trading/${encodeURIComponent(filename)}`;
}

type SubmoduleRow = { title: string; filename: string };

const SECRETS_ROWS: SubmoduleRow[] = [
  { title: "Secrets Module 1", filename: "Secrets_M1_Final.mp4" },
  { title: "Secrets Module 2", filename: "Secrets_M2_Final.mp4" },
  { title: "Secrets Module 3", filename: "Secrets_M3.mp4" },
  { title: "Secrets Module 4", filename: "Secrets_M4.mp4" },
  { title: "Secrets Module 5", filename: "Secrets_M5.mp4" },
  { title: "Secrets Module 6", filename: "Secrets_M6.mp4" },
  { title: "Secrets Module 7", filename: "Secrets_M7.mp4" },
  { title: "Secrets Module 8", filename: "Secrets_M8.mp4" },
  { title: "Secrets Module 9", filename: "Secrets_M9.mp4" },
  { title: "Secrets Module 10", filename: "Secrets_M10.mp4" },
  { title: "Secrets Module 11", filename: "Secrets_M11.mp4" },
  { title: "Secrets Module 12", filename: "Secrets_M12.mp4" },
  { title: "Secrets Module 13", filename: "Secrets_M13.mp4" },
  { title: "Secrets Module 14", filename: "Secrets_M14.mp4" },
  { title: "Secrets Module 15", filename: "Secrets_M15.mp4" },
  { title: "Secrets Module 16", filename: "Secrets_M16.mp4" },
  { title: "Secrets Goals", filename: "Secrets_Goals.mp4" },
  { title: "Secrets Recap — Setups", filename: "Secrets_Recap_Setups.mp4" },
  { title: "Secrets Recap — Strategies", filename: "Secrets_Recap_Strategies.mp4" },
];

const SETUPS_ROWS: SubmoduleRow[] = [
  { title: "Setups Introduction", filename: "Setups_Intro.mp4" },
  { title: "Setups Module 1", filename: "Setups_M1_Final.mp4" },
  { title: "Setups Module 2", filename: "Setups_M2_Final.mp4" },
  { title: "Setups Module 3", filename: "Setups_M3_Final.mp4" },
  { title: "Setups Module 4", filename: "Setups_M4_final.mp4" },
  { title: "Setups Module 5", filename: "Setups_M5_Final.mp4" },
  { title: "Setups Module 6", filename: "Setups_M6_Final.mp4" },
  { title: "Setups Module 7", filename: "Setups_M7_Final.mp4" },
  { title: "Setups Module 8", filename: "Setups_M8_Final.mp4" },
  { title: "Setups Module 9", filename: "Setups_M9_Final.mp4" },
  { title: "Setups Module 10", filename: "Setups_M10_Final.mp4" },
  { title: "Setups Module 11", filename: "Setups_M11_Final.mp4" },
  { title: "Setups Module 12", filename: "Setups_M12_Final.mp4" },
  { title: "Setups Module 13", filename: "Setups_13_Final.mp4" },
  { title: "Setups Module 14", filename: "Setusp_M14_final.mp4" },
  { title: "Setups Module 15", filename: "Setups_M15_Final.mp4" },
  { title: "Setups Module 16", filename: "Setups_M16_Final.mp4" },
  { title: "Setups Closing", filename: "Setups_Closing_Final.mp4" },
];

const STRATEGIES_ROWS: SubmoduleRow[] = [
  { title: "Strategies Module 1", filename: "Strategies_M1.mp4" },
  { title: "Strategies Module 2", filename: "Strategies_M2.mp4" },
  { title: "Strategies Module 3", filename: "Strategies_M3.mp4" },
  { title: "Strategies Module 4", filename: "Strategies_M4.mp4" },
  { title: "Strategies Module 5", filename: "Strategies_M5.mp4" },
  { title: "Strategies Module 6", filename: "Strategies_M6.mp4" },
  { title: "Strategies Module 7", filename: "Strategies_M7.mp4" },
  { title: "Strategies Module 8", filename: "StrategiesM8.mp4" },
];

const SCALPEL_ROWS: SubmoduleRow[] = [
  { title: "Chapter 1 — Introduction", filename: "1. Chapter 1 - Introduction Course.mp4" },
  { title: "Chapter 2 — Bull and Bear Flags", filename: "2. Chapter 2 - Bull and Bear Flags.mp4" },
  { title: "Chapter 3 — Falling Wedges", filename: "3. Chapter 3 - Falling Wedges.mp4" },
  { title: "Chapter 4 — Rising Wedges", filename: "4. Chapter 4 - Rising Wedges.mp4" },
  { title: "Chapter 5 — Moving Averages Strategies", filename: "5. Chapter 5 - Moving Averages Strategies.mp4" },
  { title: "Chapter 6 — Parallels and Channels", filename: "6. Module 6 Parallels and Channels.mp4" },
  { title: "Chapter 7 — Final Protocol", filename: "7. Module chapter 7 final video.mp4" },
  { title: "Chapter 8 — Retrace to the Scene of Crime", filename: "8. Chapter 8 - Retrace to the Scene of Crime.mp4" },
  { title: "Chapter 9 — Risk Management", filename: "9. Chapter 9 - Risk Management.mp4" },
  { title: "Chapter 10 — Final Execution", filename: "10. Module chapter 10_final video.mp4" },
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
    parentModule: parent,
    unitPrice: 9,
    comparePrice: 14,
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
    image: packThumb("secrets.jpg"),
    slug: "trading_master_secrets",
  },
  trading_master_setups: {
    title: "Setups of a Master Trader",
    image: packThumb("setup.jpg"),
    slug: "trading_master_setups",
  },
  trading_master_strategies: {
    title: "Strategies of a Master Trader",
    image: packThumb("strategies.jpg"),
    slug: "trading_master_strategies",
  },
  trading_scalpel_protocol: {
    title: "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart",
    image: packThumb("1- min.jpg"),
    slug: "trading_scalpel_protocol",
  },
};

const PARENT_BY_SLUG = new Map<string, TradingModuleSlug>(
  TRADING_SUBMODULES.map((row) => [row.slug as string, row.parentModule])
);

export function isTradingSubmoduleSlug(slug: string): boolean {
  return PARENT_BY_SLUG.has(slug.trim().toLowerCase());
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
    imageSrc: TRADING_MODULE_META[row.parentModule].image,
    teaser: resolveVaultModuleTeaser(row.title, "trading_technical_analysis"),
    displayPrice: `$${row.unitPrice}`,
    comparePrice: `$${row.comparePrice}`,
    billingLabel: "/lifetime",
    checkoutAmount: price,
    billing: "monthly",
    openLabel: "Unlock",
    accent: VAULT_SUB_COURSE_NEON_ACCENTS[accentIndex % VAULT_SUB_COURSE_NEON_ACCENTS.length],
    detailTitle: row.title.toUpperCase(),
    detailDescription: resolveVaultModuleDetail(row.title, "trading_technical_analysis"),
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
