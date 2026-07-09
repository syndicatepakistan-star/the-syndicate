/**
 * Curated Trading Advanced Technical Analysis full-pack copy.
 * Section headers: Programme Introduction, Programme Description, What You Will Learn.
 */
import type { VaultPackKey } from "@/components/programs/planOfferCatalog";
import { extractProgrammeIntroductionTeaser } from "@/lib/structuredDescription";

export const TRADING_VAULT_PACK_TITLE = "Trading Advanced Technical Analysis";

export const TRADING_VAULT_PACK_STRUCTURED_DESCRIPTION = `Programme Introduction
Are you feeling lost in the fast-paced world of trading and struggling to know the right moments to buy or sell? Many beginners let confusion and emotions drive their trades, resulting in costly mistakes and missed financial opportunities. This complete program helps you cut through the market noise by teaching you the proven "One Minute Scalpel" method. You will learn step by step how to read price charts, spot hidden patterns, and protect your investments from sudden drops. By the end of this journey, you will trade with confidence and take true control of your financial future.

Programme Description
This entire course is a practical guide to mastering short-term trading by identifying highly profitable market setups. You will build essential skills in reading chart patterns like flags, wedges, and channels, while using tools like moving averages and momentum indicators to confirm your moves. The program also focuses heavily on strict risk management, showing you exactly where to set your entry, exit, and stop-loss targets. It is highly worth your time because it replaces dangerous guesswork with a disciplined, mechanical trading system. Instead of gambling your money, you will learn how to make smart, calculated decisions that build consistent, long-term wealth.


What You Will Learn
Master the One Minute Scalpel method to make smart, quick trading decisions across different timeframes
Identify core support and resistance levels to know exactly where prices might bounce or break
Use 50-day and 200-day moving averages to spot market trends and strong entry points
Spot bull and bear flags to predict whether a stock's price will continue going up or down
Recognize falling and rising wedges to successfully catch major market reversals before they happen
Draw and trade within parallel channels to capture steady profits during strong market trends
Understand market gap fills and how they create hidden buying or selling pressure
Trade the "retrace to the scene of the crime" setup to catch safe entries and avoid market fakeouts
Use the Relative Strength Index (RSI) to spot momentum shifts and confirm your trading signals
Protect your money with strict risk management by calculating precise stop-loss and take-profit levels
Practice your new skills safely using replay features before risking real money in the live market
Combine technical chart reading with strict mental discipline to build a reliable, consistent trading system`;

const PACK_DESCRIPTIONS: Partial<Record<VaultPackKey, string>> = {
  trading_technical_analysis: TRADING_VAULT_PACK_STRUCTURED_DESCRIPTION,
};

export function tradingVaultPackTeaser(description: string): string {
  return extractProgrammeIntroductionTeaser(description);
}

export function curatedTradingVaultPackDescription(pack: VaultPackKey): string | undefined {
  return PACK_DESCRIPTIONS[pack];
}
