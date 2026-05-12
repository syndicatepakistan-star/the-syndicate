"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";

export type StreamHtmlPlayerLayoutMode = "auto" | "landscape" | "portrait";

type Props = {
  /** Absolute playback URL (S3 presigned GET or signed Django proxy URL). */
  src: string;
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
};

function lateResumeKey(src: string, startSeconds: number): string {
  return `${src}::${Number(startSeconds).toFixed(3)}`;
}

/**
 * HTML5 MP4 playback for signed URLs (no HLS / MSE).
 * Binds listeners and loads `src` only when `src` changes — not when resume/progress props change.
 */
export default function StreamHtmlVideoPlayer({
  src,
  className,
  onMetadata,
  playerLayout = "auto",
  sourceWidth = null,
  sourceHeight = null,
  onTimeProgress,
  onPlaybackEnded,
  startAtSeconds = 0,
  onSeekSegment,
  seekRequest = null
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const onMetadataRef = useRef(onMetadata);
  const startAtSecondsRef = useRef(startAtSeconds);
  const onTimeProgressRef = useRef(onTimeProgress);
  const onPlaybackEndedRef = useRef(onPlaybackEnded);
  const onSeekSegmentRef = useRef(onSeekSegment);
  const suppressNextSeekEventRef = useRef(false);
  const lastSeekStartRef = useRef(0);
  /** Prevents duplicate resume seeks (metadata handler + late hydration effect). */
  const lateResumeAppliedKeyRef = useRef("");

  useEffect(() => {
    onMetadataRef.current = onMetadata;
  }, [onMetadata]);

  startAtSecondsRef.current = startAtSeconds;
  onTimeProgressRef.current = onTimeProgress;
  onPlaybackEndedRef.current = onPlaybackEnded;
  onSeekSegmentRef.current = onSeekSegment;

  useEffect(() => {
    setMeasured(null);
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
    if (!video || !src) return;

    lateResumeAppliedKeyRef.current = "";

    const emitMetadata = () => {
      const width = Number(video.videoWidth || 0);
      const height = Number(video.videoHeight || 0);
      if (width > 0 && height > 0) {
        setMeasured({ width, height });
        onMetadataRef.current?.({ width, height });
      }
      const start = Number(startAtSecondsRef.current || 0);
      if (start > 0 && Number.isFinite(video.duration) && video.duration > 0) {
        const target = Math.min(Math.max(0, start), Math.max(0, video.duration - 0.05));
        if (target > 0) {
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

    video.src = src;
    video.load();

    video.addEventListener("loadedmetadata", emitMetadata);
    video.addEventListener("timeupdate", emitTimeProgress);
    video.addEventListener("ended", emitEnded);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);

    return () => {
      video.removeEventListener("loadedmetadata", emitMetadata);
      video.removeEventListener("timeupdate", emitTimeProgress);
      video.removeEventListener("ended", emitEnded);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

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

  /**
   * When `startAtSeconds` arrives after `loadedmetadata`, seek once if still near the start
   * and we have not already applied the same resume key (avoids double-seek stutter).
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
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
  }, [startAtSeconds, src]);

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
      <video
        ref={videoRef}
        className="relative z-[1] h-full w-full bg-transparent object-contain [accent-color:#ef4444]"
        controls
        preload="auto"
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
