"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ReactNode } from "react";
import { UnlockCartProvider, useUnlockCart } from "@/components/programs/UnlockCartContext";
import {
  UnlockActivationProvider,
  useUnlockActivation,
} from "@/components/programs/UnlockActivationContext";
import { lazyCheckoutUnlockCartItems } from "@/lib/lazyUnlockCheckout";
import { useProgramsPageScrollSmooth } from "@/hooks/useProgramsPageScrollSmooth";

const Toaster = dynamic(() => import("react-hot-toast").then((m) => m.Toaster), { ssr: false });
const UnlockCartPanel = dynamic(
  () => import("@/components/programs/UnlockCartPanel").then((m) => m.UnlockCartPanel),
  { ssr: false },
);

function ProgramsUnlockShellHost({ children }: { children: ReactNode }) {
  const unlockCart = useUnlockCart();
  const { unlockReady } = useUnlockActivation();
  const [cartCheckoutBusy, setCartCheckoutBusy] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // Cart/toast only after Unlock tap (or restored cart / checkout return).
  const showChrome =
    unlockReady || unlockCart.count > 0 || unlockCart.selectionMode || cartCheckoutBusy || !!cartError;

  const onCheckout = useCallback(async () => {
    if (cartCheckoutBusy || !unlockCart.items.length) return;
    setCartError(null);
    setCartCheckoutBusy(true);
    try {
      const result = await lazyCheckoutUnlockCartItems(unlockCart.items, {
        postAuthNext: "/dashboard/programs",
        playlistReturnPath: "/programs",
      });
      if (result.status === "already_unlocked") {
        unlockCart.clearCart();
        return;
      }
      if (result.status === "error") {
        setCartError(result.message);
      }
    } catch (e) {
      setCartError(e instanceof Error ? e.message : "Could not start cart checkout.");
    } finally {
      setCartCheckoutBusy(false);
    }
  }, [cartCheckoutBusy, unlockCart]);

  return (
    <>
      {showChrome ? (
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
      ) : null}
      {children}
      {showChrome ? (
        <UnlockCartPanel busy={cartCheckoutBusy} error={cartError} onCheckout={() => void onCheckout()} />
      ) : null}
    </>
  );
}

/**
 * Keep UnlockCartProvider off the first paint graph until unlock is needed.
 * Browse cards use EMPTY_UNLOCK_CART stubs until then (no throw).
 */
function UnlockCartGate({ children }: { children: ReactNode }) {
  const { unlockReady } = useUnlockActivation();
  if (!unlockReady) {
    return <>{children}</>;
  }
  return (
    <UnlockCartProvider>
      <ProgramsUnlockShellHost>{children}</ProgramsUnlockShellHost>
    </UnlockCartProvider>
  );
}

/**
 * Browse-first shell: cards paint without checkout/toast/cart context chunks.
 * First Unlock tap (or deep-link) activates unlockReady → loads cart + checkout modules.
 */
export function ProgramsUnlockShell({ children }: { children: ReactNode }) {
  useProgramsPageScrollSmooth(true);

  return (
    <UnlockActivationProvider>
      <UnlockCartGate>{children}</UnlockCartGate>
    </UnlockActivationProvider>
  );
}
