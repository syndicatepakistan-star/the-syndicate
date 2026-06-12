"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import type { CheckoutOfferKey, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import {
  isVaultPackKey,
  VAULT_PACK_MODAL_COPY,
  vaultCoursesForPack,
  vaultPackAlaCarteTotal,
} from "@/components/programs/vaultPackCatalog";
import { isVaultOfferUnlocked, resolveOfferActionLabel } from "@/components/programs/vaultUnlock";
import { fetchVaultPlaylistMap, vaultPlaylistIdForPlan } from "@/lib/vaultPlaylistMap";

type Props = {
  packOffer: PlanOfferDef | null;
  busyPlan: CheckoutOfferKey | null;
  purchasedSlugs: ReadonlySet<string>;
  accessTier: string | null;
  onClose: () => void;
  onDetails: (offer: PlanOfferDef) => void;
  onUnlock: (offer: PlanOfferDef) => void;
  onOpenUnlocked: (offer: PlanOfferDef) => void;
};

export function PackVaultOfferModal({
  packOffer,
  busyPlan,
  purchasedSlugs,
  accessTier,
  onClose,
  onDetails,
  onUnlock,
  onOpenUnlocked,
}: Props) {
  const [playlistMapReady, setPlaylistMapReady] = useState(false);
  const [linkedModuleCount, setLinkedModuleCount] = useState(0);

  useEffect(() => {
    if (!packOffer) {
      setPlaylistMapReady(false);
      setLinkedModuleCount(0);
      return;
    }
    setPlaylistMapReady(false);
    let cancelled = false;
    void fetchVaultPlaylistMap()
      .then((map) => {
        if (cancelled) return;
        const courses = vaultCoursesForPack(packOffer.plan);
        const linked = courses.filter((offer) => vaultPlaylistIdForPlan(offer.plan, map) != null).length;
        setLinkedModuleCount(linked);
        setPlaylistMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setPlaylistMapReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [packOffer]);

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

  if (!packOffer || !isVaultPackKey(packOffer.plan) || typeof document === "undefined") return null;

  const packKey = packOffer.plan;
  const copy = VAULT_PACK_MODAL_COPY[packKey];
  const courses = vaultCoursesForPack(packKey);
  const alaCarteTotal = vaultPackAlaCarteTotal(packKey);

  const handlePrimary = (offer: PlanOfferDef) => {
    if (isVaultOfferUnlocked(offer, purchasedSlugs, accessTier)) {
      if (isVaultPackKey(offer.plan)) {
        return;
      }
      onOpenUnlocked(offer);
      return;
    }
    onUnlock(offer);
  };

  const packUnlocked = isVaultOfferUnlocked(packOffer, purchasedSlugs, accessTier);

  return createPortal(
    <div
      className="fixed inset-0 z-[115] flex items-start justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-pack-modal-title"
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
              Back
            </button>
            <h2
              id="vault-pack-modal-title"
              className="text-[clamp(1.1rem,3.5vw,1.65rem)] font-black uppercase leading-tight tracking-[0.06em] text-white"
            >
              {copy.title}
            </h2>
            <p className="mt-2 max-w-2xl font-mono text-[12px] leading-relaxed text-white/72 sm:text-[13px]">
              {copy.subtitle}
              {alaCarteTotal > Number(packOffer.checkoutAmount) ? (
                <span className="mt-1 block text-white/50">
                  Full pack {packOffer.displayPrice} — individual total ${alaCarteTotal} if bought separately.
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn("shrink-0 rounded-lg border bg-black/80 p-1.5 transition", copy.closeBtnClass)}
            aria-label="Close vault offers"
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
              Full vault — best value
            </p>
            <PlanOfferCard
              offer={packOffer}
              size="large"
              cardKind="pack"
              busy={busyPlan === packOffer.plan}
              actionLabel={resolveOfferActionLabel(packOffer, purchasedSlugs, accessTier)}
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
          {playlistMapReady && linkedModuleCount < courses.length ? (
            <p className="mb-4 text-center font-mono text-[11px] leading-relaxed text-amber-200/75">
              {linkedModuleCount === 0
                ? "Stream playlists are not linked yet — add vault_plan_slug in Django admin for each module."
                : `${linkedModuleCount} of ${courses.length} modules have stream playlists linked.`}
            </p>
          ) : null}

          <div className="vault-modules-grid">
            {courses.map((offer) => (
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
