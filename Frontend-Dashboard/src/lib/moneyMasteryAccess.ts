import type { PortalUser } from "@/lib/portal-api";

const MONEY_MASTERY_TIERS = new Set(["money_mastery", "full"]);

/** Lifetime Money Mastery unlocks every program, vault module, and nested lesson. */
export function hasMoneyMasteryAccess(
  accessTier: string | undefined | null,
  moneyMasteryActive?: boolean | null,
): boolean {
  if (moneyMasteryActive) return true;
  return MONEY_MASTERY_TIERS.has(String(accessTier ?? "").trim().toLowerCase());
}

export function hasMoneyMasteryFromUser(user: PortalUser | null | undefined): boolean {
  if (!user) return false;
  return hasMoneyMasteryAccess(user.access_tier, user.money_mastery_active);
}
