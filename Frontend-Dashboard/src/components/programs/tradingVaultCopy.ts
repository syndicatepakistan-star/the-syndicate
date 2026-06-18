/** Canonical marketing copy for the Trading Advanced Technical Analysis vault. */
export const TRADING_PACK_DESCRIPTION =
  "The financial markets are a battlefield engineered to transfer wealth from the emotional to the disciplined. If you are trading based on hype, hope, or uncalculated intuition, you are not an investor—you are liquidity. The elite do not guess; they execute proven, probabilistic trading strategies that extract capital regardless of economic conditions. You lack the systematic leverage to read the charts and command the market. This protocol is your definitive strategic weapon. It is the ultimate roadmap to strip away emotion, deploy master-level technical analysis, and architect a system for compounding wealth across stocks and crypto. We eliminate the theoretical noise and amateur gambling psychology to deliver the raw, operational mechanics of a professional trading matrix. This is a comprehensive, three-part masterclass in trading architecture. You will master the logic of advanced technical analysis, deploy high-leverage indicators, and command advanced candlestick strategies. Furthermore, you will weaponize complex chart setups—from mature candlestick patterns to confirmation signals and RSI divergences. By internalizing multi-hit methodology, time counts, and flawless entry-point fine-tuning, you are not just learning to trade. You are engineering a ruthless, self-sustaining system that executes your financial will with cold, mathematical precision.";

export const TRADING_PACK_TEASER =
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
  "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart":
    "The one-minute chart is a battlefield engineered to transfer wealth from the emotional to the disciplined. You lack the systematic leverage to read the charts and command the market — this protocol is your definitive strategic weapon for flawless entry-point fine-tuning. By internalizing multi-hit methodology, time counts, and cold, mathematical precision, you engineer a ruthless, self-sustaining system on the fastest timeframe.",
  "Strategies of a Master Trader":
    "The elite do not guess; they execute proven, probabilistic trading strategies that extract capital regardless of economic conditions. We eliminate the theoretical noise and amateur gambling psychology to deliver the raw, operational mechanics of a professional trading matrix. You will master the logic of advanced technical analysis, deploy high-leverage indicators, and command advanced candlestick strategies.",
  "Setups of a Master Trader":
    "Furthermore, you will weaponize complex chart setups—from mature candlestick patterns to confirmation signals and RSI divergences. This is a comprehensive masterclass in trading architecture built to strip away emotion and install systematic leverage. Setups are ammunition for operators who refuse to be liquidity.",
  "Secrets of a Master Trader":
    "We eliminate the theoretical noise and amateur gambling psychology to deliver the raw, operational mechanics of a professional trading matrix. You are engineering a ruthless, self-sustaining system that executes your financial will with cold, mathematical precision. The classified execution layer reserved for disciplined capital — not retail entertainment.",
};

export function resolveTradingSubmoduleTeaser(index: number): string {
  const a = TRADING_PHRASES[index % TRADING_PHRASES.length];
  const b = TRADING_PHRASES[(index + 5) % TRADING_PHRASES.length];
  return `${a} ${b}`;
}

export function resolveTradingModuleTeaser(title: string): string {
  return TRADING_MODULE_DESCRIPTIONS[title] ?? TRADING_PACK_TEASER;
}

export function resolveTradingModuleDetail(title: string): string {
  const body = TRADING_MODULE_DESCRIPTIONS[title] ?? TRADING_PACK_DESCRIPTION;
  return `${body} Buy once — your dashboard records ownership. Curriculum access activates when the module deploys in the vault. No vanity access. Only controlled entitlement under your Syndicate identity.`;
}
