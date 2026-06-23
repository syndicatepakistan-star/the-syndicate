"use client";

import { useEffect } from "react";
import { isVaultPackKey } from "@/components/programs/vaultPackCatalog";
import { clearUnlockCelebrationStorage } from "@/lib/programUnlockFlow";
import { clearVaultPlaylistMapCache, fetchVaultPlaylistMap, vaultPlaylistIdForPlan } from "@/lib/vaultPlaylistMap";
import { clearStreamPlaylistsCache } from "@/lib/streaming-api";

/** After vault plan checkout, refresh unlock state and route to the pack picker or lesson. */
export function PlanCheckoutSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("plan_checkout") !== "success") return;

    const plan = (params.get("plan") || "").trim().toLowerCase();
    let cancelled = false;

    void (async () => {
      clearStreamPlaylistsCache();
      clearVaultPlaylistMapCache();
      clearUnlockCelebrationStorage();

      let playlistId: number | null = null;
      if (plan && !isVaultPackKey(plan)) {
        try {
          const map = await fetchVaultPlaylistMap({ forceRefresh: true });
          playlistId = vaultPlaylistIdForPlan(plan, map);
        } catch {
          // Ignore map errors; grid refresh still runs below.
        }
      }

      if (cancelled) return;

      try {
        window.sessionStorage.setItem("plan_checkout_confirmed", "1");
      } catch {
        // Ignore storage exceptions.
      }

      window.dispatchEvent(
        new CustomEvent("plan-checkout-confirmed", {
          detail: { plan, playlistId: playlistId ?? undefined },
        })
      );

      const clean = new URL(window.location.href);
      clean.searchParams.delete("plan_checkout");
      clean.searchParams.delete("plan");
      clean.searchParams.set("section", "programs");
      if (plan && isVaultPackKey(plan)) {
        clean.searchParams.set("pack", plan);
      } else if (playlistId) {
        clean.searchParams.set("playlist", String(playlistId));
      }
      window.history.replaceState({}, "", clean.toString());
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
