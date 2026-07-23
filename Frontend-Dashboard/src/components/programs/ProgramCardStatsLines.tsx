"use client";

import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { ProgramCardStats } from "@/components/programs/vaultProgramCardStats";
import { isPackOrModuleStats } from "@/components/programs/vaultProgramCardStats";

type Props = {
  stats: ProgramCardStats;
  size?: "large" | "compact" | "module" | "stream";
  /** Smaller labels on mobile/iPad (max-xl) — trading vault module cards. */
  denseMobile?: boolean;
  /** Larger video/time type on phone only (named program packs). */
  boostMobile?: boolean;
  className?: string;
};

export function ProgramCardStatsLines({
  stats,
  size = "large",
  denseMobile = false,
  boostMobile = false,
  className,
}: Props) {
  const compact = size === "compact" || size === "module" || size === "stream";
  const inlineOnMobile = compact || denseMobile;
  const shortWatchLabel = compact;

  if (isPackOrModuleStats(stats)) {
    return (
      <div
        className={cn(
          "program-card-stats-lines space-y-0.5 font-mono uppercase tracking-[0.08em] text-cyan-200/88",
          inlineOnMobile && "program-card-stats-lines--inline-mobile",
          inlineOnMobile &&
            "max-xl:flex max-xl:flex-wrap max-xl:items-baseline max-xl:gap-x-2 max-xl:gap-y-0 max-xl:space-y-0",
          className,
        )}
      >
        <p
          className={cn(
            compact ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-[13px]",
            boostMobile && !inlineOnMobile && "text-[13px] sm:text-[13px]",
            inlineOnMobile && "max-xl:contents max-xl:text-[8px] max-xl:leading-tight",
            boostMobile && inlineOnMobile && "max-xl:text-[11px]",
          )}
        >
          No. of Videos:{" "}
          <span
            className={cn(
              "font-bold tabular-nums text-white/95",
              compact ? "text-[11px] sm:text-[12px]" : "text-[13px] sm:text-[15px]",
              boostMobile && !inlineOnMobile && "text-[16px] sm:text-[15px]",
              inlineOnMobile && "max-xl:text-[9px]",
              boostMobile && inlineOnMobile && "max-xl:text-[12px]",
            )}
          >
            {stats.lessonCount}
          </span>
        </p>

        {inlineOnMobile ? (
          <span aria-hidden className="program-card-stats-lines__sep hidden text-white/30 max-xl:inline">
            ·
          </span>
        ) : null}

        <p
          className={cn(
            compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-[12px]",
            boostMobile && !inlineOnMobile && "text-[12px] sm:text-[12px]",
            inlineOnMobile && "max-xl:contents max-xl:text-[8px] max-xl:leading-tight",
            boostMobile && inlineOnMobile && "max-xl:text-[10px]",
          )}
        >
          {shortWatchLabel ? "Watch time:" : "All videos watch time:"}{" "}
          <span
            className={cn(
              "font-bold tabular-nums text-white/95",
              compact ? "text-[10px] sm:text-[11px]" : "text-[12px] sm:text-[14px]",
              boostMobile && !inlineOnMobile && "text-[15px] sm:text-[14px]",
              inlineOnMobile && "max-xl:text-[8px]",
              boostMobile && inlineOnMobile && "max-xl:text-[11px]",
            )}
          >
            {stats.watchTime}
          </span>
        </p>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "font-mono uppercase tracking-[0.08em] text-cyan-200/88",
        compact ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]",
        boostMobile && "text-[11px] sm:text-[10px]",
        denseMobile && "max-xl:text-[7px] max-xl:leading-tight",
        boostMobile && denseMobile && "max-xl:text-[10px]",
        className,
      )}
    >
      Video length:{" "}
      <span
        className={cn(
          "font-bold tabular-nums text-white/95",
          denseMobile && "max-xl:text-[8px]",
          boostMobile && "text-[13px] sm:text-[inherit]",
          boostMobile && denseMobile && "max-xl:text-[11px]",
        )}
      >
        {stats.videoLength}
      </span>
    </p>
  );
}
