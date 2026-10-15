"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useState } from "react";
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
 * Swap without collapsing layout (old 1px/`hidden` path caused desktop CLS ~0.88).
 * SSR stays in normal flow (visibility:hidden keeps its box). Interactive overlays it.
 */
function parkSsrBrowseSibling(): boolean {
  const el = document.getElementById("programs-lcp-browse");
  if (!el) return true;

  const host =
    (document.getElementById("programs-offers-swap-host") as HTMLElement | null) ??
    (el.parentElement as HTMLElement | null);
  const interactive = host?.querySelector<HTMLElement>(
    ".programs-offers-shell:not(#programs-lcp-browse)",
  );
  if (!interactive) return false;

  if (host) {
    host.classList.add("programs-offers-swap-host");
    host.style.position = "relative";
    const lockH = Math.max(el.offsetHeight, interactive.scrollHeight, interactive.offsetHeight, 1);
    host.style.minHeight = `${lockH}px`;
  }

  // Keep SSR box in document flow — never absolute/1px/display:none.
  el.removeAttribute("hidden");
  el.setAttribute("aria-hidden", "true");
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style.position = "";
  el.style.width = "";
  el.style.height = "";
  el.style.overflow = "";
  el.style.clipPath = "";
  el.style.zIndex = "";

  // Interactive sits on top of the reserved SSR footprint.
  interactive.style.position = "absolute";
  interactive.style.left = "0";
  interactive.style.right = "0";
  interactive.style.top = "0";
  interactive.style.width = "100%";
  interactive.style.zIndex = "2";
  interactive.style.margin = "0";
  return true;
}

/** Runs in the same commit as interactive offers mount — before paint. */
function ProgramsOffersSwapPark() {
  useLayoutEffect(() => {
    parkSsrBrowseSibling();
  }, []);
  return null;
}

function hasPackDetailsDeepLink(): boolean {
  if (typeof window === "undefined") return false;
  if (!readProgramDetailsHash()) return false;
  const sp = new URLSearchParams(window.location.search);
  return Boolean(parsePackDeepLinkSlug(sp.get("slug")) || sp.get("pack"));
}

type OfferSectionProps = {
  size?: "large" | "compact";
  shellHosted?: boolean;
  omitKnight?: boolean;
  knightOnly?: boolean;
  highlightPack?: GlobePackKey;
};

const EliteOffersDynamic = dynamic(
  () =>
    import("@/components/programs/ProgramsOfferSection").then((m) => {
      const Section = m.ProgramsOfferSection;
      function EliteOffersWithPark(props: OfferSectionProps) {
        return (
          <>
            <Section {...props} />
            <ProgramsOffersSwapPark />
          </>
        );
      }
      return EliteOffersWithPark;
    }),
  { loading: () => null },
);

const EliteOffersDynamicWithFallback = dynamic(
  () => import("@/components/programs/ProgramsOfferSection").then((m) => m.ProgramsOfferSection),
  { loading: () => <ProgramsEliteOffersLcpFallback /> },
);

const KnightOfferDynamic = dynamic(
  () => import("@/components/programs/ProgramsOfferSection").then((m) => m.ProgramsOfferSection),
  {
    loading: () => <KnightOfferFallback />,
  },
);

/**
 * Idle-deferred interactive elite offers. Pair with server `ProgramsEliteOffersLcpFallback`
 * (`browseSibling`) so Money Mastery LCP stays a stable server <img>.
 * Pack `#details` deep links mount immediately so checkout-return URLs open Money Mastery
 * (not a Level-1 library modal).
 */
export function ProgramsOfferSectionLazy({ browseSibling = false, ...props }: Props) {
  const [forcePackDetails] = useState(() => hasPackDetailsDeepLink());
  const interactiveReady = useDeferredInteractiveOffers({
    // Interaction unlocks immediately; auto idle stays past lab CLS window.
    safetyMs: props.knightOnly ? 7000 : 7200,
  });
  const ready = forcePackDetails || interactiveReady;

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
    return <EliteOffersDynamic {...props} />;
  }
  return <EliteOffersDynamicWithFallback {...props} />;
}
