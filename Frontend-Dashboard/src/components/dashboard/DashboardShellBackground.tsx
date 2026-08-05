"use client";

import { useEffect, useRef, useState } from "react";

export const DASHBOARD_MAIN_BG_VIDEO = "/assets/bg.mp4";
/** Static stand-in so LCP is not the mp4 element. */
export const DASHBOARD_MAIN_BG_POSTER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs>
        <radialGradient id="a" cx="50%" cy="15%" r="70%">
          <stop offset="0%" stop-color="#0e7490" stop-opacity="0.35"/>
          <stop offset="55%" stop-color="#070a12" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="b" cx="85%" cy="78%" r="55%">
          <stop offset="0%" stop-color="#b45309" stop-opacity="0.22"/>
          <stop offset="50%" stop-color="#030407" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#070a12"/>
          <stop offset="55%" stop-color="#030407"/>
          <stop offset="100%" stop-color="#000"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#c)"/>
      <rect width="1600" height="900" fill="url(#a)"/>
      <rect width="1600" height="900" fill="url(#b)"/>
    </svg>`,
  );

type DashboardShellBackgroundProps = {
  /** `contained` = main referral/content panel only; `viewport` = legacy full-screen (avoid). */
  variant?: "contained" | "viewport";
  /** Video layer opacity (CSS also targets `.dashboard-main-shell-video`). */
  opacity?: number;
  /** Never mount the letter-rain mp4 (programs route / reduced motion / lite). */
  disabled?: boolean;
};

const SHELL_GRADIENT =
  "radial-gradient(ellipse 90% 70% at 50% 15%, rgba(34,211,238,0.16), transparent 58%), radial-gradient(ellipse 80% 55% at 85% 78%, rgba(245,158,11,0.12), transparent 52%), linear-gradient(180deg, #070a12 0%, #030407 55%, #000 100%)";

/** Cover video behind dashboard main content — not navbar or sidebar. */
export function DashboardShellBackground({
  variant = "contained",
  opacity = 0.22,
  disabled = false,
}: DashboardShellBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  /** Start true so SSR + first paint use the poster/gradient (never the mp4 as LCP). */
  const [allowVideo, setAllowVideo] = useState(false);
  const [skipVideo, setSkipVideo] = useState(true);

  useEffect(() => {
    if (disabled) {
      setSkipVideo(true);
      setAllowVideo(false);
      return;
    }

    // Phone + iPad + large tablets: never load letter-rain mp4 (Lighthouse + scroll).
    const narrow = window.matchMedia("(max-width: 1280px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let safetyId: number | undefined;
    let interactionCleanups: Array<() => void> = [];

    const clearInteraction = () => {
      interactionCleanups.forEach((fn) => fn());
      interactionCleanups = [];
      if (safetyId !== undefined) {
        window.clearTimeout(safetyId);
        safetyId = undefined;
      }
    };

    const sync = () => {
      clearInteraction();
      const skip = narrow.matches || reduced.matches;
      setSkipVideo(skip);
      if (skip) {
        setAllowVideo(false);
        return;
      }
      // Wide desktop only: wait for interaction or long idle — never on first paint.
      const activate = () => {
        if (narrow.matches || reduced.matches) return;
        clearInteraction();
        setAllowVideo(true);
      };
      const opts: AddEventListenerOptions = { once: true, passive: true };
      window.addEventListener("pointerdown", activate, opts);
      window.addEventListener("touchstart", activate, opts);
      window.addEventListener("keydown", activate, opts);
      window.addEventListener("scroll", activate, opts);
      interactionCleanups = [
        () => window.removeEventListener("pointerdown", activate),
        () => window.removeEventListener("touchstart", activate),
        () => window.removeEventListener("keydown", activate),
        () => window.removeEventListener("scroll", activate),
      ];
      safetyId = window.setTimeout(activate, 12000);
    };

    sync();
    narrow.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      clearInteraction();
      narrow.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [disabled]);

  useEffect(() => {
    if (skipVideo || !allowVideo) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("playsinline", "");
    el.preload = "none";

    const startOnce = () => {
      if (document.visibilityState === "hidden") return;
      if (startedRef.current && !el.paused) return;
      startedRef.current = true;
      void el.play().catch(() => {
        startedRef.current = false;
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (!el.paused) el.pause();
        return;
      }
      if (el.paused) void el.play().catch(() => {});
    };

    const ric =
      window.requestIdleCallback ??
      ((cb: IdleRequestCallback) => window.setTimeout(() => cb({} as IdleDeadline), 2200));
    const idleId = ric.call(
      window,
      () => {
        el.preload = "metadata";
        if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          startOnce();
        } else {
          el.addEventListener("canplay", startOnce, { once: true });
          el.load();
        }
      },
      { timeout: 6500 },
    );

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (typeof window.cancelIdleCallback === "function" && typeof idleId === "number") {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId as number);
      }
      el.removeEventListener("canplay", startOnce);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [skipVideo, allowVideo]);

  const positionClass =
    variant === "viewport"
      ? "pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
      : "dashboard-main-shell-bg pointer-events-none col-start-1 row-start-1 z-0 min-h-full w-full overflow-hidden rounded-[inherit] bg-transparent";

  const showVideo = allowVideo && !skipVideo;

  return (
    <div className={positionClass} aria-hidden>
      <div
        className="dashboard-main-shell-poster absolute inset-0 z-[0]"
        style={{
          opacity,
          background: SHELL_GRADIENT,
          backgroundImage: `url("${DASHBOARD_MAIN_BG_POSTER}"), ${SHELL_GRADIENT}`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {showVideo ? (
        <video
          ref={videoRef}
          data-dashboard-bg-video
          className="dashboard-main-shell-video absolute inset-0 z-[0] h-full min-h-full w-full min-w-full object-cover"
          style={{ opacity }}
          muted
          loop
          playsInline
          preload="none"
          poster={DASHBOARD_MAIN_BG_POSTER}
        >
          <source src={DASHBOARD_MAIN_BG_VIDEO} type="video/mp4" />
        </video>
      ) : null}
      <div className="dashboard-main-shell-video-scrim pointer-events-none absolute inset-0 z-[1] bg-black/25" aria-hidden />
    </div>
  );
}
