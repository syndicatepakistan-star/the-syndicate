"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ProgramsPageCssImport = dynamic(
  () =>
    import("@/components/programs/ProgramsPageCssImport").then((m) => m.ProgramsPageCssImport),
  { ssr: false },
);

/**
 * programs-page.css (~24KB) — needed for /dashboard/programs, not for dashboard home LCP.
 * Load immediately on programs routes; idle-defer otherwise so /dashboard isn't blocked by it.
 */
export function DeferredDashboardProgramsPageCss() {
  const pathname = usePathname() ?? "";
  const needsNow =
    pathname === "/dashboard/programs" || pathname.startsWith("/dashboard/programs/");
  const [ready, setReady] = useState(needsNow);

  useEffect(() => {
    if (needsNow) {
      setReady(true);
      return;
    }
    let idleHandle: number | undefined;
    const safety = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      } else {
        setReady(true);
      }
    }, 1800);
    return () => {
      window.clearTimeout(safety);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [needsNow]);

  return ready ? <ProgramsPageCssImport /> : null;
}
