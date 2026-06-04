"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchStreamVideoPlayback,
  getCachedStreamVideoPlayback,
  type StreamPayload,
} from "@/lib/streaming-api";

/** Refresh signed playback URLs this many ms before server expiry. */
const REFRESH_BUFFER_MS = 3 * 60 * 1000;
const MIN_REFRESH_DELAY_MS = 15_000;
const REFRESH_RETRY_MS = 30_000;

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
): { playback: StreamPayload | null; srcRevision: number; loading: boolean } {
  const context = options?.context === "membership" ? "membership" : "programs";
  const enabled = options?.enabled !== false;
  const [playback, setPlayback] = useState<StreamPayload | null>(null);
  const [srcRevision, setSrcRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoIdRef = useRef<number | null>(null);

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
            setPlayback(next);
            setSrcRevision((prev) => prev + 1);
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
        setPlayback(initial);
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
          setPlayback(next);
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

  return { playback, srcRevision, loading };
}
