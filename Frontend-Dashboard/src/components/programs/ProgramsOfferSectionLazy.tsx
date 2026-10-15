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

function isDesktopViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(min-width: 768px)").matches
  );
}

/** Mobile — unchanged: collapse SSR browse out of paint (works on Slow 4G lab). */
function hideSsrBrowseSiblingMobile() {
  const el = document.getElementById("programs-lcp-browse");
  if (!el) return;
  el.setAttribute("hidden", "");
  el.setAttribute("aria-hidden", "true");
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style.position = "absolute";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.overflow = "hidden";
  el.style.clipPath = "inset(50%)";
}

/**
 * Desktop — keep SSR box in flow (visibility only) + pull interactive up.
 * Collapsing to 1px is the desktop CLS ~0.88 culprit in Lighthouse.
 */
function swapSsrBrowseSiblingDesktop(layer: HTMLElement) {
  const el = document.getElementById("programs-lcp-browse");
  if (!el) return;
  const h = Math.round(el.getBoundingClientRect().height);
  el.setAttribute("aria-hidden", "true");
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style.userSelect = "none";
  layer.style.marginTop = h > 0 ? `-${h}px` : "0";
  layer.style.position = "relative";
  layer.style.zIndex = "2";
}

function hasPackDetailsDeepLink(): boolean {
  if (typeof window === "undefined") return false;
  if (!readProgramDetailsHash()) return false;
  const sp = new URLSearchParams(window.location.search);
  return Boolean(parsePackDeepLinkSlug(sp.get("slug")) || sp.get("pack"));
}

/**
 * Idle-deferred interactive elite offers. Pair with server `ProgramsEliteOffersLcpFallback`
 * (`browseSibling`) so Money Mastery LCP stays a stable server <img>.
 * Pack `#details` deep links mount immediately so checkout-return URLs open Money Mastery
 * (not a Level-1 library modal).
 *
 * Desktop browseSibling: interaction-only mount + non-collapsing swap (CLS fix).
 * Mobile: existing safety timer + 1px hide (untouched).
 */
export function ProgramsOfferSectionLazy({ browseSibling = false, ...props }: Props) {
  const desktopSwapRef = useRef<HTMLDivElement>(null);
  /** Latch desktop once on client — mobile path never enters desktop swap/hide. */
  const [desktopBrowse] = useState(
    () => Boolean(browseSibling && !props.knightOnly && isDesktopViewport()),
  );
  const [forcePackDetails] = useState(() => hasPackDetailsDeepLink());
  const interactiveReady = useDeferredInteractiveOffers({
    // Mobile unchanged. Desktop browse: no auto idle (see desktopInteractionOnly).
    safetyMs: props.knightOnly ? 7000 : 6800,
    desktopInteractionOnly: desktopBrowse,
  });
  const ready = forcePackDetails || interactiveReady;

  useLayoutEffect(() => {
    if (!ready || props.knightOnly) return;
    if (desktopBrowse) {
      const layer = desktopSwapRef.current;
      if (layer) swapSsrBrowseSiblingDesktop(layer);
      return;
    }
    hideSsrBrowseSiblingMobile();
  }, [ready, props.knightOnly, desktopBrowse]);

  if (!ready) {
    if (props.knightOnly) return <KnightOfferFallback />;
    // Sibling server browse already paints LCP — do not duplicate / remount the img.
    if (browseSibling) return null;
    return <ProgramsEliteOffersLcpFallback />;
  }

  if (props.knightOnly) {
    return <KnightOfferDynamic {...props} />;
  }

  // Desktop: negative-margin pull-up (no 1px collapse). Mobile: bare section + mobile hide.
  if (desktopBrowse) {
    return (
      <div ref={desktopSwapRef} className="programs-offers-desktop-swap relative z-[2] w-full">
        <EliteOffersDynamic {...props} />
      </div>
    );
  }

  return <EliteOffersDynamic {...props} />;
}
