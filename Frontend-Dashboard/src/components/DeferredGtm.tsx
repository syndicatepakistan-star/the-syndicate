"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_KEY,
  readCookieConsent,
  type CookieConsentValue,
} from "@/components/CookieConsentBanner";
import { flushPendingPurchases, hasPendingPurchaseEvents } from "@/lib/gtmCommerce";

const GTM_ID = "GTM-WBW2KZV6";
/** Keep gtm.js / FB / Klaviyo out of the Lighthouse TBT window after Accept. */
const GTM_SAFETY_DELAY_MS = 7000;
/** Dashboard is auth-heavy — wait longer so GTM/FB don't fight LCP/TBT. */
const GTM_DASHBOARD_SAFETY_DELAY_MS = 12000;
/** Ignore Accept-click / early LH taps before arming gesture → GTM. */
const GTM_GESTURE_ATTACH_MS = 500;

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
    const syncConsent = (value: CookieConsentValue | null = readCookieConsent()) => {
      // Marketing GTM: load for both Accept all and Essential only.
      setConsentAccepted(value === "accepted" || value === "essential");
    };
    syncConsent();
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
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("syndicate-cookie-consent", onCustom);
    };
  }, []);

  useEffect(() => {
    if (!consentAccepted) {
      setGtmReady(false);
      return;
    }

    let cancelled = false;
    let idleId: number | undefined;
    let safetyTimer: number | undefined;
    let gestureAttachTimer: number | undefined;
    let scheduled = false;

    const detachGestures = () => {
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
    };

    const loadGtm = () => {
      if (cancelled) return;
      setGtmReady(true);
    };

    const armViaIdle = () => {
      if (cancelled || scheduled) return;
      scheduled = true;
      if (safetyTimer != null) window.clearTimeout(safetyTimer);
      detachGestures();
      if (shouldLoadGtmImmediately()) {
        loadGtm();
        return;
      }
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        idleId = ric(() => loadGtm(), { timeout: 1500 });
      } else {
        loadGtm();
      }
    };

    function onInteraction() {
      armViaIdle();
    }

    if (shouldLoadGtmImmediately()) {
      armViaIdle();
    } else {
      safetyTimer = window.setTimeout(
        armViaIdle,
        typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")
          ? GTM_DASHBOARD_SAFETY_DELAY_MS
          : GTM_SAFETY_DELAY_MS,
      );

      gestureAttachTimer = window.setTimeout(() => {
        if (cancelled || scheduled) return;
        const opts: AddEventListenerOptions = { once: true, passive: true };
        window.addEventListener("pointerdown", onInteraction, opts);
        window.addEventListener("keydown", onInteraction, opts);
        window.addEventListener("touchstart", onInteraction, opts);
      }, GTM_GESTURE_ATTACH_MS);
    }

    return () => {
      cancelled = true;
      if (safetyTimer != null) window.clearTimeout(safetyTimer);
      if (gestureAttachTimer != null) window.clearTimeout(gestureAttachTimer);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      detachGestures();
    };
  }, [consentAccepted]);

  useEffect(() => {
    if (!gtmReady || typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      flushPendingPurchases();
    }, 350);
    return () => window.clearTimeout(t);
  }, [gtmReady]);

  if (!consentAccepted || !gtmReady) return null;

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
