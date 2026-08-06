"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShellCssImport = dynamic(
  () =>
    import("@/components/dashboard/DashboardShellCssImport").then((m) => m.DashboardShellCssImport),
  { ssr: false },
);

/**
 * Load ~296KB dashboard-shell.css after first paint so it is not SSR render-blocking.
 * Critical chrome (black bg, navbar/shell reserves, slideshow/programs LCP slots) stays
 * inline in dashboard/layout.tsx — avoids white filmstrip without FOUC-ing the shell forever.
 */
export function DeferredDashboardShellCss() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setReady(true));
    });
    // Safety if rAF is starved under Lighthouse CPU throttle.
    const safety = window.setTimeout(() => setReady(true), 80);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(safety);
    };
  }, []);

  return ready ? <ShellCssImport /> : null;
}
