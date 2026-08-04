"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ProgramsEliteOffersLcpFallback } from "@/components/programs/ProgramsEliteOffersLcpFallback";
import type { GlobePackKey } from "@/lib/programPlaylistThumbnails";

type Props = {
  size?: "large" | "compact";
  shellHosted?: boolean;
  omitKnight?: boolean;
  knightOnly?: boolean;
  highlightPack?: GlobePackKey;
};

function KnightOfferFallback() {
  return (
    <div
      className="mx-auto min-h-[min(70vh,30rem)] w-full max-w-lg animate-pulse rounded-3xl bg-white/[0.04]"
      aria-hidden
    />
  );
}

/**
 * Client-only offers mount after first paint so Money Mastery LCP (SSR fallback)
 * can paint before the heavy unlock/browse chunk competes for main thread.
 */
const EliteOffersDynamic = dynamic(
  () => import("@/components/programs/ProgramsOfferSection").then((m) => m.ProgramsOfferSection),
  {
    ssr: false,
    loading: () => <ProgramsEliteOffersLcpFallback />,
  },
);

const KnightOfferDynamic = dynamic(
  () => import("@/components/programs/ProgramsOfferSection").then((m) => m.ProgramsOfferSection),
  {
    ssr: false,
    loading: () => <KnightOfferFallback />,
  },
);

export function ProgramsOfferSectionLazy(props: Props) {
  const [interactiveReady, setInteractiveReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    let raf2 = 0;

    const start = () => {
      if (!cancelled) setInteractiveReady(true);
    };

    // Two frames: commit SSR LCP fallback paint, then schedule heavy JS.
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (typeof window.requestIdleCallback === "function") {
          idleHandle = window.requestIdleCallback(start, { timeout: 900 });
        } else {
          timeoutHandle = window.setTimeout(start, 50);
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, []);

  if (!interactiveReady) {
    return props.knightOnly ? <KnightOfferFallback /> : <ProgramsEliteOffersLcpFallback />;
  }

  if (props.knightOnly) {
    return <KnightOfferDynamic {...props} />;
  }
  return <EliteOffersDynamic {...props} />;
}
