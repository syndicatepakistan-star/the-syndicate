"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CheckoutOfferKey, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";
import { fetchStreamPlaylists } from "@/lib/streaming-api";
import { fetchPurchasedPlanSlugs } from "@/lib/plan-purchases-api";
import {
  UNLOCK_CART_STORAGE_KEY,
  cartContainsKey,
  cartItemKey,
  cartItemTotal,
  clearUnlockCartStorage,
  filterOwnedUnlockCartItems,
  offerToCartItem,
  playlistToCartItem,
  readUnlockCartFromStorage,
  type UnlockCartItem,
  writeUnlockCartToStorage,
} from "@/lib/unlockCart";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUnlockActivationOptional } from "@/components/programs/UnlockActivationContext";

type UnlockCartContextValue = {
  items: UnlockCartItem[];
  selectionMode: boolean;
  setSelectionMode: (active: boolean) => void;
  panelExpanded: boolean;
  setPanelExpanded: (expanded: boolean) => void;
  checkoutPulse: boolean;
  addItem: (offer: PlanOfferDef) => boolean;
  addPlaylist: (playlist: StreamPlaylistListItem, title: string, imageSrc?: string) => boolean;
  removeItem: (plan: CheckoutOfferKey) => void;
  removeByKey: (key: string) => void;
  toggleItem: (offer: PlanOfferDef) => void;
  togglePlaylist: (playlist: StreamPlaylistListItem, title: string, imageSrc?: string) => void;
  clearCart: () => void;
  pruneOwnedItems: (owned: {
    planSlugs?: ReadonlySet<string> | readonly string[];
    unlockedPlaylistIds?: ReadonlySet<number> | readonly number[];
  }) => void;
  isInCart: (plan: CheckoutOfferKey) => boolean;
  isInCartKey: (key: string) => boolean;
  totalLabel: string;
  count: number;
};

const UnlockCartContext = createContext<UnlockCartContextValue | null>(null);

function consumeCheckoutConfirmedFlags(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const planFlag = window.sessionStorage.getItem("plan_checkout_confirmed");
    const playlistFlag = window.sessionStorage.getItem("playlist_checkout_confirmed");
    if (!planFlag && !playlistFlag) return false;
    window.sessionStorage.removeItem("plan_checkout_confirmed");
    window.sessionStorage.removeItem("playlist_checkout_confirmed");
    return true;
  } catch {
    return false;
  }
}

export function UnlockCartProvider({ children }: { children: ReactNode }) {
  const { currency, formatPrice } = useCurrency();
  const unlockActivation = useUnlockActivationOptional();
  const unlockLive = unlockActivation?.unlockReady ?? true;
  const [items, setItems] = useState<UnlockCartItem[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [checkoutPulse, setCheckoutPulse] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const clearCart = useCallback(() => {
    setItems([]);
    setSelectionMode(false);
    setPanelExpanded(false);
    setCheckoutPulse(false);
    clearUnlockCartStorage();
  }, []);

  const pruneOwnedItems = useCallback(
    (owned: {
      planSlugs?: ReadonlySet<string> | readonly string[];
      unlockedPlaylistIds?: ReadonlySet<number> | readonly number[];
    }) => {
      setItems((prev) => {
        const next = filterOwnedUnlockCartItems(prev, owned);
        return next.length === prev.length ? prev : next;
      });
    },
    [],
  );

  useEffect(() => {
    if (consumeCheckoutConfirmedFlags()) {
      clearUnlockCartStorage();
      setItems([]);
      setSelectionMode(false);
      setPanelExpanded(false);
      setCheckoutPulse(false);
    } else {
      setItems(readUnlockCartFromStorage());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeUnlockCartToStorage(items);
    if (!items.length) {
      setSelectionMode(false);
      setPanelExpanded(false);
      setCheckoutPulse(false);
    }
  }, [hydrated, items]);

  useEffect(() => {
    const onCheckoutConfirmed = () => {
      clearCart();
    };
    window.addEventListener("plan-checkout-confirmed", onCheckoutConfirmed);
    window.addEventListener("playlist-checkout-confirmed", onCheckoutConfirmed);
    return () => {
      window.removeEventListener("plan-checkout-confirmed", onCheckoutConfirmed);
      window.removeEventListener("playlist-checkout-confirmed", onCheckoutConfirmed);
    };
  }, [clearCart]);

  // Other tabs clearing the bucket should sync immediately.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.sessionStorage) return;
      if (event.key !== UNLOCK_CART_STORAGE_KEY) return;
      if (event.newValue && event.newValue !== "[]") return;
      clearCart();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearCart]);

  // Safety net: drop already-unlocked programs that were left in the bucket.
  // Deferred until unlock is live (or cart already has items) so browse paint stays light.
  useEffect(() => {
    if (!hydrated) return;
    if (!unlockLive && items.length === 0) return;
    let cancelled = false;

    const pruneFromServer = async () => {
      try {
        const [slugs, playlists] = await Promise.all([
          fetchPurchasedPlanSlugs().catch(() => [] as string[]),
          fetchStreamPlaylists().catch(() => [] as StreamPlaylistListItem[]),
        ]);
        if (cancelled) return;
        const unlockedPlaylistIds = playlists
          .filter((pl) => !!pl.is_unlocked)
          .map((pl) => pl.id)
          .filter((id) => Number.isFinite(id) && id > 0);
        pruneOwnedItems({ planSlugs: slugs, unlockedPlaylistIds });
      } catch {
        // Ownership prune is best-effort; checkout clear path remains primary.
      }
    };

    void pruneFromServer();

    const onCheckoutConfirmed = () => {
      window.setTimeout(() => {
        void pruneFromServer();
      }, 400);
    };
    window.addEventListener("plan-checkout-confirmed", onCheckoutConfirmed);
    window.addEventListener("playlist-checkout-confirmed", onCheckoutConfirmed);
    return () => {
      cancelled = true;
      window.removeEventListener("plan-checkout-confirmed", onCheckoutConfirmed);
      window.removeEventListener("playlist-checkout-confirmed", onCheckoutConfirmed);
    };
  }, [hydrated, items.length, pruneOwnedItems, unlockLive]);

  const pulseBucket = useCallback(() => {
    setSelectionMode(true);
    setPanelExpanded(true);
    setCheckoutPulse(true);
    window.setTimeout(() => setCheckoutPulse(false), 2200);
  }, []);

  const addItem = useCallback(
    (offer: PlanOfferDef) => {
      const key = cartItemKey(offerToCartItem(offer));
      let added = false;
      setItems((prev) => {
        if (cartContainsKey(prev, key)) return prev;
        added = true;
        return [...prev, offerToCartItem(offer)];
      });
      if (added) pulseBucket();
      return added;
    },
    [pulseBucket],
  );

  const addPlaylist = useCallback(
    (playlist: StreamPlaylistListItem, title: string, imageSrc?: string) => {
      if (playlist.is_unlocked) return false;
      const key = cartItemKey(playlistToCartItem(playlist, title, imageSrc));
      let added = false;
      setItems((prev) => {
        if (cartContainsKey(prev, key)) return prev;
        added = true;
        return [...prev, playlistToCartItem(playlist, title, imageSrc)];
      });
      if (added) pulseBucket();
      return added;
    },
    [pulseBucket],
  );

  const removeByKey = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => cartItemKey(item) !== key));
  }, []);

  const removeItem = useCallback(
    (plan: CheckoutOfferKey) => {
      removeByKey(`plan:${plan}`);
    },
    [removeByKey],
  );

  const toggleItem = useCallback(
    (offer: PlanOfferDef) => {
      const key = cartItemKey(offerToCartItem(offer));
      setItems((prev) => {
        if (cartContainsKey(prev, key)) {
          return prev.filter((item) => cartItemKey(item) !== key);
        }
        pulseBucket();
        return [...prev, offerToCartItem(offer)];
      });
    },
    [pulseBucket],
  );

  const togglePlaylist = useCallback(
    (playlist: StreamPlaylistListItem, title: string, imageSrc?: string) => {
      if (playlist.is_unlocked) {
        const key = cartItemKey(playlistToCartItem(playlist, title, imageSrc));
        setItems((prev) => prev.filter((item) => cartItemKey(item) !== key));
        return;
      }
      const key = cartItemKey(playlistToCartItem(playlist, title, imageSrc));
      setItems((prev) => {
        if (cartContainsKey(prev, key)) {
          return prev.filter((item) => cartItemKey(item) !== key);
        }
        pulseBucket();
        return [...prev, playlistToCartItem(playlist, title, imageSrc)];
      });
    },
    [pulseBucket],
  );

  const isInCartKey = useCallback((key: string) => cartContainsKey(items, key), [items]);

  const isInCart = useCallback(
    (plan: CheckoutOfferKey) => isInCartKey(`plan:${plan}`),
    [isInCartKey],
  );

  const value = useMemo<UnlockCartContextValue>(
    () => ({
      items,
      selectionMode,
      setSelectionMode,
      panelExpanded,
      setPanelExpanded,
      checkoutPulse,
      addItem,
      addPlaylist,
      removeItem,
      removeByKey,
      toggleItem,
      togglePlaylist,
      clearCart,
      pruneOwnedItems,
      isInCart,
      isInCartKey,
      totalLabel: formatPrice(cartItemTotal(items)),
      count: items.length,
    }),
    [
      addItem,
      addPlaylist,
      checkoutPulse,
      clearCart,
      currency,
      formatPrice,
      isInCart,
      isInCartKey,
      items,
      panelExpanded,
      pruneOwnedItems,
      removeByKey,
      removeItem,
      selectionMode,
      toggleItem,
      togglePlaylist,
    ],
  );

  return <UnlockCartContext.Provider value={value}>{children}</UnlockCartContext.Provider>;
}

export function useUnlockCart(): UnlockCartContextValue {
  const ctx = useContext(UnlockCartContext);
  if (!ctx) {
    throw new Error("useUnlockCart must be used within UnlockCartProvider");
  }
  return ctx;
}

export function useUnlockCartOptional(): UnlockCartContextValue | null {
  return useContext(UnlockCartContext);
}
