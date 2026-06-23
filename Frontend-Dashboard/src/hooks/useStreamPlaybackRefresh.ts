"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchStreamVideoPlayback,
  getCachedStreamVideoPlayback,
  purgeExpiredStreamPlaybackCache,
  isStreamPlaybackUrlStale,
  type StreamPayload,
} from "@/lib/streaming-api";
import { useTabResume } from "@/hooks/useTabResume";

/** Refresh signed playback URLs shortly before server expiry (not half the TTL). */
const REFRESH_BUFFER_MS = 90 * 1000;
const MIN_REFRESH_DELAY_MS = 15_000;
const REFRESH_RETRY_MS = 30_000;

/** Keep the current playback URL when a background fetch returns a new token but the old one still works. */
function mergePlaybackRefresh(prev: StreamPayload | null, next: StreamPayload): StreamPayload {
  if (!prev?.playback_url) return next;
  if (prev.playback_url === next.playback_url) return next;
  if (!isStreamPlaybackUrlStale(prev)) {
    return {
      ...next,
      playback_url: prev.playback_url,
      playback_expires_at: prev.playback_expires_at ?? next.playback_expires_at,
    };
  }
  return next;
}

type Options = {
  context?: "programs" | "membership";
  enabled?: boolean;
};

/**
 * Loads stream playback for a video and schedules automatic URL refresh before expiry
 * so long MP4 sessions (seek/scrub after 15+ min) keep working.
 */
export function useStreamPlaybackRefresh(
  videoId: number | null | undefined,
  options?: Options
): {
  playback: StreamPayload | null;
  srcRevision: number;
  loading: boolean;
  refreshPlaybackNow: (options?: { force?: boolean }) => Promise<void>;
  ensureFreshPlayback: () => Promise<void>;
} {
  const context = options?.context === "membership" ? "membership" : "programs";
  const enabled = options?.enabled !== false;
  const [playback, setPlayback] = useState<StreamPayload | null>(null);
  const [srcRevision, setSrcRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoIdRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);
  const playbackRef = useRef<StreamPayload | null>(null);
  playbackRef.current = playback;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (expiresAt: number | null | undefined, vid: number) => {
      clearTimer();
      if (!enabled || !expiresAt) return;

      const refreshAtMs = expiresAt * 1000 - REFRESH_BUFFER_MS;
      const delay = Math.max(MIN_REFRESH_DELAY_MS, refreshAtMs - Date.now());

      timerRef.current = setTimeout(() => {
        void (async () => {
          try {
            const next = await fetchStreamVideoPlayback(vid, { context, forceRefresh: true });
            if (videoIdRef.current !== vid) return;
            if (!next.playback_url) return;
            const prevUrl = playbackRef.current?.playback_url;
            setPlayback((prev) => {
              if (!prev) return next;
              if (prev.playback_url === next.playback_url) return prev;
              return next;
            });
            if (prevUrl && next.playback_url && prevUrl !== next.playback_url) {
              setSrcRevision((r) => r + 1);
            }
            scheduleRefresh(next.playback_expires_at ?? null, vid);
          } catch {
            if (videoIdRef.current !== vid) return;
            timerRef.current = setTimeout(() => {
              scheduleRefresh(expiresAt, vid);
            }, REFRESH_RETRY_MS);
          }
        })();
      }, delay);
    },
    [clearTimer, context, enabled]
  );

  const applyPlaybackRefresh = useCallback((next: StreamPayload, prev: StreamPayload | null) => {
    if (!prev) return next;
    if (prev.playback_url === next.playback_url) return prev;
    return next;
  }, []);

  const refreshPlaybackNow = useCallback(async (options?: { force?: boolean }) => {
    const vid = videoIdRef.current;
    if (!vid || !enabled || refreshInFlightRef.current) return;
    const current = playbackRef.current;
    if (!options?.force && current?.playback_url && !isStreamPlaybackUrlStale(current)) return;

    refreshInFlightRef.current = true;
    try {
      const next = await fetchStreamVideoPlayback(vid, { context, forceRefresh: true });
      if (videoIdRef.current !== vid) return;
      if (!next.playback_url) return;
      const prevUrl = playbackRef.current?.playback_url;
      setPlayback((prev) => applyPlaybackRefresh(next, prev));
      if (prevUrl && next.playback_url && prevUrl !== next.playback_url) {
        setSrcRevision((r) => r + 1);
      }
      if (next.status === "ready" && next.playback_url) {
        scheduleRefresh(next.playback_expires_at ?? null, vid);
      }
    } catch {
      // Caller may retry on next playback error.
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [applyPlaybackRefresh, context, enabled, scheduleRefresh]);

  const ensureFreshPlayback = useCallback(async () => {
    await refreshPlaybackNow();
  }, [refreshPlaybackNow]);

  useEffect(() => {
    videoIdRef.current = videoId ?? null;
    clearTimer();

    if (!videoId || !enabled) {
      setPlayback(null);
      setSrcRevision(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const cached = getCachedStreamVideoPlayback(videoId, { context });
    if (cached?.playback_url) {
      setPlayback(cached);
      setSrcRevision(0);
      setLoading(false);
      if (cached.status === "ready") {
        scheduleRefresh(cached.playback_expires_at ?? null, videoId);
      }
    } else {
      setLoading(true);
      setSrcRevision(0);
      setPlayback(null);
    }

    void (async () => {
      try {
        const initial = await fetchStreamVideoPlayback(videoId, { context });
        if (cancelled || videoIdRef.current !== videoId) return;
        setPlayback((prev) => mergePlaybackRefresh(prev, initial));
        if (initial.status === "ready" && initial.playback_url) {
          scheduleRefresh(initial.playback_expires_at ?? null, videoId);
        }
      } catch {
        if (!cancelled && videoIdRef.current === videoId && !cached?.playback_url) {
          setPlayback(null);
        }
      } finally {
        if (!cancelled && videoIdRef.current === videoId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [videoId, context, enabled, clearTimer, scheduleRefresh]);

  useEffect(() => {
    if (!videoId || !enabled) return;
    if (playback?.status !== "processing") return;

    let cancelled = false;
    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const next = await fetchStreamVideoPlayback(videoId, { context, forceRefresh: true });
          if (cancelled || videoIdRef.current !== videoId) return;
          setPlayback((prev) => mergePlaybackRefresh(prev, next));
          if (next.status === "ready" && next.playback_url) {
            scheduleRefresh(next.playback_expires_at ?? null, videoId);
          }
        } catch {
          // Keep polling until ready or unmount.
        }
      })();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [videoId, context, enabled, playback?.status, scheduleRefresh]);

  const refreshIfStale = useCallback(() => {
    const vid = videoIdRef.current;
    if (!vid || !enabled) return;
    purgeExpiredStreamPlaybackCache();
    const current = playbackRef.current;
    const urlExpired = isStreamPlaybackUrlStale(current);
    const missingReadyUrl = current?.status === "ready" && !current?.playback_url;

    if (current?.status === "ready" && current?.playback_url && !urlExpired) {
      scheduleRefresh(current.playback_expires_at ?? null, vid);
      return;
    }

    if (!urlExpired && !missingReadyUrl && current?.status !== "processing") return;

    void (async () => {
      try {
        const next = await fetchStreamVideoPlayback(vid, { context, forceRefresh: true });
        if (videoIdRef.current !== vid) return;
        const prevUrl = playbackRef.current?.playback_url;
        setPlayback((prev) => mergePlaybackRefresh(prev, next));
        if (prevUrl && next.playback_url && prevUrl !== next.playback_url) {
          setSrcRevision((r) => r + 1);
        }
        if (next.status === "ready" && next.playback_url) {
          scheduleRefresh(next.playback_expires_at ?? null, vid);
        }
      } catch {
        timerRef.current = setTimeout(() => refreshIfStale(), REFRESH_RETRY_MS);
      }
    })();
  }, [context, enabled, scheduleRefresh]);

  useTabResume(refreshIfStale, enabled && Boolean(videoId));

  return { playback, srcRevision, loading, refreshPlaybackNow, ensureFreshPlayback };
}
