"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const GlobalsCssImport = dynamic(
  () => import("@/components/GlobalsCssImport").then((m) => m.GlobalsCssImport),
  { ssr: false },
);

/**
 * Keep the ~105KB Tailwind/globals sheet OUT of the SSR render-blocking chain.
 * First paint uses critical-shell.css + page inline LCP CSS; full chrome loads right after.
 */
export function DeferredGlobalsCss() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let raf1 = 0;
    let raf2 = 0;

    const activate = () => {
      if (!cancelled) setReady(true);
    };

    // Two rAFs ≈ after first paint, then idle with short timeout so UX isn't bare long.
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (typeof window.requestIdleCallback === "function") {
          idleId = window.requestIdleCallback(activate, { timeout: 400 });
        } else {
          activate();
        }
      });
    });

    // Absolute fail-safe — never leave marketing shell unstyled.
    const hard = window.setTimeout(activate, 1200);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(hard);
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  return ready ? <GlobalsCssImport /> : null;
}
