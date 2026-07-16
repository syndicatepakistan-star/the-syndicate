import { isKnightCheckoutBlocked, KNIGHT_LAUNCHING_SOON_MESSAGE, type CheckoutOfferKey } from "@/components/programs/planOfferCatalog";
import { isTradingSubmoduleSlug } from "@/components/programs/tradingVaultCatalog";
import { affiliateCheckoutFields } from "@/lib/affiliateAttribution";
import { getActiveCurrency } from "@/lib/currency";
import {
  getAuthorizationHeader,
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

export type UnlockCartCheckoutItem =
  | { plan: CheckoutOfferKey; amount: string; title?: string; image?: string; playlistId?: never }
  | { playlistId: number; amount: string; title?: string; image?: string; plan?: never };

export type UnlockCartCheckoutParams = {
  items: UnlockCartCheckoutItem[];
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
  if (/^agentic_ai_c\d{2}$/.test(v) || /^ai_content_c\d{2}$/.test(v)) return true;
  if (isTradingSubmoduleSlug(v)) return true;
  return false;
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
  return `/signup?${search.toString()}`;
}

export function buildPlaylistCheckoutAuthHref(
  playlistId: number | string,
  postAuthNext?: string,
): string {
  const search = new URLSearchParams({
    playlist_id: String(playlistId),
    buy: "1",
  });
  const next = postAuthNext?.trim() ?? "";
  if (next) search.set("next", next);
  return `/signup?${search.toString()}`;
}

export type PlanCheckoutSessionPayload = {
  checkout_url?: string;
  is_unlocked?: boolean;
  already_purchased?: boolean;
  message?: string;
  error?: string;
  detail?: string;
  excluded_owned?: string[];
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
        currency: getActiveCurrency(),
        ...affiliateCheckoutFields(),
      }),
    }
  );
  const payload = (data && typeof data === "object" ? data : {}) as PlanCheckoutSessionPayload;
  return { ok, status, payload };
}

export async function createUnlockCartCheckoutSession(
  params: UnlockCartCheckoutParams,
): Promise<{ ok: boolean; status: number; payload: PlanCheckoutSessionPayload }> {
  const { ok, status, data } = await portalFetch<PlanCheckoutSessionPayload>(
    "/api/auth/checkout/create-session/",
    {
      method: "POST",
      body: JSON.stringify({
        return_base_url: typeof window !== "undefined" ? window.location.origin : undefined,
        cart_items: params.items.map((item) =>
          item.playlistId != null
            ? {
                playlist_id: item.playlistId,
                amount: item.amount.trim(),
                ...(item.title ? { title: item.title } : {}),
                ...(item.image ? { image: item.image } : {}),
              }
            : {
                plan: item.plan,
                amount: item.amount.trim(),
                ...(item.title ? { title: item.title } : {}),
                ...(item.image ? { image: item.image } : {}),
              },
        ),
        currency: getActiveCurrency(),
        ...affiliateCheckoutFields(),
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

function payloadErrorMessage(payload: PlanCheckoutSessionPayload | string, status: number): string {
  const sanitize = (msg: string): string => {
    const trimmed = msg.replace(/\s+/g, " ").trim();
    const lower = trimmed.toLowerCase();
    if (lower.includes("invalid api key")) {
      return "Checkout is misconfigured (invalid Stripe secret key on the server). Update STRIPE_SECRET_KEY in Railway backend variables and redeploy.";
    }
    return trimmed.replace(/sk_(test|live)_[A-Za-z0-9*]+/g, "sk_***");
  };
  if (typeof payload === "string") {
    const snippet = payload.replace(/\s+/g, " ").trim().slice(0, 200);
    if (!snippet) {
      return status === 500
        ? "Checkout is unavailable right now. Please try again shortly."
        : "Could not start checkout.";
    }
    if (snippet.toLowerCase().includes("<!doctype") || snippet.toLowerCase().includes("<html")) {
      if (status === 502 || status === 503 || status === 504) {
        return "Checkout service is temporarily unavailable (deploy or backend restart). Wait a minute and try again.";
      }
      if (status === 500) {
        return "Checkout service error. Verify STRIPE_SECRET_KEY on the backend Railway service and BACKEND_INTERNAL_URL on the frontend, then redeploy both.";
      }
      return "Could not start checkout.";
    }
    return sanitize(snippet);
  }
  if (typeof payload.message === "string" && payload.message.trim()) return sanitize(payload.message.trim());
  if (typeof payload.error === "string" && payload.error.trim()) return sanitize(payload.error.trim());
  if (typeof payload.detail === "string" && payload.detail.trim()) return sanitize(payload.detail.trim());
  if (status === 401 || status === 403) return "Session expired. Sign in again to continue checkout.";
  if (status === 502 || status === 503 || status === 504) {
    return "Checkout service is temporarily unavailable. Wait a minute and try again.";
  }
  if (status === 500) {
    return "Checkout is unavailable right now. Check Railway backend logs and confirm STRIPE_SECRET_KEY is set.";
  }
  return "Could not start checkout.";
}

function shouldRetryViaAuth(status: number, message: string): boolean {
  if (status === 401 || status === 403) return true;
  const lower = message.toLowerCase();
  return lower.includes("signup token") || lower.includes("not authenticated") || lower.includes("authentication");
}

const KNIGHT_COMING_SOON_MESSAGE = KNIGHT_LAUNCHING_SOON_MESSAGE;

export async function startPlanCheckout(params: PlanCheckoutParams): Promise<StartPlanCheckoutResult> {
  if (isKnightCheckoutBlocked(params.plan)) {
    return { status: "error", message: KNIGHT_COMING_SOON_MESSAGE };
  }

  const { ok, status, payload } = await createPlanCheckoutSession(params);
  const checkoutUrl = typeof payload.checkout_url === "string" ? payload.checkout_url.trim() : "";

  if (ok && checkoutUrl) {
    if (Array.isArray(payload.excluded_owned) && payload.excluded_owned.length && typeof window !== "undefined") {
      try {
        const toast = (await import("react-hot-toast")).default;
        toast(
          payload.message ||
            `Skipped ${payload.excluded_owned.length} already-owned program(s) before checkout.`,
          { icon: "✓" },
        );
      } catch {
        // Toast optional.
      }
    }
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
  // Guest checkout is supported — only redirect to auth when session is truly expired/forbidden for a logged-in attempt.
  if (getAuthorizationHeader() && shouldRetryViaAuth(status, message)) {
    redirectToAuthCheckout(params);
    return { status: "auth_required" };
  }

  return { status: "error", message };
}

export async function startUnlockCartCheckout(
  params: UnlockCartCheckoutParams,
): Promise<StartPlanCheckoutResult> {
  const items = params.items.filter(
    (item) => (item.plan && item.amount.trim()) || (item.playlistId != null && item.amount.trim()),
  );
  if (items.length < 1) {
    return { status: "error", message: "Add at least one program to checkout." };
  }

  for (const item of items) {
    if (item.plan && isKnightCheckoutBlocked(item.plan)) {
      return { status: "error", message: KNIGHT_LAUNCHING_SOON_MESSAGE };
    }
  }

  const firstPlan = items.find((item) => item.plan)?.plan;
  const firstAmount = items[0]?.amount ?? "";

  const { ok, status, payload } = await createUnlockCartCheckoutSession(params);
  const checkoutUrl = typeof payload.checkout_url === "string" ? payload.checkout_url.trim() : "";

  if (ok && checkoutUrl) {
    if (Array.isArray(payload.excluded_owned) && payload.excluded_owned.length && typeof window !== "undefined") {
      try {
        const toast = (await import("react-hot-toast")).default;
        toast(
          payload.message ||
            `Skipped ${payload.excluded_owned.length} already-owned program(s) before checkout.`,
          { icon: "✓" },
        );
      } catch {
        // Toast optional.
      }
    }
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
  if (getAuthorizationHeader() && shouldRetryViaAuth(status, message) && firstPlan) {
    redirectToAuthCheckout({
      plan: firstPlan,
      billing: "monthly",
      amount: firstAmount,
      postAuthNext: params.postAuthNext,
    });
    return { status: "auth_required" };
  }

  return { status: "error", message };
}

export function hasPlanCheckoutIntent(plan: string, amount: string): boolean {
  return isCheckoutPlanKey(plan.trim()) && amount.trim().length > 0;
}
