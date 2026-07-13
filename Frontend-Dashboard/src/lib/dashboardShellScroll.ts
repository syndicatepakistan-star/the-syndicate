const MAIN_SHELL_SELECTOR = "[data-main-shell-scroll]";
const MISSION_SCROLL_SELECTOR = "[data-syndicate-mission-scroll]";
const PROGRAMS_GRID_SCROLL_SELECTOR = ".programs-grid-scroll";
const PROGRAMS_LESSON_SCROLL_SELECTOR = ".programs-lesson-scroll";
const CHECKOUT_RETURN_GRACE_KEY = "dashboard_checkout_return_until";
const CHECKOUT_RETURN_GRACE_MS = 3000;
const SECTION_SCROLL_STORE_KEY = "dashboard_section_scroll_v1";

type SectionScrollStore = Record<string, number>;

function readSectionScrollStore(): SectionScrollStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SECTION_SCROLL_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as SectionScrollStore;
  } catch {
    return {};
  }
}

function writeSectionScrollStore(store: SectionScrollStore) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SECTION_SCROLL_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage exceptions.
  }
}

export function getDashboardMainShellScrollElement(
  root?: HTMLElement | null,
): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (root) {
    const scoped = root.querySelector<HTMLElement>(MAIN_SHELL_SELECTOR);
    if (scoped) return scoped;
  }
  return document.querySelector<HTMLElement>(MAIN_SHELL_SELECTOR);
}

/** Remember scroll position when leaving a dashboard section. */
export function saveDashboardSectionScroll(section: string, root?: HTMLElement | null) {
  if (!section || typeof window === "undefined") return;
  const shell = getDashboardMainShellScrollElement(root);
  if (!shell) return;
  const store = readSectionScrollStore();
  store[section] = shell.scrollTop;
  writeSectionScrollStore(store);
}

/** Restore saved scroll for a section; returns true when a non-zero position was applied. */
export function restoreDashboardSectionScroll(section: string, root?: HTMLElement | null): boolean {
  if (!section || typeof window === "undefined") return false;
  const shell = getDashboardMainShellScrollElement(root);
  if (!shell) return false;
  const top = readSectionScrollStore()[section];
  if (typeof top !== "number" || top <= 0) return false;
  shell.scrollTo({ top, left: 0, behavior: "auto" });
  return true;
}

/** Swap sections: persist outgoing scroll, restore incoming when available. */
export function transitionDashboardSectionScroll(
  fromSection: string,
  toSection: string,
  root?: HTMLElement | null,
) {
  if (fromSection && fromSection !== toSection) {
    saveDashboardSectionScroll(fromSection, root);
  }
  resetDashboardDocumentScroll();
  if (shouldSkipMainShellScrollReset()) return;
  const restored = restoreDashboardSectionScroll(toSection, root);
  if (!restored) {
    resetDashboardMainShellScroll(root);
  }
}

/** After Stripe return, skip main-shell resets so the navbar and gold frame stay pinned. */
export function markDashboardCheckoutReturn() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CHECKOUT_RETURN_GRACE_KEY,
      String(Date.now() + CHECKOUT_RETURN_GRACE_MS),
    );
  } catch {
    // Ignore storage exceptions.
  }
}

export function isDashboardCheckoutReturnGraceActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const until = Number(window.sessionStorage.getItem(CHECKOUT_RETURN_GRACE_KEY));
    if (!Number.isFinite(until)) return false;
    if (Date.now() > until) {
      window.sessionStorage.removeItem(CHECKOUT_RETURN_GRACE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Programs grid/lesson: inner panel scrolls; outer shell must not jump. */
export function isProgramsInnerScrollActive(): boolean {
  if (typeof document === "undefined") return false;
  const shell = document.querySelector<HTMLElement>(MAIN_SHELL_SELECTOR);
  if (!shell) return false;
  return (
    shell.hasAttribute("data-programs-grid-active") ||
    shell.hasAttribute("data-programs-lesson-active")
  );
}

/** Release programs-only shell lock so other dashboard sections can scroll. */
export function clearProgramsMainShellScrollLock() {
  if (typeof document === "undefined") return;
  document.querySelectorAll<HTMLElement>(MAIN_SHELL_SELECTOR).forEach((shell) => {
    shell.removeAttribute("data-programs-grid-active");
    shell.removeAttribute("data-programs-lesson-active");
  });
}

/** Ensure the dashboard main column can scroll (fixes stuck overflow after section swaps). */
export function ensureDashboardMainShellScrollable(root?: HTMLElement | null) {
  clearProgramsMainShellScrollLock();
  const shell = getDashboardMainShellScrollElement(root);
  if (!shell) return;
  shell.style.removeProperty("overflow");
  shell.style.removeProperty("overflow-y");
  shell.style.removeProperty("max-height");
}

export function shouldSkipMainShellScrollReset(): boolean {
  return isDashboardCheckoutReturnGraceActive() || isProgramsInnerScrollActive();
}

/** Scroll only the programs inner panels — never the document or main gold frame. */
export function resetProgramsInnerScrollOnly(options?: { top?: number }) {
  if (typeof document === "undefined") return;
  const top = options?.top ?? 0;
  document.querySelectorAll(`${PROGRAMS_GRID_SCROLL_SELECTOR}, ${PROGRAMS_LESSON_SCROLL_SELECTOR}`).forEach((el) => {
    (el as HTMLElement).scrollTo({ top, left: 0, behavior: "auto" });
  });
}

/** Clear window / document scroll — fixed FABs stay put while the page body must not offset. */
export function resetDashboardDocumentScroll() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Reset in-shell scroll containers (main column + mission detail). */
export function resetDashboardMainShellScroll(root?: HTMLElement | null) {
  if (typeof document === "undefined" || shouldSkipMainShellScrollReset()) return;
  document.querySelectorAll(`${MAIN_SHELL_SELECTOR}, ${MISSION_SCROLL_SELECTOR}`).forEach((el) => {
    (el as HTMLElement).scrollTop = 0;
  });
  if (root && root.scrollTop !== 0) root.scrollTop = 0;
}

export function resetDashboardShellScroll(root?: HTMLElement | null) {
  resetDashboardDocumentScroll();
  resetDashboardMainShellScroll(root);
}

type ShellScrollBlock = "start" | "center";

/** Scroll within the dashboard main column without moving the document (avoids layout glitch). */
export function scrollIntoDashboardMainShell(
  el: HTMLElement | null | undefined,
  options?: { behavior?: ScrollBehavior; block?: ShellScrollBlock }
) {
  if (!el || typeof document === "undefined") return;
  const behavior = options?.behavior ?? "smooth";
  const block = options?.block ?? "start";

  const shell = el.closest<HTMLElement>(MAIN_SHELL_SELECTOR);
  if (!shell) {
    resetDashboardDocumentScroll();
    el.scrollIntoView({ behavior, block });
    return;
  }

  resetDashboardDocumentScroll();

  const shellRect = shell.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const scrollPaddingTop =
    Number.parseFloat(window.getComputedStyle(shell).scrollPaddingTop) || 0;

  let target =
    shell.scrollTop + (elRect.top - shellRect.top) - (block === "start" ? scrollPaddingTop : 0);

  if (block === "center") {
    target = shell.scrollTop + (elRect.top - shellRect.top) - (shell.clientHeight - elRect.height) / 2;
  }

  shell.scrollTo({ top: Math.max(0, target), behavior });
}

/** Smooth scroll the main dashboard column to an absolute offset. */
export function smoothScrollDashboardMainShellTo(
  top: number,
  root?: HTMLElement | null,
  behavior: ScrollBehavior = "smooth",
) {
  const shell = getDashboardMainShellScrollElement(root);
  if (!shell) return;
  resetDashboardDocumentScroll();
  shell.scrollTo({ top: Math.max(0, top), left: 0, behavior });
}
