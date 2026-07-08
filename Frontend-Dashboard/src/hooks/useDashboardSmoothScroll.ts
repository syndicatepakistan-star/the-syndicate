"use client";

import { useEffect, type RefObject } from "react";
import { isDashboardMotionSuspended } from "@/lib/dashboardMotionControl";

const SCROLL_CONTAINER_SELECTOR =
  "[data-main-shell-scroll], .programs-grid-scroll, .programs-lesson-scroll, [data-syndicate-mission-scroll]";

const SCROLL_END_MS = 150;

/** Pause heavy chrome animations while any dashboard scroll container moves. */
export function useDashboardSmoothScroll(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    let rafId = 0;
    let scrollEndTimer: number | null = null;
    let scrolling = false;

    const setScrolling = (active: boolean) => {
      if (scrolling === active) return;
      scrolling = active;
      root.classList.toggle("is-scrolling", active);
      document.documentElement.classList.toggle("dashboard-is-scrolling", active);
    };

    const onScroll = () => {
      if (isDashboardMotionSuspended()) return;
      if (!rafId) {
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          setScrolling(true);
        });
      }
      if (scrollEndTimer !== null) window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => {
        setScrolling(false);
        scrollEndTimer = null;
      }, SCROLL_END_MS);
    };

    const onScrollCapture = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches(SCROLL_CONTAINER_SELECTOR)) return;
      onScroll();
    };

    root.addEventListener("scroll", onScrollCapture, { passive: true, capture: true });

    return () => {
      root.removeEventListener("scroll", onScrollCapture, true);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (scrollEndTimer !== null) window.clearTimeout(scrollEndTimer);
      setScrolling(false);
    };
  }, [rootRef]);
}
