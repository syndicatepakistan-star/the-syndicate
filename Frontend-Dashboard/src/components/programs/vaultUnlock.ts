import type { CheckoutOfferKey, PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import { vaultCoursesForPack } from "@/components/programs/vaultPackCatalog";

const MONEY_MASTERY_TIERS = new Set(["money_mastery", "full"]);

export function hasMoneyMasteryAccess(accessTier: string | undefined | null): boolean {
  return MONEY_MASTERY_TIERS.has(String(accessTier ?? "").trim().toLowerCase());
}

export function isVaultOfferUnlocked(
  offer: Pick<PlanOfferDef, "plan" | "vaultPackPlan">,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null
): boolean {
  if (hasMoneyMasteryAccess(accessTier)) return true;
  if (purchasedSlugs.has(offer.plan)) return true;
  const pack = offer.vaultPackPlan ?? (isVaultPackPlanKey(offer.plan) ? offer.plan : null);
  if (pack && purchasedSlugs.has(pack)) return true;
  return false;
}

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

function isVaultPackPlanKey(plan: CheckoutOfferKey): plan is VaultPackKey {
  return plan === "agentic_ai" || plan === "ai_content_automation" || plan === "trading_technical_analysis";
}

export function resolveOfferActionLabel(
  offer: Pick<PlanOfferDef, "plan" | "vaultPackPlan" | "openLabel">,
  purchasedSlugs: ReadonlySet<string>,
  accessTier: string | undefined | null
): string {
  return isVaultOfferUnlocked(offer, purchasedSlugs, accessTier) ? "Open" : offer.openLabel;
}
