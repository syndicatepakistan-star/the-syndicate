import type {
  AffiliateFunnelResponse,
  AffiliateStats,
  AffiliateVisitorsResponse,
  RecentReferralsResponse,
  WithdrawalRequestPayload,
  WithdrawalRequestResponse,
  WithdrawalStatementResponse
} from "@/lib/affiliateTypes";
import { getSyndicateApiBase } from "@/lib/syndicateApiBase";

/**
 * Affiliate API lives on Django (`/api/track/...`, `/api/affiliate/auth/...`).
 * In the browser, use same-origin `/api/...` so Next.js rewrites forward to Django (see next.config.js).
 * Override with NEXT_PUBLIC_AFFILIATE_API_BASE_URL only for a separate tracking server.
 */
function affiliateApiRoot(): string {
  const override = (process.env.NEXT_PUBLIC_AFFILIATE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (override) {
    return override.endsWith("/api") ? override : `${override}/api`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/+$/, "")}/api`;
  }
  return getSyndicateApiBase();
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = JSON.parse(text) as { error?: string; detail?: string };
      message = (typeof body?.error === "string" && body.error) || (typeof body?.detail === "string" && body.detail) || message;
    } catch {
      if (res.status === 404 && text.includes("<!DOCTYPE")) {
        message =
          "API route not found (404). Restart Next.js after next.config changes, run Django on BACKEND_INTERNAL_URL, and ensure /api/affiliate is proxied.";
      } else if (res.status === 404) {
        message = "Not found (404).";
      }
    }
    throw new Error(message);
  }
  return JSON.parse(text) as T;
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("affiliate_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const root = () => affiliateApiRoot();

async function postTrackJson<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const doPost = async (url: string) =>
    fetch(url, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });

  const baseUrl = `${root()}/track/${endpoint}`;
  let res = await doPost(baseUrl);

  // Some environments/proxies normalize tracking URLs differently; retry once with trailing slash.
  if (res.status === 404 && !baseUrl.endsWith("/")) {
    res = await doPost(`${baseUrl}/`);
  }

  return parseJson<T>(res);
}

export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const res = await fetch(
    `${root()}/track/stats?affiliate_id=${encodeURIComponent(affiliateId)}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<AffiliateStats>(res);
}

export async function getAffiliateVisitors(affiliateId: string, limit = 20): Promise<AffiliateVisitorsResponse> {
  const res = await fetch(
    `${root()}/track/affiliate-visitors?affiliate_id=${encodeURIComponent(affiliateId)}&limit=${limit}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<AffiliateVisitorsResponse>(res);
}

export async function getAffiliateFunnel(affiliateId: string): Promise<AffiliateFunnelResponse> {
  const res = await fetch(
    `${root()}/track/funnel?affiliate_id=${encodeURIComponent(affiliateId)}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<AffiliateFunnelResponse>(res);
}

export async function getRecentReferrals(affiliateId: string, limit = 10): Promise<RecentReferralsResponse> {
  const res = await fetch(
    `${root()}/track/recent-referrals?affiliate_id=${encodeURIComponent(affiliateId)}&limit=${limit}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<RecentReferralsResponse>(res);
}

export async function getWithdrawalStatement(affiliateId: string, limit = 50): Promise<WithdrawalStatementResponse> {
  const res = await fetch(
    `${root()}/track/withdrawal-statement?affiliate_id=${encodeURIComponent(affiliateId)}&limit=${limit}`,
    { cache: "no-store", headers: authHeaders() }
  );
  return parseJson<WithdrawalStatementResponse>(res);
}

export async function trackClick(affiliateId: string, visitorId: string) {
  return postTrackJson<{ success: boolean }>("click", {
    affiliate_id: affiliateId,
    visitor_id: visitorId,
  });
}

/**
 * Non-blocking click tracking: does not await JSON parsing.
 * Uses keepalive so the request can complete after client navigation away from the referral route.
 */
export function trackClickFireAndForget(affiliateId: string, visitorId: string): void {
  if (typeof window === "undefined") return;
  const aid = affiliateId.trim();
  const vid = visitorId.trim();
  if (!aid || !vid) return;
  const body = JSON.stringify({ affiliate_id: aid, visitor_id: vid });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const extra = authHeaders();
  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    Object.assign(headers, extra as Record<string, string>);
  }
  const url = `${root()}/track/click`;
  void fetch(url, { method: "POST", keepalive: true, headers, body }).catch(() => {});
}

/**
 * Lead milestone for a referred visitor.
 * One visitor may produce up to two distinct leads:
 *   - kind="diagnosis" → "Syn Diagnosis lead" (email captured during the quiz)
 *   - kind="auth"      → "Sign up lead" or "Login lead" (account creation / login)
 * The backend dedupes per (affiliate_id, visitor_id, kind), so calling this
 * twice with the same kind is safe and only refreshes the stored email/label.
 */
export type TrackLeadKind = "diagnosis" | "auth";

export type TrackLeadOptions = {
  /** Defaults to "auth" when omitted (back-compat with older callers). */
  kind?: TrackLeadKind;
  /** Human-friendly label shown in the affiliate dashboard chips. */
  label?: string;
};

export async function trackLead(
  affiliateId: string,
  visitorId: string,
  email: string,
  options: TrackLeadOptions = {}
) {
  const kind: TrackLeadKind = options.kind ?? "auth";
  return postTrackJson<{ success: boolean; lead_recorded: boolean; lead_kind?: string; lead_label?: string }>("lead", {
    affiliate_id: affiliateId,
    visitor_id: visitorId,
    email,
    lead_kind: kind,
    ...(options.label ? { lead_label: options.label } : {}),
  });
}

/**
 * Non-blocking lead tracking: survives navigation away (checkout redirect, back button, tab close).
 */
export function trackLeadFireAndForget(
  affiliateId: string,
  visitorId: string,
  email: string,
  options: TrackLeadOptions = {}
): void {
  if (typeof window === "undefined") return;
  const aid = affiliateId.trim();
  const vid = visitorId.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!aid || !vid || !normalizedEmail || !normalizedEmail.includes("@")) return;
  const kind: TrackLeadKind = options.kind ?? "auth";
  const body = JSON.stringify({
    affiliate_id: aid,
    visitor_id: vid,
    email: normalizedEmail,
    lead_kind: kind,
    ...(options.label ? { lead_label: options.label } : {}),
  });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const extra = authHeaders();
  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    Object.assign(headers, extra as Record<string, string>);
  }
  const url = `${root()}/track/lead`;
  void fetch(url, { method: "POST", keepalive: true, headers, body }).catch(() => {});
}

export async function trackSale(
  affiliateId: string,
  visitorId: string,
  email: string,
  amount: string,
  extras?: { purchase_amount?: string; commission_rate?: number; offer?: string; tier?: string; program?: string; currency?: string }
) {
  return postTrackJson<{ success: boolean }>("sale", {
    affiliate_id: affiliateId,
    visitor_id: visitorId,
    email,
    amount,
    ...extras,
  });
}

export async function generateOneTimeReferralLink(affiliateId: string, domain?: string) {
  const res = await fetch(`${root()}/track/generate-referral-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ affiliate_id: affiliateId, domain }),
  });
  return parseJson<{ success: boolean; affiliate_id: string; link: string; created_once: boolean }>(res);
}

export async function requestAffiliateWithdrawal(payload: WithdrawalRequestPayload): Promise<WithdrawalRequestResponse> {
  return postTrackJson<WithdrawalRequestResponse>("request-withdrawal", payload);
}
