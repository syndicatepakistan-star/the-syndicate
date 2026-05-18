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
      window.scrollBy({ top: delta, behavior: "smooth" });
    }
    return true;
  }

  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  return true;
}

/** Retry scroll while layout/images load after route change. */
export function focusProgramCardWithRetries(
  programId: number,
  onComplete?: () => void
): () => void {
  const delays = [0, 100, 250, 500, 900, 1400, 2200, 3200];
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
