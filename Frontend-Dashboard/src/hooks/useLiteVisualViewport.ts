"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 1024px)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** SSR: assume lite (mobile/iPad) so we never paint blur/glow layers into first HTML. */
function getServerSnapshot() {
  return true;
}

/**
 * True on phone + iPad widths — use for perf compromises (no blur/sparks/infinite glow).
 * Desktop / large screens stay false (full FX after deferred ready).
 */
export function useLiteVisualViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
