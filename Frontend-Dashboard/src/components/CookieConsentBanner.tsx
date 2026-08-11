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
      "Essential cookies keep you signed in, remember currency, and protect checkout/OTP. Optional analytics cookies run only after you Accept all. Clear site data in your browser anytime to reset this choice. Affiliate attribution may use a visitor id so referrals can be credited.",
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
        "fixed inset-x-0 bottom-0 z-[500] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2",
        "sm:px-5 sm:pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
      role="dialog"
      aria-label="Privacy and cookie preferences"
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-xl border border-amber-300/40",
          "bg-[linear-gradient(180deg,rgba(8,10,16,0.97),rgba(2,4,10,0.98))] p-4 shadow-[0_0_28px_rgba(251,191,36,0.18)]",
          "sm:flex-row sm:items-start sm:gap-4 sm:p-5",
          showDetails && "max-h-[min(78dvh,640px)]",
        )}
      >
        <div className="min-w-0 flex-1 text-left">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/90">
            Privacy &amp; Policy
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-200/90 sm:text-[14px]">
            We use essential cookies to run The Syndicate and optional analytics cookies to improve
            the site. Privacy, terms, subscriptions, refunds, and cookies are covered here.
          </p>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300 underline-offset-2 transition hover:text-cyan-100 hover:underline"
            aria-expanded={showDetails}
          >
            {showDetails ? "Hide policies" : "Read policies"}
          </button>
          {showDetails ? (
            <div className="mt-2 max-h-[min(42dvh,360px)] space-y-3 overflow-y-auto border-t border-white/10 pt-2 pr-1">
              {POLICY_BLOCKS.map((block) => (
                <div key={block.title}>
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.12em] text-amber-100/95">
                    {block.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-zinc-300/90 sm:text-[13px]">
                    {block.body}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          {!alreadyChose || !openedFromHash ? (
            <>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className={cn(
                  "inline-flex min-h-[42px] flex-1 items-center justify-center rounded-lg border border-amber-300/70",
                  "bg-amber-400/15 px-4 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-amber-100",
                  "transition hover:bg-amber-400/25 sm:flex-none",
                )}
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => choose("essential")}
                className={cn(
                  "inline-flex min-h-[42px] flex-1 items-center justify-center rounded-lg border border-white/20",
                  "bg-black/50 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-200",
                  "transition hover:border-white/35 hover:text-white sm:flex-none",
                )}
              >
                Essential only
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={dismissPolicyOnly}
              className={cn(
                "inline-flex min-h-[42px] flex-1 items-center justify-center rounded-lg border border-amber-300/70",
                "bg-amber-400/15 px-4 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-amber-100",
                "transition hover:bg-amber-400/25 sm:flex-none",
              )}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
