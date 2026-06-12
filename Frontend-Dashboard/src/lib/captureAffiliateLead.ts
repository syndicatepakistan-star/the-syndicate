import { getAffiliateAttribution } from "@/lib/affiliateAttribution";
import { trackLeadFireAndForget, type TrackLeadKind } from "@/lib/affiliateApi";

const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isLikelyValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.length > 0 && BASIC_EMAIL_RE.test(trimmed);
}

export type CaptureAffiliateLeadOptions = {
  kind?: TrackLeadKind;
  label?: string;
};

/**
 * Record a referred visitor lead as soon as we have their email — purchase / OTP completion not required.
 * Backend dedupes per (affiliate_id, visitor_id, kind).
 */
export function captureAffiliateLead(email: string, options: CaptureAffiliateLeadOptions = {}): void {
  if (!isLikelyValidEmail(email)) return;
  const attribution = getAffiliateAttribution();
  if (!attribution) return;
  trackLeadFireAndForget(attribution.affiliateId, attribution.visitorId, email.trim(), {
    kind: options.kind ?? "auth",
    label: options.label,
  });
}

export function captureAffiliateAuthLead(
  email: string,
  label: "Sign up lead" | "Login lead" = "Sign up lead"
): void {
  captureAffiliateLead(email, { kind: "auth", label });
}
