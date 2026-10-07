"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_KEY,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentValue,
} from "@/components/CookieConsentBanner";
import { flushPendingPurchases, hasPendingPurchaseEvents } from "@/lib/gtmCommerce";

const GTM_ID = "GTM-WBW2KZV6";

/**
 * Earliest GTM (Klaviyo / Meta / Ads inside the container) may start after navigation.
 * Marketing pages use a longer floor so Slow-4G Lighthouse TBT isn't dominated by tags.
 * Checkout / pending purchase still loads immediately.
 */
const GTM_EARLIEST_LOAD_MS = 3000;
const GTM_EARLIEST_LOAD_MARKETING_MS = 8000;

/** Auto-accept consent for first-time visitors who never click the banner. */
const GTM_AUTO_CONSENT_DELAY_MS = 3000;

function isMarketingPath(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname || "";
  return (
    p === "/" ||
    p === "" ||
    p.startsWith("/programs") ||
    p.startsWith("/quiz") ||
    p.startsWith("/our-") ||
    p.startsWith("/what-you-get") ||
    p.startsWith("/membership")
  );
}

function shouldLoadGtmImmediately(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith("/checkout/success")) return true;
  if (window.location.search.includes("playlist_checkout=success")) return true;
  try {
    return hasPendingPurchaseEvents();
  } catch {
    return false;
  }
}

/** ms since navigation start (falls back to 0). */
function msSinceNavigation(): number {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav && typeof nav.startTime === "number") {
      return Math.max(0, performance.now() - nav.startTime);
    }
  } catch {
    /* ignore */
  }
  return Math.max(0, performance.now());
}

/**
 * Consent gate + hard 3s floor before gtm.js (Klaviyo/Meta ride inside GTM).
 * Exception: checkout success / pending purchase → load immediately.
 */
export function DeferredGtm() {
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [gtmReady, setGtmReady] = useState(false);

  useEffect(() => {
    let autoConsentTimer: number | undefined;

    const syncConsent = (value: CookieConsentValue | null = readCookieConsent()) => {
      // GTM loads for both "accepted" and "essential" (Reject All).
      const next = value === "accepted" || value === "essential";
      setConsentAccepted(next);

      if (autoConsentTimer != null && value !== null) {
        window.clearTimeout(autoConsentTimer);
        autoConsentTimer = undefined;
      }
    };
    syncConsent();

    if (readCookieConsent() === null) {
      autoConsentTimer = window.setTimeout(() => {
        if (readCookieConsent() === null) {
          writeCookieConsent("accepted");
        }
      }, GTM_AUTO_CONSENT_DELAY_MS);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) syncConsent();
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentValue>).detail;
      syncConsent(detail ?? readCookieConsent());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("syndicate-cookie-consent", onCustom);
    return () => {
      if (autoConsentTimer != null) window.clearTimeout(autoConsentTimer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("syndicate-cookie-consent", onCustom);
    };
  }, []);

  useEffect(() => {
    if (shouldLoadGtmImmediately()) {
      setGtmReady(true);
      return;
    }

    if (!consentAccepted) {
      setGtmReady(false);
      return;
    }

    const floor = isMarketingPath() ? GTM_EARLIEST_LOAD_MARKETING_MS : GTM_EARLIEST_LOAD_MS;
    const remaining = Math.max(0, floor - msSinceNavigation());
    const t = window.setTimeout(() => {
      setGtmReady(true);
    }, remaining);

    return () => window.clearTimeout(t);
  }, [consentAccepted]);

  useEffect(() => {
    if (!gtmReady || typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      flushPendingPurchases();
    }, 350);
    return () => window.clearTimeout(t);
  }, [gtmReady]);

  if (!gtmReady) return null;

  return (
    <>
      <Script
        id="google-tag-manager"
        strategy="lazyOnload"
        onReady={() => {
          flushPendingPurchases();
        }}
      >{`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}</Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
