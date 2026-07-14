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
import {
  cartContainsKey,
  cartItemKey,
  formatCartTotal,
  offerToCartItem,
  playlistToCartItem,
  readUnlockCartFromStorage,
  type UnlockCartItem,
  writeUnlockCartToStorage,
} from "@/lib/unlockCart";

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
  isInCart: (plan: CheckoutOfferKey) => boolean;
  isInCartKey: (key: string) => boolean;
  totalLabel: string;
  count: number;
};

const UnlockCartContext = createContext<UnlockCartContextValue | null>(null);

export function UnlockCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UnlockCartItem[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [checkoutPulse, setCheckoutPulse] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readUnlockCartFromStorage());
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

  const clearCart = useCallback(() => {
    setItems([]);
    setSelectionMode(false);
    setPanelExpanded(false);
    setCheckoutPulse(false);
  }, []);

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
      isInCart,
      isInCartKey,
      totalLabel: formatCartTotal(items),
      count: items.length,
    }),
    [
      addItem,
      addPlaylist,
      checkoutPulse,
      clearCart,
      isInCart,
      isInCartKey,
      items,
      panelExpanded,
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
