import type { PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import {
  isTradingModuleSlug,
  isTradingSubmoduleSlug,
  TRADING_SUBMODULES,
  tradingSubmodulesForModule,
  type TradingModuleSlug,
} from "@/components/programs/tradingVaultCatalog";
import { isVaultPackKey, vaultCoursesForPack } from "@/components/programs/vaultPackCatalog";

export type ProgramCardStats =
  | { mode: "pack"; lessonCount: number; watchTime: string }
  | { mode: "module"; lessonCount: number; watchTime: string }
  | { mode: "lesson"; videoLength: string };

const DEFAULT_LESSON_MINUTES = 45;

export function formatTotalWatchTime(lessonCount: number, minutesPerLesson = DEFAULT_LESSON_MINUTES): string {
  const total = lessonCount * minutesPerLesson;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `~${mins} min`;
  if (mins === 0) return `~${hours}h`;
  return `~${hours}h ${mins}m`;
}

/** Parse duration hints from course titles (e.g. "3 hours", "19 Minutes"). */
export function estimateVideoLengthFromTitle(title: string): string {
  const hours = title.match(/(\d+)\s*hours?\b/i);
  if (hours) return `~${hours[1]}h`;
  const minutes = title.match(/(\d+)\s*minutes?\b/i);
  if (minutes) return `~${minutes[1]} min`;
  if (/\bfull course\b/i.test(title)) return "~2h";
  if (/\bguide\b/i.test(title)) return "~45 min";
  return "~1h 30m";
}

function sumWatchTimeFromTitles(titles: readonly string[]): string {
  let totalMinutes = 0;
  for (const title of titles) {
    const hours = title.match(/(\d+)\s*hours?\b/i);
    if (hours) {
      totalMinutes += Number(hours[1]) * 60;
      continue;
    }
    const minutes = title.match(/(\d+)\s*minutes?\b/i);
    if (minutes) {
      totalMinutes += Number(minutes[1]);
      continue;
    }
    if (/\bfull course\b/i.test(title)) {
      totalMinutes += 120;
      continue;
    }
    totalMinutes += 90;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `~${mins} min`;
  if (mins === 0) return `~${hours}h`;
  return `~${hours}h ${mins}m`;
}

export function tradingPackLessonCount(): number {
  return TRADING_SUBMODULES.length;
}

export function vaultPackLessonCount(pack: VaultPackKey): number {
  if (pack === "trading_technical_analysis") return tradingPackLessonCount();
  return vaultCoursesForPack(pack).length;
}

export function vaultPackWatchTime(pack: VaultPackKey): string {
  if (pack === "trading_technical_analysis") {
    return formatTotalWatchTime(tradingPackLessonCount());
  }
  const titles = vaultCoursesForPack(pack).map((c) => c.title);
  return sumWatchTimeFromTitles(titles);
}

export function tradingModuleStats(moduleSlug: TradingModuleSlug): ProgramCardStats {
  const count = tradingSubmodulesForModule(moduleSlug).length;
  return { mode: "module", lessonCount: count, watchTime: formatTotalWatchTime(count) };
}

export function resolveOfferCardStats(
  offer: PlanOfferDef,
  cardKind?: "pack" | "module"
): ProgramCardStats | undefined {
  const plan = offer.plan;

  if (isVaultPackKey(plan) && cardKind === "pack") {
    return {
      mode: "pack",
      lessonCount: vaultPackLessonCount(plan),
      watchTime: vaultPackWatchTime(plan),
    };
  }

  if (isTradingModuleSlug(plan)) {
    return tradingModuleStats(plan as TradingModuleSlug);
  }

  if (isTradingSubmoduleSlug(plan)) {
    return { mode: "lesson", videoLength: formatTotalWatchTime(1) };
  }

  if (cardKind === "module" && offer.vaultPackPlan) {
    if (offer.vaultPackPlan === "trading_technical_analysis") {
      return tradingModuleStats(plan as TradingModuleSlug);
    }
    return { mode: "lesson", videoLength: estimateVideoLengthFromTitle(offer.title) };
  }

  if (/^agentic_ai_c\d{2}$/.test(plan) || /^ai_content_c\d{2}$/.test(plan)) {
    return { mode: "lesson", videoLength: estimateVideoLengthFromTitle(offer.title) };
  }

  return undefined;
}

export function streamPlaylistCardStats(videoCount: number): ProgramCardStats {
  if (videoCount <= 1) {
    return { mode: "lesson", videoLength: formatTotalWatchTime(1) };
  }
  return {
    mode: "module",
    lessonCount: videoCount,
    watchTime: formatTotalWatchTime(videoCount),
  };
}

export function isPackOrModuleStats(stats: ProgramCardStats): stats is Extract<
  ProgramCardStats,
  { mode: "pack" | "module" }
> {
  return stats.mode === "pack" || stats.mode === "module";
}
