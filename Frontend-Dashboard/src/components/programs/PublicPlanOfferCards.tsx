"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import { PlanOfferDetailModal } from "@/components/programs/PlanOfferDetailModal";
import { PackVaultOfferModal } from "@/components/programs/PackVaultOfferModal";
import {
  PLAN_OFFERS,
  PLAN_OFFERS_PRIMARY,
  PLAN_OFFERS_VAULT,
  type CheckoutOfferKey,
  type PlanOfferDef,
} from "@/components/programs/planOfferCatalog";
import { isVaultPackKey } from "@/components/programs/vaultPackCatalog";
import {
  isVaultOfferUnlocked,
  isVaultPackFullyUnlocked,
  resolveOfferActionLabel,
} from "@/components/programs/vaultUnlock";
import { fetchPurchasedPlanSlugs } from "@/lib/plan-purchases-api";
import { startPlanCheckout } from "@/lib/plan-checkout";
import { fetchPortalIdentity, getAuthorizationHeader } from "@/lib/portal-api";
import { focusPlanOfferCardWithRetries } from "@/lib/programCardScroll";
import type { GlobePackKey } from "@/lib/programPlaylistThumbnails";
import { buildVaultModulePlaylistHref, fetchVaultPlaylistMap } from "@/lib/vaultPlaylistMap";

const PACK_SPOTLIGHT: Record<
  PlanOfferDef["accent"],
  { a: string; b: string }
> = {
  amber: { a: "245,158,11", b: "234,88,12" },
  cyan: { a: "34,211,238", b: "14,165,233" },
  pink: { a: "217,70,239", b: "236,72,153" },
  green: { a: "52,211,153", b: "16,185,129" },
  purple: { a: "192,132,252", b: "139,92,246" },
  red: { a: "248,113,113", b: "239,68,68" },
  orange: { a: "251,146,60", b: "249,115,22" },
  blue: { a: "96,165,250", b: "59,130,246" },
};

export function PublicPlanOfferCards({
  checkoutReturnPath = "/dashboard?section=programs",
  embedded = false,
  size = "large",
  highlightPack,
  onAlreadyUnlocked,
  onCheckoutError,
}: {
  checkoutReturnPath?: string;
  embedded?: boolean;
  size?: "large" | "compact";
  highlightPack?: GlobePackKey;
  onAlreadyUnlocked?: (plan: CheckoutOfferKey) => void | Promise<void>;
  onCheckoutError?: (message: string) => void;
} = {}) {
  const router = useRouter();
  const [highlightedPack, setHighlightedPack] = useState<GlobePackKey | null>(null);
  const highlightHandledRef = useRef(false);
  const [busyPlan, setBusyPlan] = useState<CheckoutOfferKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailOffer, setDetailOffer] = useState<PlanOfferDef | null>(null);
  const [vaultPackOffer, setVaultPackOffer] = useState<PlanOfferDef | null>(null);
  const [purchasedSlugs, setPurchasedSlugs] = useState<ReadonlySet<string>>(() => new Set());
  const [accessTier, setAccessTier] = useState<string | null>(null);
  const isLarge = size === "large";

  const reloadUnlockState = useCallback(async () => {
    if (!getAuthorizationHeader()) {
      setPurchasedSlugs(new Set());
      setAccessTier(null);
      return;
    }
    const [slugs, identity] = await Promise.all([fetchPurchasedPlanSlugs(), fetchPortalIdentity()]);
    setPurchasedSlugs(new Set(slugs));
    setAccessTier(identity?.access_tier ?? null);
  }, []);

  useEffect(() => {
    void reloadUnlockState();
  }, [reloadUnlockState]);

  useEffect(() => {
    highlightHandledRef.current = false;
  }, [highlightPack]);

  useEffect(() => {
    if (!highlightPack) return;
    if (highlightHandledRef.current) return;
    highlightHandledRef.current = true;
    setHighlightedPack(highlightPack);
    const cancelScroll = focusPlanOfferCardWithRetries(highlightPack);
    const clearHighlight = window.setTimeout(() => setHighlightedPack(null), 22000);
    return () => {
      cancelScroll();
      window.clearTimeout(clearHighlight);
    };
  }, [highlightPack]);

  const purchasedSet = useMemo(() => purchasedSlugs, [purchasedSlugs]);
  const spotlightActive = highlightedPack != null;
  const activeSpotlightOffer = useMemo(
    () => (highlightedPack ? PLAN_OFFERS.find((offer) => offer.plan === highlightedPack) : undefined),
    [highlightedPack]
  );
  const sectionSpotlightStyle = useMemo(() => {
    if (!activeSpotlightOffer) return undefined;
    const colors = PACK_SPOTLIGHT[activeSpotlightOffer.accent];
    return {
      ["--spotlight-a" as string]: colors.a,
      ["--spotlight-b" as string]: colors.b,
    } as CSSProperties;
  }, [activeSpotlightOffer]);

  const openUnlocked = useCallback(
    async (offer: PlanOfferDef) => {
      try {
        const map = await fetchVaultPlaylistMap();
        const href = buildVaultModulePlaylistHref(offer.plan, map, checkoutReturnPath);
        if (href !== checkoutReturnPath) {
          router.push(href);
          return;
        }
      } catch {
        // Fall back to dashboard/programs when map API is unavailable.
      }
      router.push(checkoutReturnPath);
    },
    [checkoutReturnPath, router]
  );

  const joinOffer = useCallback(
    async (offer: PlanOfferDef) => {
      if (isVaultOfferUnlocked(offer, purchasedSet, accessTier)) {
        void openUnlocked(offer);
        return;
      }
      setError(null);
      setBusyPlan(offer.plan);
      try {
        const result = await startPlanCheckout({
          plan: offer.plan,
          billing: offer.billing,
          amount: offer.checkoutAmount,
          postAuthNext: checkoutReturnPath,
        });
        if (result.status === "already_unlocked") {
          await reloadUnlockState();
          await onAlreadyUnlocked?.(offer.plan);
          router.push(checkoutReturnPath);
          return;
        }
        if (result.status === "error") {
          throw new Error(result.message);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not start checkout.";
        if (onCheckoutError) onCheckoutError(msg);
        else setError(msg);
      } finally {
        setBusyPlan(null);
      }
    },
    [accessTier, checkoutReturnPath, onAlreadyUnlocked, onCheckoutError, openUnlocked, purchasedSet, reloadUnlockState, router]
  );

  const renderOffer = (offer: PlanOfferDef) => {
    const vaultPack = isVaultPackKey(offer.plan) ? offer.plan : null;
    const packUnlocked = vaultPack ? isVaultPackFullyUnlocked(vaultPack, purchasedSet, accessTier) : false;
    const showOpenOnParent =
      offer.openAction === "vault_picker" &&
      (packUnlocked || isVaultOfferUnlocked(offer, purchasedSet, accessTier));

    return (
      <PlanOfferCard
        key={offer.plan}
        offer={offer}
        size={size}
        busy={busyPlan === offer.plan}
        highlighted={highlightedPack === offer.plan}
        actionLabel={
          showOpenOnParent ? "Open" : resolveOfferActionLabel(offer, purchasedSet, accessTier)
        }
        onDetails={() => setDetailOffer(offer)}
        onOpen={() => {
          if (offer.openAction === "vault_picker") {
            setVaultPackOffer(offer);
            return;
          }
          if (offer.openHref) {
            router.push(offer.openHref);
            return;
          }
          if (isVaultOfferUnlocked(offer, purchasedSet, accessTier)) {
            openUnlocked(offer);
            return;
          }
          void joinOffer(offer);
        }}
      />
    );
  };

  return (
    <section
      id="syndicate-elite-offers"
      data-globe-spotlight-active={spotlightActive ? "true" : undefined}
      style={sectionSpotlightStyle}
      className={cn(
        "relative z-[1] mx-auto w-full overflow-visible",
        isLarge ? "max-w-7xl" : "max-w-[1400px]",
        embedded
          ? "px-[var(--fluid-section-p,1rem)] py-6 sm:py-8"
          : "px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8"
      )}
    >
      {error && !onCheckoutError ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">
          {error}
        </div>
      ) : null}
      {isLarge ? (
        <div className="flex w-full flex-col gap-8 overflow-visible lg:gap-10">
          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-stretch gap-6 overflow-visible sm:grid-cols-2 sm:gap-8">
            {PLAN_OFFERS_PRIMARY.map(renderOffer)}
          </div>
          <div className="grid w-full grid-cols-1 items-stretch gap-6 overflow-visible sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8">
            {PLAN_OFFERS_VAULT.map(renderOffer)}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-row flex-wrap items-start justify-center gap-2 sm:gap-3">
          {PLAN_OFFERS.map(renderOffer)}
        </div>
      )}
      <PlanOfferDetailModal offer={detailOffer} onClose={() => setDetailOffer(null)} />
      <PackVaultOfferModal
        packOffer={vaultPackOffer}
        busyPlan={busyPlan}
        purchasedSlugs={purchasedSet}
        accessTier={accessTier}
        onClose={() => setVaultPackOffer(null)}
        onDetails={setDetailOffer}
        onUnlock={(offer) => void joinOffer(offer)}
        onOpenUnlocked={openUnlocked}
      />
    </section>
  );
}
