import type { PortalUser } from "@/lib/portal-api";

/** Syndicate Mode APIs (`/api/challenges/...`) require an active Knight subscription (or staff). */
export function hasSyndicateKnightApiAccess(user: PortalUser | null | undefined): boolean {
  if (!user) return false;
  if (user.is_staff) return true;
  if (user.knight_subscription_active) return true;
  const tier = (user.access_tier || "").trim().toLowerCase();
  return tier === "full";
}

/** When monk nav is locked, skip Syndicate Mode network calls (avoids 403 noise on Money Mastery). */
export function syndicateKnightApiEnabled(
  user: PortalUser | null | undefined,
  monkNavLocked?: boolean,
): boolean {
  if (monkNavLocked) return false;
  return hasSyndicateKnightApiAccess(user);
}

export function formatKnightSubscriptionRemaining(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const end = Date.parse(expiresAt);
  if (!Number.isFinite(end)) return null;
  const ms = end - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ${hours}h remaining`;
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
