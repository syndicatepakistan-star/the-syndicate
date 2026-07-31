"use client";

import { useEffect } from "react";

const HASH_PENDING_CLASS = "programs-hash-pending";
const INLINE_STYLE_ID = "programs-hash-pending-inline";
const TARGETS = new Set(["businessprograms", "programs-library"]);
const SCROLL_ID = "businessprograms";
const MAX_HIDE_MS = 1600;

function readHash(): string {
  return window.location.hash.replace(/^#/, "").trim().toLowerCase();
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

function isNearTarget(slackPx = 96): boolean {
  const el = document.getElementById(SCROLL_ID);
  if (!el) return false;
  const margin = readScrollMarginTop(el);
  const top = el.getBoundingClientRect().top;
  return top >= margin - slackPx && top <= margin + slackPx;
}

function clearPending() {
  document.documentElement.classList.remove(HASH_PENDING_CLASS);
  document.getElementById(INLINE_STYLE_ID)?.remove();
}

function ensureHash(matched: string) {
  const { pathname, search } = window.location;
  const full = `${pathname}${search}#${matched}`;
  if (window.location.hash.replace(/^#/, "").toLowerCase() !== matched) {
    window.history.replaceState(window.history.state, "", full);
  }
}

/**
 * Lands /programs#businessprograms on the PROGRAMS (psychology + business models) band.
 * Always reveals within MAX_HIDE_MS so a failed scroll cannot leave a blank page.
 */
export function ProgramsBusinessHashLand() {
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const finish = (matched: string | null) => {
      if (cancelled) return;
      // Unlock overflow first so the final scroll sticks, then show the page.
      document.documentElement.classList.remove(HASH_PENDING_CLASS);
      if (matched) {
        scrollToBusinessPrograms();
        ensureHash(matched);
      }
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        if (matched) scrollToBusinessPrograms();
        clearPending();
      });
    };

    const run = () => {
      const fromHash = readHash();
      const pending = document.documentElement.classList.contains(HASH_PENDING_CLASS);
      const matched =
        (TARGETS.has(fromHash) ? fromHash : null) ||
        (pending ? "businessprograms" : null);

      if (!matched) {
        clearPending();
        return;
      }

      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      // Keep hash in the URL (do not strip) so refresh / share still deep-link.
      ensureHash(matched === "programs-library" ? "businessprograms" : matched);

      let attempts = 0;
      const tick = () => {
        if (cancelled) return;
        attempts += 1;
        const ok = scrollToBusinessPrograms();
        if (ok && isNearTarget()) {
          timers.push(window.setTimeout(() => finish(matched), 40));
          return;
        }
        if (attempts < 40) {
          timers.push(window.setTimeout(tick, 40));
          return;
        }
        finish(matched);
      };

      tick();
    };

    run();
    // Hard safety: never leave the page invisible.
    timers.push(window.setTimeout(() => finish(TARGETS.has(readHash()) ? readHash() : "businessprograms"), MAX_HIDE_MS));

    const onHash = () => {
      if (TARGETS.has(readHash())) run();
    };
    window.addEventListener("hashchange", onHash);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("hashchange", onHash);
      // If this instance is torn down mid-flight (Strict Mode), do not leave blank UI.
      clearPending();
    };
  }, []);

  return null;
}
