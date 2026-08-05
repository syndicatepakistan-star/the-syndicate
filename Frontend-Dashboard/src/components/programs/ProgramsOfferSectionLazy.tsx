"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect } from "react";
import { ProgramsEliteOffersLcpFallback } from "@/components/programs/ProgramsEliteOffersLcpFallback";
import { useDeferredInteractiveOffers } from "@/hooks/useDeferredInteractiveOffers";
import type { GlobePackKey } from "@/lib/programPlaylistThumbnails";

type Props = {
  size?: "large" | "compact";
  shellHosted?: boolean;
  omitKnight?: boolean;
  knightOnly?: boolean;
  highlightPack?: GlobePackKey;
  /**
   * When true, SSR browse card is a sibling Server Component (`#programs-lcp-browse`).
   * This island returns null until idle so LCP <img> is never remounted by this client tree.
   */
  browseSibling?: boolean;
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
 * Code-split offers — mount only after idle/interaction (no `ssr: false` bomb).
 * Default dynamic SSR is fine when mounted; we simply do not mount during TBT window.
 */
const EliteOffersDynamic = dynamic(
  () => import("@/components/programs/ProgramsOfferSection").then((m) => m.ProgramsOfferSection),
  {
    loading: () => <ProgramsEliteOffersLcpFallback />,
  },
);

const KnightOfferDynamic = dynamic(
  () => import("@/components/programs/ProgramsOfferSection").then((m) => m.ProgramsOfferSection),
  {
    loading: () => <KnightOfferFallback />,
  },
);

function hideSsrBrowseSibling() {
  const el = document.getElementById("programs-lcp-browse");
  if (!el) return;
  el.setAttribute("hidden", "");
  el.style.display = "none";
}

/**
 * Idle-deferred interactive elite offers. Pair with server `ProgramsEliteOffersLcpFallback`
 * (`browseSibling`) so Money Mastery LCP stays a stable server <img>.
 */
export function ProgramsOfferSectionLazy({ browseSibling = false, ...props }: Props) {
  const interactiveReady = useDeferredInteractiveOffers({
    safetyMs: props.knightOnly ? 4500 : 3200,
  });

  useLayoutEffect(() => {
    if (!interactiveReady || props.knightOnly) return;
    hideSsrBrowseSibling();
  }, [interactiveReady, props.knightOnly]);

  if (!interactiveReady) {
    if (props.knightOnly) return <KnightOfferFallback />;
    // Sibling server browse already paints LCP — do not duplicate / remount the img.
    if (browseSibling) return null;
    return <ProgramsEliteOffersLcpFallback />;
  }

  if (props.knightOnly) {
    return <KnightOfferDynamic {...props} />;
  }
  return <EliteOffersDynamic {...props} />;
}
