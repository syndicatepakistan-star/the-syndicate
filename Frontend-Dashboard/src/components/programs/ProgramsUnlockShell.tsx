"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { UnlockCartProvider, useUnlockCart } from "@/components/programs/UnlockCartContext";
import { UnlockCartPanel } from "@/components/programs/UnlockCartPanel";
import { checkoutUnlockCartItems } from "@/lib/unlockCartCheckout";

function ProgramsUnlockShellHost({ children }: { children: ReactNode }) {
  const unlockCart = useUnlockCart();
  const [cartCheckoutBusy, setCartCheckoutBusy] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

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
      {children}
      <UnlockCartPanel busy={cartCheckoutBusy} error={cartError} onCheckout={() => void onCheckout()} />
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
