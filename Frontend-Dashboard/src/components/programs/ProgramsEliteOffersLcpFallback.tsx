import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { nextOptimizedImageSrcSet, nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";
import { formatTempAwareDisplayPrice } from "@/lib/tempTestPricing";

const LCP_SIZES = "(max-width: 767px) 100vw, (max-width: 1024px) 420px, 480px";
/** Same q/w as page preload + PlanOfferCard Money Mastery priority image. */
const LCP_SRC = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 384, 55);
const LCP_SRCSET = nextOptimizedImageSrcSet(OFFER_PLAN_THUMB_MONEY_MASTERY, 55, 480);

/**
 * Server-stable Money Mastery browse card for /programs first paint.
 * Geometry matches PlanOfferCard elite primary (`aspect-[4/3]`, max-h 13.5rem) so
 * swapping to interactive cards after idle does not CLS. Non-interactive (no Unlock).
 * Critical paint aided by `.programs-lcp-*` in programs/layout.tsx.
 */
export function ProgramsEliteOffersLcpFallback({
  markedAsLcpBrowse = false,
}: {
  /** Only the SSR sibling should use `#programs-lcp-browse` (interactive loading clone must not). */
  markedAsLcpBrowse?: boolean;
} = {}) {
  return (
    <div
      id={markedAsLcpBrowse ? "programs-lcp-browse" : undefined}
      className="programs-offers-shell programs-offers-shell--large relative z-[1] mx-auto w-full max-w-[min(100%,calc(80rem+300px))] overflow-visible px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8"
      aria-hidden
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-4 sm:gap-8">
        <article className="plan-offer-card plan-offer-card--amber relative flex w-full flex-col text-left sm:min-h-[34rem]">
          <div className="programs-lcp-shell plan-offer-card__shell relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 border-amber-300/75 bg-black shadow-[0_14px_38px_rgba(0,0,0,0.58)]">
            <div className="relative z-[2] m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-[#04060d] ring-1 ring-black/70">
              <div className="relative flex h-full min-h-0 flex-col gap-2 p-3 sm:p-5">
                <div className="programs-lcp-media plan-offer-card__media relative w-full aspect-[4/3] max-h-[13.5rem] min-h-0 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 sm:max-h-[15rem]">
                  <img
                    src={LCP_SRC}
                    srcSet={LCP_SRCSET}
                    sizes={LCP_SIZES}
                    width={384}
                    height={480}
                    alt=""
                    decoding="sync"
                    fetchPriority="high"
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-cover object-[center_38%] [image-rendering:high-quality]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45" />
                  <div className="absolute right-4 top-4 z-[4]">
                    <span
                      className="plan-offer-card__pack-price-badge plan-offer-card__pack-price-badge--compare inline-flex shrink-0 flex-col items-center justify-center rounded-md border border-amber-300/70 bg-black/80 font-black tabular-nums leading-none tracking-normal text-amber-100"
                      style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
                    >
                      <span className="plan-offer-card__pack-price-badge__compare text-[10px] text-white/50 line-through decoration-white/40 sm:text-[11px]">
                        $555
                      </span>
                      <span className="plan-offer-card__pack-price-badge__amount text-[12px] sm:text-[13px]">
                        {formatTempAwareDisplayPrice("bundle", 333)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="plan-offer-card__info-panel flex shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-amber-300/40 bg-black/50 px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <p className="text-center font-black uppercase tracking-[0.12em] text-[#f5c814] text-[clamp(0.95rem,3.6vw,1.15rem)]">
                    Money Mastery Bundle
                  </p>
                  <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 sm:text-[11px]">
                    /lifetime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
