"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "programs-back-step-v3";

function hasProgramsDeepLink(url: URL): boolean {
  if (url.pathname !== "/programs") return false;
  if (url.searchParams.has("slug")) return true;
  if (url.searchParams.has("pack")) return true;
  if (url.searchParams.has("program")) return true;
  if (url.searchParams.has("playlist")) return true;
  // Detail hashes only — bare #syndicate-elite-offers is the base programs view.
  const hash = url.hash.replace(/^#/, "").toLowerCase();
  return hash === "details" || hash === "spotlight";
}

function isAboutBlank(): boolean {
  return window.location.protocol === "about:" || window.location.href.startsWith("about:");
}

/**
 * Deep pack/program URLs must not use raw history.replaceState + pushState with a wiped
 * Next.js history state — that inserts about:blank into the Back stack.
 *
 * Seed a real App Router /programs entry, then re-open the deep link so:
 *   deep link → Back → /programs → Back → previous page
 */
export function ProgramsBackStepGuard() {
  const router = useRouter();
  const seedingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const recoverBlank = () => {
      if (!isAboutBlank()) return;
      window.location.replace("/programs#syndicate-elite-offers");
    };

    recoverBlank();
    window.addEventListener("popstate", recoverBlank);
    return () => window.removeEventListener("popstate", recoverBlank);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = new URL(window.location.href);
    if (current.pathname !== "/programs") return;

    if (!hasProgramsDeepLink(current)) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }

    if (seedingRef.current) return;

    const deepPath = `${current.pathname}${current.search}${current.hash}`;
    if (sessionStorage.getItem(SESSION_KEY) === deepPath) return;

    seedingRef.current = true;
    sessionStorage.setItem(SESSION_KEY, deepPath);

    router.replace("/programs");
    const t = window.setTimeout(() => {
      router.push(deepPath);
    }, 40);

    return () => window.clearTimeout(t);
  }, [router]);

  return null;
}
