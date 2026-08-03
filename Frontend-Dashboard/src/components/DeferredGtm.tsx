"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_KEY,
  readCookieConsent,
  type CookieConsentValue,
} from "@/components/CookieConsentBanner";

const GTM_ID = "GTM-WBW2KZV6";
/** Keep trackers out of the Lighthouse / first-paint TBT window. */
const GTM_SAFETY_DELAY_MS = 7000;
/** Ignore the Accept-click (and LH early taps) before arming interaction → GTM. */
const GTM_GESTURE_ATTACH_MS = 500;

/**
 * Consent gate + post-consent delay.
 * - Never loads GTM unless cookie consent === "accepted".
 * - Even with prior "accepted", waits for first real interaction OR ~7s (+ idle)
 *   so gtm.js / FB / Klaviyo stay out of cold-load TBT on /programs and all pages.
 */
export function DeferredGtm() {
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [gtmReady, setGtmReady] = useState(false);

  useEffect(() => {
    const syncConsent = (value: CookieConsentValue | null = readCookieConsent()) => {
      setConsentAccepted(value === "accepted");
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

    // Safety: load after 7s even with no interaction (still post-consent).
    safetyTimer = window.setTimeout(armViaIdle, GTM_SAFETY_DELAY_MS);

    // Attach gesture listeners after a short beat so Accept / early LH taps do not
    // immediately inject GTM on the same turn as consent sync.
    gestureAttachTimer = window.setTimeout(() => {
      if (cancelled || scheduled) return;
      const opts: AddEventListenerOptions = { once: true, passive: true };
      window.addEventListener("pointerdown", onInteraction, opts);
      window.addEventListener("keydown", onInteraction, opts);
      window.addEventListener("touchstart", onInteraction, opts);
    }, GTM_GESTURE_ATTACH_MS);

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

  if (!consentAccepted || !gtmReady) return null;

  return (
    <>
      <Script id="google-tag-manager" strategy="lazyOnload">{`
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
