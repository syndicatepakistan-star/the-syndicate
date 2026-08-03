"use client";

import { useEffect, useState } from "react";

type Options = {
  /** Extra wait on phones before enabling neon blur/glow (default 1200ms). */
  mobileDelayMs?: number;
  /** Extra wait on desktop (default 500ms). */
  desktopDelayMs?: number;
};

let sharedReady = false;
let schedulerStarted = false;
const listeners = new Set<() => void>();

function notifyReady() {
  if (sharedReady) return;
  sharedReady = true;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
  listeners.clear();
}

function startSharedScheduler(options?: Options) {
  if (schedulerStarted || typeof window === "undefined") return;
  schedulerStarted = true;

  let idleId: number | undefined;

  const mobile =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 767px)").matches;
  const delay = mobile
    ? (options?.mobileDelayMs ?? 1200)
    : (options?.desktopDelayMs ?? 500);

  const scheduleIdle = () => {
    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      idleId = ric(() => notifyReady(), { timeout: mobile ? 1000 : 600 });
      return;
    }
    notifyReady();
  };

  window.setTimeout(scheduleIdle, delay);

  // Keep cancelIdleCallback reachable if the page unloads mid-wait (best-effort).
  window.addEventListener(
    "pagehide",
    () => {
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    },
    { once: true },
  );
}

/**
 * First paint stays light (borders only). After a short delay + idle time,
 * flip true so heavy blur/glow layers can mount without changing layout size.
 *
 * Shared across all /programs cards — one timer, not one per card (cuts TBT).
 */
export function useDeferredVisualEffects(options?: Options): boolean {
  // Always start false so SSR HTML matches first client paint (sharedReady can already be true).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sharedReady) {
      setReady(true);
      return;
    }
    startSharedScheduler(options);
    const onReady = () => setReady(true);
    listeners.add(onReady);
    return () => {
      listeners.delete(onReady);
    };
  }, [options?.mobileDelayMs, options?.desktopDelayMs]);

  return ready;
}
