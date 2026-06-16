import type { PortalUser } from "@/lib/portal-api";

/** Syndicate Mode APIs (`/api/challenges/...`) require The Knight tier (or staff). */
export function hasSyndicateKnightApiAccess(user: PortalUser | null | undefined): boolean {
  if (!user) return false;
  if (user.is_staff) return true;
  const tier = (user.access_tier || "").trim().toLowerCase();
  return tier === "king" || tier === "full";
}

/** When monk nav is locked, skip Syndicate Mode network calls (avoids 403 noise on Money Mastery). */
export function syndicateKnightApiEnabled(
  user: PortalUser | null | undefined,
  monkNavLocked?: boolean,
): boolean {
  if (monkNavLocked) return false;
  return hasSyndicateKnightApiAccess(user);
}
