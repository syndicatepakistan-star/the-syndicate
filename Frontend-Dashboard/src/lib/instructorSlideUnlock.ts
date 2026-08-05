import { planOfferByKey } from "@/components/programs/planOfferCatalog";
import type { CheckoutOfferKey } from "@/components/programs/planOfferCatalog";
import { vaultCourseBySlug } from "@/components/programs/vaultPackCatalog";
import type { InstructorSlide, InstructorSlideUnlock } from "@/data/instructorSlides";
import { requestDashboardShellNav } from "@/lib/dashboardShellNavEvent";
import {
  buildDashboardPlaylistPath,
  navigateToAlreadyUnlockedProgram,
  requestDashboardProgramOpen,
  resolvePlaylistIdForPlan,
} from "@/lib/programUnlockFlow";
import {
  buildPlaylistCheckoutAuthHref,
  buildPlanCheckoutAuthHref,
  startPlanCheckout,
} from "@/lib/plan-checkout";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";
import {
  createPlaylistCheckoutSession,
  fetchStreamPlaylists,
  type StreamPlaylistListItem,
} from "@/lib/streaming-api";

const PROGRAMS_RETURN = "/dashboard/programs";

export type InstructorUnlockResult = {
  ok: boolean;
  /** Owned — show ✓ already-purchased UI; navigation already kicked off. */
  alreadyPurchased?: boolean;
  /** Soft failure handled by navigating to the program (no error toast). */
  navigated?: boolean;
  message?: string;
};

function resolvePlanOffer(plan: CheckoutOfferKey) {
  return planOfferByKey(plan as never) ?? vaultCourseBySlug(plan);
}

/** Django get_object_or_404 / similar — never surface these as toasts. */
export function isTechnicalNotFoundMessage(message: string | undefined | null): boolean {
  const m = (message || "").trim().toLowerCase();
  if (!m) return false;
  return (
    m.includes("matches the given query") ||
    m.includes("not found") ||
    m.includes("no streamplaylist") ||
    m.includes("no steam") || // OCR/common misread of StreamPlaylist
    /^no [\w.]+ matches/i.test(message || "")
  );
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function findPlaylistByProgramName(
  playlists: StreamPlaylistListItem[],
  programName: string,
): StreamPlaylistListItem | undefined {
  const target = normalizeTitle(programName);
  if (!target) return undefined;
  const exact = playlists.find((pl) => normalizeTitle(pl.title) === target);
  if (exact) return exact;
  return playlists.find((pl) => {
    const title = normalizeTitle(pl.title);
    return title.includes(target) || target.includes(title);
  });
}

function openProgramsForPlaylist(playlistId: number): void {
  requestDashboardShellNav("programs");
  requestDashboardProgramOpen({ playlistId });
}

function openProgramsHub(): void {
  requestDashboardShellNav("programs");
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/dashboard/programs")) {
    window.location.assign(PROGRAMS_RETURN);
  }
}

async function resolveLivePlaylistId(
  legacyPlaylistId: number,
  programName: string,
): Promise<{ id: number; unlocked: boolean } | null> {
  try {
    const list = await fetchStreamPlaylists({ allowPublicFallback: true });
    const byId = list.find((pl) => pl.id === legacyPlaylistId);
    if (byId) return { id: byId.id, unlocked: !!byId.is_unlocked };
    const byName = findPlaylistByProgramName(list, programName);
    if (byName) return { id: byName.id, unlocked: !!byName.is_unlocked };
  } catch {
    /* fall through */
  }
  return null;
}

async function unlockPlaylist(
  legacyPlaylistId: number,
  programName: string,
): Promise<InstructorUnlockResult> {
  const resolved = await resolveLivePlaylistId(legacyPlaylistId, programName);
  const playlistId = resolved?.id ?? legacyPlaylistId;
  const programsWithPlaylist = buildDashboardPlaylistPath(playlistId);

  if (resolved?.unlocked) {
    openProgramsForPlaylist(playlistId);
    return { ok: true, alreadyPurchased: true };
  }

  if (!hasSimpleAuthSessionClient()) {
    window.location.assign(buildPlaylistCheckoutAuthHref(playlistId, programsWithPlaylist));
    return { ok: true, navigated: true };
  }

  try {
    const checkout = await createPlaylistCheckoutSession(playlistId, {
      returnBaseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
    });

    if (checkout.is_unlocked) {
      openProgramsForPlaylist(playlistId);
      return { ok: true, alreadyPurchased: true };
    }

    if (checkout.checkout_url) {
      window.location.href = checkout.checkout_url;
      return { ok: true, navigated: true };
    }

    // No checkout URL — take them to the program card / detail instead of an error toast.
    openProgramsForPlaylist(playlistId);
    return { ok: true, navigated: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // Missing playlist / stale id → open programs on the matching card (or hub).
    if (resolved) {
      openProgramsForPlaylist(resolved.id);
    } else {
      openProgramsHub();
    }
    if (isTechnicalNotFoundMessage(message)) {
      return { ok: true, navigated: true };
    }
    return { ok: true, navigated: true };
  }
}

async function unlockPlan(plan: CheckoutOfferKey): Promise<InstructorUnlockResult> {
  const offer = resolvePlanOffer(plan);
  if (!offer) {
    openProgramsHub();
    return { ok: true, navigated: true };
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
    return { ok: true, navigated: true };
  }

  try {
    const result = await startPlanCheckout({
      plan: offer.plan,
      billing: offer.billing,
      amount: offer.checkoutAmount,
      postAuthNext: PROGRAMS_RETURN,
    });

    if (result.status === "checkout" || result.status === "auth_required") {
      return { ok: true, navigated: true };
    }

    if (result.status === "already_unlocked") {
      const playlistId = await resolvePlaylistIdForPlan(offer.plan);
      if (playlistId) {
        openProgramsForPlaylist(playlistId);
      } else {
        await navigateToAlreadyUnlockedProgram({ plan: offer.plan, postAuthNext: PROGRAMS_RETURN });
      }
      return { ok: true, alreadyPurchased: true };
    }

    // Soft-fail: open the program instead of toasting API noise.
    const playlistId = await resolvePlaylistIdForPlan(offer.plan);
    if (playlistId) openProgramsForPlaylist(playlistId);
    else openProgramsHub();
    return { ok: true, navigated: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const playlistId = await resolvePlaylistIdForPlan(offer.plan);
    if (playlistId) openProgramsForPlaylist(playlistId);
    else openProgramsHub();
    if (isTechnicalNotFoundMessage(message)) {
      return { ok: true, navigated: true };
    }
    return { ok: true, navigated: true };
  }
}

export async function unlockInstructorSlide(slide: InstructorSlide): Promise<InstructorUnlockResult> {
  if (typeof window === "undefined") {
    return { ok: false, message: "Checkout is only available in the browser." };
  }

  requestDashboardShellNav("programs");

  const target: InstructorSlideUnlock = slide.unlock;
  if (target.kind === "playlist") {
    return unlockPlaylist(target.legacyPlaylistId, slide.programName);
  }
  return unlockPlan(target.plan);
}
