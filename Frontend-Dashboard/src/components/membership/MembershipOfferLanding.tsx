"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { getAuthorizationHeader, hasSimpleAuthSessionClient, resolveClientApiUrl } from "@/lib/portal-api";
import { OFFER_PLAN_THUMB_THE_KING } from "@/components/programs/offerPlanThumbnails";

const BILLING = "monthly" as const;
const CHECKOUT_AMOUNT = "19.99";
const DISPLAY_PRICE = "£19.99";

const UNLOCK_FEATURES: readonly string[] = [
  "Select 4–5 courses yourself from the catalog",
  "Weekly content and member drops",
  "Full dashboard access",
  "Membership articles and secure video hub",
  "Exclusive membership section",
  "Goals and milestones (full deck)",
  "Syndicate Mode challenges",
];

export function MembershipOfferLanding() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlockMembership = useCallback(async () => {
    setError(null);
    if (!hasSimpleAuthSessionClient()) {
      const params = new URLSearchParams({
        plan: "king",
        billing: BILLING,
        amount: CHECKOUT_AMOUNT,
      });
      router.push(`/signup?${params.toString()}`);
      return;
    }

    setBusy(true);
    try {
      const authHeader = getAuthorizationHeader();
      const response = await fetch(resolveClientApiUrl("/api/auth/checkout/create-session/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          return_base_url: typeof window !== "undefined" ? window.location.origin : undefined,
          selected_plan: "king",
          selected_billing: BILLING,
          selected_amount: CHECKOUT_AMOUNT,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        checkout_url?: string;
        is_unlocked?: boolean;
        already_purchased?: boolean;
        message?: string;
        error?: string;
      };

      const checkoutUrl = typeof payload.checkout_url === "string" ? payload.checkout_url.trim() : "";
      if (response.ok && checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      if (response.ok && (payload.is_unlocked || payload.already_purchased)) {
        router.push("/dashboard?section=resources");
        return;
      }
      const msg =
        typeof payload.message === "string"
          ? payload.message
          : typeof payload.error === "string"
            ? payload.error
            : "Could not start checkout.";
      throw new Error(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }, [router]);

  return (
    <main className="relative px-[clamp(1rem,3.2vw,1.5rem)] pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[15%] h-[280px] w-[280px] rounded-full bg-violet-600/18 blur-[100px] sm:h-[420px] sm:w-[420px]" />
        <div className="absolute right-[-8%] top-[40%] h-[260px] w-[260px] rounded-full bg-fuchsia-500/15 blur-[95px]" />
        <div className="absolute bottom-[0%] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1100px] space-y-10 sm:space-y-12">
        <header className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-200/90 sm:text-[11px]">
            <Crown className="h-3.5 w-3.5 text-amber-200/90" aria-hidden />
            The King · Membership
          </div>
          <h1 className="mt-4 text-balance text-[clamp(1.75rem,4vw+0.5rem,3.1rem)] font-black uppercase leading-tight tracking-[0.08em] text-white drop-shadow-[0_0_24px_rgba(167,139,250,0.35)]">
            Syndicate membership
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
            Your curriculum, your rhythm: choose programs, unlock the full membership library, Syndicate Mode, and the complete
            goals stack. Review what is included, then join to open Stripe checkout when you are signed in—or create an account
            first if you are new.
          </p>
        </header>

        <div
          className={cn(
            "grid gap-6 overflow-hidden rounded-3xl border-2 border-fuchsia-300/50 bg-[linear-gradient(165deg,rgba(24,8,32,0.92),rgba(6,6,12,0.96))] p-4 shadow-[0_0_40px_rgba(217,70,239,0.22)] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:gap-8 sm:p-6 lg:p-8"
          )}
        >
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/15 sm:min-h-[280px] lg:min-h-[320px]">
            <img
              src={OFFER_PLAN_THUMB_THE_KING}
              alt=""
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
              <p className="text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-white/90 sm:text-sm">
                The King tier — built for operators who want the full Syndicate OS, not a single course.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-[0.14em] text-fuchsia-100 sm:text-xl">Details</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/72 sm:text-[15px]">
                One membership unlocks the hub used inside the dashboard: protected articles, secure video drops, Syndicate
                missions, and the full goals experience alongside your selected programs.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center rounded-full border border-emerald-400/50 bg-black/60 px-4 py-1.5 font-mono text-[18px] font-black tabular-nums text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.28)] sm:text-[20px]"
                style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
              >
                {DISPLAY_PRICE}
                <span className="ml-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200/80">/ mo</span>
              </span>
            </div>
            {error ? (
              <div className="rounded-xl border border-rose-500/35 bg-rose-950/30 px-3 py-2 text-[13px] text-rose-100/95">{error}</div>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void unlockMembership()}
              className={cn(
                "w-full rounded-xl border border-fuchsia-300/85 bg-[linear-gradient(135deg,rgba(88,28,135,0.55),rgba(30,27,75,0.95))] px-4 py-3.5 text-[13px] font-black uppercase tracking-[0.16em] text-fuchsia-50 shadow-[0_0_28px_rgba(192,132,252,0.45)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-65 sm:py-4 sm:text-[14px]"
              )}
            >
              {busy ? "Opening checkout…" : "Unlock membership"}
            </button>
            <p className="text-[11px] leading-snug text-white/45 sm:text-xs">
              Signed out? You will continue to signup with this plan prefilled. Already a member? Checkout may confirm instantly
              and send you to the dashboard.
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-black/40 px-4 py-8 sm:px-8 sm:py-10">
          <h2 className="text-center text-[clamp(1.1rem,2vw+0.5rem,1.5rem)] font-black uppercase tracking-[0.12em] text-amber-100/95">
            Unlocked after you join
          </h2>
          <p className="mx-auto mt-2 max-w-[56ch] text-center text-[13px] text-white/60 sm:text-[14px]">
            Once The King membership is active on your account, the following areas unlock inside the Syndicate dashboard.
          </p>
          <ul className="mx-auto mt-8 grid max-w-[720px] gap-3 sm:grid-cols-2 sm:gap-4">
            {UNLOCK_FEATURES.map((line) => (
              <li
                key={line}
                className="flex gap-3 rounded-xl border border-violet-400/25 bg-violet-950/20 px-3 py-2.5 text-left text-[13px] font-medium leading-snug text-white/88 sm:text-[14px]"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
