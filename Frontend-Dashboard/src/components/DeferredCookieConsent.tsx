"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Cookie UI is not needed for LCP — mount after a quiet window so Slow 4G
 * keeps bandwidth/main-thread for the hero. GTM still has its own 3s floor.
 */
const CookieConsentBannerLazy = dynamic(
  () => import("@/components/CookieConsentBanner").then((m) => m.CookieConsentBanner),
  { ssr: false },
);

export function DeferredCookieConsent() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;

    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const isMarketing =
      typeof window !== "undefined" &&
      (window.location.pathname === "/" ||
        window.location.pathname === "" ||
        window.location.pathname.startsWith("/programs") ||
        window.location.pathname.startsWith("/quiz"));

    const delayMs = isMarketing ? 3500 : 1200;
    const timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(enable, { timeout: 2000 });
      } else {
        enable();
      }
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  if (!ready) return null;
  return <CookieConsentBannerLazy />;
}
