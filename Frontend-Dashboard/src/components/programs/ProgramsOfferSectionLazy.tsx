"use client";

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

export function ProgramsOfferSectionLazy(props: Props) {
  if (props.knightOnly) {
    return <KnightOfferDynamic {...props} />;
  }
  return <EliteOffersDynamic {...props} />;
}
