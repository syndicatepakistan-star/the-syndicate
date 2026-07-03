"use client";

import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { ProgramCardStats } from "@/components/programs/vaultProgramCardStats";
import { isPackOrModuleStats } from "@/components/programs/vaultProgramCardStats";

type Props = {
  stats: ProgramCardStats;
  size?: "large" | "compact" | "module" | "stream";
  /** Smaller labels on mobile/iPad (max-xl) — trading vault module cards. */
  denseMobile?: boolean;
  className?: string;
};

export function ProgramCardStatsLines({ stats, size = "large", denseMobile = false, className }: Props) {
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
            inlineOnMobile && "max-xl:contents max-xl:text-[8px] max-xl:leading-tight",
          )}
        >
          No. of Videos:{" "}
          <span
            className={cn(
              "font-bold tabular-nums text-white/95",
              compact ? "text-[11px] sm:text-[12px]" : "text-[13px] sm:text-[15px]",
              inlineOnMobile && "max-xl:text-[9px]",
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
            inlineOnMobile && "max-xl:contents max-xl:text-[8px] max-xl:leading-tight",
          )}
        >
          {shortWatchLabel ? "Watch time:" : "All videos watch time:"}{" "}
          <span
            className={cn(
              "font-bold tabular-nums text-white/95",
              compact ? "text-[10px] sm:text-[11px]" : "text-[12px] sm:text-[14px]",
              inlineOnMobile && "max-xl:text-[8px]",
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
        denseMobile && "max-xl:text-[7px] max-xl:leading-tight",
        className,
      )}
    >
      Video length:{" "}
      <span
        className={cn(
          "font-bold tabular-nums text-white/95",
          denseMobile && "max-xl:text-[8px]",
        )}
      >
        {stats.videoLength}
      </span>
    </p>
  );
};
