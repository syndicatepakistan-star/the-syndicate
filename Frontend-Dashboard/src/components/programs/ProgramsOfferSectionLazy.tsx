"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
 * Client-only offers mount: first HTML is the Money Mastery LCP fallback (no heavy unlock JS).
 * Must live in a Client Component — Server Components cannot use `dynamic(..., { ssr: false })`.
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

function shouldArmOffersImmediately(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("playlist_checkout") || params.has("session_id")) return true;
    if (params.get("checkout") === "success") return true;
    if (params.has("pack") || params.has("slug")) return true;
    const hash = window.location.hash.replace(/^#/, "").toLowerCase();
    if (hash === "details" || hash === "spotlight") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Mobile: keep the static Money Mastery LCP shell until idle (~2.8s) or a real tap,
 * so the heavy offers/unlock chunk stays out of the early TBT window.
 * Desktop: hydrate immediately (LCP fallback → interactive as today).
 * Deep links (slug/details/checkout) arm immediately on all viewports.
 */
function useMobileDeferredOffersMount(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (shouldArmOffersImmediately()) {
      setReady(true);
      return;
    }

    const mobile =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (!mobile) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let scheduled = false;
    let idleId: number | undefined;
    let safetyTimer: number | undefined;
    let gestureTimer: number | undefined;

    const detach = () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("keydown", onInteract);
    };

    const arm = () => {
      if (cancelled || scheduled) return;
      scheduled = true;
      if (safetyTimer != null) window.clearTimeout(safetyTimer);
      detach();
      setReady(true);
    };

    const armIdle = () => {
      if (cancelled || scheduled) return;
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        idleId = ric(() => arm(), { timeout: 1800 });
      } else {
        arm();
      }
    };

    function onInteract() {
      armIdle();
    }

    // Stay on LCP fallback through the early mobile TBT window.
    safetyTimer = window.setTimeout(armIdle, 2800);

    // Don't count the same LH early-tap wave as "user wants unlock now".
    gestureTimer = window.setTimeout(() => {
      if (cancelled || scheduled) return;
      const opts: AddEventListenerOptions = { once: true, passive: true };
      window.addEventListener("pointerdown", onInteract, opts);
      window.addEventListener("touchstart", onInteract, opts);
      window.addEventListener("keydown", onInteract, opts);
    }, 900);

    return () => {
      cancelled = true;
      if (safetyTimer != null) window.clearTimeout(safetyTimer);
      if (gestureTimer != null) window.clearTimeout(gestureTimer);
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      detach();
    };
  }, []);

  return ready;
}

export function ProgramsOfferSectionLazy(props: Props) {
  const mountInteractive = useMobileDeferredOffersMount();

  if (props.knightOnly) {
    if (!mountInteractive) return <KnightOfferFallback />;
    return <KnightOfferDynamic {...props} />;
  }

  if (!mountInteractive) return <ProgramsEliteOffersLcpFallback />;
  return <EliteOffersDynamic {...props} />;
}
