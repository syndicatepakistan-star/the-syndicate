import type { PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import {
  isTradingModuleSlug,
  isTradingSubmoduleSlug,
  TRADING_SUBMODULES,
  tradingSubmodulesForModule,
  type TradingModuleSlug,
} from "@/components/programs/tradingVaultCatalog";
import { isVaultPackKey, vaultCoursesForPack } from "@/components/programs/vaultPackCatalog";
import {
  formatDurationSeconds,
  lookupCuratedDurationSeconds,
  sumCuratedDurations,
  VAULT_PACK_TOTAL_SECONDS,
} from "@/lib/programVideoDurations";

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

function curatedOrEstimatedLength(plan: string, title: string): string {
  const seconds = lookupCuratedDurationSeconds(plan);
  if (seconds !== undefined) return formatDurationSeconds(seconds);
  return estimateVideoLengthFromTitle(title);
}

function curatedPackWatchTime(pack: VaultPackKey, lessonCount: number): string {
  const packTotal = VAULT_PACK_TOTAL_SECONDS[pack];
  if (packTotal !== undefined) return formatDurationSeconds(packTotal);

  const slugs = vaultCoursesForPack(pack).map((c) => c.plan);
  const { totalSeconds, allKnown } = sumCuratedDurations(slugs);
  if (allKnown && totalSeconds > 0) return formatDurationSeconds(totalSeconds);
  if (totalSeconds > 0) return formatDurationSeconds(totalSeconds, true);
  return formatTotalWatchTime(lessonCount);
}

export function tradingPackLessonCount(): number {
  return TRADING_SUBMODULES.length;
}

export function vaultPackLessonCount(pack: VaultPackKey): number {
  if (pack === "trading_technical_analysis") return tradingPackLessonCount();
  return vaultCoursesForPack(pack).length;
}

export function vaultPackWatchTime(pack: VaultPackKey): string {
  const count = vaultPackLessonCount(pack);
  return curatedPackWatchTime(pack, count);
}

export function tradingModuleStats(moduleSlug: TradingModuleSlug): ProgramCardStats {
  const submodules = tradingSubmodulesForModule(moduleSlug);
  const count = submodules.length;
  const { totalSeconds, allKnown } = sumCuratedDurations(submodules.map((s) => s.slug));
  const watchTime =
    allKnown && totalSeconds > 0
      ? formatDurationSeconds(totalSeconds)
      : formatTotalWatchTime(count);
  return { mode: "module", lessonCount: count, watchTime };
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
    const seconds = lookupCuratedDurationSeconds(plan);
    return {
      mode: "lesson",
      videoLength: seconds !== undefined ? formatDurationSeconds(seconds) : formatTotalWatchTime(1),
    };
  }

  if (cardKind === "module" && offer.vaultPackPlan) {
    if (offer.vaultPackPlan === "trading_technical_analysis") {
      return tradingModuleStats(plan as TradingModuleSlug);
    }
    return { mode: "lesson", videoLength: curatedOrEstimatedLength(plan, offer.title) };
  }

  if (/^agentic_ai_c\d{2}$/.test(plan) || /^ai_content_c\d{2}$/.test(plan)) {
    return { mode: "lesson", videoLength: curatedOrEstimatedLength(plan, offer.title) };
  }

  return undefined;
}

export function streamPlaylistCardStats(
  videoCount: number,
  options?: { slug?: string; title?: string }
): ProgramCardStats {
  const slug = options?.slug ?? "";
  const curatedSeconds = slug ? lookupCuratedDurationSeconds(slug) : undefined;

  if (videoCount <= 1) {
    const videoLength =
      curatedSeconds !== undefined
        ? formatDurationSeconds(curatedSeconds)
        : formatTotalWatchTime(1);
    return { mode: "lesson", videoLength };
  }

  const watchTime =
    curatedSeconds !== undefined
      ? formatDurationSeconds(curatedSeconds)
      : formatTotalWatchTime(videoCount);

  return {
    mode: "module",
    lessonCount: videoCount,
    watchTime,
  };
}

export function isPackOrModuleStats(stats: ProgramCardStats): stats is Extract<
  ProgramCardStats,
  { mode: "pack" | "module" }
> {
  return stats.mode === "pack" || stats.mode === "module";
}
