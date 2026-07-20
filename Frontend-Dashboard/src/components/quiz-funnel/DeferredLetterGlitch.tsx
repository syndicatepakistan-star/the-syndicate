"use client";

import { LoopBgVideo } from "@/components/marketing/LoopBgVideo";
import { useMatchMedia } from "@/hooks/useMatchMedia";

/** Quiz / funnel background — compressed bg.mp4 loop (replaces LetterGlitch canvas). */
export default function DeferredLetterGlitch(_props: Record<string, unknown>) {
  const reduced = useMatchMedia("(prefers-reduced-motion: reduce)");
  if (reduced) {
    return <div className="quiz-glitch-canvas absolute inset-0 bg-[#050814]" aria-hidden />;
  }
  return (
    <LoopBgVideo
      className="quiz-glitch-canvas absolute inset-0 h-full w-full"
      scrimOpacity={0.5}
      videoOpacity={0.75}
    />
  );
}
