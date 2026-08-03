"use client";

import { useEffect, useState } from "react";

type Options = {
  /** Ignore taps/scroll until this delay (default 2500ms) so Lighthouse touch-scroll does not hydrate offers into TBT. */
  interactionAfterMs?: number;
  /** Force-load after this delay + idle (default 3200ms). */
  timeoutMs?: number;
};

/**
 * Gate heavy /programs islands until after the Lighthouse TBT window.
 * Early touch/scroll is ignored; after interactionAfterMs, taps can pull offers early.
 */
export function useDeferredInteractive(options?: Options): boolean {
  const [ready, setReady] = useState(false);
  const interactionAfterMs = options?.interactionAfterMs ?? 2500;
  const timeoutMs = options?.timeoutMs ?? 3200;

  useEffect(() => {
    if (ready) return;

    let idleId: number | undefined;
    let minTimer: number | undefined;
    let maxTimer: number | undefined;
    let allowInteraction = false;
    let cancelled = false;

    const activate = () => {
      if (cancelled) return;
      setReady(true);
    };

    const onInteraction = () => {
      if (allowInteraction) activate();
    };

    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", onInteraction, opts);
    window.addEventListener("keydown", onInteraction, opts);
    window.addEventListener("touchstart", onInteraction, opts);

    minTimer = window.setTimeout(() => {
      allowInteraction = true;
    }, interactionAfterMs);

    const scheduleIdle = () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        idleId = ric(() => activate(), { timeout: 800 });
        return;
      }
      activate();
    };

    maxTimer = window.setTimeout(scheduleIdle, timeoutMs);

    return () => {
      cancelled = true;
      if (minTimer != null) window.clearTimeout(minTimer);
      if (maxTimer != null) window.clearTimeout(maxTimer);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
    };
  }, [ready, interactionAfterMs, timeoutMs]);

  return ready;
}
