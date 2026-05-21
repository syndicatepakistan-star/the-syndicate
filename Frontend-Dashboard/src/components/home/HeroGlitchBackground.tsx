"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const LetterGlitch = dynamic(() => import("@/components/LetterGlitch"), {
  ssr: false,
  loading: () => null,
});

type HeroGlitchBackgroundProps = ComponentProps<typeof LetterGlitch>;

/** Instant static hero backdrop; animated glitch canvas layers on when the chunk is ready. */
export function HeroGlitchBackground(props: HeroGlitchBackgroundProps) {
  const { className, ...glitchProps } = props;

  return (
    <div className={`hero-glitch-shell absolute inset-0 h-full w-full min-w-0 ${className ?? ""}`.trim()}>
      <div className="hero-glitch-placeholder absolute inset-0 z-0" aria-hidden />
      <LetterGlitch {...glitchProps} className="absolute inset-0 z-[1] h-full w-full min-w-0" />
    </div>
  );
}
