"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const PROGRAMS_BASE = "/programs#syndicate-elite-offers";

function hasProgramsDeepLink(url: URL): boolean {
  if (url.pathname !== "/programs") return false;
  if (url.searchParams.has("slug")) return true;
  if (url.searchParams.has("pack")) return true;
  if (url.searchParams.has("program")) return true;
  if (url.searchParams.has("playlist")) return true;
  const hash = url.hash.replace(/^#/, "").toLowerCase();
  return hash === "details" || hash === "spotlight";
}

function isAboutBlank(): boolean {
  return window.location.protocol === "about:" || window.location.href.startsWith("about:");
}

/**
 * When a pack/program deep link is open, Back must return to the /programs catalog —
 * never skip to /quiz (or another prior page) in one step, and never land on about:blank.
 */
export function ProgramsBackStepGuard() {
  const router = useRouter();
  const deepActiveRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncDeepFlag = () => {
      deepActiveRef.current = hasProgramsDeepLink(new URL(window.location.href));
    };
    syncDeepFlag();

    const goProgramsCatalog = () => {
      deepActiveRef.current = false;
      router.replace(PROGRAMS_BASE);
    };

    const onPopState = () => {
      if (isAboutBlank()) {
        window.location.replace(PROGRAMS_BASE);
        return;
      }

      const url = new URL(window.location.href);

      // Backed away from a deep pack/program URL onto another route (e.g. /quiz).
      if (deepActiveRef.current && url.pathname !== "/programs") {
        goProgramsCatalog();
        return;
      }

      syncDeepFlag();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    deepActiveRef.current = hasProgramsDeepLink(new URL(window.location.href));
  });

  return null;
}
