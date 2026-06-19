const MAIN_SHELL_SELECTOR = "[data-main-shell-scroll]";
const MISSION_SCROLL_SELECTOR = "[data-syndicate-mission-scroll]";

/** Clear window / document scroll — fixed FABs stay put while the page body must not offset. */
export function resetDashboardDocumentScroll() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Reset in-shell scroll containers (main column + mission detail). */
export function resetDashboardMainShellScroll(root?: HTMLElement | null) {
  if (typeof document === "undefined") return;
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
