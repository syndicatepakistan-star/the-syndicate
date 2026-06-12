import type { CheckoutOfferKey } from "@/components/programs/planOfferCatalog";
import {
  hasPlanCheckoutIntent,
  isCheckoutPlanKey,
  startPlanCheckout,
} from "@/lib/plan-checkout";
import { createPlaylistCheckoutSession } from "@/lib/streaming-api";

export type PendingCheckoutIntent = {
  plan?: string;
  billing?: string;
  amount?: string;
  playlistId?: string;
  postAuthNext?: string;
};

export type PostAuthCheckoutResult =
  | { status: "checkout" }
  | { status: "already_unlocked" }
  | { status: "none" }
  | { status: "error"; message: string };

function safePostAuthNext(next: string | undefined): string {
  const trimmed = (next || "").trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return "/dashboard?section=programs";
}

export function hasPendingCheckoutIntent(intent: PendingCheckoutIntent): boolean {
  const playlistId = (intent.playlistId || "").trim();
  if (playlistId && /^\d+$/.test(playlistId)) return true;
  const plan = (intent.plan || "").trim();
  const amount = (intent.amount || "").trim();
  return hasPlanCheckoutIntent(plan, amount);
}

/** After login/signup OTP, continue straight to Stripe when a purchase was in progress. */
export async function resumePendingCheckoutAfterAuth(
  intent: PendingCheckoutIntent,
): Promise<PostAuthCheckoutResult> {
  const playlistId = (intent.playlistId || "").trim();
  const plan = (intent.plan || "").trim();
  const amount = (intent.amount || "").trim();
  const billing = (intent.billing || "monthly").trim();

  if (playlistId && /^\d+$/.test(playlistId)) {
    try {
      const checkout = await createPlaylistCheckoutSession(Number(playlistId), {
        returnBaseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (checkout.is_unlocked) return { status: "already_unlocked" };
      const checkoutUrl = (checkout.checkout_url || "").trim();
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return { status: "checkout" };
      }
      return {
        status: "error",
        message: checkout.message?.trim() || "Playlist checkout did not return a Stripe URL.",
      };
    } catch (caught) {
      return {
        status: "error",
        message: caught instanceof Error ? caught.message : "Playlist checkout failed.",
      };
    }
  }

  if (hasPlanCheckoutIntent(plan, amount) && isCheckoutPlanKey(plan)) {
    const result = await startPlanCheckout({
      plan: plan as CheckoutOfferKey,
      billing,
      amount,
      postAuthNext: safePostAuthNext(intent.postAuthNext),
    });
    if (result.status === "checkout") return { status: "checkout" };
    if (result.status === "already_unlocked") return { status: "already_unlocked" };
    if (result.status === "auth_required") {
      return {
        status: "error",
        message: "Session was not recognized for checkout. Try Verify code again.",
      };
    }
    if (result.status === "error") {
      return { status: "error", message: result.message };
    }
  }

  return { status: "none" };
}
