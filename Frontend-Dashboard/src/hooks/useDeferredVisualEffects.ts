"use client";

import { useEffect, useState } from "react";

type Options = {
  /** Extra wait on phones before enabling neon blur/glow (default 1100ms). */
  mobileDelayMs?: number;
  /** Extra wait on desktop (default 450ms). */
  desktopDelayMs?: number;
};

/**
 * First paint stays light (borders only). After a short delay + idle time,
 * flip true so heavy blur/glow layers can mount without changing layout size.
 */
export function useDeferredVisualEffects(options?: Options): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let fallbackTimer: number | undefined;

    const mobile =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;
    const delay = mobile
      ? (options?.mobileDelayMs ?? 1100)
      : (options?.desktopDelayMs ?? 450);

    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const scheduleIdle = () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        idleId = ric(() => enable(), { timeout: mobile ? 900 : 500 });
        return;
      }
      enable();
    };

    fallbackTimer = window.setTimeout(scheduleIdle, delay);

    return () => {
      cancelled = true;
      if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [options?.mobileDelayMs, options?.desktopDelayMs]);

  return ready;
}
