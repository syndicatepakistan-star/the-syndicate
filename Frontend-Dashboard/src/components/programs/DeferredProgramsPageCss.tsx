"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ProgramsPageCssImport = dynamic(
  () =>
    import("@/components/programs/ProgramsPageCssImport").then((m) => m.ProgramsPageCssImport),
  { ssr: false },
);

/**
 * Loads programs-page.css after a short quiet window so critical LCP CSS
 * (inlined in layout) paints first. Does not touch GTM.
 */
export function DeferredProgramsPageCss() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | undefined;
    let safetyHandle: number | undefined;

    const activate = () => {
      if (!cancelled) setReady(true);
    };

    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointerdown", activate, opts);
    window.addEventListener("touchstart", activate, opts);
    window.addEventListener("scroll", activate, opts);

    const scheduleIdle = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(activate, { timeout: 1200 });
      } else {
        activate();
      }
    };

    // Money Mastery LCP first; mobile waits longer so Slow 4G bandwidth stays free.
    const isMobile =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;
    safetyHandle = window.setTimeout(scheduleIdle, isMobile ? 2400 : 900);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("touchstart", activate);
      window.removeEventListener("scroll", activate);
      if (safetyHandle !== undefined) window.clearTimeout(safetyHandle);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, []);

  return ready ? <ProgramsPageCssImport /> : null;
}
