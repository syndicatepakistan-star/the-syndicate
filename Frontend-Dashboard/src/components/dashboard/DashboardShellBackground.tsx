"use client";

import { useEffect, useRef } from "react";

const DASHBOARD_BG_VIDEO = "/assets/bg.mp4";

type DashboardShellBackgroundProps = {
  /** `contained` = main referral/content panel only; `viewport` = legacy full-screen (avoid). */
  variant?: "contained" | "viewport";
};

/** Cover video behind dashboard main content — not navbar or sidebar. */
export function DashboardShellBackground({ variant = "contained" }: DashboardShellBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const play = () => {
      void el.play().catch(() => {});
    };
    play();
    el.addEventListener("loadeddata", play);
    return () => el.removeEventListener("loadeddata", play);
  }, []);

  const positionClass =
    variant === "viewport"
      ? "pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
      : "dashboard-main-shell-bg pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] bg-black";

  return (
    <div className={positionClass} aria-hidden>
      <video
        ref={videoRef}
        className="dashboard-main-shell-video absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.1 }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={DASHBOARD_BG_VIDEO} type="video/mp4" />
      </video>
    </div>
  );
}
