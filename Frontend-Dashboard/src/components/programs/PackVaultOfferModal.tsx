"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import {
  ReadMoreText,
  VAULT_MODAL_BODY_CLASS,
  VAULT_MODAL_HEADER_CLASS,
  VAULT_MODAL_OVERLAY_CLASS,
  VAULT_MODAL_PANEL_CLASS,
} from "@/components/programs/ReadMoreText";
import type { CheckoutOfferKey, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import {
  isVaultPackKey,
  VAULT_PACK_MODAL_COPY,
  vaultCoursesForPack,
  vaultPackAlaCarteTotal,
} from "@/components/programs/vaultPackCatalog";
import { isVaultOfferUnlocked, resolveOfferActionLabel } from "@/components/programs/vaultUnlock";
import { resolveOfferCardStats } from "@/components/programs/vaultProgramCardStats";

type Props = {
  packOffer: PlanOfferDef | null;
  busyPlan: CheckoutOfferKey | null;
  purchasedSlugs: ReadonlySet<string>;
  accessTier: string | null;
  moneyMasteryActive?: boolean;
  onClose: () => void;
  onDetails: (offer: PlanOfferDef) => void;
  onUnlock: (offer: PlanOfferDef) => void;
  onOpenUnlocked: (offer: PlanOfferDef) => void;
  onExploreTradingModule?: (offer: PlanOfferDef) => void;
};

export function PackVaultOfferModal({
  packOffer,
  busyPlan,
  purchasedSlugs,
  accessTier,
  moneyMasteryActive = false,
  onClose,
  onDetails,
  onUnlock,
  onOpenUnlocked,
  onExploreTradingModule,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!packOffer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    overlayRef.current?.scrollTo({ top: 0 });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [packOffer, onClose]);

  if (!packOffer || !isVaultPackKey(packOffer.plan) || typeof document === "undefined") return null;

  const packKey = packOffer.plan;
  const copy = VAULT_PACK_MODAL_COPY[packKey];
  const courses = vaultCoursesForPack(packKey);
  const alaCarteTotal = vaultPackAlaCarteTotal(packKey);

  const handlePrimary = (offer: PlanOfferDef) => {
    if (isVaultOfferUnlocked(offer, purchasedSlugs, accessTier, moneyMasteryActive)) {
      if (isVaultPackKey(offer.plan)) {
        return;
      }
      onOpenUnlocked(offer);
      return;
    }
    onUnlock(offer);
  };

  const packUnlocked = isVaultOfferUnlocked(packOffer, purchasedSlugs, accessTier, moneyMasteryActive);
  const isTradingPack = packKey === "trading_technical_analysis";

  const handleModuleOpen = (offer: PlanOfferDef) => {
    if (isTradingPack) {
      onExploreTradingModule?.(offer);
      return;
    }
    handlePrimary(offer);
  };

  return createPortal(
    <div
      ref={overlayRef}
      className={VAULT_MODAL_OVERLAY_CLASS}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-pack-modal-title"
      onClick={onClose}
    >
      <div
        className={cn(VAULT_MODAL_PANEL_CLASS, copy.borderClass)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={VAULT_MODAL_HEADER_CLASS}>
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
                Back
              </button>
              <h2
                id="vault-pack-modal-title"
                className="text-[clamp(1.05rem,3.2vw,1.5rem)] font-black uppercase leading-tight tracking-[0.06em] text-white"
              >
                {copy.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "sticky top-0 shrink-0 rounded-lg border bg-black/80 p-2 transition",
                copy.closeBtnClass
              )}
              aria-label="Close vault offers"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ReadMoreText
            text={copy.subtitle}
            maxLines={6}
            className="mt-2 max-w-3xl"
            textClassName="font-mono text-[12px] text-white/72 sm:text-[13px]"
          />
          {alaCarteTotal > Number(packOffer.checkoutAmount) ? (
            <p className="mt-2 max-w-3xl font-mono text-[11px] text-white/50 sm:text-[12px]">
              Full pack {packOffer.displayPrice} — individual total ${alaCarteTotal} if bought separately.
            </p>
          ) : null}
        </div>

        <div className={VAULT_MODAL_BODY_CLASS}>
          <section
            className={cn(
              "mx-auto mb-8 max-w-2xl rounded-2xl border-2 bg-black/40 p-4 sm:p-6",
              copy.borderClass
            )}
          >
            <p className={cn("mb-4 text-center font-mono text-[11px] uppercase tracking-[0.2em]", copy.labelClass)}>
              Full vault — best value
            </p>
            <PlanOfferCard
              offer={packOffer}
              size="large"
              cardKind="pack"
              cardStats={resolveOfferCardStats(packOffer, "pack")}
              busy={busyPlan === packOffer.plan}
              actionLabel={resolveOfferActionLabel(packOffer, purchasedSlugs, accessTier, moneyMasteryActive)}
              onDetails={() => onDetails(packOffer)}
              onOpen={() => handlePrimary(packOffer)}
            />
            {packUnlocked ? (
              <p className="mt-3 text-center font-mono text-[11px] text-emerald-300/90">
                Pack unlocked — choose a module below and tap Open to watch.
              </p>
            ) : null}
          </section>

          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="shrink-0 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              Individual modules ({courses.length})
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="vault-modules-grid">
            {courses.map((offer) => (
              <div key={offer.plan} className="vault-module-cell">
                <PlanOfferCard
                  offer={offer}
                  size="module"
                  cardKind="module"
                  cardStats={resolveOfferCardStats(offer, "module")}
                  busy={busyPlan === offer.plan}
                  actionLabel={
                    isTradingPack
                      ? isVaultOfferUnlocked(offer, purchasedSlugs, accessTier, moneyMasteryActive)
                        ? "View lessons"
                        : "Browse lessons"
                      : resolveOfferActionLabel(offer, purchasedSlugs, accessTier, moneyMasteryActive)
                  }
                  onDetails={() => onDetails(offer)}
                  onOpen={() => handleModuleOpen(offer)}
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
