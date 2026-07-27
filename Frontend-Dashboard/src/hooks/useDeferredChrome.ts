"use client";

import { useEffect, useState } from "react";

/**
 * Defer mounting non-critical UI chrome (toasts, cart panel) until the user
 * interacts, scrolls, or `force` becomes true (e.g. cart already has items).
 * Purchase/checkout logic stays in providers; only visual chrome is delayed.
 */
export function useDeferredChrome(force = false): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (force || ready) {
      if (force) setReady(true);
      return;
    }

    const activate = () => setReady(true);
    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointerdown", activate, opts);
    window.addEventListener("keydown", activate, opts);
    window.addEventListener("touchstart", activate, opts);
    window.addEventListener("scroll", activate, opts);

    // Safety: mount before most users scroll far enough to add to cart without pointer.
    const idle = window.setTimeout(activate, 4500);

    return () => {
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("keydown", activate);
      window.removeEventListener("touchstart", activate);
      window.removeEventListener("scroll", activate);
      window.clearTimeout(idle);
    };
  }, [force, ready]);

  return ready || force;
}
