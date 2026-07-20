"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";

/** Compressed ~2s loop used on public hero/footer (and shared with dashboard shell). */
export const MARKETING_LOOP_BG_VIDEO = "/assets/bg.mp4";

const POSTER_GRADIENT =
  "radial-gradient(ellipse 90% 70% at 50% 15%, rgba(34,211,238,0.16), transparent 58%), radial-gradient(ellipse 80% 55% at 85% 78%, rgba(245,158,11,0.12), transparent 52%), linear-gradient(180deg, #070a12 0%, #030407 55%, #000 100%)";

type LoopBgVideoProps = {
  className?: string;
  /** Overlay darkness over the video (0–1). */
  scrimOpacity?: number;
  /** Video layer opacity (0–1). */
  videoOpacity?: number;
};

/**
 * Infinite muted background loop for hero/footer.
 * Plays on mobile + desktop; pauses when off-screen or tab hidden; respects reduced motion (poster only).
 */
export function LoopBgVideo({
  className,
  scrimOpacity = 0.55,
  videoOpacity = 0.85,
}: LoopBgVideoProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const video = videoRef.current;
    if (!host || !video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let started = false;

    const syncPlay = () => {
      if (reduced.matches || document.visibilityState === "hidden" || !visible) {
        if (!video.paused) video.pause();
        return;
      }
      video.muted = true;
      video.defaultMuted = true;
      if (!started) {
        started = true;
        video.preload = "auto";
      }
      void video.play().catch(() => {
        started = false;
      });
    };

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
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduced.removeEventListener("change", onReduced);
      video.pause();
    };
  }, []);

  return (
    <div ref={hostRef} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 z-0" style={{ background: POSTER_GRADIENT }} />
      <video
        ref={videoRef}
        className="absolute inset-0 z-[1] h-full w-full object-cover"
        style={{ opacity: videoOpacity }}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        poster=""
      >
        <source src={MARKETING_LOOP_BG_VIDEO} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 z-[2] bg-black"
        style={{ opacity: scrimOpacity }}
      />
    </div>
  );
}
