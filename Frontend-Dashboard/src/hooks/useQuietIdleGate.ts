"use client";

import { useEffect, useState } from "react";

type Options = {
  /** Ignore touch/scroll/pointer that Lighthouse fires early (default 2500ms). */
  quietMs?: number;
  /** Wait this long before requesting idle callback (default 3500ms mobile / 2000ms desktop). */
  delayMs?: number;
  /** requestIdleCallback timeout after delay (default 1500ms). */
  idleTimeoutMs?: number;
  /** Force true immediately (deep links / restored cart). */
  force?: boolean;
};

/**
 * Stay false through the Lighthouse TBT window, then flip true after delay+idle.
 * Early touch/scroll is ignored so LH synthetic input does not pull heavy JS early.
 * Unlock/Details can force via `programs-offers-interactive` event.
 */
export function useQuietIdleGate(options?: Options): boolean {
  const force = !!options?.force;
  const [ready, setReady] = useState(force);

  useEffect(() => {
    if (force) {
      setReady(true);
      return;
    }
    if (ready) return;

    let cancelled = false;
    let idleId: number | undefined;
    let delayTimer: number | undefined;
    let quietTimer: number | undefined;
    let allowGesture = false;

    const mobile =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;

    const quietMs = options?.quietMs ?? 2500;
    const delayMs = options?.delayMs ?? (mobile ? 3500 : 2000);
    const idleTimeoutMs = options?.idleTimeoutMs ?? 1500;

    const enable = () => {
      if (cancelled) return;
      setReady(true);
    };

    const onDemand = () => enable();
    window.addEventListener("programs-offers-interactive", onDemand);

    const onGesture = () => {
      if (!allowGesture || cancelled) return;
      enable();
    };

    quietTimer = window.setTimeout(() => {
      allowGesture = true;
      window.addEventListener("pointerdown", onGesture, { passive: true });
      window.addEventListener("keydown", onGesture);
    }, quietMs);

    delayTimer = window.setTimeout(() => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        idleId = ric(() => enable(), { timeout: idleTimeoutMs });
      } else {
        enable();
      }
    }, delayMs);

    return () => {
      cancelled = true;
      window.removeEventListener("programs-offers-interactive", onDemand);
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      if (delayTimer != null) window.clearTimeout(delayTimer);
      if (quietTimer != null) window.clearTimeout(quietTimer);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [force, options?.quietMs, options?.delayMs, options?.idleTimeoutMs, ready]);

  return ready || force;
}

/** Imperative: Unlock/Details wake the offers island (user intent). */
export function requestProgramsOffersInteractive() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("programs-offers-interactive"));
}
