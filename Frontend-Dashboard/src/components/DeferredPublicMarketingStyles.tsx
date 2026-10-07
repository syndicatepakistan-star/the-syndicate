"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MarketingCssImport = dynamic(
  () => import("@/components/MarketingCssImport").then((m) => m.MarketingCssImport),
  { ssr: false },
);

/**
 * Defers public-marketing-responsive.css until after first paint / idle
 * so it does not block hero LCP on Slow 4G.
 */
export function DeferredPublicMarketingStyles() {
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
        idleHandle = window.requestIdleCallback(activate, { timeout: 1800 });
      } else {
        activate();
      }
    };

    // Past hero LCP quiet window on Slow 4G mobile.
    safetyHandle = window.setTimeout(scheduleIdle, 2800);

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

  return ready ? <MarketingCssImport /> : null;
}
