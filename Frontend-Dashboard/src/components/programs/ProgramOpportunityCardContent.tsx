"use client";

import Image from "next/image";
import type { CourseRec } from "@/components/dashboard/path/goalPathData";
import { optimizeCoverImageSrc } from "@/lib/optimizeImageUrl";
import { ProgramPlaylistCoverImage } from "@/components/programs/ProgramPlaylistCoverImage";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { formatPrice } from "@/lib/currency";
import { navigateToProgramLibraryCard } from "@/lib/programCardScroll";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

const PROGRAM_CARD_BACKGROUNDS: readonly string[] = [
  "from-amber-600/85 via-orange-900/50 to-black",
  "from-violet-600/85 via-purple-950/50 to-black",
  "from-sky-600/85 via-blue-950/50 to-black",
  "from-emerald-600/80 via-teal-950/50 to-black",
];

type Skin = {
  heading: string;
  titleText: string;
  infoPanel: string;
};

type Props = {
  course: CourseRec;
  variant: "support" | "focus" | "future";
  playlist: StreamPlaylistListItem | null;
  skin: Skin;
  cardIndex: number;
  onDetails: (playlist: StreamPlaylistListItem) => void;
  onUnlock: (playlist: StreamPlaylistListItem) => void;
};

export function ProgramOpportunityCardContent({
  course,
  variant,
  playlist,
  skin,
  cardIndex,
  onDetails,
  onUnlock,
}: Props) {
  const programId = course.programId;
  const label =
    variant === "focus" ? "Recommended" : variant === "support" ? "Supporting" : "Up next";
  const grad = PROGRAM_CARD_BACKGROUNDS[cardIndex % PROGRAM_CARD_BACKGROUNDS.length];
  const price = course.price ?? 0;

  const openProgram = () => {
    if (programId == null) return;
    navigateToProgramLibraryCard(programId);
  };

  const coverSrc = course.posterSrc;

  return (
    <div className="flex h-auto w-full flex-col pb-[10px]">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "font-mono fluid-path-card-label font-black uppercase tracking-[0.16em] sm:tracking-[0.18em]",
            skin.heading,
          )}
        >
          {label}
        </span>
      </div>

      <button
        type="button"
        onClick={openProgram}
        disabled={programId == null}
        className={cn(
          "group/cover relative mt-1 block w-full shrink-0 overflow-hidden rounded-lg border border-white/20 text-left transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
          "aspect-[4/5] min-h-[6.75rem] max-h-[9.5rem] sm:min-h-[7.25rem] sm:max-h-[10.5rem]",
          programId == null && "cursor-default opacity-80",
        )}
        aria-label={
          programId != null
            ? `Open ${course.title} in Programs library`
            : course.title
        }
      >
        <span className="absolute inset-0 z-0 block h-full w-full overflow-hidden">
          {playlist ? (
            <ProgramPlaylistCoverImage
              playlist={playlist}
              gradClassName={grad}
              loading="lazy"
            />
          ) : coverSrc ? (
            <>
              <div className={cn("absolute inset-0 bg-gradient-to-t opacity-80", grad)} aria-hidden />
              <Image
                src={optimizeCoverImageSrc(coverSrc, 400) ?? coverSrc}
                alt=""
                fill
                sizes="(max-width: 640px) 40vw, 280px"
                quality={72}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 z-[1] object-cover object-center"
              />
            </>
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-t opacity-95", grad)} />
          )}
        </span>
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/20 via-transparent to-black/50" />
        <span className="pointer-events-none absolute right-2 top-2 z-[3] inline-flex items-center whitespace-nowrap rounded-full border border-emerald-300/50 bg-[#03140d]/95 px-2 py-0.5 text-[11px] font-black tabular-nums text-emerald-100 shadow-[0_0_14px_rgba(52,211,153,0.28)] sm:text-[12px]">
          {formatPrice(price)}
        </span>
      </button>

      <h3
        className={cn(
          "mt-1.5 line-clamp-2 text-[clamp(0.72rem,0.55vw+0.5rem,0.92rem)] font-extrabold uppercase leading-snug tracking-[0.05em]",
          skin.titleText,
        )}
      >
        {course.title}
      </h3>
      <p className="mt-1 line-clamp-3 font-mono text-[clamp(0.62rem,0.4vw+0.48rem,0.78rem)] leading-snug text-white/88">
        {course.summary ?? course.outcome}
      </p>

      <div className="mt-[5px] grid shrink-0 grid-cols-2 gap-1.5 sm:gap-2">
        <button
          type="button"
          disabled={!playlist}
          onClick={(e) => {
            e.stopPropagation();
            if (playlist) onDetails(playlist);
          }}
          className="min-w-0 rounded-lg border border-white/40 bg-black/55 px-1.5 py-1.5 font-mono text-[clamp(8px,2vw,10px)] font-black uppercase tracking-[0.1em] text-white/95 transition hover:border-[#f5c814]/55 hover:text-[#ffe9a3] disabled:opacity-50 sm:px-2 sm:py-2"
        >
          Details
        </button>
        <button
          type="button"
          disabled={!playlist}
          onClick={(e) => {
            e.stopPropagation();
            if (playlist) onUnlock(playlist);
          }}
          className="min-w-0 rounded-lg border border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] px-1.5 py-1.5 font-mono text-[clamp(8px,2vw,10px)] font-black uppercase tracking-[0.1em] text-[#ffe9a3] shadow-[0_0_16px_rgba(202,167,36,0.45)] transition hover:scale-[1.02] disabled:opacity-50 sm:px-2 sm:py-2"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
