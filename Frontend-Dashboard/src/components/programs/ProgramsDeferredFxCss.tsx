"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/** Side-effect-only module — pulls deferred spotlight/ambient CSS into the bundle chunk. */
const ProgramsFxCssImport = dynamic(
  () => import("@/components/programs/ProgramsFxCssImport").then((m) => m.ProgramsFxCssImport),
  { ssr: false },
);

/**
 * Loads programs-page-fx.css after idle / interaction so first-paint
 * render-blocking CSS stays on card/layout rules only.
 */
export function ProgramsDeferredFxCss() {
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

    const scheduleIdle = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(activate, { timeout: 2000 });
      } else {
        activate();
      }
    };
    // After mobile Lighthouse quiet window + interactive offers mount.
    safetyHandle = window.setTimeout(scheduleIdle, 5200);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("touchstart", activate);
      if (safetyHandle !== undefined) window.clearTimeout(safetyHandle);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, []);

  return ready ? <ProgramsFxCssImport /> : null;
}
