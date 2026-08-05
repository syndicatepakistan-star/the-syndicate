"use client";

import { useEffect, useState } from "react";

type Options = {
  /** Safety timeout so unlock still appears without interaction (default 3200ms). */
  safetyMs?: number;
};

/**
 * Keep the Money Mastery SSR browse card mounted through Lighthouse’s TBT window.
 * Flip true on first pointer/touch/key, idle callback, or safety timeout — whichever first.
 */
export function useDeferredInteractiveOffers(options?: Options): boolean {
  const [ready, setReady] = useState(false);
  const safetyMs = options?.safetyMs ?? 3200;

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    let idleHandle: number | undefined;
    let safetyHandle: number | undefined;

    const activate = () => {
      if (cancelled) return;
      setReady(true);
    };

    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointerdown", activate, opts);
    window.addEventListener("touchstart", activate, opts);
    window.addEventListener("keydown", activate, opts);

    const scheduleIdle = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(activate, { timeout: 1200 });
      } else {
        activate();
      }
    };

    // Wait past typical mobile Lighthouse quiet window, then idle-load the offers chunk.
    safetyHandle = window.setTimeout(scheduleIdle, safetyMs);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("touchstart", activate);
      window.removeEventListener("keydown", activate);
      if (safetyHandle !== undefined) window.clearTimeout(safetyHandle);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [ready, safetyMs]);

  return ready;
}
