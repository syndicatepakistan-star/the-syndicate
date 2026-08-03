"use client";

import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { nextOptimizedImageSrcSet, nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";
import { requestProgramsOffersInteractive } from "@/hooks/useQuietIdleGate";

const LCP_SIZES = "(max-width: 640px) 92vw, (max-width: 1024px) 420px, 480px";
const LCP_SRC = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 480, 55);
const LCP_SRCSET = nextOptimizedImageSrcSet(OFFER_PLAN_THUMB_MONEY_MASTERY, 55, 640);

type Props = {
  /** When true, Unlock/Details wake the interactive offers island on demand. */
  interactiveTriggers?: boolean;
};

/**
 * Static Money Mastery browse shell for /programs first paint (LCP).
 * Geometry matches PlanOfferCard elite primary: aspect-[4/3] max-h-[13.5rem] — not tall portrait.
 * Stable img: interactive island mounts later; do not remount this art during the LH window.
 */
export function ProgramsEliteOffersLcpFallback({ interactiveTriggers = true }: Props) {
  const wake = () => {
    if (interactiveTriggers) requestProgramsOffersInteractive();
  };

  return (
    <div className="programs-offers-shell programs-offers-shell--large relative z-[1] mx-auto w-full max-w-[min(100%,calc(80rem+300px))] overflow-visible px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8">
      <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-4 sm:gap-8">
        <article className="plan-offer-card relative flex w-full flex-col text-left">
          <div className="plan-offer-card__shell relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 border-amber-300/75 bg-black shadow-[0_14px_38px_rgba(0,0,0,0.58)] sm:min-h-[34rem]">
            <span className="relative z-[2] m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-[#04060d] ring-1 ring-black/70">
              <div className="relative z-[3] flex h-full min-h-0 flex-col gap-2 p-3 sm:p-5">
                <div className="plan-offer-card__media relative aspect-[4/3] max-h-[13.5rem] w-full min-h-0 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 sm:max-h-[15rem]">
                  <img
                    src={LCP_SRC}
                    srcSet={LCP_SRCSET}
                    sizes={LCP_SIZES}
                    width={480}
                    height={360}
                    alt="Money Mastery Bundle"
                    decoding="async"
                    fetchPriority="high"
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-cover object-[center_38%] [image-rendering:high-quality]"
                  />
                </div>
                <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 pt-1">
                  <h2 className="text-center font-black uppercase tracking-[0.12em] text-[#f5c814] text-[clamp(0.95rem,3.6vw,1.15rem)]">
                    Money Mastery Bundle
                  </h2>
                  <p className="text-center font-mono text-[11px] leading-snug text-white/65 sm:text-[12px]">
                    Lifetime vault access — unlock when you are ready.
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.setItem("programs_pending_offer", "details:bundle");
                        } catch {
                          /* ignore */
                        }
                        wake();
                      }}
                      className="rounded-lg border border-white/25 bg-black/60 px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white/90 transition hover:border-white/45"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.setItem("programs_pending_offer", "unlock:bundle");
                        } catch {
                          /* ignore */
                        }
                        wake();
                      }}
                      className="rounded-lg border border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffe9a3] shadow-[0_0_20px_rgba(202,167,36,0.45)] transition hover:shadow-[0_0_28px_rgba(202,167,36,0.7)]"
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              </div>
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}
