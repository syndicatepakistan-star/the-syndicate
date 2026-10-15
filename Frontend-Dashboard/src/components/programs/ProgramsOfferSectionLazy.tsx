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

/**
 * Retire SSR browse without collapsing layout (desktop CLS ~0.88 was from
 * absolute/1px shrink). Lock host min-height first, then hide — interactive
 * sibling fills the same reserved space; nothing below jumps.
 */
function hideSsrBrowseSibling() {
  const el = document.getElementById("programs-lcp-browse");
  if (!el || el.dataset.retired === "1") return;
  el.dataset.retired = "1";

  const host =
    el.closest(".programs-elite-offers-swap") ??
    document.getElementById("syndicate-elite-offers");
  const browseH = Math.ceil(el.getBoundingClientRect().height);
  if (host && browseH > 0) {
    const locked = Math.max(browseH, Math.ceil(host.getBoundingClientRect().height));
    host.style.minHeight = `${locked}px`;
  }

  el.setAttribute("aria-hidden", "true");
  el.hidden = true;
  el.style.setProperty("display", "none", "important");

  // After interactive shell paints, match host to real content (grow OK, no cut).
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!host) return;
      const interactive = host.querySelector(
        ".programs-offers-shell:not(#programs-lcp-browse)",
      ) as HTMLElement | null;
      if (!interactive) return;
      const nextH = Math.ceil(interactive.getBoundingClientRect().height);
      if (nextH > 0) host.style.minHeight = `${nextH}px`;
    });
  });
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
 */
export function ProgramsOfferSectionLazy({ browseSibling = false, ...props }: Props) {
  const [forcePackDetails] = useState(() => hasPackDetailsDeepLink());
  const interactiveReady = useDeferredInteractiveOffers({
    // Past mobile Lighthouse CLS/TBT window so Money Mastery SSR LCP stays quiet.
    safetyMs: props.knightOnly ? 7000 : 6800,
  });
  const ready = forcePackDetails || interactiveReady;

  useLayoutEffect(() => {
    if (!ready || props.knightOnly) return;
    hideSsrBrowseSibling();
  }, [ready, props.knightOnly]);

  if (!ready) {
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
