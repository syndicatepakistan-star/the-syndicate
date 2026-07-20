"use client";

import { LoopBgVideo, QUIZ_LOOP_BG_VIDEO } from "@/components/marketing/LoopBgVideo";
import { useMatchMedia } from "@/hooks/useMatchMedia";

/**
 * Quiz funnel background — `/assets/bg-loop.mp4` infinite loop on mobile and desktop.
 * Reduced-motion users get a static gradient only.
 */
export default function DeferredLetterGlitch(_props: Record<string, unknown>) {
  const reduced = useMatchMedia("(prefers-reduced-motion: reduce)");

  if (reduced) {
    return (
      <div
        className="quiz-glitch-canvas absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(45,198,232,0.14),transparent_55%),linear-gradient(180deg,#050814_0%,#02040a_100%)]"
        aria-hidden
      />
    );
  }

  return (
    <LoopBgVideo
      src={QUIZ_LOOP_BG_VIDEO}
      className="quiz-glitch-canvas absolute inset-0 h-full w-full"
      scrimOpacity={0.48}
      videoOpacity={0.88}
    />
  );
}
