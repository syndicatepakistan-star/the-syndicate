"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MOBILE_MAX_WIDTH_PX = 820;

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches;
}

function currentPathWithSearch() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function seedKeyFor(path: string) {
  return `mobile-auth-back-seeded:${path}`;
}

/** Mobile only: system back from login/signup navigates to home (no UI). */
export default function MobileAuthBackToHome() {
  const router = useRouter();

  useEffect(() => {
    if (!isMobileViewport()) return;

    const path = currentPathWithSearch();
    const seedKey = seedKeyFor(path);

    if (sessionStorage.getItem(seedKey) !== "1") {
      window.history.pushState(null, "", "/");
      window.history.pushState(null, "", path);
      sessionStorage.setItem(seedKey, "1");
    }

    const onPopState = () => {
      sessionStorage.removeItem(seedKey);
      router.replace("/");
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      sessionStorage.removeItem(seedKey);
    };
  }, [router]);

  return null;
}
