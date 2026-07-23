/**
 * Reference-counted body scroll lock for stacked modals.
 * Each modal must call lockModalScroll() on open and run the returned unlock on close.
 * Prevents body staying overflow:hidden when modals close out of order.
 *
 * Uses position:fixed + top offset so locking does not flash a layout jump
 * (common with overflow:hidden alone when a scrollbar disappears).
 */

let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";
let savedPosition = "";
let savedTop = "";
let savedWidth = "";
let savedScrollY = 0;

export function lockModalScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;
    savedPosition = document.body.style.position;
    savedTop = document.body.style.top;
    savedWidth = document.body.style.width;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount += 1;

  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = savedOverflow;
      document.body.style.paddingRight = savedPaddingRight;
      document.body.style.position = savedPosition;
      document.body.style.top = savedTop;
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = savedWidth;
      window.scrollTo(0, savedScrollY);
    }
  };
}

/** Emergency reset if a modal cleanup was skipped (dev / edge cases). */
export function forceUnlockModalScroll(): void {
  if (typeof document === "undefined") return;
  lockCount = 0;
  document.body.style.overflow = savedOverflow || "";
  document.body.style.paddingRight = savedPaddingRight || "";
  document.body.style.position = savedPosition || "";
  document.body.style.top = savedTop || "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = savedWidth || "";
  if (savedScrollY) window.scrollTo(0, savedScrollY);
}
