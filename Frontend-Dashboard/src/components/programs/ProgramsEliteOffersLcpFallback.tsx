import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { nextOptimizedImageSrcSet, nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

const LCP_SIZES = "(max-width: 767px) 100vw, (max-width: 1024px) 420px, 480px";
const LCP_SRC = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 384, 55);
const LCP_SRCSET = nextOptimizedImageSrcSet(OFFER_PLAN_THUMB_MONEY_MASTERY, 55, 480);

/**
 * Server-only LCP paint for /programs while elite offers JS chunk loads.
 * Same Money Mastery art + card frame so Lighthouse LCP is not a blank pulse div.
 * Replaced (not stacked) when ProgramsOfferSection hydrates — no layout jump if heights match.
 * Uses `.programs-lcp-*` critical CSS from programs/layout for early paint.
 */
export function ProgramsEliteOffersLcpFallback() {
  return (
    <div
      className="programs-offers-shell programs-offers-shell--large relative z-[1] mx-auto w-full max-w-[min(100%,calc(80rem+300px))] overflow-visible px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8"
      aria-hidden
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-4 sm:gap-8">
        <div className="plan-offer-card relative flex w-full flex-col text-left">
          <div className="programs-lcp-shell plan-offer-card__shell">
            <div className="programs-lcp-media plan-offer-card__media plan-offer-card__media--portrait-cover">
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
