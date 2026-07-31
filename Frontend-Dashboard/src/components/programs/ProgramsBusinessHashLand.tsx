"use client";

import { useEffect } from "react";

const TARGETS = new Set(["businessprograms", "programs-library"]);
const SCROLL_ID = "businessprograms";
const OFFERS_ID = "syndicate-elite-offers";
/** Keep re-anchoring while Elite Offers / mid-tickets hydrate and grow above. */
const PIN_MS = 5000;

/** Clear leftover hide/collapse classes from older deploys (no-op if absent). */
function clearLegacyPending() {
  document.documentElement.classList.remove("programs-hash-pending");
  document.getElementById("programs-hash-pending-inline")?.remove();
}

function readHash(): string {
  return window.location.hash.replace(/^#/, "").trim().toLowerCase();
}

function matchedDeepLinkHash(): string | null {
  const h = readHash();
  if (!TARGETS.has(h)) return null;
  return h === "programs-library" ? "businessprograms" : h;
}

function readScrollMarginTop(el: HTMLElement): number {
  const raw = window.getComputedStyle(el).scrollMarginTop || "0";
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function scrollToBusinessPrograms(): boolean {
  const el = document.getElementById(SCROLL_ID);
  if (!el) return false;
  const margin = readScrollMarginTop(el);
  const y = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - margin));
  window.scrollTo({ top: y, left: 0, behavior: "auto" });
  return true;
}

/**
 * #businessprograms — scroll only (no offer collapse).
 * Re-pins when Elite Offers / mid-ticket packs load above and would otherwise
 * shove the viewport onto those packs. Stops if the user scrolls on purpose.
 */
export function ProgramsBusinessHashLand() {
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    let pinActive = false;
    let pinUntil = 0;
    let allowUserStop = false;
    let resizeObserver: ResizeObserver | null = null;

    clearLegacyPending();

    const stopPin = () => {
      pinActive = false;
      allowUserStop = false;
      resizeObserver?.disconnect();
      resizeObserver = null;
    };

    const pinScroll = () => {
      if (cancelled || !pinActive) return;
      if (!matchedDeepLinkHash()) {
        stopPin();
        return;
      }
      if (Date.now() > pinUntil) {
        stopPin();
        return;
      }
      scrollToBusinessPrograms();
    };

    const onUserGesture = () => {
      // Ignore gestures during the first moments of programmatic pinning.
      if (!pinActive || !allowUserStop) return;
      stopPin();
    };

    const startPin = () => {
      clearLegacyPending();
      if (!matchedDeepLinkHash()) {
        stopPin();
        return;
      }

      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      pinActive = true;
      allowUserStop = false;
      pinUntil = Date.now() + PIN_MS;

      scrollToBusinessPrograms();

      timers.push(
        window.setTimeout(() => {
          if (pinActive && !cancelled) allowUserStop = true;
        }, 450),
      );

      resizeObserver?.disconnect();
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          // Elite Offers / vault row grew → re-anchor Programs.
          pinScroll();
        });
        const offers = document.getElementById(OFFERS_ID);
        const target = document.getElementById(SCROLL_ID);
        const library = document.getElementById("programs-library");
        if (offers) resizeObserver.observe(offers);
        if (target) resizeObserver.observe(target);
        if (library) resizeObserver.observe(library);
      }

      // Catch late dynamic chunks (Money Mastery + mid-ticket packs).
      let pulses = 0;
      const pulse = () => {
        if (cancelled || !pinActive) return;
        pinScroll();
        pulses += 1;
        if (pulses < 20 && pinActive) {
          timers.push(window.setTimeout(pulse, 200));
        }
      };
      timers.push(window.setTimeout(pulse, 50));

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) stopPin();
        }, PIN_MS + 50),
      );
    };

    const onHash = () => startPin();

    startPin();

    window.addEventListener("hashchange", onHash);
    window.addEventListener("wheel", onUserGesture, { passive: true });
    window.addEventListener("touchmove", onUserGesture, { passive: true });
    window.addEventListener("keydown", onUserGesture);

    return () => {
      cancelled = true;
      stopPin();
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("wheel", onUserGesture);
      window.removeEventListener("touchmove", onUserGesture);
      window.removeEventListener("keydown", onUserGesture);
      clearLegacyPending();
    };
  }, []);

  return null;
}
