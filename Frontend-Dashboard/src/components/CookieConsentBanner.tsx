"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";

export const COOKIE_CONSENT_KEY = "syndicate_cookie_consent";

export type CookieConsentValue = "accepted" | "essential";

export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (raw === "accepted" || raw === "essential") return raw;
  } catch {
    // Ignore storage errors.
  }
  return null;
}

export function writeCookieConsent(value: CookieConsentValue): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    // Ignore storage errors.
  }
  window.dispatchEvent(new CustomEvent("syndicate-cookie-consent", { detail: value }));
}

type LegalBlock = { title: string; body: string };
type LegalView = "policy" | "terms";

/** Privacy / policy copy for /#policy */
const POLICY_BLOCKS: LegalBlock[] = [
  {
    title: "Privacy Policy",
    body:
      "We collect account details (such as email), purchase records, and technical data needed to run login, checkout, and course access. We use this to deliver The Syndicate services, prevent abuse, and improve the product. We do not sell your personal data. The above excludes text messaging originator opt-in data and consent; this information will not be shared with any third parties. The Syndicate uses cookies to help keep track of items you put into your shopping cart including when you have abandoned your cart and this information is used to determine when to send cart reminder messages via SMS.",
  },
  {
    title: "Subscription Conditions",
    body:
      "The Knight membership bills monthly while active. Cancel anytime from your account/billing flow; access continues until the paid period ends. Lifetime vault purchases (including Money Mastery) are one-time and are not monthly subscriptions.",
  },
  {
    title: "Refund Policy",
    body:
      "Refund eligibility follows the Refund Policy and Syndicate Guarantee rules shown at checkout and on the Guarantee page. Where a refund applies, it is processed under those documents — not informal promises.",
  },
  {
    title: "Cookies",
    body:
      "Essential cookies keep you signed in, remember currency, and protect checkout/OTP. Marketing/analytics cookies (GTM / Klaviyo) run after you choose Accept all or Reject All. Clear site data in your browser anytime to reset this choice. Affiliate attribution may use a visitor id so referrals can be credited.",
  },
];

/** Terms copy for /#terms — SMS opt-in text is exact. */
const TERMS_BLOCKS: LegalBlock[] = [
  {
    title: "Terms and Conditions",
    body:
      "By opting in you agree to receive recurring automated promotional and personalized marketing text messages from THE SYNDICATE at the number provided. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for assistance. Consent is not a condition of purchase. By opting in you agree to receive recurring automated promotional and personalized marketing text messages from THE SYNDICATE at the number provided. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for assistance. Consent is not a condition of purchase.\n\nWe do not sell, rent, or share your personal information - including your mobile opt-in and SMS consent data - with third parties for advertising purposes.",
  },
  {
    title: "Program Access Terms",
    body:
      "Programs, vaults, and memberships are digital education products for personal use. Access depends on a valid purchase or membership. Content is for educational purposes; results depend on your own application. Misuse, sharing credentials, or reselling content may end access.",
  },
];

function readHashId(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "").trim().toLowerCase();
}

function isPolicyHash(hash: string): boolean {
  return hash === "policy" || hash === "privacy" || hash === "cookies" || hash === "cookie";
}

function isTermsHash(hash: string): boolean {
  return hash === "terms" || hash === "term" || hash === "conditions" || hash === "tos";
}

function isLegalHash(hash: string): boolean {
  return isPolicyHash(hash) || isTermsHash(hash);
}

function legalViewFromHash(hash: string): LegalView | null {
  if (isTermsHash(hash)) return "terms";
  if (isPolicyHash(hash)) return "policy";
  return null;
}

function canonicalizeLegalHash() {
  const hash = readHashId();
  try {
    if (hash === "cookies" || hash === "cookie" || hash === "privacy") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#policy`,
      );
      return;
    }
    if (hash === "term" || hash === "conditions" || hash === "tos") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#terms`,
      );
    }
  } catch {
    /* ignore */
  }
}

function clearLegalHash() {
  if (!isLegalHash(readHashId())) return;
  try {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  } catch {
    /* ignore */
  }
}

/**
 * Bottom overlay for cookies consent + Privacy Policy (/#policy) + Terms (/#terms).
 * Public URLs:
 * - https://the-syndicate.com/#policy
 * - https://the-syndicate.com/#terms
 */
export function CookieConsentBanner() {
  const pathname = usePathname() || "";
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [openedFromHash, setOpenedFromHash] = useState(false);
  const [legalView, setLegalView] = useState<LegalView>("policy");

  const hideOnAuth =
    pathname.startsWith("/syndicate-otp") ||
    pathname.startsWith("/affiliate-login") ||
    pathname.startsWith("/checkout");

  useEffect(() => {
    if (hideOnAuth) {
      setVisible(false);
      return;
    }

    const syncFromHash = () => {
      canonicalizeLegalHash();
      const view = legalViewFromHash(readHashId());
      if (view) {
        setLegalView(view);
        setOpenedFromHash(true);
        setShowDetails(true);
        setVisible(true);
        return true;
      }
      return false;
    };

    if (syncFromHash()) {
      window.addEventListener("hashchange", syncFromHash);
      return () => window.removeEventListener("hashchange", syncFromHash);
    }

    window.addEventListener("hashchange", syncFromHash);

    if (readCookieConsent()) {
      return () => window.removeEventListener("hashchange", syncFromHash);
    }

    const id = window.setTimeout(() => {
      const view = legalViewFromHash(readHashId());
      if (view) {
        setLegalView(view);
        setOpenedFromHash(true);
        setShowDetails(true);
        setVisible(true);
        return;
      }
      setOpenedFromHash(false);
      setLegalView("policy");
      setVisible(true);
    }, 2500);

    return () => {
      window.clearTimeout(id);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [hideOnAuth]);

  // If consent is changed programmatically (ex: auto-consent), hide the banner immediately.
  useEffect(() => {
    if (hideOnAuth) return;
    const onConsent = () => {
      setVisible(false);
      setOpenedFromHash(false);
      setShowDetails(false);
    };
    window.addEventListener("syndicate-cookie-consent", onConsent as EventListener);
    return () => window.removeEventListener("syndicate-cookie-consent", onConsent as EventListener);
  }, [hideOnAuth]);

  if (!visible || hideOnAuth) return null;

  const choose = (value: CookieConsentValue) => {
    writeCookieConsent(value);
    setVisible(false);
    setOpenedFromHash(false);
    clearLegalHash();
  };

  const dismissLegalOnly = () => {
    setVisible(false);
    setOpenedFromHash(false);
    clearLegalHash();
  };

  const alreadyChose = Boolean(readCookieConsent());
  const blocks = legalView === "terms" ? TERMS_BLOCKS : POLICY_BLOCKS;
  const heading = legalView === "terms" ? "Terms and Conditions" : "Privacy & Policy";
  const intro =
    legalView === "terms"
      ? "SMS marketing opt-in, consent rules, and program access terms for The Syndicate."
      : "We use essential cookies to run The Syndicate and marketing/analytics cookies (GTM / Klaviyo) for analytics. Privacy, subscriptions, refunds, and cookies are covered here. Terms and Conditions are at /#terms.";
  const toggleLabel =
    legalView === "terms"
      ? showDetails
        ? "Hide terms"
        : "Read terms"
      : showDetails
        ? "Hide policies"
        : "Read policies";

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[500]",
        "px-0 pb-[max(0px,env(safe-area-inset-bottom))] pt-0",
      )}
      role="dialog"
      aria-label={legalView === "terms" ? "Terms and Conditions" : "Privacy and cookie preferences"}
    >
      <div
        className={cn(
          "flex w-full max-w-none flex-col border-t border-amber-300/45",
          "bg-[linear-gradient(180deg,rgba(8,10,16,0.98),rgba(2,4,10,0.99))]",
          "shadow-[0_-12px_40px_rgba(0,0,0,0.55),0_-2px_24px_rgba(251,191,36,0.12)]",
          showDetails ? "max-h-[min(85dvh,720px)]" : "max-h-[min(42dvh,280px)]",
        )}
      >
        {/* Top bar — title + actions */}
        <div
          className={cn(
            "flex shrink-0 flex-col gap-3 border-b border-amber-300/25",
            "px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4",
          )}
        >
          <div className="min-w-0 flex-1 text-left">
            <p className="font-mono text-[12px] font-black uppercase tracking-[0.2em] text-amber-200 sm:text-[13px]">
              {heading}
            </p>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-zinc-200/92 sm:text-[14px]">
              {intro}
            </p>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="mt-2.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300 underline-offset-2 transition hover:text-cyan-100 hover:underline sm:text-[12px]"
              aria-expanded={showDetails}
            >
              {toggleLabel}
            </button>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch sm:min-w-[11.5rem]">
            {!alreadyChose || !openedFromHash ? (
              <>
                <button
                  type="button"
                  onClick={() => choose("accepted")}
                  className={cn(
                    "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-amber-300/75",
                    "bg-amber-400/18 px-4 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-amber-50",
                    "transition hover:bg-amber-400/28 sm:flex-none",
                  )}
                >
                  Accept all
                </button>
                <button
                  type="button"
                  onClick={() => choose("essential")}
                  className={cn(
                    "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-white/25",
                    "bg-black/55 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-100",
                    "transition hover:border-white/40 hover:text-white sm:flex-none",
                  )}
                >
                  Reject All
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={dismissLegalOnly}
                className={cn(
                  "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-amber-300/75",
                  "bg-amber-400/18 px-4 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-amber-50",
                  "transition hover:bg-amber-400/28 sm:flex-none",
                )}
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Scrollable legal body */}
        {showDetails ? (
          <div
            className={cn(
              "syndicate-policy-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain",
              "px-4 py-4 sm:px-6 sm:py-5",
            )}
          >
            <div
              className={cn(
                "mx-auto grid w-full max-w-none gap-3",
                legalView === "terms" ? "sm:grid-cols-1 xl:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3",
              )}
            >
              {blocks.map((block) => (
                <article
                  key={block.title}
                  className="rounded-lg border border-white/12 bg-black/35 px-3.5 py-3.5 sm:px-4 sm:py-4"
                >
                  <div className="mb-2 flex items-center gap-2 border-b border-amber-300/30 pb-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.65)]"
                      aria-hidden
                    />
                    <h3 className="font-mono text-[12px] font-black uppercase tracking-[0.12em] text-amber-100 sm:text-[13px]">
                      {block.title}
                    </h3>
                  </div>
                  <p className="whitespace-pre-line text-[13px] font-medium leading-relaxed text-zinc-200/95 sm:text-[14px]">
                    {block.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
