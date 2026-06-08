"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import type { CheckoutOfferKey, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import { TRADING_SUB_OFFERS } from "@/components/programs/tradingSubOfferCatalog";

type Props = {
  packOffer: PlanOfferDef | null;
  busyPlan: CheckoutOfferKey | null;
  onClose: () => void;
  onDetails: (offer: PlanOfferDef) => void;
  onUnlock: (offer: PlanOfferDef) => void;
};

export function TradingVaultOfferModal({
  packOffer,
  busyPlan,
  onClose,
  onDetails,
  onUnlock,
}: Props) {
  useEffect(() => {
    if (!packOffer) return;
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
  }, [packOffer, onClose]);

  if (!packOffer || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[115] flex items-start justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trading-vault-modal-title"
      onClick={onClose}
    >
      <div
        className="relative my-4 w-full max-w-6xl overflow-hidden rounded-2xl border-2 border-violet-400/45 bg-[#04060d] shadow-[0_0_56px_rgba(168,85,247,0.35),0_0_100px_rgba(139,92,246,0.2)] sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-violet-400/25 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1 pr-2">
            <button
              type="button"
              onClick={onClose}
              className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-violet-400/35 bg-black/60 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-violet-100/90 transition hover:border-violet-300/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back
            </button>
            <h2
              id="trading-vault-modal-title"
              className="text-[clamp(1.1rem,3.5vw,1.65rem)] font-black uppercase leading-tight tracking-[0.06em] text-violet-200"
            >
              Trading Advanced Technical Analysis
            </h2>
            <p className="mt-2 max-w-2xl font-mono text-[12px] leading-relaxed text-white/72 sm:text-[13px]">
              Unlock the full vault in one checkout — or buy individual protocols. Each purchase records to your
              dashboard; curriculum access activates as modules go live.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-violet-400/35 bg-black/80 p-1.5 text-violet-100 transition hover:border-violet-300/60"
            aria-label="Close trading vault offers"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(82dvh,900px)] overflow-y-auto px-3 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto mb-6 max-w-md">
            <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-violet-300/85">
              Full vault — best value
            </p>
            <PlanOfferCard
              offer={packOffer}
              size="large"
              busy={busyPlan === packOffer.plan}
              onDetails={() => onDetails(packOffer)}
              onOpen={() => onUnlock(packOffer)}
            />
          </div>

          <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
            Or unlock individual protocols
          </p>

          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-7">
            {TRADING_SUB_OFFERS.map((offer) => (
              <PlanOfferCard
                key={offer.plan}
                offer={offer}
                size="large"
                busy={busyPlan === offer.plan}
                onDetails={() => onDetails(offer)}
                onOpen={() => onUnlock(offer)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
