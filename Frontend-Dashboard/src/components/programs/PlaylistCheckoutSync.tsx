"use client";

import { useEffect } from "react";
import { clearUnlockCelebrationStorage } from "@/lib/programUnlockFlow";
import { markDashboardCheckoutReturn } from "@/lib/dashboardShellScroll";
import { confirmPlaylistCheckoutSuccess } from "@/lib/streaming-api";
import { historyReplaceUrl } from "@/lib/historyUrl";

export function PlaylistCheckoutSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = (params.get("playlist_checkout") || "").trim();
    const sessionId = (params.get("session_id") || "").trim();
    if (status !== "success" || !sessionId) return;
    markDashboardCheckoutReturn();
    let cancelled = false;
    void (async () => {
      let confirmed = false;
      let playlistId =
        (params.get("playlist_id") || "").trim() ||
        (params.get("playlist") || "").trim();
      try {
        const result = await confirmPlaylistCheckoutSuccess(sessionId);
        confirmed = true;
        playlistId = String(result.playlist_id || playlistId || "").trim();
        clearUnlockCelebrationStorage();
        try {
          window.sessionStorage.setItem("playlist_checkout_confirmed", "1");
        } catch {
          // Ignore storage exceptions.
        }

        try {
          const { trackPurchase, waitForGtmReady } = await import("@/lib/gtmCommerce");
          const amount =
            typeof result.amount_paid === "number" && Number.isFinite(result.amount_paid)
              ? result.amount_paid
              : undefined;
          trackPurchase({
            transaction_id: sessionId,
            currency: result.currency || "usd",
            value: amount,
            items: [
              {
                item_id: playlistId ? `playlist_${playlistId}` : "playlist",
                item_name: (result.playlist_title || "").trim() || "Playlist access",
                price: amount,
                quantity: 1,
              },
            ],
          });
          await waitForGtmReady(2500);
        } catch {
          /* GTM optional */
        }

        window.dispatchEvent(
          new CustomEvent("playlist-checkout-confirmed", {
            detail: {
              playlistId: playlistId ? Number(playlistId) : undefined,
              skipCelebration: true,
            },
          })
        );
      } catch {
        // Ignore noisy errors here; dashboard data fetch will reflect final state.
      } finally {
        if (cancelled) return;
        if (!confirmed) return;
        const clean = new URL(window.location.href);
        clean.pathname = "/dashboard/programs";
        clean.searchParams.delete("playlist_checkout");
        clean.searchParams.delete("session_id");
        clean.searchParams.delete("playlist_id");
        clean.searchParams.delete("playlist");
        clean.searchParams.delete("pack");
        clean.searchParams.delete("section");
        markDashboardCheckoutReturn();
        const qs = clean.searchParams.toString();
        historyReplaceUrl(qs ? `${clean.pathname}?${qs}` : clean.pathname);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
