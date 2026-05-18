import {
  getAuthorizationHeader,
  hasSimpleAuthSessionClient,
  portalFetch,
} from "@/lib/portal-api";

export type SubscriptionPlanKey = "bundle" | "king";

export type PlanCheckoutParams = {
  plan: SubscriptionPlanKey;
  billing?: string;
  amount: string;
  /** After signup/login when checkout is deferred. */
  postAuthNext?: string;
};

/** Auth handoff before Stripe — keeps dashboard users on /login, not public /signup. */
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
  // Full navigation — assign and replace both work; replace avoids back-button loops after Stripe.
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

/** Start Stripe checkout for Money Mastery (bundle) or The King. */
export async function startPlanCheckout(params: PlanCheckoutParams): Promise<StartPlanCheckoutResult> {
  const authHeader = getAuthorizationHeader();
  if (!authHeader) {
    if (hasSimpleAuthSessionClient()) {
      // Cookie without stored token — send through signup/login to restore session then checkout.
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

export function isSubscriptionPlanKey(value: string): value is SubscriptionPlanKey {
  return value === "bundle" || value === "king";
}

export function hasPlanCheckoutIntent(plan: string, amount: string): boolean {
  return isSubscriptionPlanKey(plan.trim()) && amount.trim().length > 0;
}
