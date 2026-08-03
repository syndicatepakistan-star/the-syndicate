import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { nextOptimizedImageSrcSet, nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

/** Must match page.tsx Money Mastery LCP preload. */
export const PROGRAMS_LCP_IMAGE_SIZES =
  "(max-width: 640px) 92vw, (max-width: 1024px) 420px, 480px";
export const PROGRAMS_LCP_IMAGE_HREF = nextOptimizedImageUrl(
  OFFER_PLAN_THUMB_MONEY_MASTERY,
  480,
  55,
);
export const PROGRAMS_LCP_IMAGE_SRCSET = nextOptimizedImageSrcSet(
  OFFER_PLAN_THUMB_MONEY_MASTERY,
  55,
  640,
);

/**
 * Server-only Money Mastery browse card for /programs first HTML (LCP).
 * Geometry matches PlanOfferCard elite primary (`aspect-[4/3]`, max-h 13.5rem) — not portrait.
 * Non-interactive; replaced after idle by the unlock island (LCP already recorded).
 */
export function ProgramsMoneyMasteryBrowseCard() {
  return (
    <div className="programs-offers-shell programs-offers-shell--large relative z-[1] mx-auto w-full max-w-[min(100%,calc(80rem+300px))] overflow-visible px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8">
      <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-4 sm:gap-8">
        <article
          id="plan-offer-bundle"
          data-plan-offer="bundle"
          className="plan-offer-card plan-offer-card--amber relative mx-auto flex h-full w-full max-w-none flex-col text-left scroll-mt-32 sm:min-h-[34rem]"
        >
          <div className="plan-offer-card__shell relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 border-amber-300/75 bg-black shadow-[0_14px_38px_rgba(0,0,0,0.58)]">
            <div className="relative z-[3] flex h-full min-h-0 flex-col gap-2 p-3 sm:p-5">
              <div className="plan-offer-card__media relative w-full shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 aspect-[4/3] max-h-[13.5rem] sm:max-h-[15rem]">
                <img
                  src={PROGRAMS_LCP_IMAGE_HREF}
                  srcSet={PROGRAMS_LCP_IMAGE_SRCSET}
                  sizes={PROGRAMS_LCP_IMAGE_SIZES}
                  width={480}
                  height={360}
                  alt="Money Mastery Bundle"
                  decoding="sync"
                  fetchPriority="high"
                  loading="eager"
                  className="absolute inset-0 h-full w-full object-cover object-[center_38%] [image-rendering:high-quality]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45" />
                <div className="absolute right-2 top-2 z-[4] flex flex-col items-end gap-0.5 rounded-md border border-amber-300/50 bg-[#1a1204]/95 px-2 py-1 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.28)]">
                  <span className="text-[0.65rem] font-semibold tabular-nums text-zinc-400 line-through">
                    $555
                  </span>
                  <span className="text-sm font-black tabular-nums leading-none">$333</span>
                </div>
              </div>
              <div className="rounded-xl border border-amber-300/35 bg-amber-950/28 px-3 py-2.5">
                <p className="text-center font-black uppercase tracking-[0.12em] text-[#f5c814] text-[clamp(0.95rem,3.6vw,1.15rem)]">
                  Money Mastery Bundle
                </p>
              </div>
              {/* Height reserve so idle swap to full card (stats + CTAs) does not yank #businessprograms. */}
              <div className="min-h-[12rem] flex-1 rounded-xl bg-white/[0.03] sm:min-h-[14rem]" aria-hidden />
              <div className="flex gap-2 pt-1" aria-hidden>
                <div className="h-10 flex-1 rounded-xl bg-white/[0.06]" />
                <div className="h-10 flex-1 rounded-xl bg-white/[0.06]" />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
