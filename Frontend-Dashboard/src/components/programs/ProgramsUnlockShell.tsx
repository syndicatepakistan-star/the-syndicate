"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ReactNode } from "react";
import { UnlockCartProvider, useUnlockCart } from "@/components/programs/UnlockCartContext";
import { checkoutUnlockCartItems } from "@/lib/unlockCartCheckout";
import { useDeferredChrome } from "@/hooks/useDeferredChrome";

const Toaster = dynamic(() => import("react-hot-toast").then((m) => m.Toaster), { ssr: false });
const UnlockCartPanel = dynamic(
  () => import("@/components/programs/UnlockCartPanel").then((m) => m.UnlockCartPanel),
  { ssr: false },
);

function ProgramsUnlockShellHost({ children }: { children: ReactNode }) {
  const unlockCart = useUnlockCart();
  const [cartCheckoutBusy, setCartCheckoutBusy] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  // Cart/toast chrome waits for interaction — unless cart already has items (restore / add).
  const showChrome = useDeferredChrome(
    unlockCart.count > 0 || unlockCart.selectionMode || cartCheckoutBusy || !!cartError,
  );

  const onCheckout = useCallback(async () => {
    if (cartCheckoutBusy || !unlockCart.items.length) return;
    setCartError(null);
    setCartCheckoutBusy(true);
    try {
      const result = await checkoutUnlockCartItems(unlockCart.items, {
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

export function ProgramsUnlockShell({ children }: { children: ReactNode }) {
  return (
    <UnlockCartProvider>
      <ProgramsUnlockShellHost>{children}</ProgramsUnlockShellHost>
    </UnlockCartProvider>
  );
}
