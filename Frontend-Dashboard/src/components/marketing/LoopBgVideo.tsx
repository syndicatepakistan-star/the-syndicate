"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";

/** Compressed ~2s loop used on public hero/footer (and shared with dashboard shell). */
export const MARKETING_LOOP_BG_VIDEO = "/assets/bg.mp4";
/** Explicit quiz / marketing alias (same compressed encode). */
export const QUIZ_LOOP_BG_VIDEO = "/assets/bg-loop.mp4";

const POSTER_GRADIENT =
  "radial-gradient(ellipse 90% 70% at 50% 15%, rgba(34,211,238,0.16), transparent 58%), radial-gradient(ellipse 80% 55% at 85% 78%, rgba(245,158,11,0.12), transparent 52%), linear-gradient(180deg, #070a12 0%, #030407 55%, #000 100%)";

const MOBILE_STATIC_MQ = "(max-width: 767px)";

type LoopBgVideoProps = {
  className?: string;
  /** MP4 path (defaults to compressed marketing loop). */
  src?: string;
  /** Overlay darkness over the video (0–1). */
  scrimOpacity?: number;
  /** Video layer opacity (0–1). */
  videoOpacity?: number;
  /**
   * Wait this many ms before attaching/playing the video (poster gradient only until then).
   * Use on mobile heroes so LCP logo/CSS win the network.
   */
  deferPlayMs?: number;
  /**
   * On phones: never mount/fetch the MP4 — poster gradient only (Slow 4G / LH media payload).
   * Default true. Desktop / tablet still play the loop.
   */
  preferStaticOnMobile?: boolean;
};

/**
 * Infinite muted background loop for hero/footer/quiz.
 * Mobile: static poster only when preferStaticOnMobile (default).
 * Desktop: plays when on-screen; pauses when off-screen / tab hidden / reduced motion.
 */
export function LoopBgVideo({
  className,
  src = MARKETING_LOOP_BG_VIDEO,
  scrimOpacity = 0.55,
  videoOpacity = 0.85,
  deferPlayMs = 0,
  preferStaticOnMobile = true,
}: LoopBgVideoProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [staticOnly, setStaticOnly] = useState(preferStaticOnMobile);

  useEffect(() => {
    if (!preferStaticOnMobile) {
      setStaticOnly(false);
      return;
    }
    const narrow = window.matchMedia(MOBILE_STATIC_MQ);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStaticOnly(narrow.matches || reduced.matches);
    sync();
    narrow.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [preferStaticOnMobile]);

  useEffect(() => {
    if (staticOnly) return;

    const host = hostRef.current;
    const video = videoRef.current;
    if (!host || !video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let started = false;
    let armed = deferPlayMs <= 0;
    let deferTimer: number | undefined;
    let cancelled = false;

    const syncPlay = () => {
      if (cancelled || !armed) return;
      if (reduced.matches || document.visibilityState === "hidden" || !visible) {
        if (!video.paused) video.pause();
        return;
      }
      video.muted = true;
      video.defaultMuted = true;
      if (!started) {
        started = true;
        video.preload = "auto";
        if (!video.currentSrc && !video.querySelector("source")) {
          const source = document.createElement("source");
          source.src = src;
          source.type = "video/mp4";
          video.appendChild(source);
          video.load();
        }
      }
      void video.play().catch(() => {
        started = false;
      });
    };

    const arm = () => {
      if (cancelled || armed) return;
      armed = true;
      syncPlay();
    };

    if (!armed) {
      deferTimer = window.setTimeout(arm, deferPlayMs);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        syncPlay();
      },
      { rootMargin: "80px 0px", threshold: 0.01 },
    );
    io.observe(host);

    const onVis = () => syncPlay();
    const onReduced = () => syncPlay();
    document.addEventListener("visibilitychange", onVis);
    reduced.addEventListener("change", onReduced);
    syncPlay();

    return () => {
      cancelled = true;
      if (deferTimer != null) window.clearTimeout(deferTimer);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduced.removeEventListener("change", onReduced);
      video.pause();
    };
  }, [src, deferPlayMs, staticOnly]);

  const deferSource = deferPlayMs > 0;

  return (
    <div ref={hostRef} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 z-0" style={{ background: POSTER_GRADIENT }} />
      {!staticOnly ? (
        <video
          ref={videoRef}
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          style={{ opacity: videoOpacity }}
          muted
          loop
          playsInline
          autoPlay={!deferSource}
          preload={deferSource ? "none" : "metadata"}
          poster=""
        >
          {!deferSource ? <source src={src} type="video/mp4" /> : null}
        </video>
      ) : null}
      <div
        className="absolute inset-0 z-[2] bg-black"
        style={{ opacity: scrimOpacity }}
      />
    </div>
  );
}
