"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { StreamPlaybackType } from "@/lib/streaming-api";
import { resolveStreamPlaybackUrl } from "@/lib/streaming-api";
import {
  clearPlaybackByteLengthCache,
  prefetchPlaybackNearTime,
  warmPlaybackHeader,
} from "@/lib/streamPlaybackSeek";

export type StreamHtmlPlayerLayoutMode = "auto" | "landscape" | "portrait";

type Props = {
  /** Absolute playback URL (signed Django proxy or presigned GET). */
  src: string;
  /** MP4 single-file vs HLS manifest URL. */
  playbackType?: StreamPlaybackType;
  /** Stable id for the current video session (resets player when changed). */
  sessionKey?: string | number;
  /** Increment when ``src`` is rotated in-place (preserves watch position). */
  srcRevision?: number;
  className?: string;
  onMetadata?: (size: { width: number; height: number }) => void;
  playerLayout?: StreamHtmlPlayerLayoutMode;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
  onTimeProgress?: (payload: { currentTime: number; duration: number }) => void;
  onPlaybackEnded?: () => void;
  /** Initial resume position only; do not pass live currentTime or the video element will reload every tick. */
  startAtSeconds?: number;
  onSeekSegment?: (payload: { from: number; to: number; duration: number }) => void;
  seekRequest?: { id: number; seconds: number; autoplay?: boolean } | null;
  /** Request a new signed playback URL (e.g. after HLS segment auth expires). */
  onNeedFreshSrc?: () => void;
  /** Refresh signed URL if expired (e.g. user presses play after a long pause). */
  onEnsurePlayback?: () => void | Promise<void>;
};

function lateResumeKey(src: string, startSeconds: number): string {
  return `${src}::${Number(startSeconds).toFixed(3)}`;
}

function resolveResumeSeconds(video: HTMLVideoElement, startAtSeconds: number): number {
  const fromVideo = Number.isFinite(video.currentTime) ? video.currentTime : 0;
  const fromStart = Number(startAtSeconds || 0);
  if (fromVideo > 1) return fromVideo;
  if (fromStart > 1) return fromStart;
  return 0;
}

function hotSwapVideoSrc(video: HTMLVideoElement, newSrc: string): void {
  const savedTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
  const wasPaused = video.paused;
  const savedRate = video.playbackRate;

  const onReady = () => {
    const duration = Number(video.duration || 0);
    if (savedTime > 0 && Number.isFinite(duration) && duration > 0) {
      video.currentTime = Math.min(Math.max(0, savedTime), Math.max(0, duration - 0.05));
    }
    video.playbackRate = savedRate;
    if (!wasPaused) {
      void video.play().catch(() => {
        // Autoplay may be blocked after src swap in some browsers.
      });
    }
  };

  video.addEventListener("loadedmetadata", onReady, { once: true });
  video.src = newSrc;
  video.load();
}

/**
 * Secure stream playback: native MP4 or hls.js for HLS manifests.
 * Binds listeners once per session; loads or hot-swaps `src` when the signed URL rotates.
 */
export default function StreamHtmlVideoPlayer({
  src,
  playbackType = "mp4",
  sessionKey = "default",
  srcRevision = 0,
  className,
  onMetadata,
  playerLayout = "auto",
  sourceWidth = null,
  sourceHeight = null,
  onTimeProgress,
  onPlaybackEnded,
  startAtSeconds = 0,
  onSeekSegment,
  seekRequest = null,
  onNeedFreshSrc,
  onEnsurePlayback,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const onMetadataRef = useRef(onMetadata);
  const startAtSecondsRef = useRef(startAtSeconds);
  const onTimeProgressRef = useRef(onTimeProgress);
  const onPlaybackEndedRef = useRef(onPlaybackEnded);
  const onSeekSegmentRef = useRef(onSeekSegment);
  const suppressNextSeekEventRef = useRef(false);
  const lastSeekStartRef = useRef(0);
  const srcRef = useRef(src);
  const seekPrefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lateResumeAppliedKeyRef = useRef("");
  const appliedSrcRef = useRef<string | null>(null);
  const appliedRevisionRef = useRef(-1);
  const srcRevisionRef = useRef(srcRevision);
  const initialResumeDoneRef = useRef(false);
  const hlsRef = useRef<Hls | null>(null);
  const hlsNetworkRetriesRef = useRef(0);
  const freshSrcCooldownRef = useRef(0);
  const onNeedFreshSrcRef = useRef(onNeedFreshSrc);
  const onEnsurePlaybackRef = useRef(onEnsurePlayback);
  const isHls = playbackType === "hls";

  onNeedFreshSrcRef.current = onNeedFreshSrc;
  onEnsurePlaybackRef.current = onEnsurePlayback;

  const loadHlsSource = useCallback(
    (url: string, opts?: { isHotSwap?: boolean }) => {
      const video = videoRef.current;
      const hls = hlsRef.current;
      if (!video || !hls || !url) return;
      if (appliedSrcRef.current === url && appliedRevisionRef.current === srcRevisionRef.current) return;

      const isHotSwap = opts?.isHotSwap ?? appliedSrcRef.current !== null;
      const resumeAt = resolveResumeSeconds(video, startAtSecondsRef.current);
      const resumeFromStart = !isHotSwap ? Number(startAtSecondsRef.current || 0) : 0;
      const wasPaused = video.paused;
      const savedRate = video.playbackRate;

      appliedSrcRef.current = url;
      appliedRevisionRef.current = srcRevisionRef.current;
      setPlaybackError(null);
      hlsNetworkRetriesRef.current = 0;

      const onManifestParsed = () => {
        const duration = Number(video.duration || 0);
        const startPos = resumeAt > 0 ? Math.max(0, resumeAt - 0.25) : -1;
        if (startPos > 0 && Number.isFinite(duration) && duration > 0) {
          suppressNextSeekEventRef.current = true;
          if (resumeFromStart > 0) {
            initialResumeDoneRef.current = true;
            lateResumeAppliedKeyRef.current = lateResumeKey(url, resumeFromStart);
          }
        }
        video.playbackRate = savedRate;
        hls.startLoad(startPos);
        if (!wasPaused) {
          void video.play().catch(() => undefined);
        }
      };

      hls.off(Hls.Events.MANIFEST_PARSED);
      hls.once(Hls.Events.MANIFEST_PARSED, onManifestParsed);
      hls.stopLoad();
      hls.loadSource(resolveStreamPlaybackUrl(url) ?? url);

      if (!isHotSwap) {
        lateResumeAppliedKeyRef.current = "";
      }
    },
    []
  );

  useEffect(() => {
    onMetadataRef.current = onMetadata;
  }, [onMetadata]);

  startAtSecondsRef.current = startAtSeconds;
  onTimeProgressRef.current = onTimeProgress;
  onPlaybackEndedRef.current = onPlaybackEnded;
  onSeekSegmentRef.current = onSeekSegment;
  srcRef.current = src;
  srcRevisionRef.current = srcRevision;

  useEffect(() => {
    setMeasured(null);
    setPlaybackError(null);
    setBuffering(false);
    appliedSrcRef.current = null;
    appliedRevisionRef.current = -1;
    lateResumeAppliedKeyRef.current = "";
    initialResumeDoneRef.current = false;
    hlsNetworkRetriesRef.current = 0;
    freshSrcCooldownRef.current = 0;
    if (seekPrefetchTimerRef.current) {
      clearTimeout(seekPrefetchTimerRef.current);
      seekPrefetchTimerRef.current = null;
    }
  }, [sessionKey]);

  useEffect(() => {
    if (src) return;
    setPlaybackError(null);
  }, [src]);

  const aspect = useMemo(() => {
    if (playerLayout === "landscape") return { w: 16, h: 9 };
    if (playerLayout === "portrait") return { w: 9, h: 16 };
    if (measured && measured.width > 0 && measured.height > 0) {
      return { w: measured.width, h: measured.height };
    }
    const sw = sourceWidth ?? null;
    const sh = sourceHeight ?? null;
    if (sw && sh && sw > 0 && sh > 0) return { w: sw, h: sh };
    return { w: 16, h: 9 };
  }, [playerLayout, measured, sourceWidth, sourceHeight]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const emitMetadata = () => {
      const width = Number(video.videoWidth || 0);
      const height = Number(video.videoHeight || 0);
      if (width > 0 && height > 0) {
        setMeasured({ width, height });
        onMetadataRef.current?.({ width, height });
      }
      const start = Number(startAtSecondsRef.current || 0);
      if (!initialResumeDoneRef.current && start > 0 && Number.isFinite(video.duration) && video.duration > 0) {
        initialResumeDoneRef.current = true;
        const target = Math.min(Math.max(0, start), Math.max(0, video.duration - 0.05));
        if (target > 0 && !isHls) {
          prefetchPlaybackNearTime(srcRef.current, target, video.duration);
          suppressNextSeekEventRef.current = true;
          video.currentTime = target;
          lateResumeAppliedKeyRef.current = lateResumeKey(src, start);
        }
      }
    };
    const emitTimeProgress = () => {
      const currentTime = Number(video.currentTime || 0);
      const duration = Number(video.duration || 0);
      if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;
      onTimeProgressRef.current?.({ currentTime, duration });
    };
    const emitEnded = () => {
      onPlaybackEndedRef.current?.();
    };
    const onSeeking = () => {
      lastSeekStartRef.current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const playbackUrl = srcRef.current;
      if (!isHls && playbackUrl && duration > 0 && target > 0) {
        if (seekPrefetchTimerRef.current) clearTimeout(seekPrefetchTimerRef.current);
        seekPrefetchTimerRef.current = setTimeout(() => {
          prefetchPlaybackNearTime(playbackUrl, target, duration);
        }, 80);
      }
    };
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onPlaying = () => setBuffering(false);
    const onPlay = () => {
      void (async () => {
        await onEnsurePlaybackRef.current?.();
        if (!isHls) return;
        const hls = hlsRef.current;
        if (!hls || !video) return;
        const resumeAt = resolveResumeSeconds(video, startAtSecondsRef.current);
        if (resumeAt > 1 && video.currentTime < 2) {
          const duration = Number(video.duration || 0);
          hls.startLoad(Math.max(0, resumeAt - 0.25));
          if (Number.isFinite(duration) && duration > 0) {
            suppressNextSeekEventRef.current = true;
            video.currentTime = Math.min(resumeAt, Math.max(0, duration - 0.05));
          }
          void video.play().catch(() => undefined);
        }
      })();
    };
    const onSeeked = () => {
      const to = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (suppressNextSeekEventRef.current) {
        suppressNextSeekEventRef.current = false;
        return;
      }
      if (duration > 0 && to - lastSeekStartRef.current > 2) {
        onSeekSegmentRef.current?.({
          from: Math.max(0, lastSeekStartRef.current),
          to: Math.min(duration, to),
          duration,
        });
      }
    };
    const onError = () => {
      const code = video.error?.code;
      const hint = isHls
        ? "HLS stream failed — check manifest and segments in R2, or refresh when the signed URL expires."
        : code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "Format not supported — use H.264/AAC in an MP4 with faststart."
          : "Stream failed — large files often need direct R2 playback (presigned GET + bucket CORS).";
      setPlaybackError(hint);
    };

    video.addEventListener("loadedmetadata", emitMetadata);
    video.addEventListener("error", onError);
    video.addEventListener("timeupdate", emitTimeProgress);
    video.addEventListener("ended", emitEnded);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("play", onPlay);

    return () => {
      video.removeEventListener("loadedmetadata", emitMetadata);
      video.removeEventListener("timeupdate", emitTimeProgress);
      video.removeEventListener("ended", emitEnded);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("error", onError);
    };
  }, [sessionKey, src, isHls]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (!video) return;
      video.removeAttribute("src");
      video.load();
    };
  }, [sessionKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHls) return;

    if (!Hls.isSupported()) {
      if (!video.canPlayType("application/vnd.apple.mpegurl")) {
        setPlaybackError("HLS is not supported in this browser.");
      }
      return;
    }

    const hls = new Hls({
      autoStartLoad: false,
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferHole: 0.6,
      startFragPrefetch: true,
    });
    hlsRef.current = hls;
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      const videoEl = videoRef.current;
      if (!data.fatal) return;

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hlsNetworkRetriesRef.current += 1;
        if (hlsNetworkRetriesRef.current <= 3) {
          hls.recoverMediaError();
          return;
        }
      }

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        const resumeAt = videoEl
          ? resolveResumeSeconds(videoEl, startAtSecondsRef.current)
          : Number(startAtSecondsRef.current || 0);
        hlsNetworkRetriesRef.current += 1;
        if (hlsNetworkRetriesRef.current <= 2 && resumeAt > 0) {
          hls.startLoad(Math.max(0, resumeAt - 0.25));
          return;
        }
        const now = Date.now();
        if (hlsNetworkRetriesRef.current <= 4 && now - freshSrcCooldownRef.current > 8000) {
          freshSrcCooldownRef.current = now;
          setBuffering(true);
          onNeedFreshSrcRef.current?.();
          return;
        }
      }

      const detail =
        data.type === Hls.ErrorTypes.NETWORK_ERROR
          ? "Network error loading HLS — check the video R2 path in admin (index.m3u8 + segments) and that R2 credentials are set on the backend."
          : data.type === Hls.ErrorTypes.MEDIA_ERROR
            ? "Media error — check segment files in R2 match the manifest."
            : "HLS playback error — try refreshing the page.";
      setPlaybackError(detail);
      hls.destroy();
      hlsRef.current = null;
    });
    hls.on(Hls.Events.FRAG_LOADED, () => {
      hlsNetworkRetriesRef.current = 0;
      setBuffering(false);
    });

    if (srcRef.current) {
      loadHlsSource(srcRef.current, { isHotSwap: false });
    }

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [sessionKey, isHls, loadHlsSource]);

  useEffect(() => {
    if (!isHls || !src) return;
    if (!hlsRef.current) return;
    if (appliedSrcRef.current === src && appliedRevisionRef.current === srcRevision) return;
    loadHlsSource(src, { isHotSwap: true });
  }, [src, srcRevision, isHls, loadHlsSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || isHls) return;
    if (appliedSrcRef.current === src && appliedRevisionRef.current === srcRevision) return;

    const isHotSwap = appliedSrcRef.current !== null;
    appliedSrcRef.current = src;
    appliedRevisionRef.current = srcRevision;

    if (isHotSwap) {
      setPlaybackError(null);
      suppressNextSeekEventRef.current = true;
      const savedTime = resolveResumeSeconds(video, startAtSecondsRef.current);
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (savedTime > 0 && duration > 0) {
        prefetchPlaybackNearTime(src, savedTime, duration);
      }
      hotSwapVideoSrc(video, src);
      return;
    }

    lateResumeAppliedKeyRef.current = "";
    setPlaybackError(null);
    clearPlaybackByteLengthCache(src);
    warmPlaybackHeader(src);
    video.src = src;
    video.load();
  }, [src, srcRevision, sessionKey, isHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !seekRequest || !Number.isFinite(seekRequest.seconds)) return;
    const applySeek = () => {
      const duration = Number(video.duration || 0);
      if (!Number.isFinite(duration) || duration <= 0) return;
      const target = Math.min(Math.max(0, seekRequest.seconds), Math.max(0, duration - 0.05));
      suppressNextSeekEventRef.current = true;
      video.currentTime = target;
      if (seekRequest.autoplay) {
        void video.play().catch(() => {
          // Browser autoplay restrictions may block this in some states.
        });
      }
    };
    if (Number.isFinite(video.duration) && video.duration > 0) {
      applySeek();
      return;
    }
    const onLoadedMetadata = () => applySeek();
    video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [seekRequest]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || isHls) return;
    const start = Number(startAtSeconds || 0);
    if (!(start > 0)) return;
    const dur = Number(video.duration || 0);
    if (!Number.isFinite(dur) || dur <= 0) return;
    const target = Math.min(Math.max(0, start), Math.max(0, dur - 0.05));
    if (!(target > 4)) return;

    const key = lateResumeKey(src, start);
    if (lateResumeAppliedKeyRef.current === key) return;

    const cur = Number(video.currentTime || 0);
    if (!Number.isFinite(cur)) return;
    if (Math.abs(cur - target) < 2.5) {
      lateResumeAppliedKeyRef.current = key;
      return;
    }
    if (cur > 8) {
      lateResumeAppliedKeyRef.current = key;
      return;
    }

    suppressNextSeekEventRef.current = true;
    video.currentTime = target;
    lateResumeAppliedKeyRef.current = key;
  }, [startAtSeconds, src, isHls]);

  return (
    <div
      className={cn(
        "relative isolate mx-auto max-h-[min(58vh,640px)] max-w-full w-auto overflow-hidden sm:max-h-[min(62vh,720px)]",
        className
      )}
      style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(120%_85%_at_18%_0%,rgba(245,200,20,0.26),transparent_52%),radial-gradient(95%_75%_at_100%_100%,rgba(34,211,238,0.24),transparent_55%),linear-gradient(160deg,rgba(0,0,0,0.88),rgba(7,7,12,0.95))]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.16)_34%,transparent_52%)] opacity-55"
        aria-hidden
      />
      {playbackError ? (
        <div className="absolute inset-x-0 bottom-0 z-[2] border-t border-red-500/40 bg-red-950/85 px-3 py-2 text-center text-[12px] leading-snug text-red-100/95">
          {playbackError}
        </div>
      ) : null}
      {buffering ? (
        <div
          className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black/35"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
            Buffering…
          </span>
        </div>
      ) : null}
      <video
        ref={videoRef}
        className="relative z-[1] h-full w-full bg-transparent object-contain [accent-color:#ef4444]"
        controls
        preload={isHls ? "auto" : "metadata"}
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
