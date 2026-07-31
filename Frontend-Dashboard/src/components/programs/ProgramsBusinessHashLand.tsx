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

/**
 * Only when the URL already has #businessprograms / #programs-library:
 * scroll to the PROGRAMS band, then reveal. Never invents or forces that hash
 * onto a plain /programs visit.
 */
export function ProgramsBusinessHashLand() {
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    let safetyTimer: number | null = null;

    const clearSafety = () => {
      if (safetyTimer != null) {
        window.clearTimeout(safetyTimer);
        safetyTimer = null;
      }
    };

    const finishLand = () => {
      if (cancelled) return;
      clearSafety();
      scrollToBusinessPrograms();
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        scrollToBusinessPrograms();
        clearPending();
      });
    };

    const landFromExplicitHash = () => {
      const matched = matchedDeepLinkHash();
      if (!matched) {
        // Plain /programs (or unrelated hash) — never deep-link, always show UI.
        clearSafety();
        clearPending();
        return;
      }

      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      clearSafety();
      safetyTimer = window.setTimeout(() => {
        // Reveal even if scroll failed — never leave main content / menu broken.
        finishLand();
      }, MAX_HIDE_MS);

      let attempts = 0;
      const tick = () => {
        if (cancelled) return;
        // Hash cleared while landing (user navigated) — abort, do not re-add hash.
        if (!matchedDeepLinkHash()) {
          clearSafety();
          clearPending();
          return;
        }
        attempts += 1;
        const ok = scrollToBusinessPrograms();
        if (ok && isNearTarget()) {
          timers.push(window.setTimeout(finishLand, 40));
          return;
        }
        if (attempts < 40) {
          timers.push(window.setTimeout(tick, 40));
          return;
        }
        finishLand();
      };

      tick();
    };

    landFromExplicitHash();

    const onHash = () => landFromExplicitHash();
    window.addEventListener("hashchange", onHash);

    return () => {
      cancelled = true;
      clearSafety();
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("hashchange", onHash);
      clearPending();
    };
  }, []);

  return null;
}
