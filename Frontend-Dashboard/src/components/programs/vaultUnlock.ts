import type { CheckoutOfferKey, PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import { vaultCoursesForPack, vaultPackForPlanSlug } from "@/components/programs/vaultPackCatalog";
import {
  isTradingModuleSlug,
  isTradingSubmoduleSlug,
  tradingParentModuleForSlug,
} from "@/components/programs/tradingVaultCatalog";
import { hasMoneyMasteryAccess } from "@/lib/moneyMasteryAccess";

export { hasMoneyMasteryAccess };

function resolveVaultPackForOffer(offer: Pick<PlanOfferDef, "plan" | "vaultPackPlan">): VaultPackKey | null {
  if (offer.vaultPackPlan) return offer.vaultPackPlan;
  return vaultPackForPlanSlug(String(offer.plan));
}

/**
 * Vault unlock cascade (all mid-ticket packs):
 * - Money Mastery → every vault module and nested trading lesson
 * - Full pack slug → every module + nested lesson in that pack
 * - Trading parent module → all nested lessons in that module only
 * - Single nested lesson → that lesson only (never siblings or parent)
 */
export function isVaultOfferUnlocked(
  offer: Pick<PlanOfferDef, "plan" | "vaultPackPlan">,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null,
  moneyMasteryActive?: boolean | null,
): boolean {
  return userHasVaultPlanAccess(String(offer.plan), purchasedSlugs, accessTier, moneyMasteryActive, offer.vaultPackPlan);
}

/** Check unlock for a raw plan slug (pack, module, or lesson). */
export function userHasVaultPlanAccess(
  planRaw: string,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null,
  moneyMasteryActive?: boolean | null,
  vaultPackPlan?: VaultPackKey,
): boolean {
  if (hasMoneyMasteryAccess(accessTier, moneyMasteryActive)) return true;

  const plan = (planRaw || "").trim().toLowerCase();
  if (!plan) return false;
  if (purchasedSlugs.has(plan)) return true;

  const pack = vaultPackPlan ?? vaultPackForPlanSlug(plan);
  if (pack && purchasedSlugs.has(pack)) return true;

  if (isTradingSubmoduleSlug(plan)) {
    const parentModule = tradingParentModuleForSlug(plan);
    if (parentModule && purchasedSlugs.has(parentModule)) return true;
  }

  return false;
}

/** True when the user bought the full pack or every top-level module in the pack. */
export function isVaultPackFullyUnlocked(
  pack: VaultPackKey,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null,
  moneyMasteryActive?: boolean | null,
): boolean {
  if (hasMoneyMasteryAccess(accessTier, moneyMasteryActive)) return true;
  if (purchasedSlugs.has(pack)) return true;
  const courses = vaultCoursesForPack(pack);
  return courses.length > 0 && courses.every((c) => userHasVaultPlanAccess(c.plan, purchasedSlugs, accessTier, moneyMasteryActive, pack));
}

export function resolveOfferActionLabel(
  offer: Pick<PlanOfferDef, "plan" | "vaultPackPlan" | "openLabel">,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null,
  moneyMasteryActive?: boolean | null,
): string {
  return isVaultOfferUnlocked(offer, purchasedSlugs, accessTier, moneyMasteryActive) ? "Open" : offer.openLabel;
}

/** Parent trading module cards unlock when the full pack or that module was purchased. */
export function isTradingModuleOfferUnlocked(
  moduleSlug: CheckoutOfferKey,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null,
  moneyMasteryActive?: boolean | null,
): boolean {
  if (!isTradingModuleSlug(moduleSlug)) return false;
  return userHasVaultPlanAccess(moduleSlug, purchasedSlugs, accessTier, moneyMasteryActive, "trading_technical_analysis");
}
