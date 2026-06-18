"use client";

import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { ProgramCardStats } from "@/components/programs/vaultProgramCardStats";
import { isPackOrModuleStats } from "@/components/programs/vaultProgramCardStats";

type Props = {
  stats: ProgramCardStats;
  size?: "large" | "compact" | "module" | "stream";
  className?: string;
};

export function ProgramCardStatsLines({ stats, size = "large", className }: Props) {
  const compact = size === "compact" || size === "module" || size === "stream";

  if (isPackOrModuleStats(stats)) {
    return (
      <div className={cn("space-y-0.5 font-mono uppercase tracking-[0.08em] text-cyan-200/88", className)}>
        <p className={cn(compact ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]")}>
          No of lessons: <span className="font-bold tabular-nums text-white/95">{stats.lessonCount}</span>
        </p>
        <p className={cn(compact ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]")}>
          All videos watch time: <span className="font-bold tabular-nums text-white/95">{stats.watchTime}</span>
        </p>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "font-mono uppercase tracking-[0.08em] text-cyan-200/88",
        compact ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]",
        className
      )}
    >
      Video length: <span className="font-bold tabular-nums text-white/95">{stats.videoLength}</span>
    </p>
  );
}
