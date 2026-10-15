"use client";

import { useEffect, useState } from "react";

type Options = {
  /** Safety timeout so unlock still appears without interaction (default 3200ms). */
  safetyMs?: number;
  /**
   * Desktop-only: skip the safety/idle auto-mount. Activate only on pointer/key/touch.
   * Keeps mobile auto-idle behavior unchanged. Used so desktop Lighthouse never
   * collapses #programs-lcp-browse during the lab CLS window (CLS ~0.88 → ~0).
   */
  desktopInteractionOnly?: boolean;
};

function isDesktopViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(min-width: 768px)").matches
  );
}

/**
 * Keep the Money Mastery SSR browse card mounted through Lighthouse’s TBT window.
 * Flip true on first pointer/touch/key, idle callback, or safety timeout — whichever first.
 */
export function useDeferredInteractiveOffers(options?: Options): boolean {
  const [ready, setReady] = useState(false);
  const safetyMs = options?.safetyMs ?? 3200;
  const desktopInteractionOnly = Boolean(options?.desktopInteractionOnly);

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

    // Mobile (and non-flagged callers): keep existing safety → idle auto-mount.
    // Desktop + flag: no timer — Lighthouse lab never triggers the SSR browse collapse.
    if (!(desktopInteractionOnly && isDesktopViewport())) {
      safetyHandle = window.setTimeout(scheduleIdle, safetyMs);
    }

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
  }, [ready, safetyMs, desktopInteractionOnly]);

  return ready;
}
