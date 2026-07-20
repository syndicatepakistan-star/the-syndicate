"use client";

import { LoopBgVideo } from "@/components/marketing/LoopBgVideo";

type HeroGlitchBackgroundProps = {
  className?: string;
  /** Kept for call-site compatibility; canvas glitch was replaced by bg.mp4. */
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  glitchColors?: string[];
  layerOpacity?: number;
};

/** Hero background — compressed looping `/assets/bg.mp4` (replaces LetterGlitch canvas). */
export function HeroGlitchBackground({ className }: HeroGlitchBackgroundProps) {
  return (
    <LoopBgVideo
      className={`z-[1] h-full w-full min-w-0 ${className ?? ""}`.trim()}
      scrimOpacity={0.45}
      videoOpacity={0.9}
    />
  );
}
