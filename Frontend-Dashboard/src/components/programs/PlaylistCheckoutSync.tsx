"use client";

import { useEffect } from "react";
import { clearUnlockCelebrationStorage } from "@/lib/programUnlockFlow";
import { confirmPlaylistCheckoutSuccess } from "@/lib/streaming-api";

export function PlaylistCheckoutSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = (params.get("playlist_checkout") || "").trim();
    const sessionId = (params.get("session_id") || "").trim();
    if (status !== "success" || !sessionId) return;
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
        clean.searchParams.delete("playlist_checkout");
        clean.searchParams.delete("session_id");
        clean.searchParams.delete("playlist_id");
        clean.searchParams.set("section", "programs");
        if (playlistId) {
          clean.searchParams.set("playlist", playlistId);
        }
        window.history.replaceState({}, "", clean.toString());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
