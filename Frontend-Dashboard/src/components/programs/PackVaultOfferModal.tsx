"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { LazyVaultModuleCell } from "@/components/programs/LazyVaultModuleCell";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import {
  VAULT_MODAL_BODY_CLASS,
  VAULT_MODAL_OVERLAY_CLASS,
  VAULT_MODAL_PANEL_CLASS,
  VAULT_MODAL_TOP_BAR_CLASS,
} from "@/components/programs/ReadMoreText";
import { StructuredDescriptionBody } from "@/components/programs/StructuredDescriptionBody";
import { resolveVaultPackStructuredDescription } from "@/components/programs/vaultStructuredDescriptions";
import { isTradingSubmoduleSlug } from "@/components/programs/tradingVaultCatalog";
import type { CheckoutOfferKey, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import {
  isVaultPackKey,
  VAULT_PACK_MODAL_COPY,
  vaultCoursesForPack,
  vaultDisplayGroupsForPack,
  vaultPackAlaCarteTotal,
  vaultPackDisplayOfferCount,
  type VaultPackDisplayGroup,
} from "@/components/programs/vaultPackCatalog";
import { isVaultOfferUnlocked, resolveOfferActionLabel } from "@/components/programs/vaultUnlock";
import { resolveOfferCardStats } from "@/components/programs/vaultProgramCardStats";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type Props = {
  packOffer: PlanOfferDef | null;
  busyPlan: CheckoutOfferKey | null;
  purchasedSlugs: ReadonlySet<string>;
  accessTier: string | null;
  moneyMasteryActive?: boolean;
  onClose: () => void;
  onDetails: (offer: PlanOfferDef) => void;
  onModuleDetails?: (offer: PlanOfferDef) => void;
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
  onModuleDetails,
  onUnlock,
  onOpenUnlocked,
  onExploreTradingModule,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useModalScrollLock(!!packOffer);

  useEffect(() => {
    if (!packOffer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [packOffer?.plan]);

  const packKey = packOffer?.plan;
  const packStructuredDescription = useMemo(
    () => (packKey && isVaultPackKey(packKey) ? resolveVaultPackStructuredDescription(packKey) : ""),
    [packKey],
  );
  const displayGroups = useMemo(
    () => (packKey && isVaultPackKey(packKey) ? vaultDisplayGroupsForPack(packKey) : []),
    [packKey],
  );
  const displayOfferCount = useMemo(() => {
    if (!packKey || !isVaultPackKey(packKey)) return 0;
    if (packKey === "trading_technical_analysis") return vaultCoursesForPack(packKey).length;
    return vaultPackDisplayOfferCount(packKey);
  }, [packKey]);

  const handleModuleOpen = useCallback(
    (offer: PlanOfferDef) => {
      if (isVaultOfferUnlocked(offer, purchasedSlugs, accessTier, moneyMasteryActive)) {
        onOpenUnlocked(offer);
        return;
      }
      onUnlock(offer);
    },
    [accessTier, moneyMasteryActive, onOpenUnlocked, onUnlock, purchasedSlugs],
  );

  const handleModuleDetails = useCallback(
    (offer: PlanOfferDef) => {
      (onModuleDetails ?? onDetails)(offer);
    },
    [onDetails, onModuleDetails],
  );

  if (!packOffer || !isVaultPackKey(packOffer.plan) || typeof document === "undefined") return null;

  const copy = VAULT_PACK_MODAL_COPY[packOffer.plan];
  const alaCarteTotal = vaultPackAlaCarteTotal(packOffer.plan);
  const packUnlocked = isVaultOfferUnlocked(packOffer, purchasedSlugs, accessTier, moneyMasteryActive);
  const isTradingPack = packOffer.plan === "trading_technical_analysis";

  const renderOfferCard = (offer: PlanOfferDef) => {
    const isLesson = isTradingSubmoduleSlug(offer.plan);
    return (
      <PlanOfferCard
        offer={offer}
        size="module"
        cardKind="module"
        cardStats={isLesson ? undefined : resolveOfferCardStats(offer, "module")}
        busy={busyPlan === offer.plan}
        actionLabel={resolveOfferActionLabel(offer, purchasedSlugs, accessTier, moneyMasteryActive)}
        onDetails={() => handleModuleDetails(offer)}
        onOpen={() => handleModuleOpen(offer)}
      />
    );
  };

  const renderGroup = (group: VaultPackDisplayGroup) => {
    if (isTradingPack && group.parent) {
      const parent = group.parent;
      return (
        <LazyVaultModuleCell key={parent.plan} minHeight="clamp(14rem,32vw,18rem)">
          <PlanOfferCard
            offer={parent}
            size="module"
            cardKind="module"
            cardStats={resolveOfferCardStats(parent, "module")}
            busy={busyPlan === parent.plan}
            actionLabel={resolveOfferActionLabel(parent, purchasedSlugs, accessTier, moneyMasteryActive)}
            onDetails={() => {
              if (onExploreTradingModule) onExploreTradingModule(parent);
              else handleModuleDetails(parent);
            }}
            onOpen={() => handleModuleOpen(parent)}
          />
        </LazyVaultModuleCell>
      );
    }

    if (!group.parent) {
      const offer = group.offers[0];
      if (!offer) return null;
      return (
        <LazyVaultModuleCell key={offer.plan} minHeight="clamp(13rem,30vw,17rem)">
          {renderOfferCard(offer)}
        </LazyVaultModuleCell>
      );
    }

    const parent = group.parent;
    const sectionId = `vault-module-section-${parent.plan}`;

    return (
      <section key={parent.plan} id={sectionId} className="scroll-mt-6 space-y-4">
        <LazyVaultModuleCell minHeight="clamp(14rem,32vw,18rem)">
          <PlanOfferCard
            offer={parent}
            size="module"
            cardKind="module"
            cardStats={resolveOfferCardStats(parent, "module")}
            busy={busyPlan === parent.plan}
            actionLabel={resolveOfferActionLabel(parent, purchasedSlugs, accessTier, moneyMasteryActive)}
            onDetails={() => handleModuleDetails(parent)}
            onOpen={() => handleModuleOpen(parent)}
          />
        </LazyVaultModuleCell>

        {group.offers.length > 0 ? (
          <>
            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-white/42">
                {group.offers.length} items
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
            <div className="vault-modules-grid">
              {group.offers.map((offer, lessonIndex) => (
                <LazyVaultModuleCell
                  key={offer.plan}
                  minHeight={lessonIndex < 4 ? "clamp(11rem,26vw,14rem)" : "clamp(10rem,24vw,13rem)"}
                >
                  {renderOfferCard(offer)}
                </LazyVaultModuleCell>
              ))}
            </div>
          </>
        ) : null}
      </section>
    );
  };

  return createPortal(
    <div
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
        <div className={VAULT_MODAL_TOP_BAR_CLASS}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "mb-2 inline-flex items-center gap-1.5 rounded-lg border bg-black/60 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition",
                  copy.closeBtnClass,
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back
              </button>
              <h2
                id="vault-pack-modal-title"
                className="text-[clamp(1.15rem,3.5vw,1.75rem)] font-black uppercase leading-tight tracking-[0.06em] text-white"
              >
                {copy.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "shrink-0 rounded-lg border bg-black/80 p-2 transition",
                copy.closeBtnClass,
              )}
              aria-label="Close vault offers"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className={VAULT_MODAL_BODY_CLASS}>
          <section
            className={cn(
              "mx-auto w-full max-w-2xl rounded-2xl border-2 bg-black/40 p-4 sm:p-6",
              copy.borderClass,
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
              onDetails={() => {
                scrollRef.current?.querySelector("[data-vault-pack-description]")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              onOpen={() => {
                if (packUnlocked) onOpenUnlocked(packOffer);
                else onUnlock(packOffer);
              }}
            />
            {packUnlocked ? (
              <p className="mt-3 text-center font-mono text-[11px] text-emerald-300/90">
                Pack unlocked — choose a module below and tap Open to watch.
              </p>
            ) : null}
          </section>

          {alaCarteTotal > Number(packOffer.checkoutAmount) ? (
            <p
              className={cn(
                "mx-auto mt-6 max-w-3xl text-center font-mono text-[clamp(14px,2.6vw,19px)] font-black uppercase leading-snug tracking-[0.05em]",
                copy.labelClass,
                "drop-shadow-[0_0_22px_currentColor]",
              )}
            >
              One-time purchase — full pack {packOffer.displayPrice} (individual total ${alaCarteTotal} if bought
              separately).
            </p>
          ) : (
            <p
              className={cn(
                "mx-auto mt-6 max-w-3xl text-center font-mono text-[clamp(13px,2.4vw,17px)] font-black uppercase leading-snug tracking-[0.05em] text-white/88",
              )}
            >
              One-time purchase — lifetime access recorded to your dashboard after checkout.
            </p>
          )}

          <div className="mb-5 mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="shrink-0 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              {isTradingPack ? "Modules" : "Individual modules"} ({displayOfferCount})
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div
            className={cn(
              "pb-2",
              isTradingPack ? "vault-modules-grid vault-modules-grid--pair" : "vault-modules-grid",
            )}
          >
            {displayGroups.map((group) => renderGroup(group))}
          </div>

          <div
            data-vault-pack-description
            className="mx-auto mt-10 w-full max-w-none scroll-mt-6 border-t border-white/12 pt-8 sm:mt-12 sm:pt-10"
          >
            <StructuredDescriptionBody text={packStructuredDescription} prominent className="w-full" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
