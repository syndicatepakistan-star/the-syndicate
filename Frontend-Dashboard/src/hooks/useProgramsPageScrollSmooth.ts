"use client";

import { useEffect } from "react";

/** Settle delay so fast up/down scrolls do not thrash pause/resume styles. */
const SCROLL_END_MS = 180;

/**
 * Public /programs page: mark document + page root while the window scrolls
 * so CSS can freeze expensive blurs/animations without blanking card content.
 * Listener attaches after idle so first-paint TBT stays lighter.
 */
export function useProgramsPageScrollSmooth(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let rafId = 0;
    let scrollEndTimer: number | null = null;
    let scrolling = false;
    let idleId: number | undefined;
    let startTimer: number | undefined;
    let attached = false;

    const setScrolling = (active: boolean) => {
      if (scrolling === active) return;
      scrolling = active;
      const root = document.querySelector(".programs-page-root");
      root?.classList.toggle("is-scrolling", active);
      document.documentElement.classList.toggle("programs-is-scrolling", active);
    };

    const onScroll = () => {
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

    const attach = () => {
      if (attached) return;
      attached = true;
      window.addEventListener("scroll", onScroll, { passive: true });
    };

    const schedule = () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        idleId = ric(() => attach(), { timeout: 1500 });
        return;
      }
      attach();
    };

    startTimer = window.setTimeout(schedule, 400);

    return () => {
      if (startTimer != null) window.clearTimeout(startTimer);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (attached) window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (scrollEndTimer !== null) window.clearTimeout(scrollEndTimer);
      setScrolling(false);
    };
  }, [enabled]);
}
