import type { CheckoutOfferKey } from "@/components/programs/planOfferCatalog";
import { startPlanCheckout, startUnlockCartCheckout } from "@/lib/plan-checkout";
import {
  resolvePlanOfferBySlug,
  type UnlockCartItem,
} from "@/lib/unlockCart";

export type UnlockCartCheckoutResult =
  | { status: "checkout" }
  | { status: "already_unlocked" }
  | { status: "auth_required" }
  | { status: "error"; message: string };

async function checkoutSinglePlan(
  plan: CheckoutOfferKey,
  amount: string,
  postAuthNext: string,
): Promise<UnlockCartCheckoutResult> {
  const result = await startPlanCheckout({
    plan,
    billing: "monthly",
    amount,
    postAuthNext,
  });
  if (result.status === "checkout" || result.status === "auth_required") {
    return { status: result.status };
  }
  if (result.status === "already_unlocked") {
    return { status: "already_unlocked" };
  }
  return { status: "error", message: result.message };
}

/** Always checkout via cart session (supports guest pay-first for 1+ items). */
export async function checkoutUnlockCartItems(
  items: readonly UnlockCartItem[],
  options: { postAuthNext?: string; playlistReturnPath?: string } = {},
): Promise<UnlockCartCheckoutResult> {
  if (!items.length) {
    return { status: "error", message: "Unlock bucket is empty." };
  }

  const postAuthNext = options.postAuthNext?.trim() || "/dashboard/programs";

  if (items.length === 1 && items[0].kind === "plan") {
    const offer = resolvePlanOfferBySlug(items[0].plan);
    if (!offer) {
      return { status: "error", message: "Could not resolve program checkout." };
    }
    // Prefer cart session for guest parity; fall back to plan checkout if cart API rejects singles.
  }

  const result = await startUnlockCartCheckout({
    items: items.map((item) =>
      item.kind === "playlist"
        ? {
            playlistId: item.playlistId,
            amount: item.checkoutAmount,
            title: item.title,
            image: item.imageSrc,
          }
        : {
            plan: item.plan,
            amount: item.checkoutAmount,
            title: item.title,
            image: item.imageSrc,
          },
    ),
    postAuthNext,
  });
  if (result.status === "checkout" || result.status === "auth_required") {
    return { status: result.status };
  }
  if (result.status === "already_unlocked") {
    return { status: "already_unlocked" };
  }

  if (items.length === 1 && items[0].kind === "plan") {
    const only = items[0];
    return checkoutSinglePlan(only.plan, only.checkoutAmount, postAuthNext);
  }

  return { status: "error", message: result.message };
}
