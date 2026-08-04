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

const POLICY_BULLETS = [
  "Essential cookies keep you signed in, remember currency, and protect checkout / OTP flows.",
  "Analytics cookies (optional) help us understand which pages work well — only after you Accept all.",
  "We do not sell your personal data. You can clear site data in your browser anytime to reset this choice.",
  "Affiliate attribution may use a visitor id so referrals can be credited when you complete a purchase.",
] as const;

/** Bottom consent bar — gates analytics until the visitor accepts. Hidden on OTP login/signup. */
export function CookieConsentBanner() {
  const pathname = usePathname() || "";
  const [visible, setVisible] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const hideOnAuth =
    pathname.startsWith("/syndicate-otp") ||
    pathname.startsWith("/affiliate-login") ||
    pathname.startsWith("/checkout");

  useEffect(() => {
    if (hideOnAuth || readCookieConsent()) {
      setVisible(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(id);
  }, [hideOnAuth]);

  if (!visible || hideOnAuth) return null;

  const choose = (value: CookieConsentValue) => {
    writeCookieConsent(value);
    setVisible(false);
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[500] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2",
        "sm:px-5 sm:pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
      role="dialog"
      aria-label="Cookie preferences"
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-xl border border-amber-300/40",
          "bg-[linear-gradient(180deg,rgba(8,10,16,0.97),rgba(2,4,10,0.98))] p-4 shadow-[0_0_28px_rgba(251,191,36,0.18)]",
          "sm:flex-row sm:items-center sm:gap-4 sm:p-5",
        )}
      >
        <div className="min-w-0 flex-1 text-left">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/90">
            Cookies
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-200/90 sm:text-[14px]">
            We use essential cookies to run The Syndicate and optional analytics cookies to improve
            the site. You can change this anytime by clearing site data.
          </p>
          <button
            type="button"
            onClick={() => setShowPolicy((v) => !v)}
            className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300 underline-offset-2 transition hover:text-cyan-100 hover:underline"
            aria-expanded={showPolicy}
          >
            {showPolicy ? "Hide policies" : "Read policies"}
          </button>
          {showPolicy ? (
            <ul className="mt-2 space-y-1.5 border-t border-white/10 pt-2 text-[12px] leading-relaxed text-zinc-300/90 sm:text-[13px]">
              {POLICY_BULLETS.map((line) => (
                <li key={line.slice(0, 28)} className="pl-3 relative before:absolute before:left-0 before:content-['•'] before:text-amber-300/80">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
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
        </div>
      </div>
    </div>
  );
}
