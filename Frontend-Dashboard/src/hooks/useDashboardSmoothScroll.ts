"use client";

import { useEffect, type RefObject } from "react";
import { isDashboardMotionSuspended } from "@/lib/dashboardMotionControl";

const SCROLL_CONTAINER_SELECTOR =
  "[data-main-shell-scroll], .programs-grid-scroll, .programs-lesson-scroll, [data-syndicate-mission-scroll], .support-thread-scroll";

/* Longer settle window: is-scrolling now only pauses animations (nothing is hidden),
   so a generous delay avoids pause/play churn on the bg video during fast up/down scrolls. */
const SCROLL_END_MS = 420;

function pauseDashboardVideos(root: HTMLElement) {
  root.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
    if (video.paused) return;
    video.dataset.dashboardScrollPaused = "1";
    video.pause();
  });
}

function resumeDashboardVideos(root: HTMLElement) {
  root.querySelectorAll<HTMLVideoElement>("video[data-dashboard-scroll-paused='1']").forEach((video) => {
    video.removeAttribute("data-dashboard-scroll-paused");
    if (document.visibilityState === "hidden") return;
    void video.play().catch(() => {});
  });
}

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
      if (active) pauseDashboardVideos(root);
      else resumeDashboardVideos(root);
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
      if (!target.matches(SCROLL_CONTAINER_SELECTOR) && !target.closest(SCROLL_CONTAINER_SELECTOR)) {
        return;
      }
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
