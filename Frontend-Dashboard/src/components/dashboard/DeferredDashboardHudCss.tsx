"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HudCssImport = dynamic(
  () => import("@/components/dashboard/DashboardHudCssImport").then((m) => m.DashboardHudCssImport),
  { ssr: false },
);

/**
 * Mission HUD CSS is large and unused on /dashboard and /dashboard/programs.
 * Load only while Syndicate Mode (monk) is active — no idle warmup on other routes.
 */
export function DeferredDashboardHudCss({ active }: { active: boolean }) {
  const [ready, setReady] = useState(active);

  useEffect(() => {
    setReady(active);
  }, [active]);

  return ready ? <HudCssImport /> : null;
}
