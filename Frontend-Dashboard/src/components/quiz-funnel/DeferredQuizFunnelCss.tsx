"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const QuizFunnelCssImport = dynamic(
  () =>
    import("@/components/quiz-funnel/QuizFunnelCssImport").then((m) => m.QuizFunnelCssImport),
  { ssr: false },
);

/**
 * Defers the large quiz-funnel.css until shortly after first paint.
 * Critical landing CSS is inlined in quiz/layout.tsx.
 * Does not touch GTM.
 */
export function DeferredQuizFunnelCss() {
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

    // Landing LCP (heading) first; ~98KB sheet after quiet window (interaction still loads early).
    const isMobile =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;
    safetyHandle = window.setTimeout(scheduleIdle, isMobile ? 3200 : 1400);

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

  return ready ? <QuizFunnelCssImport /> : null;
}
