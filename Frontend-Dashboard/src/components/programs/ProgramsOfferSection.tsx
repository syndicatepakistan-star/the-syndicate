"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicPlanOfferCards } from "@/components/programs/PublicPlanOfferCards";
import { GLOBE_PACK_KEYS, type GlobePackKey } from "@/lib/programPlaylistThumbnails";

function parseHighlightPack(raw: string | null): GlobePackKey | undefined {
  const value = (raw ?? "").trim();
  return GLOBE_PACK_KEYS.has(value as GlobePackKey) ? (value as GlobePackKey) : undefined;
}

function ProgramsOfferSectionInner({ size = "large" }: { size?: "large" | "compact" }) {
  const searchParams = useSearchParams();
  const highlightPack = parseHighlightPack(searchParams.get("pack"));
  return <PublicPlanOfferCards size={size} highlightPack={highlightPack} />;
}

export function ProgramsOfferSection({ size = "large" }: { size?: "large" | "compact" }) {
  return (
    <Suspense fallback={<PublicPlanOfferCards size={size} />}>
      <ProgramsOfferSectionInner size={size} />
    </Suspense>
  );
}
