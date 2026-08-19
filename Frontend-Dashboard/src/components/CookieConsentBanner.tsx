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

/** Full legal copy shown inside the same bottom overlay (Klaviyo /#policy). */
const POLICY_BLOCKS: { title: string; body: string }[] = [
  {
    title: "Privacy Policy",
    body:
      "We collect account details (such as email), purchase records, and technical data needed to run login, checkout, and course access. We use this to deliver The Syndicate services, prevent abuse, and improve the product. We do not sell your personal data.",
  },
  {
    title: "Terms of Use",
    body:
      "Programs, vaults, and memberships are digital education products for personal use. Access depends on a valid purchase or membership. Content is for educational purposes; results depend on your own application. Misuse, sharing credentials, or reselling content may end access.",
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

function readHashId(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "").trim().toLowerCase();
}

function isPolicyHash(hash: string): boolean {
  return hash === "policy" || hash === "privacy" || hash === "cookies" || hash === "cookie";
}

function canonicalizePolicyHash() {
  const hash = readHashId();
  if (hash === "cookies" || hash === "cookie" || hash === "privacy") {
    try {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#policy`,
      );
    } catch {
      /* ignore */
    }
  }
}

/**
 * Single bottom overlay for cookies consent + Privacy & Policy.
 * Public URL for Klaviyo / legal: https://the-syndicate.com/#policy
 * (No separate home-page policy section.)
 */
export function CookieConsentBanner() {
  const pathname = usePathname() || "";
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [openedFromHash, setOpenedFromHash] = useState(false);

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
      canonicalizePolicyHash();
      if (isPolicyHash(readHashId())) {
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
      if (isPolicyHash(readHashId())) {
        setOpenedFromHash(true);
        setShowDetails(true);
        setVisible(true);
        return;
      }
      setOpenedFromHash(false);
      setVisible(true);
    }, 2500);

    return () => {
      window.clearTimeout(id);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [hideOnAuth]);

  if (!visible || hideOnAuth) return null;

  const choose = (value: CookieConsentValue) => {
    writeCookieConsent(value);
    setVisible(false);
    setOpenedFromHash(false);
    if (isPolicyHash(readHashId())) {
      try {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      } catch {
        /* ignore */
      }
    }
  };

  const dismissPolicyOnly = () => {
    setVisible(false);
    setOpenedFromHash(false);
    if (isPolicyHash(readHashId())) {
      try {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      } catch {
        /* ignore */
      }
    }
  };

  const alreadyChose = Boolean(readCookieConsent());

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[500]",
        "px-0 pb-[max(0px,env(safe-area-inset-bottom))] pt-0",
      )}
      role="dialog"
      aria-label="Privacy and cookie preferences"
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
              Privacy &amp; Policy
            </p>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-zinc-200/92 sm:text-[14px]">
              We use essential cookies to run The Syndicate and marketing/analytics cookies (GTM / Klaviyo) for
              analytics. Privacy, terms, subscriptions, refunds, and cookies are covered here.
            </p>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="mt-2.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300 underline-offset-2 transition hover:text-cyan-100 hover:underline sm:text-[12px]"
              aria-expanded={showDetails}
            >
              {showDetails ? "Hide policies" : "Read policies"}
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
                  onClick={() => choose("accepted")}
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
                onClick={dismissPolicyOnly}
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

        {/* Scrollable policy body */}
        {showDetails ? (
          <div
            className={cn(
              "syndicate-policy-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain",
              "px-4 py-4 sm:px-6 sm:py-5",
            )}
          >
            <div className="mx-auto grid w-full max-w-none gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {POLICY_BLOCKS.map((block) => (
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
                  <p className="text-[13px] font-medium leading-relaxed text-zinc-200/95 sm:text-[14px]">
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
