"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ProgramsUnlockShell } from "@/components/programs/ProgramsUnlockShell";
import { useDeferredInteractive } from "@/hooks/useDeferredInteractive";

const ProgramsOfferSection = dynamic(
  () => import("@/components/programs/ProgramsOfferSection").then((m) => m.ProgramsOfferSection),
  { loading: () => null },
);

type Props = {
  /** Static chrome above offers (heading + copy) — always visible. */
  eliteChrome: ReactNode;
  /** SSR Money Mastery browse card (LCP). */
  browse: ReactNode;
  /** Library + Knight (+ anything else that needs unlock cart). */
  rest: ReactNode;
};

/**
 * Browse-first /programs body:
 * - Until deferred: elite chrome + SSR Money Mastery card + rest (no unlock JS).
 * - After ~3.2s idle: one UnlockShell with interactive elite offers + rest.
 */
export function ProgramsInteractiveBody({ eliteChrome, browse, rest }: Props) {
  const ready = useDeferredInteractive({ interactionAfterMs: 2500, timeoutMs: 3200 });

  if (!ready) {
    return (
      <>
        <section
          id="syndicate-elite-offers"
          className="programs-page-band mobile-viewport-contain relative z-[2] scroll-mt-24 space-y-4 overflow-visible px-[clamp(0.5rem,2.5vw,1rem)] pt-6 sm:space-y-8 sm:px-[clamp(1rem,3.2vw,1.5rem)] sm:pt-10 2xl:px-[clamp(1.5rem,2vw,2.5rem)]"
        >
          {eliteChrome}
          {browse}
        </section>
        {rest}
      </>
    );
  }

  return (
    <ProgramsUnlockShell>
      <section
        id="syndicate-elite-offers"
        className="programs-page-band mobile-viewport-contain relative z-[2] scroll-mt-24 space-y-4 overflow-visible px-[clamp(0.5rem,2.5vw,1rem)] pt-6 sm:space-y-8 sm:px-[clamp(1rem,3.2vw,1.5rem)] sm:pt-10 2xl:px-[clamp(1.5rem,2vw,2.5rem)]"
      >
        {eliteChrome}
        <ProgramsOfferSection size="large" shellHosted omitKnight />
      </section>
      {rest}
    </ProgramsUnlockShell>
  );
}
