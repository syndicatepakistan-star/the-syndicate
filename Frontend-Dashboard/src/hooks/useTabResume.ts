"use client";

import { useEffect, useRef } from "react";

/**
 * Run `callback` when the user returns to this tab after it was hidden (or bfcache restore).
 * Does not listen to `window` focus — that fires on many in-page clicks and caused spurious
 * playlist/video reloads while the user was still watching.
 */
export function useTabResume(callback: () => void, enabled = true): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const wasHiddenRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const runAfterResume = () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      if (!wasHiddenRef.current) return;
      wasHiddenRef.current = false;
      callbackRef.current();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
        return;
      }
      runAfterResume();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      wasHiddenRef.current = true;
      runAfterResume();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [enabled]);
}
