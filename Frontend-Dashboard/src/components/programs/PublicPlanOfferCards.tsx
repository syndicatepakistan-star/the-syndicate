"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { startPlanCheckout } from "@/lib/plan-checkout";
import { OFFER_PLAN_THUMB_MONEY_MASTERY, OFFER_PLAN_THUMB_THE_KNIGHT } from "@/components/programs/offerPlanThumbnails";

type PlanKey = "bundle" | "king";

const OFFERS: readonly {
  plan: PlanKey;
  title: string;
  imageSrc: string;
  description: string;
  displayPrice: string;
  checkoutAmount: string;
  billing: "monthly";
  ctaLabel: string;
  borderClass: string;
  bgClass: string;
  shadowClass: string;
  titleClass: string;
  priceBorderClass: string;
  priceBgClass: string;
  priceTextClass: string;
  imageGradient: string;
  buttonClass: string;
}[] = [
  {
    plan: "bundle",
    title: "Money Mastery Bundle",
    imageSrc: OFFER_PLAN_THUMB_MONEY_MASTERY,
    description:
      "Unlock all programs at once (all playlist categories and courses). One checkout, instant full program access.",
    displayPrice: "$333",
    checkoutAmount: "333",
    billing: "monthly",
    ctaLabel: "Unlock All Programs",
    borderClass: "border-amber-400/55",
    bgClass: "bg-[#070a12]",
    shadowClass: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
    titleClass: "text-fuchsia-100",
    priceBorderClass: "border-amber-300/70",
    priceBgClass: "bg-amber-950/70",
    priceTextClass: "text-amber-100",
    imageGradient: "from-black/88 via-black/35 to-black/20",
    buttonClass:
      "border-cyan-300/75 bg-[linear-gradient(135deg,rgba(8,51,68,0.92),rgba(6,78,71,0.9))] text-cyan-50",
  },
  {
    plan: "king",
    title: "The Knight",
    imageSrc: OFFER_PLAN_THUMB_THE_KNIGHT,
    description:
      "Membership, Syndicate Mode, goals deck, and hand-picked courses — full dashboard experience.",
    displayPrice: "$19.99",
    checkoutAmount: "19.99",
    billing: "monthly",
    ctaLabel: "Unlock",
    borderClass: "border-violet-400/60",
    bgClass: "bg-[#07060f]",
    shadowClass: "shadow-[0_0_32px_rgba(139,92,246,0.14)]",
    titleClass: "text-violet-100",
    priceBorderClass: "border-violet-300/70",
    priceBgClass: "bg-violet-950/60",
    priceTextClass: "text-violet-100",
    imageGradient: "from-black/88 via-violet-950/35 to-black/25",
    buttonClass:
      "border-violet-300/75 bg-[linear-gradient(135deg,rgba(46,16,78,0.92),rgba(60,24,90,0.9))] text-violet-50",
  },
];

type OfferDef = (typeof OFFERS)[number];

export function PublicPlanOfferCards({
  checkoutReturnPath = "/dashboard?section=programs",
  embedded = false,
  size = "large",
  onAlreadyUnlocked,
  onCheckoutError,
}: {
  checkoutReturnPath?: string;
  embedded?: boolean;
  /** `large` matches dashboard program offer cards; `compact` for tight layouts. */
  size?: "large" | "compact";
  onAlreadyUnlocked?: (plan: PlanKey) => void | Promise<void>;
  onCheckoutError?: (message: string) => void;
} = {}) {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLarge = size === "large";

  const joinOffer = useCallback(
    async (offer: OfferDef) => {
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

  return (
    <section
      className={cn(
        "relative mx-auto w-full",
        isLarge ? "max-w-5xl" : "max-w-[1400px]",
        embedded
          ? "px-[var(--fluid-section-p,1rem)] py-6 sm:py-8"
          : "px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8"
      )}
    >
      {error && !onCheckoutError ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{error}</div>
      ) : null}
      <div
        className={cn(
          "flex w-full justify-center",
          isLarge
            ? "grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10"
            : "flex-row flex-wrap items-start justify-center gap-2 sm:gap-3"
        )}
      >
        {OFFERS.map((offer) => (
          <article
            key={offer.plan}
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border-2",
              offer.borderClass,
              offer.bgClass,
              offer.shadowClass,
              isLarge
                ? "mx-auto w-full max-w-[420px] sm:max-w-none"
                : "w-[min(90vw,272px)] shrink-0 sm:w-[260px] lg:w-[276px]"
            )}
          >
            <div
              className={cn(
                "relative w-full shrink-0 overflow-hidden",
                isLarge ? "aspect-[5/4] sm:aspect-[4/3]" : "aspect-[4/3]"
              )}
            >
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
                className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t", offer.imageGradient)}
                aria-hidden
              />
              {!isLarge ? (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/55" />
              ) : null}
              {!isLarge ? (
                <div className="absolute inset-x-0 bottom-0 z-[2] p-2 text-[clamp(0.65rem,2.4vw,0.85rem)] font-extrabold uppercase leading-tight tracking-[0.06em] text-white">
                  {offer.title}
                </div>
              ) : null}
            </div>
            <div
              className={cn(
                "flex flex-col border-t border-white/10",
                isLarge ? "gap-2 p-3 sm:p-4" : "gap-1 p-2"
              )}
            >
              {isLarge ? (
                <>
                  <div
                    className={cn(
                      "font-black uppercase leading-tight tracking-[0.12em]",
                      offer.titleClass,
                      "text-[11px] sm:text-[13px]"
                    )}
                  >
                    {offer.title}
                  </div>
                  <p className="text-[12px] leading-snug text-cyan-50/90 sm:text-[14px] sm:leading-relaxed">
                    {offer.description}
                  </p>
                  <div className="mt-1 flex flex-col gap-2 border-t border-white/10 pt-2.5">
                    <span
                      className={cn(
                        "w-fit shrink-0 rounded border px-2 py-1 text-[12px] font-black sm:text-[14px]",
                        offer.priceBorderClass,
                        offer.priceBgClass,
                        offer.priceTextClass
                      )}
                    >
                      {offer.displayPrice}
                    </span>
                    <button
                      type="button"
                      disabled={busyPlan === offer.plan}
                      onClick={() => {
                        void joinOffer(offer);
                      }}
                      className={cn(
                        "w-full rounded-md border px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] transition sm:py-3 sm:text-[12px]",
                        "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
                        offer.buttonClass
                      )}
                    >
                      {busyPlan === offer.plan ? "Redirecting…" : offer.ctaLabel}
                    </button>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
