"use client";

import { useEffect, useRef, useState } from "react";
import { isVideoWarm, warmVideo } from "@/lib/mediaWarmCache";

export const DASHBOARD_MAIN_BG_VIDEO = "/assets/dashboard/bg.mp4";

type DashboardShellBackgroundProps = {
  /** `contained` = main referral/content panel only; `viewport` = legacy full-screen (avoid). */
  variant?: "contained" | "viewport";
  /** Video layer opacity (CSS also targets `.dashboard-main-shell-video`). */
  opacity?: number;
};

/** Cover video behind dashboard main content — not navbar or sidebar. */
export function DashboardShellBackground({
  variant = "contained",
  opacity = 0.2,
}: DashboardShellBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const [skipVideo, setSkipVideo] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSkipVideo(narrow.matches || reduced.matches);
    sync();
    narrow.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (skipVideo) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("playsinline", "");

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

    void warmVideo(DASHBOARD_MAIN_BG_VIDEO).finally(startOnce);

    if (isVideoWarm(DASHBOARD_MAIN_BG_VIDEO) && el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      startOnce();
    } else {
      el.addEventListener("canplay", startOnce, { once: true });
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      el.removeEventListener("canplay", startOnce);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [skipVideo]);

  const positionClass =
    variant === "viewport"
      ? "pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
      : "dashboard-main-shell-bg pointer-events-none col-start-1 row-start-1 z-0 min-h-full w-full overflow-hidden rounded-[inherit] bg-transparent";

  return (
    <div className={positionClass} aria-hidden>
      {skipVideo ? (
        <div
          className="absolute inset-0 z-[0]"
          style={{
            opacity,
            background:
              "radial-gradient(ellipse 90% 70% at 50% 15%, rgba(34,211,238,0.16), transparent 58%), radial-gradient(ellipse 80% 55% at 85% 78%, rgba(245,158,11,0.12), transparent 52%), linear-gradient(180deg, #070a12 0%, #030407 55%, #000 100%)",
          }}
        />
      ) : (
        <video
          ref={videoRef}
          data-dashboard-bg-video
          className="dashboard-main-shell-video absolute inset-0 z-[0] h-full min-h-full w-full min-w-full object-cover"
          style={{ opacity }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={DASHBOARD_MAIN_BG_VIDEO} type="video/mp4" />
        </video>
      )}
      {/* Scrim sits on the video layer only — content scroll stays above at z-[2] */}
      <div className="dashboard-main-shell-video-scrim pointer-events-none absolute inset-0 z-[1] bg-black/25" aria-hidden />
    </div>
  );
}
