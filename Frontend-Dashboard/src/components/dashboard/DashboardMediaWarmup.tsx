"use client";

import { useEffect } from "react";
import { shouldSkipHeavyVideoWarmup } from "@/lib/mediaWarmCache";
import { DASHBOARD_MAIN_BG_VIDEO } from "@/components/dashboard/DashboardShellBackground";

/**
 * Soft-warm dashboard shell MP4 on desktop only.
 * Never full-buffers on phones (video is skipped there) — that alone was ~18MB of Lighthouse payload.
 */
export function DashboardMediaWarmup() {
  useEffect(() => {
    if (shouldSkipHeavyVideoWarmup()) return;

    let cancelled = false;
    const warm = () => {
      if (cancelled || typeof document === "undefined") return;
      // Metadata-only hint — do not create a preload=auto pool entry for the 18MB asset.
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "video";
      link.href = DASHBOARD_MAIN_BG_VIDEO;
      link.setAttribute("data-dashboard-video-prefetch", "1");
      if (!document.head.querySelector(`link[data-dashboard-video-prefetch="1"]`)) {
        document.head.appendChild(link);
      }
    };

    const ric = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({} as IdleDeadline), 1800));
    const id = ric.call(window, warm, { timeout: 4000 });

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function" && typeof id === "number") {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id as number);
      }
    };
  }, []);

  return null;
}
