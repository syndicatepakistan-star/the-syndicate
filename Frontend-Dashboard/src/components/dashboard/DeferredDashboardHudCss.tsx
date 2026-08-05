"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HudCssImport = dynamic(
  () => import("@/components/dashboard/DashboardHudCssImport").then((m) => m.DashboardHudCssImport),
  { ssr: false },
);

/**
 * Mission HUD CSS is large and unused on /dashboard/programs first paint.
 * Load only when the monk/missions section is active (or after long idle on desktop).
 */
export function DeferredDashboardHudCss({ active }: { active: boolean }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (active) {
      setReady(true);
      return;
    }
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;

    let idleHandle: number | undefined;
    const safety = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(() => setReady(true), { timeout: 4000 });
      } else {
        setReady(true);
      }
    }, 12000);

    return () => {
      window.clearTimeout(safety);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [active]);

  return ready ? <HudCssImport /> : null;
}
