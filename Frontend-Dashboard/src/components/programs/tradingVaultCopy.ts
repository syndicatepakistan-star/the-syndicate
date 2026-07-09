import {
  curatedTradingScalpelDescription,
  TRADING_SCALPEL_MODULE_TITLE,
  tradingScalpelTeaser,
} from "@/data/tradingScalpelProgramDescriptions";
import {
  curatedTradingStrategiesDescription,
  TRADING_STRATEGIES_MODULE_TITLE,
  tradingStrategiesTeaser,
} from "@/data/tradingStrategiesProgramDescriptions";
import {
  curatedTradingSecretsDescription,
  TRADING_SECRETS_MODULE_TITLE,
  tradingSecretsTeaser,
} from "@/data/tradingSecretsProgramDescriptions";
import {
  curatedTradingSetupsDescription,
  TRADING_SETUPS_MODULE_TITLE,
  tradingSetupsTeaser,
} from "@/data/tradingSetupsProgramDescriptions";

export function curatedTradingVaultDescription(
  slug: string | null | undefined,
  title: string | null | undefined,
): string | undefined {
  return (
    curatedTradingScalpelDescription(slug, title) ??
    curatedTradingStrategiesDescription(slug, title) ??
    curatedTradingSetupsDescription(slug, title) ??
    curatedTradingSecretsDescription(slug, title)
  );
}

export function tradingVaultDescriptionTeaser(description: string, planSlug?: string): string {
  if (planSlug?.startsWith("trading_strategies") || planSlug === "trading_master_strategies") {
    return tradingStrategiesTeaser(description);
  }
  if (planSlug?.startsWith("trading_setups") || planSlug === "trading_master_setups") {
    return tradingSetupsTeaser(description);
  }
  if (planSlug?.startsWith("trading_secrets") || planSlug === "trading_master_secrets") {
    return tradingSecretsTeaser(description);
  }
  return tradingScalpelTeaser(description);
}

import {
  curatedTradingVaultPackDescription,
  tradingVaultPackTeaser,
  TRADING_VAULT_PACK_STRUCTURED_DESCRIPTION,
} from "@/data/tradingVaultPackProgramDescriptions";

/** Canonical marketing copy for the Trading Advanced Technical Analysis vault. */
export const TRADING_PACK_DESCRIPTION =
  tradingVaultPackTeaser(TRADING_VAULT_PACK_STRUCTURED_DESCRIPTION) ||
  "The financial markets are a battlefield engineered to transfer wealth from the emotional to the disciplined. If you are trading based on hype, hope, or uncalculated intuition, you are not an investor—you are liquidity.";

export const TRADING_PACK_TEASER =
  TRADING_PACK_DESCRIPTION ||
  "The financial markets are a battlefield engineered to transfer wealth from the emotional to the disciplined. This protocol is your definitive strategic weapon — master-level technical analysis, high-leverage indicators, and cold, mathematical execution across stocks and crypto.";

const TRADING_PHRASES: readonly string[] = [
  "The financial markets are a battlefield engineered to transfer wealth from the emotional to the disciplined.",
  "If you are trading based on hype, hope, or uncalculated intuition, you are not an investor—you are liquidity.",
  "The elite do not guess; they execute proven, probabilistic trading strategies that extract capital regardless of economic conditions.",
  "You lack the systematic leverage to read the charts and command the market.",
  "This protocol is your definitive strategic weapon.",
  "It is the ultimate roadmap to strip away emotion, deploy master-level technical analysis, and architect a system for compounding wealth across stocks and crypto.",
  "We eliminate the theoretical noise and amateur gambling psychology to deliver the raw, operational mechanics of a professional trading matrix.",
  "This is a comprehensive, three-part masterclass in trading architecture.",
  "You will master the logic of advanced technical analysis, deploy high-leverage indicators, and command advanced candlestick strategies.",
  "Furthermore, you will weaponize complex chart setups—from mature candlestick patterns to confirmation signals and RSI divergences.",
  "By internalizing multi-hit methodology, time counts, and flawless entry-point fine-tuning, you are not just learning to trade.",
  "You are engineering a ruthless, self-sustaining system that executes your financial will with cold, mathematical precision.",
];

export const TRADING_MODULE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  [TRADING_SCALPEL_MODULE_TITLE]:
    tradingScalpelTeaser(
      curatedTradingScalpelDescription("trading_scalpel_protocol", TRADING_SCALPEL_MODULE_TITLE) ?? "",
    ) ||
    "The one-minute chart is a battlefield engineered to transfer wealth from the emotional to the disciplined. You lack the systematic leverage to read the charts and command the market — this protocol is your definitive strategic weapon for flawless entry-point fine-tuning.",
  [TRADING_STRATEGIES_MODULE_TITLE]:
    tradingStrategiesTeaser(
      curatedTradingStrategiesDescription("trading_master_strategies", TRADING_STRATEGIES_MODULE_TITLE) ?? "",
    ) ||
    "The elite do not guess; they execute proven, probabilistic trading strategies that extract capital regardless of economic conditions.",
  [TRADING_SETUPS_MODULE_TITLE]:
    tradingSetupsTeaser(
      curatedTradingSetupsDescription("trading_master_setups", TRADING_SETUPS_MODULE_TITLE) ?? "",
    ) ||
    "Furthermore, you will weaponize complex chart setups—from mature candlestick patterns to confirmation signals and RSI divergences.",
  [TRADING_SECRETS_MODULE_TITLE]:
    tradingSecretsTeaser(
      curatedTradingSecretsDescription("trading_master_secrets", TRADING_SECRETS_MODULE_TITLE) ?? "",
    ) ||
    "We eliminate the theoretical noise and amateur gambling psychology to deliver the raw, operational mechanics of a professional trading matrix.",
};

export function resolveTradingSubmoduleTeaser(index: number, title?: string, planSlug?: string): string {
  const curated = curatedTradingVaultDescription(planSlug, title);
  if (curated) return tradingVaultDescriptionTeaser(curated, planSlug);
  const a = TRADING_PHRASES[index % TRADING_PHRASES.length];
  const b = TRADING_PHRASES[(index + 5) % TRADING_PHRASES.length];
  return `${a} ${b}`;
}

export function resolveTradingModuleTeaser(title: string): string {
  return TRADING_MODULE_DESCRIPTIONS[title] ?? TRADING_PACK_TEASER;
}

export function resolveTradingModuleDetail(title: string, planSlug?: string): string {
  const curated = curatedTradingVaultDescription(planSlug, title);
  if (curated) return curated;
  const body = TRADING_MODULE_DESCRIPTIONS[title] ?? TRADING_PACK_DESCRIPTION;
  return `${body} Buy once — your dashboard records ownership. Curriculum access activates when the module deploys in the vault. No vanity access. Only controlled entitlement under your Syndicate identity.`;
}
