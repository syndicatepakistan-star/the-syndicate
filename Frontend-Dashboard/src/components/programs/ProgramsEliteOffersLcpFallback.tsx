import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { nextOptimizedImageSrcSet, nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

const LCP_SIZES = "(max-width: 640px) 92vw, (max-width: 1024px) 420px, 480px";
const LCP_SRC = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 480, 55);
const LCP_SRCSET = nextOptimizedImageSrcSet(OFFER_PLAN_THUMB_MONEY_MASTERY, 55, 640);

/**
 * Server-only LCP paint for /programs while elite offers JS chunk loads.
 * Same Money Mastery art + card frame so Lighthouse LCP is not a blank pulse div.
 * Replaced (not stacked) when ProgramsOfferSection hydrates — no layout jump if heights match.
 */
export function ProgramsEliteOffersLcpFallback() {
  return (
    <div
      className="programs-offers-shell programs-offers-shell--large relative z-[1] mx-auto w-full max-w-[min(100%,calc(80rem+300px))] overflow-visible px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8"
      aria-hidden
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-4 sm:gap-8">
        <div className="plan-offer-card relative flex w-full flex-col text-left">
          <div className="plan-offer-card__shell relative flex min-h-[min(92vh,48rem)] flex-col overflow-hidden rounded-3xl border-2 border-amber-300/75 bg-black shadow-[0_14px_38px_rgba(0,0,0,0.58)] sm:min-h-[min(85vh,52rem)] sm:min-h-[34rem]">
            <div className="plan-offer-card__media plan-offer-card__media--portrait-cover relative bg-[#050508] max-xl:aspect-[4/5] max-xl:min-h-[min(52dvh,16.5rem)] max-xl:max-h-[min(62dvh,22rem)] sm:max-xl:aspect-[3/4] sm:max-xl:min-h-[min(48dvh,20rem)] xl:aspect-[3/4] xl:max-h-[22rem] xl:min-h-[18.5rem]">
              <img
                src={LCP_SRC}
                srcSet={LCP_SRCSET}
                sizes={LCP_SIZES}
                width={480}
                height={600}
                alt=""
                decoding="sync"
                fetchPriority="high"
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover object-[center_38%] [image-rendering:high-quality]"
              />
            </div>
            <div className="border-t border-amber-300/25 px-4 py-3 sm:px-5">
              <p className="text-center font-black uppercase tracking-[0.12em] text-[#f5c814] text-[clamp(0.95rem,3.6vw,1.15rem)]">
                Money Mastery Bundle
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
