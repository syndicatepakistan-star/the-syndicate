"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { startPlanCheckout } from "@/lib/plan-checkout";
import { KNIGHT_PLAN_COMING_SOON, KNIGHT_LAUNCHING_SOON_LABEL, KNIGHT_SUBSCRIPTION_COPY } from "@/components/programs/planOfferCatalog";
import { fetchPortalIdentity } from "@/lib/portal-api";
import { formatKnightSubscriptionRemaining } from "@/lib/syndicateKnightAccess";
import { CyberInsetPanel } from "@/components/cyber/CyberChamferFrames";
import { useCurrency } from "@/contexts/CurrencyContext";

const BILLING = "monthly" as const;
const CHECKOUT_AMOUNT = "19.99";
const DISPLAY_PRICE = "$19.99";

const HERO_OFFER_COPY = KNIGHT_SUBSCRIPTION_COPY;

const HERO_OFFER_DETAIL =
  "This is not passive education — it is a controlled environment for action, discipline, and execution. Hand-pick your courses, run weekly drops and Syndicate Challenges Mode, use the full dashboard, and unlock founder Q&A plus real investment pathways.";

const CYBER_UNLOCK_CTA = cn(
  "membership-unlock-cta relative z-[1] w-full rounded-xl border-[3px] border-[#d4af39] bg-[linear-gradient(180deg,rgba(10,12,28,0.96),rgba(4,6,18,0.99))]",
  "px-5 py-4 font-mono text-[clamp(11px,2.4vw,15px)] font-black uppercase tracking-[0.16em] text-[#d4af39]",
  "[text-shadow:0_0_18px_rgba(212,175,57,0.55),0_0_32px_rgba(250,204,21,0.45),0_1px_2px_rgba(0,0,0,0.85)]",
  "disabled:cursor-wait disabled:opacity-65"
);

export function MembershipKnightHeroOffer({
  checkoutReturnPath = "/dashboard/resources",
}: {
  checkoutReturnPath?: string;
}) {
  const router = useRouter();
  const { localizeLabel } = useCurrency();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [knightRemaining, setKnightRemaining] = useState<string | null>(null);
  const [knightActive, setKnightActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchPortalIdentity().then((user) => {
      if (cancelled) return;
      const active = !!user?.knight_subscription_active;
      setKnightActive(active);
      if (!active) return;
      setKnightRemaining(formatKnightSubscriptionRemaining(user.knight_subscription_expires_at));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const knightCheckoutComingSoon = KNIGHT_PLAN_COMING_SOON && !knightActive;

  const unlockMembership = useCallback(async () => {
    if (knightCheckoutComingSoon) return;
    setError(null);
    setBusy(true);
    try {
      const result = await startPlanCheckout({
        plan: "king",
        billing: BILLING,
        amount: CHECKOUT_AMOUNT,
        postAuthNext: checkoutReturnPath,
      });
      if (result.status === "checkout" || result.status === "auth_required") {
        return;
      }
      if (result.status === "already_unlocked") {
        router.push(checkoutReturnPath);
        return;
      }
      if (result.status === "error") {
        throw new Error(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }, [checkoutReturnPath, knightCheckoutComingSoon, router]);

  return (
    <div className="membership-knight-hero-offer mt-6 w-full space-y-4">
      {knightRemaining ? (
        <p className="font-mono text-sm uppercase tracking-wider text-amber-200/90">
          Knight membership active — {knightRemaining}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-stretch sm:gap-4">
        <CyberInsetPanel variant="blood" className="h-full min-h-[8rem] [&>div]:flex [&>div]:h-full [&>div]:items-center">
          <p className="font-mono text-sm leading-relaxed text-zinc-100/92 sm:text-[0.95rem] sm:leading-relaxed">
            {HERO_OFFER_COPY}
          </p>
        </CyberInsetPanel>
        <CyberInsetPanel variant="cyan" className="h-full min-h-[8rem] [&>div]:flex [&>div]:h-full [&>div]:items-center">
          <p className="font-mono text-sm leading-relaxed text-zinc-100/88 sm:text-[0.95rem] sm:leading-relaxed">
            {HERO_OFFER_DETAIL}
          </p>
        </CyberInsetPanel>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(9.5rem,auto)_1fr] sm:items-stretch">
        <span
          className="inline-flex h-full min-h-[3.25rem] items-center justify-center border-[3px] border-cyan-400/90 bg-black/80 px-4 py-3 font-mono text-xl font-black tabular-nums text-cyan-100 [text-shadow:0_0_16px_rgba(103,232,249,0.55)] shadow-[0_0_28px_rgba(34,211,238,0.35)] sm:text-2xl"
          style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
        >
          {localizeLabel(DISPLAY_PRICE)}
          <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 sm:text-xs">/ mo</span>
        </span>
        <div
          className={cn(
            "membership-unlock-cta-shell min-h-[3.25rem] w-full",
            !knightCheckoutComingSoon && "membership-unlock-cta-shell--public"
          )}
        >
          <button
            type="button"
            disabled={busy || knightCheckoutComingSoon}
            onClick={() => void unlockMembership()}
            className={cn(CYBER_UNLOCK_CTA, "min-h-[3.25rem] w-full", knightCheckoutComingSoon && "cursor-not-allowed opacity-70")}
          >
            {knightCheckoutComingSoon ? KNIGHT_LAUNCHING_SOON_LABEL : busy ? "Opening checkout…" : "Unlock membership"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="min-h-[1.375rem] font-mono text-sm text-rose-300 [text-shadow:0_0_10px_rgba(244,63,94,0.5)]">
          {error}
        </p>
      ) : (
        <p className="min-h-[1.375rem] font-mono text-sm" aria-hidden="true">
          {"\u00a0"}
        </p>
      )}
    </div>
  );
}
