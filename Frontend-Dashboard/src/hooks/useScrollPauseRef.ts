"use client";

import { useEffect, useRef } from "react";

/** True while the user is actively scrolling (main-thread relief for canvas / RAF). */
export function useScrollPauseRef(cooldownMs = 180) {
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

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [cooldownMs]);

  return scrollingRef;
}
