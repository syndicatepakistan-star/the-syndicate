"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FxCssImport = dynamic(
  () => import("@/components/programs/ProgramsFxCssImport").then((m) => m.ProgramsFxCssImport),
  { ssr: false },
);

/** Spotlight/ambient FX sheet — idle on desktop; skip first paint on phone/iPad. */
export function DeferredDashboardProgramsFxCss() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;

    let idleHandle: number | undefined;
    const safety = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      } else {
        setReady(true);
      }
    }, 4000);

    return () => {
      window.clearTimeout(safety);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, []);

  return ready ? <FxCssImport /> : null;
}
