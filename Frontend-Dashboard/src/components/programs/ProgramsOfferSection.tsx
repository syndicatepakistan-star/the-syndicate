"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { PublicPlanOfferCards } from "@/components/programs/PublicPlanOfferCards";
import { GLOBE_PACK_KEYS, type GlobePackKey } from "@/lib/programPlaylistThumbnails";

function parseHighlightPack(raw: string | null): GlobePackKey | undefined {
  const value = (raw ?? "").trim();
  return GLOBE_PACK_KEYS.has(value as GlobePackKey) ? (value as GlobePackKey) : undefined;
}

function ProgramsOfferSectionFallback({ size = "large" }: { size?: "large" | "compact" }) {
  const isLarge = size === "large";
  return (
    <div
      className={cn(
        "relative z-[1] mx-auto w-full overflow-visible px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8",
        isLarge ? "max-w-[min(100%,calc(80rem+300px))]" : "max-w-[1400px]",
      )}
      aria-hidden
    >
      {isLarge ? (
        <div className="flex w-full flex-col gap-4 sm:gap-8 lg:gap-10">
          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
            <div className="min-h-[30rem] rounded-3xl bg-white/[0.04]" />
            <div className="min-h-[30rem] rounded-3xl bg-white/[0.04]" />
          </div>
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-12">
            <div className="min-h-[28rem] rounded-3xl bg-white/[0.04]" />
            <div className="min-h-[28rem] rounded-3xl bg-white/[0.04]" />
            <div className="min-h-[28rem] rounded-3xl bg-white/[0.04]" />
          </div>
        </div>
      ) : (
        <div className="flex min-h-[20rem] w-full flex-wrap justify-center gap-2 sm:gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[20rem] w-[min(90vw,272px)] rounded-3xl bg-white/[0.04] sm:w-[260px]" />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramsOfferSectionInner({
  size = "large",
  shellHosted = false,
}: {
  size?: "large" | "compact";
  shellHosted?: boolean;
}) {
  const searchParams = useSearchParams();
  const highlightPack = parseHighlightPack(searchParams.get("pack"));
  return <PublicPlanOfferCards size={size} highlightPack={highlightPack} shellHosted={shellHosted} />;
}

export function ProgramsOfferSection({
  size = "large",
  shellHosted = false,
}: {
  size?: "large" | "compact";
  shellHosted?: boolean;
}) {
  return (
    <Suspense fallback={<ProgramsOfferSectionFallback size={size} />}>
      <ProgramsOfferSectionInner size={size} shellHosted={shellHosted} />
    </Suspense>
  );
}
