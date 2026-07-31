/**
 * Lazy entry points so plan-checkout / cart-checkout / toast stay out of the
 * initial /programs browse bundle until the shopper taps Unlock.
 */

import type { PlanCheckoutParams } from "@/lib/plan-checkout";
import type { UnlockCartItem } from "@/lib/unlockCart";

export async function lazyStartPlanCheckout(params: PlanCheckoutParams) {
  const { startPlanCheckout } = await import("@/lib/plan-checkout");
  return startPlanCheckout(params);
}

export async function lazyCheckoutUnlockCartItems(
  items: readonly UnlockCartItem[],
  options: { postAuthNext?: string; playlistReturnPath?: string } = {},
) {
  const { checkoutUnlockCartItems } = await import("@/lib/unlockCartCheckout");
  return checkoutUnlockCartItems(items, options);
}

export async function lazyToastSuccess(message: string, opts?: { duration?: number }) {
  const toast = (await import("react-hot-toast")).default;
  return toast.success(message, opts);
}

export async function lazyToast(message: string, opts?: { duration?: number }) {
  const toast = (await import("react-hot-toast")).default;
  return toast(message, opts);
}

export async function lazyToastError(message: string, opts?: { duration?: number }) {
  const toast = (await import("react-hot-toast")).default;
  return toast.error(message, opts);
}
