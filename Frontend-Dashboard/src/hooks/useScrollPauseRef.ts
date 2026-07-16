"use client";

import { useEffect, useRef } from "react";

/**
 * True while the user is actively scrolling.
 * Listens in capture phase so nested dashboard scrollports
 * (`[data-main-shell-scroll]`, `.programs-grid-scroll`, …) are detected —
 * `window` often does not scroll under the locked dashboard shell.
 */
export function useScrollPauseRef(cooldownMs = 220) {
  const scrollingRef = useRef(false);

  useEffect(() => {
    let timer: number | undefined;

    const onScroll = () => {
      scrollingRef.current = true;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        scrollingRef.current = false;
      }, cooldownMs);
    };

    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("scroll", onScroll);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [cooldownMs]);

  return scrollingRef;
}
