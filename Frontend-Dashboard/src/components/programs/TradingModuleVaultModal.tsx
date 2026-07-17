"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import { PurchaseValueCallout } from "@/components/programs/PurchaseValueCallout";
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
import { isUnlockCartEligible } from "@/lib/unlockCart";
import { resolveOfferCardStats } from "@/components/programs/vaultProgramCardStats";
import {
  tradingSubmoduleOffersForModule,
  type TradingModuleSlug,
} from "@/components/programs/tradingVaultCatalog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type Props = {
  moduleOffer: PlanOfferDef | null;
  busyPlan: CheckoutOfferKey | null;
  purchasedSlugs: ReadonlySet<string>;
  accessTier: string | null;
  moneyMasteryActive?: boolean;
  selectionMode?: boolean;
  isInCart?: (plan: CheckoutOfferKey) => boolean;
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
  selectionMode = false,
  isInCart,
  onClose,
  onDetails,
  onUnlock,
  onOpenUnlocked,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { localizeLabel } = useCurrency();

  useModalScrollLock(!!moduleOffer);

  useEffect(() => {
    if (!moduleOffer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [moduleOffer?.plan]);

  if (!moduleOffer || typeof document === "undefined") return null;

  const moduleSlug = moduleOffer.plan as TradingModuleSlug;
  const copy = VAULT_PACK_MODAL_COPY.trading_technical_analysis;
  const lessons = tradingSubmoduleOffersForModule(moduleSlug);
  const moduleStats = resolveOfferCardStats(moduleOffer, "module");
  const moduleUnlocked = isVaultOfferUnlocked(moduleOffer, purchasedSlugs, accessTier, moneyMasteryActive);

  const resolveActionLabel = (offer: PlanOfferDef) => {
    const unlocked = isVaultOfferUnlocked(offer, purchasedSlugs, accessTier, moneyMasteryActive);
    if (selectionMode && !unlocked && isUnlockCartEligible(offer)) {
      return isInCart?.(offer.plan) ? "Added" : "Add to bucket";
    }
    return resolveOfferActionLabel(offer, purchasedSlugs, accessTier, moneyMasteryActive);
  };

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
          <section className="vault-hero-offer-row mb-3 sm:mb-4">
            <div className="vault-hero-offer-row__card min-w-0">
              <div
                className={cn(
                  "w-fit max-w-full rounded-2xl border-2 bg-black/40 p-2.5 sm:p-3",
                  copy.borderClass,
                )}
              >
                <PlanOfferCard
                  offer={moduleOffer}
                  size="large"
                  cardKind="module"
                  vaultHero
                  cardStats={moduleStats}
                  busy={busyPlan === moduleOffer.plan}
                  inCart={isInCart?.(moduleOffer.plan)}
                  actionLabel={resolveActionLabel(moduleOffer)}
                  onDetails={() => scrollRef.current?.scrollTo({ top: 0, behavior: "auto" })}
                  onOpen={() => (moduleUnlocked ? onClose() : handlePrimary(moduleOffer))}
                />
              </div>
            </div>

            <div className="vault-hero-offer-row__copy flex min-w-0 flex-col justify-center gap-3">
              {moduleUnlocked ? (
                <p className="text-left font-mono text-[11px] text-emerald-300/90">
                  Module unlocked — review the individual lesson details below.
                </p>
              ) : null}
            </div>
          </section>

          {!moduleUnlocked ? (
            <PurchaseValueCallout className="mb-4 sm:mb-5">
              One-time purchase — unlock this module sub-pack for {localizeLabel(moduleOffer.displayPrice)} ·
              individual lessons included · lifetime access
            </PurchaseValueCallout>
          ) : null}

          <div className="mb-3 flex items-center gap-4 sm:mb-4">
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
                  inCart={isInCart?.(offer.plan)}
                  actionLabel={resolveActionLabel(offer)}
                  onDetails={() => onDetails(offer)}
                  onOpen={() => handlePrimary(offer)}
                />
              </div>
            ))}
          </div>

          <div className="mt-10 w-full max-w-none border-t border-white/10 pt-8 font-[family-name:var(--font-body)]">
            <StructuredDescriptionBody
              text={resolveVaultModuleStructuredDescription(moduleOffer)}
              prominent
              omitSections={["what_you_will_learn"]}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
