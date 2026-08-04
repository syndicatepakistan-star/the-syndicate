"use client";

import dynamic from "next/dynamic";

/**
 * Cookie UI is not needed for LCP — mount after main content hydrates.
 * Keeps consent out of the first JS critical path on marketing pages.
 */
const CookieConsentBannerLazy = dynamic(
  () => import("@/components/CookieConsentBanner").then((m) => m.CookieConsentBanner),
  { ssr: false },
);

export function DeferredCookieConsent() {
  return <CookieConsentBannerLazy />;
}
