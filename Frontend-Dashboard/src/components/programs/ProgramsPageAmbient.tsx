"use client";

import { useDeferredVisualEffects } from "@/hooks/useDeferredVisualEffects";
import { useLiteVisualViewport } from "@/hooks/useLiteVisualViewport";
import { cn } from "@/components/dashboard/dashboardPrimitives";

/**
 * Soft page orbs — desktop only after deferred ready.
 * Mobile/iPad: skipped (paint/TBT compromise; layout unchanged).
 */
export function ProgramsPageAmbient() {
  const fxReady = useDeferredVisualEffects();
  const liteViewport = useLiteVisualViewport();

  if (liteViewport) return null;

  return (
    <div
      className={cn(
        "programs-page-ambient pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-500",
        fxReady ? "opacity-100" : "opacity-0",
      )}
      aria-hidden
    >
      {fxReady ? (
        <>
          <div className="programs-page-ambient__orb programs-page-ambient__orb--fuchsia absolute left-[-12%] top-[10%] h-[280px] w-[280px] rounded-full sm:h-[420px] sm:w-[420px]" />
          <div className="programs-page-ambient__orb programs-page-ambient__orb--amber absolute right-[-8%] top-[38%] h-[260px] w-[260px] rounded-full sm:h-[380px] sm:w-[380px]" />
          <div className="programs-page-ambient__orb programs-page-ambient__orb--cyan absolute bottom-[-10%] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full sm:h-[440px] sm:w-[440px]" />
        </>
      ) : null}
    </div>
  );
}
