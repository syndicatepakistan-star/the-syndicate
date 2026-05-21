"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { PlanOfferDef } from "@/components/programs/planOfferCatalog";

type Props = {
  offer: PlanOfferDef | null;
  onClose: () => void;
};

function OfferDetailCheck({ accent }: { accent: PlanOfferDef["accent"] }) {
  return (
    <span
      className={cn(
        "plan-offer-detail__check flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
        accent === "amber"
          ? "border-cyan-400/90 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.45)]"
          : "border-lime-400/90 text-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.45)]"
      )}
      aria-hidden
    >
      <Check className="h-3 w-3 stroke-[3]" />
    </span>
  );
}

export function PlanOfferDetailModal({ offer, onClose }: Props) {
  useEffect(() => {
    if (!offer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [offer, onClose]);

  if (!offer || typeof document === "undefined") return null;

  const isAmber = offer.accent === "amber";

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-offer-detail-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "plan-offer-detail-modal plan-offer-detail-modal--scroll relative w-full max-w-md overflow-hidden rounded-2xl border-2 bg-black",
          isAmber
            ? "border-cyan-400/45 shadow-[0_0_48px_rgba(34,211,238,0.22),inset_0_0_80px_rgba(168,85,247,0.08)]"
            : "border-lime-400/40 shadow-[0_0_48px_rgba(163,230,53,0.18)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute right-3 top-3 z-10 rounded-lg border bg-black/80 p-1.5 transition",
            isAmber
              ? "border-cyan-400/35 text-cyan-100 hover:border-cyan-300/60"
              : "border-lime-400/35 text-lime-100 hover:border-lime-300/60"
          )}
          aria-label="Close offer details"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="max-h-[min(88dvh,680px)] overflow-y-auto px-6 py-8 sm:px-8 sm:py-10">
          <h2
            id="plan-offer-detail-title"
            className={cn(
              "plan-offer-detail__title text-[clamp(2rem,7vw,3.25rem)] font-black uppercase leading-[0.92] tracking-[0.04em]",
              isAmber ? "text-cyan-300" : "text-lime-300"
            )}
          >
            {offer.detailTitle}
          </h2>

          <div className="mt-5 flex flex-wrap items-end gap-x-2 gap-y-1">
            <span className="font-mono text-lg text-white/40 line-through decoration-white/35 sm:text-xl">
              {offer.comparePrice}
            </span>
            <span
              className="font-mono text-[clamp(2.5rem,9vw,4rem)] font-black leading-none tracking-tight text-white"
              style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
            >
              {offer.displayPrice}
            </span>
            <span className="pb-1 font-mono text-sm text-white/55 sm:text-base">{offer.billingLabel}</span>
          </div>

          <p className="mt-5 max-w-prose font-mono text-[13px] leading-relaxed text-white/78 sm:text-[15px]">
            {offer.detailDescription}
          </p>

          <ul className="mt-7 space-y-3" role="list">
            {offer.detailFeatures.map((feature) => (
              <li key={feature}>
                <div
                  className={cn(
                    "plan-offer-detail__feature flex items-center gap-3 rounded-full border px-4 py-2.5",
                    isAmber ? "border-cyan-400/55" : "border-lime-400/55"
                  )}
                >
                  <OfferDetailCheck accent={offer.accent} />
                  <span className="min-w-0 font-mono text-[12px] leading-snug text-white/88 sm:text-[14px]">
                    {feature}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
