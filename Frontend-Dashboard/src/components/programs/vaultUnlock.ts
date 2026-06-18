import type { CheckoutOfferKey, PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import { vaultCoursesForPack } from "@/components/programs/vaultPackCatalog";
import {
  isTradingModuleSlug,
  isTradingSubmoduleSlug,
  tradingParentModuleForSlug,
} from "@/components/programs/tradingVaultCatalog";

const MONEY_MASTERY_TIERS = new Set(["money_mastery", "full"]);

/** Money Mastery / staff-full: all program vault cards + playlists; Syndicate Mode + Membership stay locked via nav. */
export function hasMoneyMasteryAccess(accessTier: string | undefined | null): boolean {
  return MONEY_MASTERY_TIERS.has(String(accessTier ?? "").trim().toLowerCase());
}

function isVaultPackPlanKey(plan: CheckoutOfferKey): plan is VaultPackKey {
  return plan === "agentic_ai" || plan === "ai_content_automation" || plan === "trading_technical_analysis";
}

function resolveVaultPackForOffer(offer: Pick<PlanOfferDef, "plan" | "vaultPackPlan">): VaultPackKey | null {
  if (offer.vaultPackPlan) return offer.vaultPackPlan;
  return isVaultPackPlanKey(offer.plan) ? offer.plan : null;
}

/**
 * Vault unlock cascade (trading + other packs):
 * - Money Mastery → every vault module and nested trading lesson
 * - Full pack slug → every module + nested lesson in that pack
 * - Trading parent module → all nested lessons in that module only
 * - Single nested lesson → that lesson only (never siblings or parent)
 */
export function isVaultOfferUnlocked(
  offer: Pick<PlanOfferDef, "plan" | "vaultPackPlan">,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null
): boolean {
  if (hasMoneyMasteryAccess(accessTier)) return true;

  const plan = offer.plan;
  if (purchasedSlugs.has(plan)) return true;

  const pack = resolveVaultPackForOffer(offer);
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
  accessTier: string | undefined | null
): boolean {
  if (hasMoneyMasteryAccess(accessTier)) return true;
  if (purchasedSlugs.has(pack)) return true;
  const courses = vaultCoursesForPack(pack);
  return courses.length > 0 && courses.every((c) => purchasedSlugs.has(c.plan));
}

export function resolveOfferActionLabel(
  offer: Pick<PlanOfferDef, "plan" | "vaultPackPlan" | "openLabel">,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null
): string {
  return isVaultOfferUnlocked(offer, purchasedSlugs, accessTier) ? "Open" : offer.openLabel;
}

/** Parent trading module cards stay locked when only a nested lesson was purchased. */
export function isTradingModuleOfferUnlocked(
  moduleSlug: CheckoutOfferKey,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null
): boolean {
  if (!isTradingModuleSlug(moduleSlug)) return false;
  return isVaultOfferUnlocked(
    { plan: moduleSlug, vaultPackPlan: "trading_technical_analysis" },
    purchasedSlugs,
    accessTier
  );
}
