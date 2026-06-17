"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import type { CheckoutOfferKey, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import { VAULT_PACK_MODAL_COPY } from "@/components/programs/vaultPackCatalog";
import { isVaultOfferUnlocked, resolveOfferActionLabel } from "@/components/programs/vaultUnlock";
import {
  tradingSubmodulesForModule,
  tradingSubmoduleOffersForModule,
  type TradingModuleSlug,
} from "@/components/programs/tradingVaultCatalog";

type Props = {
  moduleOffer: PlanOfferDef | null;
  busyPlan: CheckoutOfferKey | null;
  purchasedSlugs: ReadonlySet<string>;
  accessTier: string | null;
  onClose: () => void;
  onDetails: (offer: PlanOfferDef) => void;
  onUnlock: (offer: PlanOfferDef) => void;
  onOpenUnlocked: (offer: PlanOfferDef) => void;
};

export function TradingModuleVaultModal({
  moduleOffer,
  busyPlan,
  purchasedSlugs,
  accessTier,
  onClose,
  onDetails,
  onUnlock,
  onOpenUnlocked,
}: Props) {
  useEffect(() => {
    if (!moduleOffer) return;
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
  }, [moduleOffer, onClose]);

  if (!moduleOffer || typeof document === "undefined") return null;

  const moduleSlug = moduleOffer.plan as TradingModuleSlug;
  const copy = VAULT_PACK_MODAL_COPY.trading_technical_analysis;
  const lessons = tradingSubmoduleOffersForModule(moduleSlug);
  const submoduleCount = tradingSubmodulesForModule(moduleSlug).length;
  const moduleUnlocked = isVaultOfferUnlocked(moduleOffer, purchasedSlugs, accessTier);

  const handlePrimary = (offer: PlanOfferDef) => {
    if (isVaultOfferUnlocked(offer, purchasedSlugs, accessTier)) {
      onOpenUnlocked(offer);
      return;
    }
    onUnlock(offer);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[116] flex items-start justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trading-module-modal-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative my-4 w-full max-w-[90rem] overflow-hidden rounded-2xl border-2 bg-[#04060d] sm:my-0",
          copy.borderClass
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1 pr-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "mb-3 inline-flex items-center gap-1.5 rounded-lg border bg-black/60 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition",
                copy.closeBtnClass
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to pack
            </button>
            <h2
              id="trading-module-modal-title"
              className="text-[clamp(1.05rem,3.2vw,1.5rem)] font-black uppercase leading-tight tracking-[0.06em] text-white"
            >
              {moduleOffer.title}
            </h2>
            <p className="mt-2 max-w-2xl font-mono text-[12px] leading-relaxed text-white/72 sm:text-[13px]">
              {submoduleCount} lessons inside this module. Unlock the full module for {moduleOffer.displayPrice} or buy
              individual lessons at $9 each.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn("shrink-0 rounded-lg border bg-black/80 p-1.5 transition", copy.closeBtnClass)}
            aria-label="Close module lessons"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(82dvh,900px)] overflow-y-auto px-3 py-5 sm:px-6 sm:py-7">
          <section
            className={cn(
              "mx-auto mb-8 max-w-2xl rounded-2xl border-2 bg-black/40 p-4 sm:p-6",
              copy.borderClass
            )}
          >
            <p className={cn("mb-4 text-center font-mono text-[11px] uppercase tracking-[0.2em]", copy.labelClass)}>
              Full module — all {submoduleCount} lessons
            </p>
            <PlanOfferCard
              offer={moduleOffer}
              size="large"
              cardKind="module"
              busy={busyPlan === moduleOffer.plan}
              actionLabel={resolveOfferActionLabel(moduleOffer, purchasedSlugs, accessTier)}
              onDetails={() => onDetails(moduleOffer)}
              onOpen={() => (moduleUnlocked ? onClose() : handlePrimary(moduleOffer))}
            />
            {moduleUnlocked ? (
              <p className="mt-3 text-center font-mono text-[11px] text-emerald-300/90">
                Module unlocked — open any lesson below.
              </p>
            ) : null}
          </section>

          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="shrink-0 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              Individual lessons ({lessons.length})
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="vault-modules-grid">
            {lessons.map((offer) => (
              <div key={offer.plan} className="vault-module-cell">
                <PlanOfferCard
                  offer={offer}
                  size="module"
                  cardKind="module"
                  busy={busyPlan === offer.plan}
                  actionLabel={resolveOfferActionLabel(offer, purchasedSlugs, accessTier)}
                  onDetails={() => onDetails(offer)}
                  onOpen={() => handlePrimary(offer)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
