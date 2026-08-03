"use client";

import { useEffect, useState } from "react";
import { PublicPlanOfferCards } from "@/components/programs/PublicPlanOfferCards";
import {
  GLOBE_PACK_KEYS,
  parsePackDeepLinkSlug,
  type GlobePackKey,
} from "@/lib/programPlaylistThumbnails";

function parseHighlightPack(raw: string | null): GlobePackKey | undefined {
  const value = (raw ?? "").trim();
  return GLOBE_PACK_KEYS.has(value as GlobePackKey) ? (value as GlobePackKey) : undefined;
}

function highlightFromLocation(): GlobePackKey | undefined {
  if (typeof window === "undefined") return undefined;
  const sp = new URLSearchParams(window.location.search);
  return parseHighlightPack(sp.get("pack")) ?? parsePackDeepLinkSlug(sp.get("slug"));
}

/**
 * Elite offers — SSR with real cards (Money Mastery img in first HTML for LCP).
 * Pack highlight from ?pack= / ?slug= applied after mount (no useSearchParams Suspense).
 */
export function ProgramsOfferSection({
  size = "large",
  shellHosted = false,
  omitKnight = false,
  knightOnly = false,
  highlightPack: highlightPackProp,
}: {
  size?: "large" | "compact";
  shellHosted?: boolean;
  omitKnight?: boolean;
  knightOnly?: boolean;
  highlightPack?: GlobePackKey;
}) {
  const [highlightPack, setHighlightPack] = useState<GlobePackKey | undefined>(highlightPackProp);

  useEffect(() => {
    const apply = () => setHighlightPack(highlightFromLocation() ?? highlightPackProp);
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [highlightPackProp]);

  return (
    <PublicPlanOfferCards
      size={size}
      highlightPack={highlightPack}
      shellHosted={shellHosted}
      omitKnight={omitKnight}
      knightOnly={knightOnly}
    />
  );
}
