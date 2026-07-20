"use client";

import { useEffect } from "react";
import { shouldSkipHeavyVideoWarmup } from "@/lib/mediaWarmCache";
import { DASHBOARD_MAIN_BG_VIDEO } from "@/components/dashboard/DashboardShellBackground";
import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";

/**
 * Soft-warm dashboard shell MP4 on desktop only.
 * Money Mastery LCP preload only on the programs grid (not playlist detail views).
 */
export function DashboardMediaWarmup() {
  useEffect(() => {
    const syncProgramsLcpPreload = () => {
      const params = new URLSearchParams(window.location.search);
      const onPrograms =
        window.location.pathname.includes("/dashboard/programs") ||
        params.get("section") === "programs" ||
        window.location.hash.includes("programs");
      const viewingPlaylist =
        Number(params.get("playlist") || params.get("playlist_id") || 0) > 0;
      const existing = document.head.querySelector('link[data-dashboard-lcp-preload="1"]');

      if (onPrograms && !viewingPlaylist) {
        if (existing) return;
        const lcp = document.createElement("link");
        lcp.rel = "preload";
        lcp.as = "image";
        lcp.href = OFFER_PLAN_THUMB_MONEY_MASTERY;
        lcp.setAttribute("data-dashboard-lcp-preload", "1");
        document.head.appendChild(lcp);
        return;
      }

      existing?.remove();
    };

    syncProgramsLcpPreload();
    window.addEventListener("popstate", syncProgramsLcpPreload);
    // Next soft navigations update search without popstate — poll lightly.
    const poll = window.setInterval(syncProgramsLcpPreload, 1500);

    if (shouldSkipHeavyVideoWarmup()) {
      return () => {
        window.removeEventListener("popstate", syncProgramsLcpPreload);
        window.clearInterval(poll);
      };
    }

    let cancelled = false;
    const warm = () => {
      if (cancelled || typeof document === "undefined") return;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "video";
      link.href = DASHBOARD_MAIN_BG_VIDEO;
      link.setAttribute("data-dashboard-video-prefetch", "1");
      if (!document.head.querySelector(`link[data-dashboard-video-prefetch="1"]`)) {
        document.head.appendChild(link);
      }
    };

    const ric =
      window.requestIdleCallback ??
      ((cb: IdleRequestCallback) => window.setTimeout(() => cb({} as IdleDeadline), 1800));
    const id = ric.call(window, warm, { timeout: 4000 });

    return () => {
      cancelled = true;
      window.removeEventListener("popstate", syncProgramsLcpPreload);
      window.clearInterval(poll);
      if (typeof window.cancelIdleCallback === "function" && typeof id === "number") {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id as number);
      }
    };
  }, []);

  return null;
}
