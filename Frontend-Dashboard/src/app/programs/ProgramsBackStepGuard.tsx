"use client";

import { useEffect } from "react";

const BACK_STEP_SEEDED = "__programsBackStepSeeded";

function hasProgramsDeepLink(url: URL): boolean {
  if (url.pathname !== "/programs") return false;
  if (url.searchParams.has("slug")) return true;
  if (url.searchParams.has("pack")) return true;
  if (url.searchParams.has("program")) return true;
  if (url.searchParams.has("playlist")) return true;
  return Boolean(url.hash && url.hash !== "#");
}

/**
 * If user opens a deep-link like /programs?slug=...#details,
 * seed one extra history step so Back goes to /programs first,
 * then another Back goes to the previous page (e.g. home).
 */
export function ProgramsBackStepGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = new URL(window.location.href);
    if (!hasProgramsDeepLink(current)) return;

    const state = (window.history.state ?? {}) as Record<string, unknown>;
    if (state[BACK_STEP_SEEDED]) return;

    const clean = new URL(current.toString());
    clean.search = "";
    clean.hash = "";

    if (clean.pathname === current.pathname && clean.search === current.search && clean.hash === current.hash) {
      return;
    }

    const cleanState = { ...state, [BACK_STEP_SEEDED]: "base" };
    const deepState = { ...state, [BACK_STEP_SEEDED]: "deep" };

    // 1) Replace current entry with /programs
    window.history.replaceState(cleanState, "", `${clean.pathname}${clean.search}${clean.hash}`);
    // 2) Push deep-link entry back on top (visible URL unchanged)
    window.history.pushState(deepState, "", `${current.pathname}${current.search}${current.hash}`);
  }, []);

  return null;
}
