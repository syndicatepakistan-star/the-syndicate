import type { CheckoutOfferKey } from "@/components/programs/planOfferCatalog";
import {
  getAuthorizationHeader,
  hasSimpleAuthSessionClient,
  portalFetch,
} from "@/lib/portal-api";

export type SubscriptionPlanKey =
  | "bundle"
  | "king"
  | "agentic_ai"
  | "ai_content_automation"
  | "trading_technical_analysis"
  | "trading_scalpel_protocol"
  | "trading_master_strategies"
  | "trading_master_setups"
  | "trading_master_secrets";

export type PlanCheckoutParams = {
  plan: CheckoutOfferKey;
  billing?: string;
  amount: string;
  postAuthNext?: string;
};

const CORE_PLAN_KEYS: readonly SubscriptionPlanKey[] = [
  "bundle",
  "king",
  "agentic_ai",
  "ai_content_automation",
  "trading_technical_analysis",
  "trading_scalpel_protocol",
  "trading_master_strategies",
  "trading_master_setups",
  "trading_master_secrets",
];

export function isSubscriptionPlanKey(value: string): value is SubscriptionPlanKey {
  return CORE_PLAN_KEYS.includes(value.trim() as SubscriptionPlanKey);
}

export function isCheckoutPlanKey(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (isSubscriptionPlanKey(v)) return true;
  return /^agentic_ai_c\d{2}$/.test(v) || /^ai_content_c\d{2}$/.test(v);
}

export function buildPlanCheckoutAuthHref(params: PlanCheckoutParams): string {
  const search = new URLSearchParams({
    plan: params.plan,
    billing: params.billing?.trim() || "monthly",
    amount: params.amount.trim(),
    buy: "1",
  });
  const next = params.postAuthNext?.trim() ?? "";
  if (next) search.set("next", next);
  const useLogin = next.startsWith("/dashboard");
  return `${useLogin ? "/login" : "/signup"}?${search.toString()}`;
}

export type PlanCheckoutSessionPayload = {
  checkout_url?: string;
  is_unlocked?: boolean;
  already_purchased?: boolean;
  message?: string;
  error?: string;
  detail?: string;
};

export async function createPlanCheckoutSession(
  params: PlanCheckoutParams
): Promise<{ ok: boolean; status: number; payload: PlanCheckoutSessionPayload }> {
  const { ok, status, data } = await portalFetch<PlanCheckoutSessionPayload>(
    "/api/auth/checkout/create-session/",
    {
      method: "POST",
      body: JSON.stringify({
        return_base_url: typeof window !== "undefined" ? window.location.origin : undefined,
        selected_plan: params.plan,
        selected_billing: params.billing?.trim() || "monthly",
        selected_amount: params.amount.trim(),
      }),
    }
  );
  const payload = (data && typeof data === "object" ? data : {}) as PlanCheckoutSessionPayload;
  return { ok, status, payload };
}

export type StartPlanCheckoutResult =
  | { status: "checkout"; checkoutUrl: string }
  | { status: "already_unlocked"; message?: string }
  | { status: "auth_required" }
  | { status: "error"; message: string };

function redirectToCheckout(checkoutUrl: string) {
  if (typeof window === "undefined") return;
  window.location.replace(checkoutUrl);
}

function redirectToAuthCheckout(params: PlanCheckoutParams) {
  if (typeof window === "undefined") return;
  window.location.assign(buildPlanCheckoutAuthHref(params));
}

function payloadErrorMessage(payload: PlanCheckoutSessionPayload, status: number): string {
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message.trim();
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error.trim();
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail.trim();
  if (status === 401 || status === 403) return "Session expired. Sign in again to continue checkout.";
  if (status === 500) return "Checkout is unavailable right now. Please try again shortly.";
  return "Could not start checkout.";
}

function shouldRetryViaAuth(status: number, message: string): boolean {
  if (status === 401 || status === 403) return true;
  const lower = message.toLowerCase();
  return lower.includes("signup token") || lower.includes("not authenticated") || lower.includes("authentication");
}

export async function startPlanCheckout(params: PlanCheckoutParams): Promise<StartPlanCheckoutResult> {
  const authHeader = getAuthorizationHeader();
  if (!authHeader) {
    if (hasSimpleAuthSessionClient()) {
      redirectToAuthCheckout(params);
      return { status: "auth_required" };
    }
    redirectToAuthCheckout(params);
    return { status: "auth_required" };
  }

  const { ok, status, payload } = await createPlanCheckoutSession(params);
  const checkoutUrl = typeof payload.checkout_url === "string" ? payload.checkout_url.trim() : "";

  if (ok && checkoutUrl) {
    redirectToCheckout(checkoutUrl);
    return { status: "checkout", checkoutUrl };
  }

  if (ok && (payload.is_unlocked || payload.already_purchased)) {
    return {
      status: "already_unlocked",
      message: payload.message,
    };
  }

  const message = payloadErrorMessage(payload, status);
  if (shouldRetryViaAuth(status, message)) {
    redirectToAuthCheckout(params);
    return { status: "auth_required" };
  }

  return { status: "error", message };
}

export function hasPlanCheckoutIntent(plan: string, amount: string): boolean {
  return isCheckoutPlanKey(plan.trim()) && amount.trim().length > 0;
}
