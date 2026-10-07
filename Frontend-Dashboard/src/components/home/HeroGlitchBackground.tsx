"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Compressed matrix still for home hero on phones (~44KB WebP). */
export const HOME_HERO_MOBILE_BG = "/assets/hero-matrix-mobile.webp";

type HeroGlitchBackgroundProps = {
  className?: string;
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  glitchColors?: string[];
  layerOpacity?: number;
};

const LoopBgVideo = dynamic(
  () => import("@/components/marketing/LoopBgVideo").then((m) => m.LoopBgVideo),
  { ssr: false },
);

/**
 * Home hero background:
 * - Mobile: matrix image via `.home-hero-mobile-bg` (critical CSS in page.tsx)
 * - Desktop: looping `/assets/bg.mp4` (lazy chunk — not on mobile JS graph)
 */
export function HeroGlitchBackground({ className }: HeroGlitchBackgroundProps) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div className="home-hero-mobile-bg absolute inset-0 z-[1] md:hidden" />
      {!isMobile ? (
        <LoopBgVideo
          className="z-[1] h-full w-full min-w-0"
          scrimOpacity={0}
          videoOpacity={0.9}
          preferStaticOnMobile={false}
          deferPlayMs={3000}
        />
      ) : null}
      <div className="absolute inset-0 z-[2] bg-black/45" />
    </div>
  );
}
