export type AffiliateAttribution = {
  affiliateId: string;
  visitorId: string;
  offer: string;
  tier?: string;
  program?: string;
  createdAt: number;
};

const STORAGE_KEY = "affiliate_attribution_v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function hasWindow() {
  return typeof window !== "undefined";
}

export function saveAffiliateAttribution(payload: Omit<AffiliateAttribution, "createdAt">) {
  if (!hasWindow()) return;
  const value: AffiliateAttribution = { ...payload, createdAt: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getAffiliateAttribution(): AffiliateAttribution | null {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AffiliateAttribution;
    if (!parsed?.affiliateId || !parsed?.visitorId || !parsed?.offer || !parsed?.createdAt) {
      return null;
    }
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      clearAffiliateAttribution();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAffiliateAttribution() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Stripe checkout payload fields from stored referral attribution (30-day window). */
export function affiliateCheckoutFields(): Record<string, string> {
  const attr = getAffiliateAttribution();
  if (!attr?.affiliateId || !attr?.visitorId) return {};
  return {
    affiliate_id: attr.affiliateId,
    visitor_id: attr.visitorId,
  };
}

export function resolveAffiliateDestination(offer: string): string {
  if (offer === "singleprogram" || offer === "single-program") return "/";
  return "/";
}

