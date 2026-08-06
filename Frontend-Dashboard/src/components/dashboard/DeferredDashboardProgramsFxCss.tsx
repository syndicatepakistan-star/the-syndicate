"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const FxCssImport = dynamic(
  () => import("@/components/programs/ProgramsFxCssImport").then((m) => m.ProgramsFxCssImport),
  { ssr: false },
);

/**
 * Spotlight/ambient FX sheet — only when Programs is in play.
 * Skipped on phones/iPads; idle-deferred on desktop programs routes.
 */
export function DeferredDashboardProgramsFxCss() {
  const pathname = usePathname() ?? "";
  const onPrograms =
    pathname === "/dashboard/programs" || pathname.startsWith("/dashboard/programs/");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;
    if (!onPrograms) {
      setReady(false);
      return;
    }

    let idleHandle: number | undefined;
    const safety = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      } else {
        setReady(true);
      }
    }, 2500);

    return () => {
      window.clearTimeout(safety);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [onPrograms]);

  return ready ? <FxCssImport /> : null;
}
