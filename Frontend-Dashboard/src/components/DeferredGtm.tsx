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
 * Load GTM quickly without requiring a user click.
 * - Target: start loading within ~3–4s of page load (first-time visitors).
 * - Keeps the rest asynchronous via Next Script `afterInteractive`.
 */
const GTM_AUTO_CONSENT_DELAY_MS = 3000;
/** Small grace period so the page finishes initial rendering first. */
const GTM_POST_CONSENT_LOAD_DELAY_MS = 250;

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

/**
 * Consent gate + post-consent delay (site-wide; biggest win on mobile /programs).
 * Loads after either "Accept all" or "Essential only". After consent, waits for
 * interaction OR ~7s (+ idle) before injecting gtm.js.
 * Exception: checkout success / pending purchase → load immediately so purchase tags fire.
 */
export function DeferredGtm() {
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [gtmReady, setGtmReady] = useState(false);

  useEffect(() => {
    // If the user hasn't chosen yet, we auto-start marketing after a short delay.
    // This reduces the tracking gap where users never click the banner.
    let autoConsentTimer: number | undefined;

    const syncConsent = (value: CookieConsentValue | null = readCookieConsent()) => {
      // GTM must load in all cases: both "accepted" and "essential".
      const next = value === "accepted" || value === "essential";
      setConsentAccepted(next);

      // Clear any pending auto-consent as soon as we have a real choice.
      if (autoConsentTimer != null && value !== null) {
        window.clearTimeout(autoConsentTimer);
        autoConsentTimer = undefined;
      }
    };
    syncConsent();

    // Arm auto-consent only for first-time visitors (no stored decision yet).
    if (readCookieConsent() === null) {
      autoConsentTimer = window.setTimeout(() => {
        // Only auto-consent if user still hasn't made a choice.
        if (readCookieConsent() === null) {
          // User requested "no wait for click": treat no-response as accepted.
          // Cookie banner will hide automatically (via existing consent listeners).
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
    // Immediate exception: make sure checkout/purchase tagging isn't blocked by consent.
    if (shouldLoadGtmImmediately()) {
      setGtmReady(true);
      return;
    }

    if (!consentAccepted) {
      setGtmReady(false);
      return;
    }

    // Start GTM shortly after consent becomes accepted (no long idle/gesture waits).
    const t = window.setTimeout(() => {
      setGtmReady(true);
    }, GTM_POST_CONSENT_LOAD_DELAY_MS);

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
        strategy="afterInteractive"
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
