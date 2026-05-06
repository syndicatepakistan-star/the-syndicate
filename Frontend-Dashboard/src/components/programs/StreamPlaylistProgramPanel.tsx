"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import HlsVideoPlayer from "@/components/streaming/HlsVideoPlayer";
import {
  fetchStreamPlaylistDetail,
  fetchStreamVideoPlayback,
  type StreamPayload,
  type StreamPlaylistDetail,
  type StreamVideoListItem
} from "@/lib/streaming-api";
import { resolveDjangoMediaUrl } from "@/lib/courses-api";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  playlistId: number;
};

const playerShell = "overflow-hidden rounded-xl border border-white/10 bg-black/50";
const WATCH_PROGRESS_PREFIX = "syn_playlist_watch_progress_v1";
const CERTIFICATE_PREFIX = "syn_playlist_certificate_v1";
const MAX_REAL_PLAYBACK_DELTA_SECONDS = 6;
const SEEK_COOLDOWN_MS = 1400;
const MIN_WATCHED_INCREMENT_SECONDS = 0.2;
const DISPLAY_GAP_SMOOTH_SECONDS = 1.2;

function parsePlaylistNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function formatDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (!ranges.length) return [];
  const sorted = [...ranges]
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
    .sort((a, b) => a.start - b.start);
  if (!sorted.length) return [];
  const merged: Array<{ start: number; end: number }> = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end + 0.4) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function mergeRangesWithGap(
  ranges: Array<{ start: number; end: number }>,
  gapSeconds: number
): Array<{ start: number; end: number }> {
  if (!ranges.length) return [];
  const sorted = [...ranges]
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
    .sort((a, b) => a.start - b.start);
  if (!sorted.length) return [];
  const merged: Array<{ start: number; end: number }> = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end + Math.max(0, gapSeconds)) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function subtractRange(
  ranges: Array<{ start: number; end: number }>,
  remove: { start: number; end: number }
): Array<{ start: number; end: number }> {
  const removeStart = Math.min(remove.start, remove.end);
  const removeEnd = Math.max(remove.start, remove.end);
  if (!Number.isFinite(removeStart) || !Number.isFinite(removeEnd) || removeEnd <= removeStart) {
    return ranges;
  }
  const next: Array<{ start: number; end: number }> = [];
  ranges.forEach((range) => {
    if (range.end <= removeStart || range.start >= removeEnd) {
      next.push(range);
      return;
    }
    if (range.start < removeStart) {
      next.push({ start: range.start, end: removeStart });
    }
    if (range.end > removeEnd) {
      next.push({ start: removeEnd, end: range.end });
    }
  });
  return mergeRanges(next);
}

function invertRanges(duration: number, ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  const safeDuration = Math.max(0, duration);
  if (safeDuration <= 0) return [];
  const merged = mergeRanges(
    ranges.map((r) => ({
      start: Math.max(0, Math.min(r.start, safeDuration)),
      end: Math.max(0, Math.min(r.end, safeDuration)),
    }))
  );
  const inverted: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  merged.forEach((r) => {
    if (r.start > cursor) inverted.push({ start: cursor, end: r.start });
    cursor = Math.max(cursor, r.end);
  });
  if (cursor < safeDuration) inverted.push({ start: cursor, end: safeDuration });
  return inverted.filter((r) => r.end - r.start > 0.12);
}

function totalRangeDuration(ranges: Array<{ start: number; end: number }>, maxDuration?: number): number {
  const merged = mergeRanges(ranges);
  const total = merged.reduce((sum, r) => sum + Math.max(0, r.end - r.start), 0);
  if (typeof maxDuration === "number" && Number.isFinite(maxDuration)) {
    return Math.min(Math.max(0, maxDuration), Math.max(0, total));
  }
  return Math.max(0, total);
}

export function StreamPlaylistProgramPanel({ playlistId }: Props) {
  const [playlist, setPlaylist] = useState<StreamPlaylistDetail | null>(null);
  const [playback, setPlayback] = useState<StreamPayload | null>(null);
  const [playbackCache, setPlaybackCache] = useState<Record<number, StreamPayload>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [didAutoPickReady, setDidAutoPickReady] = useState(false);
  const [progressMap, setProgressMap] = useState<
    Record<
      number,
      {
        watchedSeconds: number;
        durationSeconds: number;
        currentPositionSeconds: number;
        completed: boolean;
        skippedRanges?: Array<{ start: number; end: number }>;
        watchedRanges?: Array<{ start: number; end: number }>;
      }
    >
  >({});
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [certificateName, setCertificateName] = useState("");
  const [certificateMessage, setCertificateMessage] = useState<string | null>(null);
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [seekRequest, setSeekRequest] = useState<{ id: number; seconds: number; autoplay?: boolean } | null>(null);
  const lastPlaybackPositionRef = useRef<Record<number, number>>({});
  const ignorePlaybackUntilRef = useRef(0);

  const loadPlaylist = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const p = await fetchStreamPlaylistDetail(playlistId);
      setPlaylist(p);
      setActiveIdx(0);
      setPlayback(null);
      setPlaybackCache({});
      setDidAutoPickReady(false);
      setCertificateMessage(null);
      lastPlaybackPositionRef.current = {};
    } catch (e) {
      setPlaylist(null);
      setErr(e instanceof Error ? e.message : "Failed to load playlist.");
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProgressHydrated(false);
    const raw = window.localStorage.getItem(`${WATCH_PROGRESS_PREFIX}:${playlistId}`);
    if (!raw) {
      setProgressHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<
        number,
        {
          watchedSeconds: number;
          durationSeconds: number;
          currentPositionSeconds?: number;
          completed: boolean;
          skippedRanges?: Array<{ start: number; end: number }>;
          watchedRanges?: Array<{ start: number; end: number }>;
        }
      >;
      const upgraded = Object.fromEntries(
        Object.entries(parsed ?? {}).map(([videoId, value]) => {
          const duration = Math.max(0, Number(value?.durationSeconds ?? 0));
          const watched = Math.min(duration, Math.max(0, Number(value?.watchedSeconds ?? 0)));
          const hasWatchedRanges = Array.isArray(value?.watchedRanges) && value.watchedRanges.length > 0;
          const watchedRanges = hasWatchedRanges ? mergeRanges(value.watchedRanges ?? []) : watched > 0 ? [{ start: 0, end: watched }] : [];
          const watchedFromRanges = totalRangeDuration(watchedRanges, duration);
          return [
            Number(videoId),
            {
              watchedSeconds: watchedFromRanges,
              durationSeconds: duration,
              currentPositionSeconds: Math.max(0, Number(value?.currentPositionSeconds ?? 0)),
              completed: Boolean(value?.completed),
              skippedRanges: Array.isArray(value?.skippedRanges) ? value.skippedRanges : [],
              watchedRanges,
            },
          ];
        })
      ) as Record<
        number,
        {
          watchedSeconds: number;
          durationSeconds: number;
          currentPositionSeconds: number;
          completed: boolean;
          skippedRanges: Array<{ start: number; end: number }>;
          watchedRanges: Array<{ start: number; end: number }>;
        }
      >;
      setProgressMap(upgraded);
    } catch {
      setProgressMap({});
    } finally {
      setProgressHydrated(true);
    }
  }, [playlistId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!progressHydrated) return;
    window.localStorage.setItem(`${WATCH_PROGRESS_PREFIX}:${playlistId}`, JSON.stringify(progressMap));
  }, [playlistId, progressMap, progressHydrated]);

  useEffect(() => {
    void loadPlaylist();
  }, [loadPlaylist]);

  const items = useMemo(() => {
    if (!playlist?.items?.length) return [];
    return [...playlist.items].sort((a, b) => a.order - b.order || a.id - b.id);
  }, [playlist]);

  const activeVideo: StreamVideoListItem | null = items[activeIdx]?.stream_video ?? null;
  const activePlayback = activeVideo?.id ? playbackCache[activeVideo.id] ?? playback : playback;
  const totalDuration = useMemo(
    () =>
      items.reduce((sum, row) => {
        const p = progressMap[row.stream_video.id];
        return sum + Math.max(0, p?.durationSeconds ?? 0);
      }, 0),
    [items, progressMap]
  );
  const watchedDuration = useMemo(
    () =>
      items.reduce((sum, row) => {
        const p = progressMap[row.stream_video.id];
        if (!p) return sum;
        return sum + Math.min(Math.max(0, p.watchedSeconds || 0), Math.max(0, p.durationSeconds || 0));
      }, 0),
    [items, progressMap]
  );
  const completedCount = useMemo(
    () => items.filter((row) => progressMap[row.stream_video.id]?.completed).length,
    [items, progressMap]
  );
  const completionPercent = totalDuration > 0 ? Math.min(100, (watchedDuration / totalDuration) * 100) : 0;
  const isPlaylistCompleted = items.length > 0 && completedCount === items.length;
  const activeProgress = activeVideo?.id ? progressMap[activeVideo.id] : undefined;
  const activeUnwatchedRanges = useMemo(() => {
    if (!activeProgress?.durationSeconds) return [];
    return mergeRangesWithGap(
      invertRanges(activeProgress.durationSeconds, activeProgress.watchedRanges ?? []),
      DISPLAY_GAP_SMOOTH_SECONDS
    );
  }, [activeProgress?.durationSeconds, activeProgress?.watchedRanges]);

  useEffect(() => {
    if (!activeVideo?.id) {
      setPlayback(null);
      return;
    }
    const cached = playbackCache[activeVideo.id];
    if (cached) {
      setPlayback(cached);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchStreamVideoPlayback(activeVideo.id);
        if (!cancelled) {
          setPlayback(p);
          setPlaybackCache((prev) => ({ ...prev, [activeVideo.id]: p }));
        }
      } catch {
        if (!cancelled) setPlayback(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeVideo?.id, playbackCache]);

  useEffect(() => {
    if (!items.length) return;
    const idsToPrefetch = items.map((row) => row.stream_video.id).filter(Boolean).slice(0, 8);
    idsToPrefetch.forEach((videoId) => {
      if (playbackCache[videoId]) return;
      void (async () => {
        try {
          const p = await fetchStreamVideoPlayback(videoId);
          setPlaybackCache((prev) => (prev[videoId] ? prev : { ...prev, [videoId]: p }));
        } catch {
          // Ignore prefetch failures; active playback effect handles visible errors.
        }
      })();
    });
  }, [items, playbackCache]);

  useEffect(() => {
    if (!items.length) return;
    if (didAutoPickReady) return;
    const currentStatus = activePlayback?.status ?? "";
    if (currentStatus === "ready") {
      setDidAutoPickReady(true);
      return;
    }
    const firstReadyIdx = items.findIndex((row) => playbackCache[row.stream_video.id]?.status === "ready");
    if (firstReadyIdx >= 0 && firstReadyIdx !== activeIdx) {
      setActiveIdx(firstReadyIdx);
      setDidAutoPickReady(true);
    }
  }, [items, playbackCache, activeIdx, activePlayback?.status, didAutoPickReady]);

  const handleTimeProgress = useCallback(
    ({ currentTime, duration }: { currentTime: number; duration: number }) => {
      if (!activeVideo?.id || duration <= 0) return;
      const videoId = activeVideo.id;
      const now = Math.min(Math.max(currentTime, 0), duration);
      const prevPosition = lastPlaybackPositionRef.current[videoId];
      lastPlaybackPositionRef.current[videoId] = now;
      const inSeekCooldown = Date.now() < ignorePlaybackUntilRef.current;

      // Prevent seek/forward jumps from inflating watched time.
      // Count only realistic forward deltas that represent real playback progression.
      const delta = typeof prevPosition === "number" ? now - prevPosition : 0;
      const playbackIncrement =
        !inSeekCooldown && delta > 0 && delta <= MAX_REAL_PLAYBACK_DELTA_SECONDS ? delta : 0;
      const hasMeaningfulPlayback = playbackIncrement >= MIN_WATCHED_INCREMENT_SECONDS;

      setProgressMap((prev) => {
        const existing = prev[videoId];
        const existingRanges = existing?.skippedRanges ?? [];
        const existingWatchedRanges = existing?.watchedRanges ?? [];
        // Fallback: treat large positive jumps as skipped/forwarded segments.
        const autoSkipRange =
          !inSeekCooldown && typeof prevPosition === "number" && delta > MAX_REAL_PLAYBACK_DELTA_SECONDS
            ? { start: Math.max(0, prevPosition), end: Math.min(duration, now) }
            : null;
        const watchedRange =
          typeof prevPosition === "number" && hasMeaningfulPlayback
            ? { start: Math.max(0, prevPosition), end: Math.min(duration, now) }
            : null;
        const nextWatchedRanges = watchedRange ? mergeRanges([...existingWatchedRanges, watchedRange]) : existingWatchedRanges;
        const withAutoSkip = autoSkipRange ? mergeRanges([...existingRanges, autoSkipRange]) : existingRanges;
        const nextRanges = watchedRange ? subtractRange(withAutoSkip, watchedRange) : withAutoSkip;
        const nextWatched = totalRangeDuration(nextWatchedRanges, duration);
        const completed = (existing?.completed ?? false) || nextWatched >= duration * 0.98;
        return {
          ...prev,
          [videoId]: {
            watchedSeconds: nextWatched,
            durationSeconds: Math.max(existing?.durationSeconds ?? 0, duration),
            currentPositionSeconds: now,
            completed,
            skippedRanges: nextRanges,
            watchedRanges: nextWatchedRanges,
          },
        };
      });
    },
    [activeVideo?.id]
  );

  const handlePlaybackEnded = useCallback(() => {
    if (!activeVideo?.id) return;
    setProgressMap((prev) => {
      const existing = prev[activeVideo.id];
      const duration = Math.max(existing?.durationSeconds ?? 0, 1);
      const watchedRanges = mergeRanges([...(existing?.watchedRanges ?? []), { start: 0, end: duration }]);
      const watched = totalRangeDuration(watchedRanges, duration);
      const completed = watched >= duration * 0.98;
      return {
        ...prev,
        [activeVideo.id]: {
          watchedSeconds: watched,
          durationSeconds: duration,
          currentPositionSeconds: duration,
          completed,
          skippedRanges: existing?.skippedRanges ?? [],
          watchedRanges,
        },
      };
    });
  }, [activeVideo?.id]);

  const handleSeekSegment = useCallback(
    ({ from, to, duration }: { from: number; to: number; duration: number }) => {
      if (!activeVideo?.id || to <= from) return;
      const safeFrom = Math.max(0, Math.min(from, duration));
      const safeTo = Math.max(0, Math.min(to, duration));
      if (safeTo - safeFrom <= 1) return;
      ignorePlaybackUntilRef.current = Date.now() + SEEK_COOLDOWN_MS;
      lastPlaybackPositionRef.current[activeVideo.id] = safeTo;
      setProgressMap((prev) => {
        const existing = prev[activeVideo.id];
        const currentRanges = existing?.skippedRanges ?? [];
        const nextRanges = mergeRanges([...currentRanges, { start: safeFrom, end: safeTo }]);
        return {
          ...prev,
          [activeVideo.id]: {
            watchedSeconds: existing?.watchedSeconds ?? 0,
            durationSeconds: Math.max(existing?.durationSeconds ?? 0, duration),
            currentPositionSeconds: existing?.currentPositionSeconds ?? safeTo,
            completed: existing?.completed ?? false,
            skippedRanges: nextRanges,
            watchedRanges: existing?.watchedRanges ?? [],
          },
        };
      });
    },
    [activeVideo?.id]
  );

  const handleTimelineSeek = useCallback(
    (seconds: number) => {
      if (!activeVideo?.id) return;
      const duration = Math.max(activeProgress?.durationSeconds ?? 0, 0);
      if (!Number.isFinite(duration) || duration <= 0) return;
      const target = Math.min(Math.max(0, seconds), Math.max(0, duration - 0.05));
      ignorePlaybackUntilRef.current = Date.now() + SEEK_COOLDOWN_MS;
      lastPlaybackPositionRef.current[activeVideo.id] = target;
      setProgressMap((prev) => {
        const existing = prev[activeVideo.id];
        return {
          ...prev,
          [activeVideo.id]: {
            watchedSeconds: existing?.watchedSeconds ?? 0,
            durationSeconds: Math.max(existing?.durationSeconds ?? 0, duration),
            currentPositionSeconds: target,
            completed: existing?.completed ?? false,
            skippedRanges: existing?.skippedRanges ?? [],
            watchedRanges: existing?.watchedRanges ?? [],
          },
        };
      });
      setSeekRequest({ id: Date.now(), seconds: target, autoplay: true });
    },
    [activeProgress?.durationSeconds, activeVideo?.id]
  );

  const handleApplyForToken = useCallback(() => {
    const displayName = certificateName.trim();
    if (!displayName) {
      setCertificateMessage("Please enter your name for the certificate.");
      return;
    }
    const certificateId = `SYN-${playlistId}-${Date.now().toString(36).toUpperCase()}`;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `${CERTIFICATE_PREFIX}:${playlistId}`,
        JSON.stringify({
          certificateId,
          playlistTitle: playlist?.title ?? "Playlist",
          name: displayName,
          issuedAt: new Date().toISOString(),
        })
      );
      window.dispatchEvent(new Event("syn-certificates-updated"));
    }
    setCertificateMessage(`Certificate issued for ${displayName}. Certificate ID: ${certificateId}`);
  }, [certificateName, playlist?.title, playlistId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-10 text-center text-sm text-white/60">
        Loading playlist…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/35 bg-red-950/20 px-4 py-6 text-[14px] text-red-100/90">{err}</div>
    );
  }

  if (!playlist || items.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-black/35 px-4 py-8 text-center text-[14px] text-white/65">
        This playlist has no videos yet. Add Stream videos in Django admin.
      </div>
    );
  }

  if (playlist.is_coming_soon) {
    return (
      <div className="rounded-xl border border-amber-400/35 bg-amber-950/20 px-4 py-10 text-center text-[14px] text-amber-100/90">
        <div className="mx-auto mb-2 inline-flex rounded-full border border-amber-300/55 bg-amber-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">
          Coming soon
        </div>
        <p>This playlist is marked as coming soon. Please check back later.</p>
      </div>
    );
  }

  const hlsUrl = activePlayback?.hls_url ?? null;
  const ready = activePlayback?.status === "ready" && !!hlsUrl;
  const playlistPrice = parsePlaylistNumber(playlist.price);

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-start lg:gap-10">
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          {!ready ? (
            <div
              className={`flex aspect-video max-h-[min(58vh,640px)] w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-white/65 sm:max-h-[min(62vh,720px)] ${playerShell}`}
            >
              <span className="rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100/90">
                {activePlayback?.status === "processing" ? "Processing" : activePlayback?.status ?? "…"}
              </span>
              <p>
                {activePlayback?.status === "processing"
                  ? "This episode is still being prepared."
                  : "Choose another episode or refresh when the video is ready."}
              </p>
            </div>
          ) : (
            <HlsVideoPlayer
              key={hlsUrl}
              src={hlsUrl}
              className={playerShell}
              playerLayout={activeVideo.player_layout ?? "auto"}
              sourceWidth={activeVideo.source_width ?? null}
              sourceHeight={activeVideo.source_height ?? null}
              onTimeProgress={handleTimeProgress}
              onPlaybackEnded={handlePlaybackEnded}
              startAtSeconds={activeVideo?.id ? progressMap[activeVideo.id]?.currentPositionSeconds ?? 0 : 0}
              onSeekSegment={handleSeekSegment}
              seekRequest={seekRequest}
            />
          )}
          {activeProgress?.durationSeconds ? (
            <div className="mt-2 rounded-md border border-cyan-300/25 bg-cyan-950/12 p-2">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-bold uppercase tracking-[0.1em] text-cyan-100/90">Video Timeline</span>
                <span className="text-rose-100/85">red = not watched</span>
              </div>
              <div
                className="relative h-2.5 cursor-pointer overflow-hidden rounded-full bg-black/60"
                onClick={(event) => {
                  const duration = Math.max(activeProgress.durationSeconds, 1);
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
                  const ratio = rect.width > 0 ? x / rect.width : 0;
                  handleTimelineSeek(ratio * duration);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  const duration = Math.max(activeProgress.durationSeconds, 1);
                  handleTimelineSeek((activeProgress.currentPositionSeconds ?? 0) + duration * 0.03);
                }}
                aria-label="Seek video from timeline"
              >
                <span
                  className="absolute left-0 top-0 h-full bg-white/75"
                  style={{
                    width: `${Math.min(
                      100,
                      ((activeProgress.currentPositionSeconds ?? 0) / Math.max(1, activeProgress.durationSeconds)) * 100
                    )}%`,
                  }}
                />
                {activeUnwatchedRanges.map((range, idx) => {
                  const dur = Math.max(1, activeProgress.durationSeconds);
                  const left = (Math.max(0, range.start) / dur) * 100;
                  const width = (Math.max(0, range.end - range.start) / dur) * 100;
                  return (
                    <span
                      key={`skip-${idx}-${range.start}-${range.end}`}
                      className="absolute top-0 h-full cursor-pointer bg-rose-500/95"
                      style={{ left: `${left}%`, width: `${Math.max(width, 0.8)}%` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        const rect = event.currentTarget.getBoundingClientRect();
                        const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
                        const ratio = rect.width > 0 ? x / rect.width : 0;
                        const segmentSeconds = range.start + ratio * Math.max(0, range.end - range.start);
                        handleTimelineSeek(segmentSeconds);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[clamp(1.15rem,2.2vw+0.5rem,1.65rem)] font-black leading-tight tracking-tight text-[#f5c814]">
              {activeVideo?.title ?? "Episode"}
            </h2>
            <span className="rounded-full border border-emerald-300/45 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-black text-emerald-200">
              {`£${playlistPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          {(activeVideo?.description || "").trim() ? (
            <div className="mt-3 max-w-4xl rounded-xl border border-white/12 bg-black/35 px-4 py-3">
              <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#f5c814]">Description</div>
              <p className="font-sans whitespace-pre-line break-words [overflow-wrap:anywhere] text-left text-[15px] font-normal leading-7 tracking-normal text-white/92 antialiased">
                {(activeVideo?.description || "").trim()}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <aside
        aria-label="Playlist"
        className="flex min-h-0 flex-col rounded-xl border border-white/12 bg-black/40 p-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]"
      >
        <div className="border-b border-white/10 px-1 pb-3">
          <div className="text-[13px] font-bold text-[#f5c814]">{playlist.title}</div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="rounded-full border border-emerald-300/45 bg-emerald-500/12 px-2 py-0.5 font-sans font-extrabold tracking-normal text-emerald-200">
              {`£${playlistPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="mt-3 space-y-3 rounded-lg border border-cyan-300/35 bg-cyan-950/20 p-3.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-black uppercase tracking-[0.12em] text-cyan-100">Playlist Progress</span>
              <span className="font-black text-cyan-100">{completionPercent.toFixed(0)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/55">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.85),rgba(129,140,248,0.85),rgba(232,121,249,0.85))] transition-[width] duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px] font-semibold text-white/90">
              <span>{formatDuration(watchedDuration)} watched</span>
              <span>{formatDuration(totalDuration)} total</span>
            </div>
            <div className="text-[12px] font-bold text-emerald-200">{completedCount}/{items.length} videos completed</div>
          </div>
          {isPlaylistCompleted ? (
            <button
              type="button"
              onClick={() => {
                setCertificateName("");
                setCertificateMessage(null);
                setShowApplyModal(true);
              }}
              className="mt-3 w-full rounded-lg border border-emerald-300/45 bg-emerald-500/15 px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.28)] transition hover:bg-emerald-500/25"
            >
              Apply for SYN token for this course
            </button>
          ) : null}
        </div>
        <ul className="mt-3 flex max-h-[min(52vh,560px)] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
          {items.map((row, i) => {
            const v = row.stream_video;
            const on = i === activeIdx;
            const thumbSrc = resolveDjangoMediaUrl(v.thumbnail_url);
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "flex w-full gap-3.5 rounded-xl border p-3 text-left transition",
                    on ? "border-violet-300/70 bg-violet-500/10 shadow-[0_0_0_1px_rgba(196,181,253,0.2)]" : "border-transparent bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]"
                  )}
                >
                  <div className="relative h-16 w-[6.4rem] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-violet-800/90 via-neutral-900 to-black">
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt=""
                        loading={i < 3 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={i < 3 ? "high" : "auto"}
                        className="absolute inset-0 h-full w-full object-cover opacity-90"
                      />
                    ) : null}
                    <span className="pointer-events-none absolute inset-y-0 left-0 z-[2] flex w-7 items-center justify-center bg-gradient-to-r from-black/70 via-black/35 to-transparent">
                      <span className="text-[32px] font-black leading-none text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
                        {i + 1}
                      </span>
                    </span>
                    <span className="absolute inset-0 z-[1] flex items-center justify-center">
                      <Play className={cn("h-6 w-6 stroke-[1.75]", on ? "text-white" : "text-white/55")} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <div
                      className={cn(
                        "font-sans text-[14px] font-semibold leading-[1.35] tracking-normal antialiased",
                        on ? "text-white" : "text-white/85"
                      )}
                    >
                      {v.title}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold text-cyan-100/85">
                      {Math.round(
                        ((progressMap[v.id]?.watchedSeconds ?? 0) /
                          Math.max(1, progressMap[v.id]?.durationSeconds ?? 0)) *
                          100
                      )}
                      % watched
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      {showApplyModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-emerald-300/40 bg-[#040a12] p-4 shadow-[0_0_26px_rgba(16,185,129,0.26)]">
            <h3 className="text-lg font-black uppercase tracking-[0.08em] text-emerald-100">Apply for SYN Token</h3>
            <p className="mt-2 text-sm text-white/80">
              Playlist complete. Enter your full name to issue your certificate for <span className="font-semibold text-emerald-100">{playlist.title}</span>.
            </p>
            <input
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              placeholder="Your full name"
              className="mt-3 w-full rounded-md border border-emerald-300/35 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/70"
            />
            {certificateMessage ? <p className="mt-2 text-xs text-emerald-200">{certificateMessage}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="rounded-md border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white/85"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleApplyForToken}
                className="rounded-md border border-emerald-300/50 bg-emerald-500/18 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-emerald-100"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
