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
import { readUnlockCartFromStorage } from "@/lib/unlockCart";

type UnlockActivationContextValue = {
  /** True once unlock/checkout UI + APIs should run. */
  unlockReady: boolean;
  /** Flip ready immediately (cart chrome can mount). */
  activateUnlock: () => void;
  /** Activate and resolve after React has committed ready=true. */
  ensureUnlockReady: () => Promise<void>;
};

const UnlockActivationContext = createContext<UnlockActivationContextValue | null>(null);

function shouldAutoActivateUnlock(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (readUnlockCartFromStorage().length > 0) return true;
    const params = new URLSearchParams(window.location.search);
    if (params.has("playlist_checkout")) return true;
    if (params.has("session_id")) return true;
    if (params.get("checkout") === "success") return true;
    const hash = window.location.hash.replace(/^#/, "").toLowerCase();
    if (hash === "details" || hash === "spotlight") return true;
    if (params.has("pack") || params.has("slug")) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Browse-first gate: unlock/checkout chrome stays off until the shopper
 * taps Unlock (or a cart/checkout deep-link needs it).
 */
export function UnlockActivationProvider({ children }: { children: ReactNode }) {
  const [unlockReady, setUnlockReady] = useState(false);

  useEffect(() => {
    if (shouldAutoActivateUnlock()) setUnlockReady(true);
  }, []);

  const activateUnlock = useCallback(() => {
    setUnlockReady(true);
  }, []);

  /**
   * Activate unlock chrome immediately.
   * Do not wait on React commit / waiter queues — those can hang forever under
   * Strict Mode remounts and leave Unlock stuck on “Loading…”.
   */
  const ensureUnlockReady = useCallback(() => {
    setUnlockReady(true);
    return Promise.resolve();
  }, []);

  const value = useMemo(
    () => ({ unlockReady, activateUnlock, ensureUnlockReady }),
    [unlockReady, activateUnlock, ensureUnlockReady],
  );

  return (
    <UnlockActivationContext.Provider value={value}>{children}</UnlockActivationContext.Provider>
  );
}

export function useUnlockActivation(): UnlockActivationContextValue {
  const ctx = useContext(UnlockActivationContext);
  if (!ctx) {
    return {
      unlockReady: true,
      activateUnlock: () => {},
      ensureUnlockReady: async () => {},
    };
  }
  return ctx;
}

export function useUnlockActivationOptional(): UnlockActivationContextValue | null {
  return useContext(UnlockActivationContext);
}
