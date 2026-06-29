/**
 * Reference-counted body scroll lock for stacked modals.
 * Each modal must call lockModalScroll() on open and run the returned unlock on close.
 * Prevents body staying overflow:hidden when modals close out of order.
 */

let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

export function lockModalScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
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
    }
  };
}

/** Emergency reset if a modal cleanup was skipped (dev / edge cases). */
export function forceUnlockModalScroll(): void {
  if (typeof document === "undefined") return;
  lockCount = 0;
  document.body.style.overflow = savedOverflow || "";
  document.body.style.paddingRight = savedPaddingRight || "";
}
