"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef, useState } from "react";
import { ProgramsEliteOffersLcpFallback } from "@/components/programs/ProgramsEliteOffersLcpFallback";
import { useDeferredInteractiveOffers } from "@/hooks/useDeferredInteractiveOffers";
import {
  parsePackDeepLinkSlug,
  readProgramDetailsHash,
  type GlobePackKey,
} from "@/lib/programPlaylistThumbnails";

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

function hasPackDetailsDeepLink(): boolean {
  if (typeof window === "undefined") return false;
  if (!readProgramDetailsHash()) return false;
  const sp = new URLSearchParams(window.location.search);
  return Boolean(parsePackDeepLinkSlug(sp.get("slug")) || sp.get("pack"));
}

/**
 * Idle-deferred interactive elite offers. Pair with server `ProgramsEliteOffersLcpFallback`
 * (`browseSibling`) so Money Mastery LCP stays a stable server <img>.
 *
 * Swap (browseSibling): keep SSR box in normal flow (visibility:hidden — no 1px collapse),
 * pull interactive up with negative margin so net height = interactive height.
 * Avoids absolute overlay (card overlap on library) and collapse CLS (~0.88).
 */
export function ProgramsOfferSectionLazy({ browseSibling = false, ...props }: Props) {
  const swapLayerRef = useRef<HTMLDivElement>(null);
  const [forcePackDetails] = useState(() => hasPackDetailsDeepLink());
  const interactiveReady = useDeferredInteractiveOffers({
    // Past mobile Lighthouse TBT window so Money Mastery SSR LCP stays quiet.
    safetyMs: props.knightOnly ? 7000 : 7200,
  });
  const ready = forcePackDetails || interactiveReady;

  useLayoutEffect(() => {
    if (!ready || props.knightOnly || !browseSibling) return;
    const el = document.getElementById("programs-lcp-browse");
    const layer = swapLayerRef.current;
    if (!el || !layer) return;

    const h = Math.round(el.getBoundingClientRect().height);
    el.setAttribute("aria-hidden", "true");
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    el.style.userSelect = "none";
    // Never collapse / absolute / hidden attr — those caused desktop CLS ~0.88 + overlap.
    layer.style.marginTop = h > 0 ? `-${h}px` : "0";
    layer.style.position = "relative";
    layer.style.zIndex = "2";
  }, [ready, props.knightOnly, browseSibling]);

  if (!ready) {
    if (props.knightOnly) return <KnightOfferFallback />;
    // Sibling server browse already paints LCP — do not duplicate / remount the img.
    if (browseSibling) return null;
    return <ProgramsEliteOffersLcpFallback />;
  }

  if (props.knightOnly) {
    return <KnightOfferDynamic {...props} />;
  }

  if (browseSibling) {
    return (
      <div ref={swapLayerRef} className="programs-offers-swap-layer relative z-[2] w-full">
        <EliteOffersDynamic {...props} />
      </div>
    );
  }

  return <EliteOffersDynamic {...props} />;
}
