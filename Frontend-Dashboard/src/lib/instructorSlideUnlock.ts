import { planOfferByKey } from "@/components/programs/planOfferCatalog";
import type { CheckoutOfferKey } from "@/components/programs/planOfferCatalog";
import { vaultCourseBySlug } from "@/components/programs/vaultPackCatalog";
import type { InstructorSlide, InstructorSlideUnlock } from "@/data/instructorSlides";
import { requestDashboardShellNav } from "@/lib/dashboardShellNavEvent";
import { navigateToAlreadyUnlockedProgram } from "@/lib/programUnlockFlow";
import {
  buildPlaylistCheckoutAuthHref,
  buildPlanCheckoutAuthHref,
  startPlanCheckout,
} from "@/lib/plan-checkout";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";
import { createPlaylistCheckoutSession } from "@/lib/streaming-api";

const PROGRAMS_RETURN = "/dashboard/programs";

function resolvePlanOffer(plan: CheckoutOfferKey) {
  return planOfferByKey(plan as never) ?? vaultCourseBySlug(plan);
}

async function unlockPlaylist(legacyPlaylistId: number): Promise<{ ok: boolean; message?: string }> {
  const programsWithPlaylist = `${PROGRAMS_RETURN}?playlist=${legacyPlaylistId}`;
  if (!hasSimpleAuthSessionClient()) {
    window.location.assign(buildPlaylistCheckoutAuthHref(legacyPlaylistId, programsWithPlaylist));
    return { ok: true };
  }

  const checkout = await createPlaylistCheckoutSession(legacyPlaylistId, {
    returnBaseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
  });

  if (checkout.is_unlocked) {
    window.location.assign(programsWithPlaylist);
    return { ok: true };
  }

  if (checkout.checkout_url) {
    window.location.href = checkout.checkout_url;
    return { ok: true };
  }

  return { ok: false, message: checkout.message || "Could not start checkout." };
}

async function unlockPlan(plan: CheckoutOfferKey): Promise<{ ok: boolean; message?: string }> {
  const offer = resolvePlanOffer(plan);
  if (!offer) {
    return { ok: false, message: "This program is not available for checkout yet." };
  }

  if (!hasSimpleAuthSessionClient()) {
    window.location.assign(
      buildPlanCheckoutAuthHref({
        plan: offer.plan,
        billing: offer.billing,
        amount: offer.checkoutAmount,
        postAuthNext: PROGRAMS_RETURN,
      }),
    );
    return { ok: true };
  }

  const result = await startPlanCheckout({
    plan: offer.plan,
    billing: offer.billing,
    amount: offer.checkoutAmount,
    postAuthNext: PROGRAMS_RETURN,
  });

  if (result.status === "checkout" || result.status === "auth_required") {
    return { ok: true };
  }

  if (result.status === "already_unlocked") {
    await navigateToAlreadyUnlockedProgram({ plan: offer.plan, postAuthNext: PROGRAMS_RETURN });
    return { ok: true };
  }

  return { ok: false, message: result.message };
}

export async function unlockInstructorSlide(
  slide: InstructorSlide,
): Promise<{ ok: boolean; message?: string }> {
  if (typeof window === "undefined") {
    return { ok: false, message: "Checkout is only available in the browser." };
  }

  requestDashboardShellNav("programs");

  const target: InstructorSlideUnlock = slide.unlock;
  if (target.kind === "playlist") {
    return unlockPlaylist(target.legacyPlaylistId);
  }
  return unlockPlan(target.plan);
}
