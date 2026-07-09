"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchStreamPlaylists, type StreamPlaylistListItem } from "@/lib/streaming-api";

type Options = {
  enabled?: boolean;
  allowPublicFallback?: boolean;
  forceRefresh?: boolean;
};

/** Shared playlist list — reuses streaming-api memory + session cache; avoids duplicate fetches. */
export function useStreamPlaylists(options?: Options) {
  const enabled = options?.enabled !== false;
  const allowPublicFallback = !!options?.allowPublicFallback;
  const forceRefresh = !!options?.forceRefresh;

  const [playlists, setPlaylists] = useState<StreamPlaylistListItem[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (opts?: { forceRefresh?: boolean }) => {
      if (!enabled) {
        setPlaylists([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const list = await fetchStreamPlaylists({
          allowPublicFallback,
          forceRefresh: opts?.forceRefresh ?? forceRefresh,
        });
        setPlaylists(Array.isArray(list) ? list : []);
      } catch {
        setPlaylists([]);
        setError("Could not load playlists.");
      } finally {
        setLoading(false);
      }
    },
    [allowPublicFallback, enabled, forceRefresh],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { playlists, loading, error, reload };
}
