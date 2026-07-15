"use client";

import { useEffect } from "react";
import { clearUnlockCelebrationStorage } from "@/lib/programUnlockFlow";
import { clearVaultPlaylistMapCache } from "@/lib/vaultPlaylistMap";
import { markDashboardCheckoutReturn } from "@/lib/dashboardShellScroll";
import { clearStreamPlaylistsCache } from "@/lib/streaming-api";

/** After checkout, refresh ownership and keep the user on the main Programs catalog. */
export function PlanCheckoutSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("plan_checkout") !== "success") return;

    markDashboardCheckoutReturn();
    const plan = (params.get("plan") || "").trim().toLowerCase();
    clearStreamPlaylistsCache();
    clearVaultPlaylistMapCache();
    clearUnlockCelebrationStorage();

    try {
      window.sessionStorage.setItem("plan_checkout_confirmed", "1");
    } catch {
      // Ignore storage exceptions.
    }

    window.dispatchEvent(
      new CustomEvent("plan-checkout-confirmed", {
        detail: { plan },
      }),
    );

    const clean = new URL(window.location.href);
    clean.searchParams.delete("plan_checkout");
    clean.searchParams.delete("plan");
    clean.searchParams.delete("playlist");
    clean.searchParams.delete("playlist_id");
    clean.searchParams.delete("pack");
    clean.searchParams.set("section", "programs");
    window.history.replaceState({}, "", clean.toString());
  }, []);

  return null;
}
