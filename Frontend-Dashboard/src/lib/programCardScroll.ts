import { requestDashboardShellNav } from "@/lib/dashboardShellNavEvent";
import { programPlaylistDeepLink, planOfferDeepLink, type GlobePackKey } from "@/lib/programPlaylistThumbnails";

export type ProgramLibraryScrollTarget = "public" | "dashboard";

const DEFAULT_FOCUS_DELAYS_MS = [0, 120, 400, 900] as const;
const DASHBOARD_FOCUS_DELAYS_MS = [0, 120, 400, 900, 1400, 2200, 3200] as const;

/** Find the program card node that is visible (mobile or desktop layout). */
export function findVisibleProgramCard(programId: number): HTMLElement | undefined {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-program-playlist-id="${programId}"]`);
  return Array.from(nodes).find((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

const VIEWPORT_PAD_TOP = 96;
const VIEWPORT_PAD_BOTTOM = 32;

function programsGridScrollEl(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(".programs-grid-scroll");
}

function scrollWithinProgramsPanel(
  el: HTMLElement,
  options?: { behavior?: ScrollBehavior; block?: "start" | "center" | "end" },
) {
  const panel = programsGridScrollEl();
  const behavior = options?.behavior ?? "smooth";
  if (!panel) {
    el.scrollIntoView({ behavior, block: options?.block ?? "center", inline: "nearest" });
    return;
  }
  const panelRect = panel.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const block = options?.block ?? "center";
  let target = panel.scrollTop + (elRect.top - panelRect.top);
  if (block === "center") {
    target = panel.scrollTop + (elRect.top - panelRect.top) - (panel.clientHeight - elRect.height) / 2;
  } else if (block === "start") {
    target = panel.scrollTop + (elRect.top - panelRect.top) - 12;
  }
  panel.scrollTo({ top: Math.max(0, target), behavior });
}

/** True when the card is comfortably in view (not clipped above/below). */
export function isProgramCardInView(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return rect.top >= VIEWPORT_PAD_TOP && rect.bottom <= vh - VIEWPORT_PAD_BOTTOM;
}

/**
 * Scroll up or down so the card sits near the viewport center.
 * Returns false when the card is not in the DOM yet.
 */
export function scrollProgramCardIntoView(programId: number): boolean {
  const el = findVisibleProgramCard(programId);
  if (!el) return false;

  if (isProgramCardInView(el)) {
    const rect = el.getBoundingClientRect();
    const cardMid = rect.top + rect.height / 2;
    const viewportMid = window.innerHeight / 2;
    const delta = cardMid - viewportMid;
    if (Math.abs(delta) > 48) {
      const panel = programsGridScrollEl();
      if (panel) {
        panel.scrollBy({ top: delta, behavior: "smooth" });
      } else {
        window.scrollBy({ top: delta, behavior: "smooth" });
      }
    }
    return true;
  }

  scrollWithinProgramsPanel(el, { behavior: "smooth", block: "center" });
  return true;
}

/** Scroll the public or dashboard program library block into view. */
export function scrollToProgramLibrary(target: ProgramLibraryScrollTarget = "public"): void {
  if (typeof window === "undefined") return;
  const id = target === "dashboard" ? "dashboard-programs-library" : "programs-library";
  const el = document.getElementById(id);
  if (el) {
    scrollWithinProgramsPanel(el, { behavior: "smooth", block: "start" });
    return;
  }
  if (target === "dashboard") {
    requestDashboardShellNav("programs");
    window.setTimeout(() => {
      const library = document.getElementById(id);
      if (library) scrollWithinProgramsPanel(library, { behavior: "smooth", block: "start" });
    }, 450);
    return;
  }
  window.location.hash = "programs-library";
}

function isDashboardProgramsSection(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.pathname === "/dashboard" &&
    new URLSearchParams(window.location.search).get("section") === "programs"
  );
}

/** Retry scroll while layout/images load after route change. */
export function focusProgramCardWithRetries(
  programId: number,
  onComplete?: () => void,
  options?: { delays?: readonly number[] },
): () => void {
  const delays = options?.delays ?? DEFAULT_FOCUS_DELAYS_MS;
  const timers = delays.map((ms) =>
    window.setTimeout(() => {
      scrollProgramCardIntoView(programId);
    }, ms)
  );

  const doneTimer = window.setTimeout(() => {
    onComplete?.();
  }, delays[delays.length - 1]! + 400);

  return () => {
    timers.forEach((id) => window.clearTimeout(id));
    window.clearTimeout(doneTimer);
  };
}

/** Dashboard programs tab: switch section, set playlist query, scroll to card. */
export function navigateToDashboardProgramCard(programId: number): void {
  if (typeof window === "undefined") return;

  const applyUrl = () => {
    const url = new URL(window.location.href);
    url.pathname = "/dashboard/programs";
    url.searchParams.delete("section");
    url.searchParams.set("playlist", String(programId));
    const qs = url.searchParams.toString();
    window.history.replaceState({}, "", qs ? `${url.pathname}?${qs}` : url.pathname);
  };

  const focus = () => {
    focusProgramCardWithRetries(programId, undefined, {
      delays: isDashboardProgramsSection() ? DEFAULT_FOCUS_DELAYS_MS : DASHBOARD_FOCUS_DELAYS_MS,
    });
  };

  if (!isDashboardProgramsSection()) {
    requestDashboardShellNav("programs");
    window.setTimeout(() => {
      applyUrl();
      focus();
    }, 80);
    return;
  }

  applyUrl();
  focus();
}

/** Deep link: highlight and scroll to the Syndicate Elite offer card. */
export function navigateToPlanOfferCard(pack: GlobePackKey): void {
  if (typeof window === "undefined") return;

  const focus = () => {
    focusPlanOfferCardWithRetries(pack);
  };

  if (window.location.pathname.startsWith("/dashboard")) {
    if (!isDashboardProgramsSection()) {
      requestDashboardShellNav("programs");
      window.setTimeout(focus, 450);
      return;
    }
    focus();
    return;
  }

  const target = planOfferDeepLink(pack);
  if (window.location.pathname === "/programs") {
    window.history.pushState({}, "", target);
    focus();
    return;
  }
  window.location.assign(target);
}

/** Deep link: highlight and scroll to the program library card. */
export function navigateToProgramLibraryCard(programId: number): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/dashboard")) {
    navigateToDashboardProgramCard(programId);
    return;
  }
  const target = programPlaylistDeepLink(programId);
  if (window.location.pathname === "/programs") {
    window.history.pushState({}, "", target);
    focusProgramCardWithRetries(programId);
    return;
  }
  window.location.assign(target);
}

export function planOfferCardId(pack: GlobePackKey): string {
  return `plan-offer-${pack}`;
}

export function findVisiblePlanOfferCard(pack: GlobePackKey): HTMLElement | undefined {
  const el = document.getElementById(planOfferCardId(pack));
  if (!el) return undefined;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? el : undefined;
}

export function scrollPlanOfferCardIntoView(pack: GlobePackKey): boolean {
  const el = findVisiblePlanOfferCard(pack);
  if (!el) return false;
  scrollWithinProgramsPanel(el, { behavior: "smooth", block: "center" });
  return true;
}

/** Retry scroll while layout/images load after route change. */
export function focusPlanOfferCardWithRetries(
  pack: GlobePackKey,
  onComplete?: () => void,
  options?: { delays?: readonly number[] },
): () => void {
  const delays = options?.delays ?? DEFAULT_FOCUS_DELAYS_MS;
  const timers = delays.map((ms) =>
    window.setTimeout(() => {
      scrollPlanOfferCardIntoView(pack);
    }, ms)
  );

  const doneTimer = window.setTimeout(() => {
    onComplete?.();
  }, delays[delays.length - 1]! + 400);

  return () => {
    timers.forEach((id) => window.clearTimeout(id));
    window.clearTimeout(doneTimer);
  };
}
