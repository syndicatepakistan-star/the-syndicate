import type { VaultPackKey, MoneyMasteryStatBlock } from "@/components/programs/planOfferCatalog";
import {
  vaultPackLessonCount,
  vaultPackWatchTime,
} from "@/components/programs/vaultProgramCardStats";
import { VAULT_PACK_TOTAL_SECONDS } from "@/lib/programVideoDurations";
import { vaultCoursesForPack } from "@/components/programs/vaultPackCatalog";
import { tradingSubmodulesForModule } from "@/components/programs/tradingVaultCatalog";

/** Documented real-world project counts from vault pack copy (AI packs only). */
const MID_TICKET_PROJECT_COUNTS: Record<"agentic_ai" | "ai_content_automation", number> = {
  agentic_ai: 30,
  ai_content_automation: 28,
};

/**
 * Few important strategy outcomes across Secrets / Setups / Strategies / 1-min Scalpel —
 * not the full lesson inventory (that stays in the Videos digit).
 */
export function tradingKeyStrategiesCount(): number {
  const secrets = tradingSubmodulesForModule("trading_master_secrets").length;
  const setups = tradingSubmodulesForModule("trading_master_setups").length;
  const strategies = tradingSubmodulesForModule("trading_master_strategies").length;
  const scalpel = tradingSubmodulesForModule("trading_scalpel_protocol").length;
  return (
    Math.min(5, secrets) +
    Math.min(6, setups) +
    strategies +
    Math.min(4, scalpel)
  );
}

function watchHoursDigit(pack: VaultPackKey): { value: string; unit: string } {
  const totalSeconds = VAULT_PACK_TOTAL_SECONDS[pack];
  if (typeof totalSeconds === "number" && totalSeconds > 0) {
    const hours = Math.max(1, Math.round(totalSeconds / 3600));
    return { value: String(hours), unit: "Hrs" };
  }
  const formatted = vaultPackWatchTime(pack);
  const hoursMatch = formatted.match(/(\d+)\s*h/i);
  if (hoursMatch) return { value: hoursMatch[1]!, unit: "Hrs" };
  return { value: formatted, unit: "Watch" };
}

export function midTicketWhatYouGetBlocks(pack: VaultPackKey): readonly MoneyMasteryStatBlock[] {
  const videos = vaultPackLessonCount(pack);
  const watch = watchHoursDigit(pack);

  const secondCell: MoneyMasteryStatBlock =
    pack === "trading_technical_analysis"
      ? {
          value: String(tradingKeyStrategiesCount()),
          unit: "Strategies",
          label: "Learn 23 Advanced Trading Strategies",
          tone: "green",
        }
      : {
          value: String(MID_TICKET_PROJECT_COUNTS[pack]),
          unit: "Projects",
          label: "Real Project Builds",
          tone: "green",
        };

  return [
    { value: String(videos), unit: "Videos", label: "No. of Videos", tone: "gold" },
    secondCell,
    { value: watch.value, unit: watch.unit, label: "Watch Time", tone: "pink" },
    { value: "$10k+", unit: "", label: "Earn Atleast", tone: "violet" },
  ] as const;
}

export function midTicketProjectCount(pack: Exclude<VaultPackKey, "trading_technical_analysis">): number {
  return MID_TICKET_PROJECT_COUNTS[pack];
}

/** Protocol / module count for trading pack (and sanity checks). */
export function midTicketModuleCount(pack: VaultPackKey): number {
  return vaultCoursesForPack(pack).length;
}
