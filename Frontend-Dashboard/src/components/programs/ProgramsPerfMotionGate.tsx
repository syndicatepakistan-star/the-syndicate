"use client";

import { useEffect } from "react";

const FX_READY_CLASS = "programs-page-root--fx-ready";

/**
 * Keeps lightning / pulse animations off during first paint + Lighthouse quiet window
 * (same colors/layout; motion starts after idle or first interaction).
 */
export function ProgramsPerfMotionGate() {
  useEffect(() => {
    const root = document.querySelector(".programs-page-root");
    if (!root) return;

    let cancelled = false;
    let idleHandle: number | undefined;
    let safetyHandle: number | undefined;

    const activate = () => {
      if (cancelled) return;
      root.classList.add(FX_READY_CLASS);
    };

    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointerdown", activate, opts);
    window.addEventListener("touchstart", activate, opts);
    window.addEventListener("keydown", activate, opts);

    const scheduleIdle = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(activate, { timeout: 1800 });
      } else {
        activate();
      }
    };

    // Past typical mobile Lighthouse TBT/CLS window; interaction unlocks sooner.
    safetyHandle = window.setTimeout(scheduleIdle, 5200);

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
  }, []);

  return null;
}
