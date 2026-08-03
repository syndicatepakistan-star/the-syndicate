"use client";

import { useEffect, useState, type ComponentType } from "react";
import { ProgramsEliteOffersLcpFallback } from "@/components/programs/ProgramsEliteOffersLcpFallback";
import { useQuietIdleGate } from "@/hooks/useQuietIdleGate";
import type { GlobePackKey } from "@/lib/programPlaylistThumbnails";

type Props = {
  size?: "large" | "compact";
  shellHosted?: boolean;
  omitKnight?: boolean;
  knightOnly?: boolean;
  highlightPack?: GlobePackKey;
};

type OfferSectionComponent = ComponentType<Props>;

function KnightOfferFallback() {
  return (
    <div
      className="mx-auto min-h-[min(70vh,30rem)] w-full max-w-lg animate-pulse rounded-3xl bg-white/[0.04]"
      aria-hidden
    />
  );
}

function shouldForceOffersInteractive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("playlist_checkout")) return true;
    if (params.has("session_id")) return true;
    if (params.get("checkout") === "success") return true;
    const hash = window.location.hash.replace(/^#/, "").toLowerCase();
    if (hash === "details" || hash === "spotlight") return true;
    if (params.has("pack")) return true;
    const slug = (params.get("slug") || "").trim().toLowerCase();
    if (
      slug === "money-mastery" ||
      slug === "bundle" ||
      slug === "agentic-ai" ||
      slug === "ai-content-automation" ||
      slug === "trading-technical-analysis" ||
      slug.startsWith("trading_")
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Browse-first elite offers: static Money Mastery LCP shell first (SSR/client).
 * Interactive ProgramsOfferSection chunk waits for quiet idle (~3.5s mobile) or Unlock/Details.
 * Manual import keeps the LCP fallback mounted until the chunk resolves — no second decode storm.
 * Does not remount library / main — only this island upgrades.
 */
export function ProgramsOfferSectionLazy(props: Props) {
  const [force, setForce] = useState(!!props.knightOnly);
  const interactive = useQuietIdleGate({ force });
  const [Section, setSection] = useState<OfferSectionComponent | null>(null);

  useEffect(() => {
    if (props.knightOnly || shouldForceOffersInteractive()) {
      setForce(true);
    }
  }, [props.knightOnly]);

  useEffect(() => {
    if (!interactive) return;
    let cancelled = false;
    void import("@/components/programs/ProgramsOfferSection")
      .then((m) => {
        if (!cancelled) setSection(() => m.ProgramsOfferSection);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [interactive]);

  if (props.knightOnly) {
    if (!Section) return <KnightOfferFallback />;
    return <Section {...props} />;
  }

  if (!Section) {
    return <ProgramsEliteOffersLcpFallback />;
  }

  return <Section {...props} />;
}
