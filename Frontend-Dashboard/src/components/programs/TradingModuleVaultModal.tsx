"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import {
  VAULT_MODAL_BODY_CLASS,
  VAULT_MODAL_OVERLAY_CLASS,
  VAULT_MODAL_PANEL_CLASS,
  VAULT_MODAL_TOP_BAR_CLASS,
} from "@/components/programs/ReadMoreText";
import { StructuredDescriptionBody } from "@/components/programs/StructuredDescriptionBody";
import { resolveVaultModuleStructuredDescription } from "@/components/programs/vaultStructuredDescriptions";
import type { CheckoutOfferKey, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import { VAULT_PACK_MODAL_COPY } from "@/components/programs/vaultPackCatalog";
import { isVaultOfferUnlocked, resolveOfferActionLabel } from "@/components/programs/vaultUnlock";
import { resolveOfferCardStats } from "@/components/programs/vaultProgramCardStats";
import {
  tradingSubmoduleOffersForModule,
  type TradingModuleSlug,
} from "@/components/programs/tradingVaultCatalog";

type Props = {
  moduleOffer: PlanOfferDef | null;
  busyPlan: CheckoutOfferKey | null;
  purchasedSlugs: ReadonlySet<string>;
  accessTier: string | null;
  moneyMasteryActive?: boolean;
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
  moneyMasteryActive = false,
  onClose,
  onDetails,
  onUnlock,
  onOpenUnlocked,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moduleOffer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [moduleOffer, onClose]);

  if (!moduleOffer || typeof document === "undefined") return null;

  const moduleSlug = moduleOffer.plan as TradingModuleSlug;
  const copy = VAULT_PACK_MODAL_COPY.trading_technical_analysis;
  const lessons = tradingSubmoduleOffersForModule(moduleSlug);
  const moduleStats = resolveOfferCardStats(moduleOffer, "module");
  const submoduleCount = moduleStats?.mode === "module" ? moduleStats.lessonCount : lessons.length;
  const moduleUnlocked = isVaultOfferUnlocked(moduleOffer, purchasedSlugs, accessTier, moneyMasteryActive);

  const handlePrimary = (offer: PlanOfferDef) => {
    if (isVaultOfferUnlocked(offer, purchasedSlugs, accessTier, moneyMasteryActive)) {
      onOpenUnlocked(offer);
      return;
    }
    onUnlock(offer);
  };

  return createPortal(
    <div
      className={cn(VAULT_MODAL_OVERLAY_CLASS, "z-[116]")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trading-module-modal-title"
      onClick={onClose}
    >
      <div
        className={cn(VAULT_MODAL_PANEL_CLASS, copy.borderClass)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={VAULT_MODAL_TOP_BAR_CLASS}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "mb-2 inline-flex items-center gap-1.5 rounded-lg border bg-black/60 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition",
                  copy.closeBtnClass
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back to pack
              </button>
              <h2
                id="trading-module-modal-title"
                className="text-[clamp(1.15rem,3.5vw,1.75rem)] font-black uppercase leading-tight tracking-[0.06em] text-white"
              >
                {moduleOffer.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "shrink-0 rounded-lg border bg-black/80 p-2 transition",
                copy.closeBtnClass
              )}
              aria-label="Close module lessons"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className={VAULT_MODAL_BODY_CLASS}>
          <div className="w-full max-w-none font-[family-name:var(--font-body)]">
            <StructuredDescriptionBody
              text={resolveVaultModuleStructuredDescription(moduleOffer.title, "trading_technical_analysis")}
              prominent
            />
            <p className="mt-5 font-mono text-[12px] leading-relaxed text-white/60 sm:text-[13px]">
              One-time purchase — unlock the full module for {moduleOffer.displayPrice} or buy individual lessons at $9
              each. Lifetime access recorded to your dashboard after checkout.
            </p>
          </div>

          <section
            className={cn(
              "mx-auto mb-8 mt-8 max-w-2xl rounded-2xl border-2 bg-black/40 p-4 sm:p-6",
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
              cardStats={moduleStats}
              busy={busyPlan === moduleOffer.plan}
              actionLabel={resolveOfferActionLabel(moduleOffer, purchasedSlugs, accessTier, moneyMasteryActive)}
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

          <div className="vault-modules-grid pb-2">
            {lessons.map((offer) => (
              <div key={offer.plan} className="vault-module-cell">
                <PlanOfferCard
                  offer={offer}
                  size="module"
                  cardKind="module"
                  cardStats={resolveOfferCardStats(offer, "module")}
                  busy={busyPlan === offer.plan}
                  actionLabel={resolveOfferActionLabel(offer, purchasedSlugs, accessTier, moneyMasteryActive)}
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
