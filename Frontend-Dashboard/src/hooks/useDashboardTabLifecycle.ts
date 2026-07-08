"use client";

import { useEffect, type RefObject } from "react";
import { pauseDashboardMotion, resumeDashboardMotion } from "@/lib/dashboardMotionControl";
import { resetDashboardDocumentScroll } from "@/lib/dashboardShellScroll";

/** Suspend heavy dashboard motion when the tab is hidden; recover cleanly on return. */
export function useDashboardTabLifecycle(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const sync = () => {
      const root = rootRef.current;
      if (document.visibilityState === "hidden") {
        pauseDashboardMotion(root);
        return;
      }
      resumeDashboardMotion(root);
      resetDashboardDocumentScroll();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      resumeDashboardMotion(rootRef.current);
      resetDashboardDocumentScroll();
    };

    const onPageHide = () => {
      pauseDashboardMotion(rootRef.current);
    };

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
      resumeDashboardMotion(rootRef.current);
    };
  }, [rootRef]);
}
