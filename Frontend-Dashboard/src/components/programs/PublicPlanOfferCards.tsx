"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import { PlanOfferDetailModal } from "@/components/programs/PlanOfferDetailModal";
import {
  PLAN_OFFERS,
  PLAN_OFFERS_PRIMARY,
  PLAN_OFFERS_VAULT,
  type PlanOfferDef,
  type PlanOfferKey,
} from "@/components/programs/planOfferCatalog";
import { startPlanCheckout } from "@/lib/plan-checkout";

export function PublicPlanOfferCards({
  checkoutReturnPath = "/dashboard?section=programs",
  embedded = false,
  size = "large",
  onAlreadyUnlocked,
  onCheckoutError,
}: {
  checkoutReturnPath?: string;
  embedded?: boolean;
  /** `large` on public /programs and dashboard programs grid; `compact` for tight layouts. */
  size?: "large" | "compact";
  onAlreadyUnlocked?: (plan: PlanOfferKey) => void | Promise<void>;
  onCheckoutError?: (message: string) => void;
} = {}) {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<PlanOfferKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailOffer, setDetailOffer] = useState<PlanOfferDef | null>(null);
  const isLarge = size === "large";

  const joinOffer = useCallback(
    async (offer: PlanOfferDef) => {
      setError(null);
      setBusyPlan(offer.plan);
      try {
        const result = await startPlanCheckout({
          plan: offer.plan,
          billing: offer.billing,
          amount: offer.checkoutAmount,
          postAuthNext: checkoutReturnPath,
        });
        if (result.status === "already_unlocked") {
          await onAlreadyUnlocked?.(offer.plan);
          router.push(checkoutReturnPath);
          return;
        }
        if (result.status === "error") {
          throw new Error(result.message);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not start checkout.";
        if (onCheckoutError) onCheckoutError(msg);
        else setError(msg);
      } finally {
        setBusyPlan(null);
      }
    },
    [checkoutReturnPath, onAlreadyUnlocked, onCheckoutError, router]
  );

  const renderOffer = (offer: PlanOfferDef) => (
    <PlanOfferCard
      key={offer.plan}
      offer={offer}
      size={size}
      busy={busyPlan === offer.plan}
      onDetails={() => setDetailOffer(offer)}
      onOpen={() => {
        if (offer.openHref) {
          router.push(offer.openHref);
          return;
        }
        void joinOffer(offer);
      }}
    />
  );

  return (
    <section
      className={cn(
        "relative mx-auto w-full",
        isLarge ? "max-w-7xl" : "max-w-[1400px]",
        embedded
          ? "px-[var(--fluid-section-p,1rem)] py-6 sm:py-8"
          : "px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8"
      )}
    >
      {error && !onCheckoutError ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">
          {error}
        </div>
      ) : null}
      {isLarge ? (
        <div className="flex w-full flex-col gap-8 lg:gap-10">
          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-8">
            {PLAN_OFFERS_PRIMARY.map(renderOffer)}
          </div>
          <div className="grid w-full grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8">
            {PLAN_OFFERS_VAULT.map(renderOffer)}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-row flex-wrap items-start justify-center gap-2 sm:gap-3">
          {PLAN_OFFERS.map(renderOffer)}
        </div>
      )}
      <PlanOfferDetailModal offer={detailOffer} onClose={() => setDetailOffer(null)} />
    </section>
  );
}
