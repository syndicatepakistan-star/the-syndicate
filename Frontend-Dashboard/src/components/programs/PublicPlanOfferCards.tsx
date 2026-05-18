"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { startPlanCheckout } from "@/lib/plan-checkout";
import { OFFER_PLAN_THUMB_MONEY_MASTERY, OFFER_PLAN_THUMB_THE_KING } from "@/components/programs/offerPlanThumbnails";

type PlanKey = "bundle" | "king";

const AMBER_THEME = {
  title: "text-white",
  dominantBorder: "border-amber-300/70",
} as const;

const VIOLET_THEME = {
  title: "text-white",
  dominantBorder: "border-fuchsia-300/70",
} as const;

const OFFERS: readonly {
  plan: PlanKey;
  title: string;
  imageSrc: string;
  displayPrice: string;
  checkoutAmount: string;
  billing: "monthly";
  theme: typeof AMBER_THEME | typeof VIOLET_THEME;
}[] = [
  {
    plan: "bundle",
    title: "Money Mastery",
    imageSrc: OFFER_PLAN_THUMB_MONEY_MASTERY,
    displayPrice: "$333",
    checkoutAmount: "333",
    billing: "monthly",
    theme: AMBER_THEME,
  },
  {
    plan: "king",
    title: "The King",
    imageSrc: OFFER_PLAN_THUMB_THE_KING,
    displayPrice: "$19.99",
    checkoutAmount: "19.99",
    billing: "monthly",
    theme: VIOLET_THEME,
  },
];

type OfferDef = (typeof OFFERS)[number];

export function PublicPlanOfferCards() {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinOffer = useCallback(
    async (offer: OfferDef) => {
      setError(null);
      setBusyPlan(offer.plan);
      try {
        const result = await startPlanCheckout({
          plan: offer.plan,
          billing: offer.billing,
          amount: offer.checkoutAmount,
          postAuthNext: "/dashboard?section=programs",
        });
        if (result.status === "already_unlocked") {
          router.push("/dashboard?section=programs");
          return;
        }
        if (result.status === "error") {
          throw new Error(result.message);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start checkout.");
      } finally {
        setBusyPlan(null);
      }
    },
    [router]
  );

  return (
    <section className="relative mx-auto w-full max-w-[1400px] px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8">
      {error ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{error}</div>
      ) : null}
      <div className="flex flex-row flex-wrap items-start justify-center gap-2 sm:justify-center sm:gap-3">
        {OFFERS.map((offer) => {
          const theme = offer.theme;
          return (
            <article
              key={offer.plan}
              className={cn(
                "flex w-[min(90vw,272px)] shrink-0 flex-col overflow-hidden rounded-xl border-2 bg-[#070a12] sm:w-[260px] lg:w-[276px]",
                theme.dominantBorder
              )}
            >
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
                <img
                  src={offer.imageSrc}
                  alt=""
                  loading={offer.plan === "bundle" ? "eager" : "lazy"}
                  fetchPriority={offer.plan === "bundle" ? "high" : undefined}
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                  className="h-full w-full object-cover object-center [image-rendering:high-quality] [backface-visibility:hidden]"
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-t opacity-70",
                    offer.plan === "bundle"
                      ? "from-amber-900/55 via-orange-950/25 to-transparent"
                      : "from-violet-900/55 via-fuchsia-950/25 to-transparent"
                  )}
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/55" />
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 z-[2] p-2 text-[clamp(0.65rem,2.4vw,0.85rem)] font-extrabold uppercase leading-tight tracking-[0.06em]",
                    theme.title
                  )}
                >
                  {offer.title}
                </div>
              </div>
              <div className="flex flex-col gap-1 border-t border-white/10 p-2">
                <div className="text-left text-[9px] font-semibold uppercase leading-tight tracking-[0.1em] text-white/65">
                  Syndicate plan
                </div>
                <button
                  type="button"
                  disabled={busyPlan === offer.plan}
                  onClick={() => {
                    void joinOffer(offer);
                  }}
                  className={cn(
                    "w-full rounded-md border px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] transition sm:text-[10px]",
                    "disabled:cursor-wait disabled:opacity-70",
                    offer.plan === "bundle"
                      ? "border-amber-300/75 bg-[linear-gradient(135deg,rgba(90,70,12,0.5),rgba(28,22,6,0.95))] text-amber-50 hover:brightness-110"
                      : "border-fuchsia-300/75 bg-[linear-gradient(135deg,rgba(60,20,80,0.55),rgba(18,12,28,0.95))] text-fuchsia-50 hover:brightness-110"
                  )}
                >
                  {busyPlan === offer.plan ? "Loading…" : "JOIN NOW"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
