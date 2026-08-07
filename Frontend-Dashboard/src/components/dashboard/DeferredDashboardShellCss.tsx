"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShellCssImport = dynamic(
  () =>
    import("@/components/dashboard/DashboardShellCssImport").then((m) => m.DashboardShellCssImport),
  { ssr: false },
);

type DeferredDashboardShellCssProps = {
  /** Extra delay before loading ~289KB shell CSS (helps programs LCP on mobile). */
  delayMs?: number;
};

/**
 * Load ~296KB dashboard-shell.css after first paint so it is not SSR render-blocking.
 * Critical chrome stays inline in dashboard/layout.tsx.
 */
export function DeferredDashboardShellCss({ delayMs = 80 }: DeferredDashboardShellCssProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (delayMs <= 80) setReady(true);
      });
    });
    const safety = window.setTimeout(() => setReady(true), Math.max(80, delayMs));
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(safety);
    };
  }, [delayMs]);

  return ready ? <ShellCssImport /> : null;
}
