"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PlanOfferCard } from "@/components/programs/PlanOfferCard";
import {
  PLAN_OFFERS,
  PLAN_OFFERS_PRIMARY,
  PLAN_OFFERS_VAULT,
  isPlanOfferComingSoon,
  isKnightPlanSlug,
  type CheckoutOfferKey,
  type PlanOfferDef,
} from "@/components/programs/planOfferCatalog";
import { isTradingModuleSlug } from "@/components/programs/tradingVaultCatalog";
import { isVaultPackKey } from "@/components/programs/vaultPackCatalog";
import {
  isVaultOfferUnlocked,
  isVaultPackFullyUnlocked,
  isVaultParentPackOpenable,
  resolveOfferActionLabel,
} from "@/components/programs/vaultUnlock";
import { fetchPurchasedPlanSlugs } from "@/lib/plan-purchases-api";
import { startPlanCheckout } from "@/lib/plan-checkout";
import { fetchPortalIdentity, getAuthorizationHeader } from "@/lib/portal-api";
import { focusPlanOfferCardWithRetries } from "@/lib/programCardScroll";
import { historyReplaceUrl } from "@/lib/historyUrl";
import { resolveOfferCardStats } from "@/components/programs/vaultProgramCardStats";
import type { GlobePackKey } from "@/lib/programPlaylistThumbnails";
import {
  clearPlanOfferDetailsHash,
  GLOBE_PACK_KEYS,
  readProgramDetailsHash,
  writePlanOfferDetailsHash,
  writePlanOfferSpotlightHash,
} from "@/lib/programPlaylistThumbnails";
import { fetchStreamPlaylists } from "@/lib/streaming-api";
import {
  buildVaultModulePlaylistHref,
  fetchVaultPlaylistMap,
  parseDashboardPlaylistId,
} from "@/lib/vaultPlaylistMap";
import { navigateToAlreadyUnlockedProgram } from "@/lib/programUnlockFlow";
import { UnlockCartProvider, useUnlockCart } from "@/components/programs/UnlockCartContext";
import { checkoutUnlockCartItems } from "@/lib/unlockCartCheckout";
import { isUnlockCartEligible } from "@/lib/unlockCart";
import toast from "react-hot-toast";
import { useDeferredChrome } from "@/hooks/useDeferredChrome";

const PlanOfferDetailModal = dynamic(
  () => import("@/components/programs/PlanOfferDetailModal").then((m) => m.PlanOfferDetailModal),
  { ssr: false },
);
const PackVaultOfferModal = dynamic(
  () => import("@/components/programs/PackVaultOfferModal").then((m) => m.PackVaultOfferModal),
  { ssr: false },
);
const TradingModuleVaultModal = dynamic(
  () => import("@/components/programs/TradingModuleVaultModal").then((m) => m.TradingModuleVaultModal),
  { ssr: false },
);
const UnlockCartPanel = dynamic(
  () => import("@/components/programs/UnlockCartPanel").then((m) => m.UnlockCartPanel),
  { ssr: false },
);
const Toaster = dynamic(() => import("react-hot-toast").then((m) => m.Toaster), { ssr: false });

function LazyVaultOffersRow({
  offers,
  renderOffer,
}: {
  offers: readonly PlanOfferDef[];
  renderOffer: (offer: PlanOfferDef) => ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px", threshold: 0.01 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={hostRef}
      className="plan-offers-vault-grid grid w-full grid-cols-1 items-stretch gap-5 overflow-visible sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-12"
    >
      {visible
        ? offers.map((offer) => (
            <div key={offer.plan} className="plan-offers-vault-cell">
              {renderOffer(offer)}
            </div>
          ))
        : offers.map((offer) => (
            <div
              key={offer.plan}
              className="plan-offers-vault-cell min-h-[18rem] animate-pulse rounded-2xl bg-white/[0.04]"
              aria-hidden
            />
          ))}
    </div>
  );
}

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

export function PublicPlanOfferCards(props: Parameters<typeof PublicPlanOfferCardsInner>[0] = {}) {
  if (props.shellHosted) {
    return <PublicPlanOfferCardsInner {...props} />;
  }
  return (
    <UnlockCartProvider>
      <PublicPlanOfferCardsInner {...props} />
    </UnlockCartProvider>
  );
}

function PublicPlanOfferCardsInner({
  checkoutReturnPath = "/dashboard/programs",
  embedded = false,
  shellHosted = false,
  size = "large",
  highlightPack,
  omitKnight = false,
  knightOnly = false,
  onAlreadyUnlocked,
  onCheckoutError,
  onOpenPlaylist,
}: {
  checkoutReturnPath?: string;
  embedded?: boolean;
  shellHosted?: boolean;
  size?: "large" | "compact";
  highlightPack?: GlobePackKey;
  /** Hide The Knight from the primary row (programs page moves it below). */
  omitKnight?: boolean;
  /** Render only The Knight card. */
  knightOnly?: boolean;
  onAlreadyUnlocked?: (plan: CheckoutOfferKey) => void | Promise<void>;
  onCheckoutError?: (message: string) => void;
  /** Dashboard programs: open lesson view immediately (router.push alone is a no-op when URL unchanged). */
  onOpenPlaylist?: (playlistId: number) => void;
} = {}) {
  const router = useRouter();
  const [highlightedPack, setHighlightedPack] = useState<GlobePackKey | null>(null);
  const highlightHandledRef = useRef(false);
  const [busyPlan, setBusyPlan] = useState<CheckoutOfferKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailOffer, setDetailOffer] = useState<PlanOfferDef | null>(null);
  const [vaultPackOffer, setVaultPackOffer] = useState<PlanOfferDef | null>(null);
  const [tradingModuleOffer, setTradingModuleOffer] = useState<PlanOfferDef | null>(null);
  const [cartCheckoutBusy, setCartCheckoutBusy] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [purchasedSlugs, setPurchasedSlugs] = useState<ReadonlySet<string>>(() => new Set());
  const [accessTier, setAccessTier] = useState<string | null>(null);
  const [moneyMasteryActive, setMoneyMasteryActive] = useState(false);
  const [knightSubscriptionActive, setKnightSubscriptionActive] = useState(false);
  const packModalOpenedRef = useRef(false);
  const isLarge = size === "large";
  const unlockCart = useUnlockCart();
  const showUnlockChrome = useDeferredChrome(
    !shellHosted &&
      (unlockCart.count > 0 || unlockCart.selectionMode || cartCheckoutBusy || !!cartError),
  );

  const reloadUnlockState = useCallback(async () => {
    if (!getAuthorizationHeader()) {
      setPurchasedSlugs(new Set());
      setAccessTier(null);
      setMoneyMasteryActive(false);
      setKnightSubscriptionActive(false);
      return;
    }
    const [slugs, identity] = await Promise.all([fetchPurchasedPlanSlugs(), fetchPortalIdentity()]);
    setPurchasedSlugs(new Set(slugs));
    setAccessTier(identity?.access_tier ?? null);
    setMoneyMasteryActive(!!identity?.money_mastery_active);
    setKnightSubscriptionActive(!!identity?.knight_subscription_active);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void reloadUnlockState();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [reloadUnlockState]);

  useEffect(() => {
    if (!purchasedSlugs.size) return;
    unlockCart.pruneOwnedItems({ planSlugs: purchasedSlugs });
  }, [purchasedSlugs, unlockCart.pruneOwnedItems]);

  useEffect(() => {
    const onCheckoutConfirmed = () => {
      void reloadUnlockState();
    };
    window.addEventListener("plan-checkout-confirmed", onCheckoutConfirmed);
    window.addEventListener("playlist-checkout-confirmed", onCheckoutConfirmed);
    return () => {
      window.removeEventListener("plan-checkout-confirmed", onCheckoutConfirmed);
      window.removeEventListener("playlist-checkout-confirmed", onCheckoutConfirmed);
    };
  }, [reloadUnlockState]);

  useEffect(() => {
    highlightHandledRef.current = false;
    packModalOpenedRef.current = false;
  }, [highlightPack]);

  // Strict URL behavior: if the deep-link params disappear, close any open offer modals.
  useEffect(() => {
    if (highlightPack) return;
    packModalOpenedRef.current = false;
    setVaultPackOffer(null);
    setDetailOffer(null);
    setTradingModuleOffer(null);
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

  // `?slug=money-mastery#details` / `?pack=bundle#details` → open pack details modal (Klaviyo).
  useEffect(() => {
    if (!highlightPack) return;

    const openFromHash = () => {
      if (!readProgramDetailsHash()) return false;
      const offer = PLAN_OFFERS.find((item) => item.plan === highlightPack);
      if (!offer) return false;
      packModalOpenedRef.current = true;
      setVaultPackOffer(null);
      setDetailOffer(offer);
      writePlanOfferDetailsHash(highlightPack);
      return true;
    };

    if (openFromHash()) return;

    if (packModalOpenedRef.current) return;
    const offer = PLAN_OFFERS.find((item) => item.plan === highlightPack);
    if (!offer || offer.openAction !== "vault_picker") return;

    // Spotlight hash is the only time we auto-open the vault browser.
    // (Without this, just `?slug=` would unexpectedly open details.)
    if (typeof window !== "undefined") {
      const h = window.location.hash.replace(/^#/, "").toLowerCase();
      if (h !== "syndicate-elite-offers") return;
    }

    packModalOpenedRef.current = true;
    setVaultPackOffer(offer);
  }, [highlightPack]);

  useEffect(() => {
    if (!highlightPack) return;
    const onHash = () => {
      if (!readProgramDetailsHash()) return;
      const offer = PLAN_OFFERS.find((item) => item.plan === highlightPack);
      if (!offer) return;
      setVaultPackOffer(null);
      setDetailOffer(offer);
      writePlanOfferDetailsHash(highlightPack);
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, [highlightPack]);

  const purchasedSet = useMemo(() => purchasedSlugs, [purchasedSlugs]);
  const spotlightActive = highlightedPack != null;

  const exitPackDeepLink = useCallback(() => {
    setVaultPackOffer(null);
    setDetailOffer(null);
    setTradingModuleOffer(null);
    setHighlightedPack(null);
    packModalOpenedRef.current = false;
    historyReplaceUrl("/programs#syndicate-elite-offers");
    router.replace("/programs#syndicate-elite-offers");
  }, [router]);

  useEffect(() => {
    if (!spotlightActive) return;
    document.body.classList.add("globe-program-spotlight");
    return () => document.body.classList.remove("globe-program-spotlight");
  }, [spotlightActive]);

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
        const [map, streamPlaylists] = await Promise.all([
          fetchVaultPlaylistMap(),
          fetchStreamPlaylists().catch(() => []),
        ]);
        const href = buildVaultModulePlaylistHref(
          offer.plan,
          map,
          checkoutReturnPath,
          {
            purchasedSlugs: purchasedSet,
            accessTier,
            moneyMasteryActive,
          },
          streamPlaylists,
        );
        if (href !== checkoutReturnPath) {
          setVaultPackOffer(null);
          const playlistId = parseDashboardPlaylistId(href);
          if (playlistId && onOpenPlaylist) {
            onOpenPlaylist(playlistId);
            return;
          }
          router.push(href);
          return;
        }
      } catch {
        // Fall back to dashboard/programs when map API is unavailable.
      }
      router.push(checkoutReturnPath);
    },
    [accessTier, checkoutReturnPath, moneyMasteryActive, onOpenPlaylist, purchasedSet, router]
  );

  const joinOfferDirect = useCallback(
    async (offer: PlanOfferDef) => {
      if (isKnightPlanSlug(String(offer.plan))) {
        if (isPlanOfferComingSoon(offer)) return;
      } else if (
        isPlanOfferComingSoon(offer) &&
        !isVaultOfferUnlocked(offer, purchasedSet, accessTier, moneyMasteryActive)
      ) {
        return;
      }
      if (isVaultOfferUnlocked(offer, purchasedSet, accessTier, moneyMasteryActive)) {
        void openUnlocked(offer);
        return;
      }
      setError(null);
      setCartError(null);
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
          if (onAlreadyUnlocked) {
            await onAlreadyUnlocked(offer.plan);
          } else {
            await navigateToAlreadyUnlockedProgram({
              plan: offer.plan,
              postAuthNext: checkoutReturnPath,
            });
          }
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
    [accessTier, moneyMasteryActive, checkoutReturnPath, onAlreadyUnlocked, onCheckoutError, openUnlocked, purchasedSet, reloadUnlockState]
  );

  const requestUnlock = useCallback(
    (offer: PlanOfferDef) => {
      if (isVaultOfferUnlocked(offer, purchasedSet, accessTier, moneyMasteryActive)) {
        void openUnlocked(offer);
        return;
      }
      if (!isUnlockCartEligible(offer)) {
        void joinOfferDirect(offer);
        return;
      }
      const added = unlockCart.addItem(offer);
      if (added) {
        toast.success(`Added to unlock bucket — ${offer.title}`, { duration: 2800 });
      } else {
        toast(`Already in unlock bucket — ${offer.title}`, { duration: 2200 });
        unlockCart.setPanelExpanded(true);
      }
    },
    [accessTier, joinOfferDirect, moneyMasteryActive, openUnlocked, purchasedSet, unlockCart]
  );

  const checkoutUnlockCart = useCallback(async () => {
    if (cartCheckoutBusy) return;
    const cartItems = unlockCart.items;
    if (!cartItems.length) return;
    setCartError(null);
    setError(null);
    setCartCheckoutBusy(true);
    try {
      const result = await checkoutUnlockCartItems(cartItems, {
        postAuthNext: checkoutReturnPath,
        playlistReturnPath: "/programs",
      });
      if (result.status === "already_unlocked") {
        await reloadUnlockState();
        unlockCart.clearCart();
        return;
      }
      if (result.status === "error") {
        throw new Error(result.message);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start cart checkout.";
      setCartError(msg);
      if (onCheckoutError) onCheckoutError(msg);
    } finally {
      setCartCheckoutBusy(false);
    }
  }, [cartCheckoutBusy, checkoutReturnPath, onCheckoutError, reloadUnlockState, unlockCart]);

  const joinOffer = requestUnlock;

  const renderOffer = (offer: PlanOfferDef) => {
    const vaultPack = isVaultPackKey(offer.plan) ? offer.plan : null;
    const packPlaylistOpenable =
      vaultPack != null &&
      (isVaultParentPackOpenable(vaultPack, purchasedSet, accessTier, moneyMasteryActive) ||
        isVaultPackFullyUnlocked(vaultPack, purchasedSet, accessTier, moneyMasteryActive));
    const comingSoon = isKnightPlanSlug(String(offer.plan))
      ? isPlanOfferComingSoon(offer)
      : isPlanOfferComingSoon(offer) &&
        !isVaultOfferUnlocked(offer, purchasedSet, accessTier, moneyMasteryActive);
    const unlocked = isVaultOfferUnlocked(offer, purchasedSet, accessTier, moneyMasteryActive);
    const inCart = unlockCart.isInCart(offer.plan);
    const bucketSelection =
      unlockCart.selectionMode && !unlocked && !comingSoon && isUnlockCartEligible(offer);
    const bucketActionLabel = bucketSelection ? (inCart ? "Added" : "Add to bucket") : undefined;

    return (
      <PlanOfferCard
        key={offer.plan}
        offer={offer}
        size={size}
        cardKind={vaultPack ? "pack" : undefined}
        cardStats={vaultPack ? resolveOfferCardStats(offer, "pack") : undefined}
        busy={busyPlan === offer.plan}
        highlighted={highlightedPack === offer.plan}
        comingSoon={comingSoon}
        inCart={inCart}
        priorityImage={isLarge && !knightOnly && offer.plan === "bundle"}
        actionLabel={
          bucketActionLabel ??
          (offer.openAction === "vault_picker" && vaultPack
            ? packPlaylistOpenable
              ? "Open"
              : offer.openLabel
            : resolveOfferActionLabel(
                offer,
                purchasedSet,
                accessTier,
                moneyMasteryActive,
                knightSubscriptionActive,
              ))
        }
        onDetails={() => {
          if (offer.openAction === "vault_picker") {
            if (GLOBE_PACK_KEYS.has(offer.plan as GlobePackKey)) {
              // Unique mid-ticket URL, then open vault browser
              writePlanOfferSpotlightHash(offer.plan as GlobePackKey);
            }
            setVaultPackOffer(offer);
            return;
          }
          if (GLOBE_PACK_KEYS.has(offer.plan as GlobePackKey)) {
            writePlanOfferDetailsHash(offer.plan as GlobePackKey);
          }
          setDetailOffer(offer);
        }}
        onOpen={() => {
          if (comingSoon) return;
          if (offer.openAction === "vault_picker" && vaultPack) {
            if (packPlaylistOpenable) {
              void openUnlocked(offer);
              return;
            }
            void joinOffer(offer);
            return;
          }
          if (offer.openHref) {
            router.push(offer.openHref);
            return;
          }
          if (isVaultOfferUnlocked(offer, purchasedSet, accessTier, moneyMasteryActive)) {
            openUnlocked(offer);
            return;
          }
          void joinOffer(offer);
        }}
      />
    );
  };

  const primaryOffers = useMemo(() => {
    if (knightOnly) return PLAN_OFFERS_PRIMARY.filter((o) => isKnightPlanSlug(String(o.plan)));
    if (omitKnight) return PLAN_OFFERS_PRIMARY.filter((o) => !isKnightPlanSlug(String(o.plan)));
    return PLAN_OFFERS_PRIMARY;
  }, [knightOnly, omitKnight]);

  const compactOffers = useMemo(() => {
    if (knightOnly) return PLAN_OFFERS.filter((o) => isKnightPlanSlug(String(o.plan)));
    if (omitKnight) return PLAN_OFFERS.filter((o) => !isKnightPlanSlug(String(o.plan)));
    return PLAN_OFFERS;
  }, [knightOnly, omitKnight]);

  return (
    <div
      data-globe-spotlight-active={spotlightActive ? "true" : undefined}
      style={sectionSpotlightStyle}
      className={cn(
        "relative z-[1] mx-auto w-full overflow-visible",
        isLarge ? "max-w-[min(100%,calc(80rem+300px))]" : "max-w-[1400px]",
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
        <div className="flex w-full max-w-full flex-col gap-4 sm:gap-8 lg:gap-10">
          {primaryOffers.length > 0 ? (
            <div
              className={cn(
                "mx-auto grid w-full items-stretch gap-4 overflow-x-clip sm:gap-8",
                primaryOffers.length === 1
                  ? "max-w-lg grid-cols-1"
                  : "max-w-4xl grid-cols-1 sm:grid-cols-2",
              )}
            >
              {primaryOffers.map(renderOffer)}
            </div>
          ) : null}
          {!knightOnly ? <LazyVaultOffersRow offers={PLAN_OFFERS_VAULT} renderOffer={renderOffer} /> : null}
        </div>
      ) : (
        <div className="flex w-full flex-row flex-wrap items-start justify-center gap-2 sm:gap-3">
          {compactOffers.map(renderOffer)}
        </div>
      )}
      {detailOffer ? (
        <PlanOfferDetailModal
          offer={detailOffer}
          onClose={() => {
            const pack = detailOffer.plan as GlobePackKey;
            setDetailOffer(null);
            if (GLOBE_PACK_KEYS.has(pack)) {
              // Return to vault list when closing details opened from a pack deep link.
              if (vaultPackOffer) {
                clearPlanOfferDetailsHash(pack);
                return;
              }
              exitPackDeepLink();
              return;
            }
          }}
          onUnlock={(offer) => void joinOffer(offer)}
          unlockBusy={busyPlan === "bundle"}
          onOpenPackDetails={(plan) => {
            const packOffer = PLAN_OFFERS.find((item) => item.plan === plan);
            if (!packOffer) return;
            writePlanOfferDetailsHash(plan);
            setVaultPackOffer(null);
            setDetailOffer(packOffer);
          }}
        />
      ) : null}
      {vaultPackOffer ? (
        <PackVaultOfferModal
          packOffer={vaultPackOffer}
          busyPlan={busyPlan}
          purchasedSlugs={purchasedSet}
          accessTier={accessTier}
          moneyMasteryActive={moneyMasteryActive}
          selectionMode={unlockCart.selectionMode}
          isInCart={unlockCart.isInCart}
          onClose={exitPackDeepLink}
          onDetails={setDetailOffer}
          onModuleDetails={(offer) => {
            if (isTradingModuleSlug(offer.plan)) {
              setTradingModuleOffer(offer);
              return;
            }
            setDetailOffer(offer);
          }}
          onUnlock={(offer) => void joinOffer(offer)}
          onOpenUnlocked={openUnlocked}
          onExploreTradingModule={(offer) => setTradingModuleOffer(offer)}
        />
      ) : null}
      {tradingModuleOffer ? (
        <TradingModuleVaultModal
          moduleOffer={tradingModuleOffer}
          busyPlan={busyPlan}
          purchasedSlugs={purchasedSet}
          accessTier={accessTier}
          moneyMasteryActive={moneyMasteryActive}
          selectionMode={unlockCart.selectionMode}
          isInCart={unlockCart.isInCart}
          onClose={() => setTradingModuleOffer(null)}
          onDetails={setDetailOffer}
          onUnlock={(offer) => void joinOffer(offer)}
          onOpenUnlocked={openUnlocked}
        />
      ) : null}
      {!shellHosted && showUnlockChrome ? (
        <>
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: "font-mono text-xs",
              style: {
                background: "#04060d",
                color: "#e2e8f0",
                border: "1px solid rgba(34,211,238,0.35)",
                marginBottom: "5.5rem",
              },
            }}
          />
          <UnlockCartPanel
            busy={cartCheckoutBusy || busyPlan !== null}
            error={cartError}
            onCheckout={() => void checkoutUnlockCart()}
          />
        </>
      ) : null}
    </div>
  );
}
