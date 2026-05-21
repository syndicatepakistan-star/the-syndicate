"use client";

import LetterGlitch from "@/components/LetterGlitch";
import type { ComponentProps } from "react";

type HeroGlitchBackgroundProps = ComponentProps<typeof LetterGlitch>;

/** Animated glitch canvas (placeholder is server-rendered in page.tsx for instant paint). */
export function HeroGlitchBackground({ className, ...glitchProps }: HeroGlitchBackgroundProps) {
  return (
    <LetterGlitch
      {...glitchProps}
      className={`absolute inset-0 z-[1] h-full w-full min-w-0 ${className ?? ""}`.trim()}
    />
  );
}
