"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { COOKIE_CONSENT_KEY, readCookieConsent, type CookieConsentValue } from "@/components/CookieConsentBanner";

const GTM_ID = "GTM-WBW2KZV6";

/** Loads GTM only after the visitor accepts analytics cookies. */
export function DeferredGtm() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = (value: CookieConsentValue | null = readCookieConsent()) => {
      setEnabled(value === "accepted");
    };
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) sync();
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentValue>).detail;
      sync(detail ?? readCookieConsent());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("syndicate-cookie-consent", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("syndicate-cookie-consent", onCustom);
    };
  }, []);

  if (!enabled) return null;

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
