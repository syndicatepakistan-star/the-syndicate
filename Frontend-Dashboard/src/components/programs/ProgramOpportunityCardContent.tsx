"use client";

import Image from "next/image";
import type { CourseRec } from "@/components/dashboard/path/goalPathData";
import type { PlanOfferDef } from "@/components/programs/planOfferCatalog";
import { ProgramCardStatsLines } from "@/components/programs/ProgramCardStatsLines";
import { resolveOfferCardStats, streamPlaylistCardStats } from "@/components/programs/vaultProgramCardStats";
import { optimizeCoverImageSrc } from "@/lib/optimizeImageUrl";
import { ProgramPlaylistCoverImage } from "@/components/programs/ProgramPlaylistCoverImage";
import { PROGRAM_CARD_LANDSCAPE_MEDIA } from "@/components/programs/programCardMedia";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPrice } from "@/lib/currency";
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
  planOffer?: PlanOfferDef | null;
  skin: Skin;
  cardIndex: number;
  onDetails: (playlist: StreamPlaylistListItem) => void;
  onUnlock: (playlist: StreamPlaylistListItem) => void;
  onPlanDetails: (offer: PlanOfferDef) => void;
  onPlanUnlock: (offer: PlanOfferDef) => void;
  onPlanOpen: (course: CourseRec) => void;
};

export function ProgramOpportunityCardContent({
  course,
  variant,
  playlist,
  planOffer = null,
  skin,
  cardIndex,
  onDetails,
  onUnlock,
  onPlanDetails,
  onPlanUnlock,
  onPlanOpen,
}: Props) {
  const { localizeLabel, formatPrice: formatLocalizedPrice } = useCurrency();
  const programId = course.programId;
  const isPack = course.offerKind === "pack";
  const isModule = course.offerKind === "module";
  const isPlanCard = isPack || isModule;
  const label =
    variant === "focus"
      ? "Recommended"
      : variant === "support"
        ? "Supporting"
        : "Up next";
  const grad = PROGRAM_CARD_BACKGROUNDS[cardIndex % PROGRAM_CARD_BACKGROUNDS.length];
  const price = course.price ?? (planOffer ? Number(planOffer.checkoutAmount) : 0);
  const localizedPlanPrice = planOffer ? localizeLabel(planOffer.displayPrice) : "";

  const openTarget = () => {
    onPlanOpen(course);
  };

  const coverSrc = course.posterSrc ?? planOffer?.imageSrc;

  const kindBadge = isPack ? "Vault pack" : isModule ? "Vault module" : null;

  const cardStats = playlist
    ? streamPlaylistCardStats(playlist.video_count, { slug: playlist.slug, title: playlist.title })
    : planOffer
      ? resolveOfferCardStats(planOffer, isPack ? "pack" : isModule ? "module" : undefined)
      : undefined;

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col pb-[10px]">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "font-mono fluid-path-card-label font-black uppercase tracking-[0.16em] sm:tracking-[0.18em]",
            skin.heading,
          )}
        >
          {label}
        </span>
        {kindBadge ? (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] sm:text-[9px]",
              skin.infoPanel,
            )}
          >
            {kindBadge}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={openTarget}
        disabled={!programId && !isPlanCard}
        className={cn(
          "group/cover relative mt-1 block w-full shrink-0 overflow-hidden text-left transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
          PROGRAM_CARD_LANDSCAPE_MEDIA,
          "rounded-lg border border-white/20",
          !programId && !isPlanCard && "cursor-default opacity-80",
        )}
        aria-label={course.title}
      >
        <span className="absolute inset-0 z-0 overflow-hidden">
          {playlist ? (
            <ProgramPlaylistCoverImage
              playlist={playlist}
              gradClassName={grad}
              loading="lazy"
              objectFit="contain"
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
                className="absolute inset-0 z-[1] object-contain object-center p-0.5 sm:p-1"
                style={
                  planOffer?.imageObjectPosition
                    ? { objectPosition: planOffer.imageObjectPosition }
                    : undefined
                }
              />
            </>
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-t opacity-95", grad)} />
          )}
        </span>
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/20 via-transparent to-black/50" />
        <span
          className={cn(
            "program-playlist-card__price-badge pointer-events-none absolute right-2 top-2 z-[3]",
            isPlanCard
              ? cn(
                  "plan-offer-card__pack-price-badge inline-flex shrink-0 items-center justify-center rounded-md border border-emerald-300/50 bg-[#03140d]/95 font-black tabular-nums leading-none text-emerald-100 shadow-[0_0_14px_rgba(52,211,153,0.28)]",
                  planOffer && localizedPlanPrice.length > 5 && "plan-offer-card__pack-price-badge--long",
                )
              : "program-playlist-card__pack-price-badge border border-emerald-300/50 bg-[#03140d]/95 text-emerald-100 shadow-[0_0_14px_rgba(52,211,153,0.28)]",
          )}
          style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
        >
          {isPlanCard && planOffer ? (
            localizedPlanPrice
          ) : (
            <>
              <span className="program-playlist-card__pack-price-badge__amount">{formatLocalizedPrice(price)}</span>
              <span className="program-playlist-card__pack-price-badge__suffix text-emerald-200/80">lifetime</span>
            </>
          )}
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
      {cardStats ? (
        <ProgramCardStatsLines stats={cardStats} size="stream" className="mt-1" />
      ) : null}
      <p className="mt-1 line-clamp-2 min-h-[2.35rem] font-mono text-[clamp(0.62rem,0.4vw+0.48rem,0.78rem)] leading-snug text-white/88">
        {course.summary ?? course.outcome}
      </p>

      <div className="mt-auto grid shrink-0 grid-cols-2 gap-1.5 pt-1.5 sm:gap-2 sm:pt-2">
        <button
          type="button"
          disabled={!playlist && !planOffer}
          onClick={(e) => {
            e.stopPropagation();
            if (playlist) onDetails(playlist);
            else if (planOffer) onPlanDetails(planOffer);
          }}
          className="min-w-0 rounded-lg border border-white/40 bg-black/55 px-1.5 py-1.5 font-mono text-[clamp(8px,2vw,10px)] font-black uppercase tracking-[0.1em] text-white/95 transition hover:border-[#f5c814]/55 hover:text-[#ffe9a3] disabled:opacity-50 sm:px-2 sm:py-2"
        >
          Details
        </button>
        <button
          type="button"
          disabled={!playlist && !planOffer}
          onClick={(e) => {
            e.stopPropagation();
            if (playlist) onUnlock(playlist);
            else if (planOffer) onPlanUnlock(planOffer);
          }}
          className="min-w-0 rounded-lg border border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] px-1.5 py-1.5 font-mono text-[clamp(8px,2vw,10px)] font-black uppercase tracking-[0.1em] text-[#ffe9a3] shadow-[0_0_16px_rgba(202,167,36,0.45)] transition hover:scale-[1.02] disabled:opacity-50 sm:px-2 sm:py-2"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
