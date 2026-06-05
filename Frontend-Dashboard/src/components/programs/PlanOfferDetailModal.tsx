"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { PlanOfferAccent, PlanOfferDef } from "@/components/programs/planOfferCatalog";

type Props = {
  offer: PlanOfferDef | null;
  onClose: () => void;
};

const DETAIL_THEMES: Record<
  PlanOfferAccent,
  {
    modal: string;
    closeBtn: string;
    title: string;
    featureBorder: string;
    check: string;
  }
> = {
  amber: {
    modal: "border-cyan-400/45 shadow-[0_0_48px_rgba(34,211,238,0.22),inset_0_0_80px_rgba(168,85,247,0.08)]",
    closeBtn: "border-cyan-400/35 text-cyan-100 hover:border-cyan-300/60",
    title: "text-cyan-300",
    featureBorder: "border-cyan-400/55",
    check: "border-cyan-400/90 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.45)]",
  },
  cyan: {
    modal: "border-lime-400/40 shadow-[0_0_48px_rgba(163,230,53,0.18)]",
    closeBtn: "border-lime-400/35 text-lime-100 hover:border-lime-300/60",
    title: "text-lime-300",
    featureBorder: "border-lime-400/55",
    check: "border-lime-400/90 text-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.45)]",
  },
  pink: {
    modal: "border-fuchsia-400/50 shadow-[0_0_56px_rgba(236,72,153,0.35),0_0_100px_rgba(217,70,239,0.2),inset_0_0_80px_rgba(236,72,153,0.1)]",
    closeBtn: "border-fuchsia-400/40 text-fuchsia-100 hover:border-fuchsia-300/65",
    title: "text-fuchsia-300",
    featureBorder: "border-fuchsia-400/60",
    check: "border-fuchsia-400/90 text-fuchsia-300 shadow-[0_0_12px_rgba(236,72,153,0.55)]",
  },
  green: {
    modal: "border-emerald-400/50 shadow-[0_0_56px_rgba(52,211,153,0.35),0_0_100px_rgba(16,185,129,0.2),inset_0_0_80px_rgba(52,211,153,0.1)]",
    closeBtn: "border-emerald-400/40 text-emerald-100 hover:border-emerald-300/65",
    title: "text-emerald-300",
    featureBorder: "border-emerald-400/60",
    check: "border-emerald-400/90 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.55)]",
  },
};

function OfferDetailCheck({ accent }: { accent: PlanOfferAccent }) {
  const theme = DETAIL_THEMES[accent];
  return (
    <span
      className={cn(
        "plan-offer-detail__check flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
        theme.check
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

  const theme = DETAIL_THEMES[offer.accent];

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
          theme.modal
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute right-3 top-3 z-10 rounded-lg border bg-black/80 p-1.5 transition",
            theme.closeBtn
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
              theme.title
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
                    theme.featureBorder
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
