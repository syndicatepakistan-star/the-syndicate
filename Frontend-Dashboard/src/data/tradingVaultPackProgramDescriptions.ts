/**
 * Curated Trading Advanced Technical Analysis full-pack copy.
 * Display order: Chart Patterns, Setups, Strategy (keyword neon titles + 23 items),
 * then Programme Introduction, Programme Description, What You Will Learn.
 * Exact* blocks are parsed from the What You Will Learn region and rendered first
 * with the same Title: explanation styling as Projects You Will Build on other packs.
 */
import type { VaultPackKey } from "@/components/programs/planOfferCatalog";
import { extractProgrammeIntroductionTeaser } from "@/lib/structuredDescription";

export const TRADING_VAULT_PACK_TITLE = "Trading Advanced Technical Analysis";

export const TRADING_VAULT_PACK_STRUCTURED_DESCRIPTION = `Programme Introduction
Are you tired of looking at market charts and feeling completely confused by all the red and green lines? Do you often guess when to buy or sell, only to watch your money disappear? Welcome to the Full Pack: Trading Advanced Technical Analysis. This massive, complete bundle is designed to take you from a total beginner to a confident, knowledgeable trader.

We have taken 53 powerful modules and summarized them into one master system. You will learn to read the secret language of the markets. Instead of relying on hope or listening to social media rumors, you will learn to look at a chart and know exactly what is happening. By the end of this journey, you will no longer feel anxious when you trade. You will have a step-by-step plan for every single decision you make, giving you the freedom to protect your hard-earned money and grow your wealth over time safely.

Programme Description
This complete masterclass is your ultimate blueprint for trading success. We break down the complex world of the stock and crypto markets into simple, bite-sized lessons that anyone can understand.

You will learn how to draw lines on your screen that show you exactly where a price is likely to stop falling (support) and where it is likely to stop rising (resistance). You will discover how human emotions like fear and greed create repeating pictures on the charts, and how you can spot these pictures before the rest of the crowd does. We cover everything from keeping your emotions in check, to managing your risk so one bad day doesn't wipe out your account. This full pack is worth your time because it replaces gambling with strategy. You will finally trade with rules, logic, and confidence.

What You Will Learn
The Master Trader Mindset: How to control your emotions, ignore market panic, and trade like a calm professional.

The Basics of Chart Reading: How to understand the colorful bars on your screen (candlesticks) and what they tell you about who is winning—the buyers or the sellers.

Support and Resistance: How to find the hidden "floors" and "ceilings" where prices love to bounce.

Market Psychology: Understanding why the biggest market moves often happen when a popular setup fails and traps other traders.

Risk Management: The golden rules of protecting your money, setting limits on your losses, and knowing exactly when to walk away with your profits.

Timing the Market: How the time of day, and how long a price stays at a certain level, changes your chances of winning.

Using Trading Tools: How to use simple tools (like Moving Averages and RSI) to double-check your ideas before you risk any money.

Building Long-Term Wealth: Why aiming for small, consistent wins is much better than trying to get rich quick on a single lucky trade.

Exact Chart Patterns
In this complete pack, you learn the repeating visual shapes that predict market moves. Chart patterns come first:

Bull and Bear Flags: Simple sideways movements that look like a flag on a pole, showing the price is resting before a massive breakout.

The Cup and Handle: A rounded bottom shape that looks like a teacup, telling you buyers are slowly taking control for a big upward push.

Double and Triple Tops/Bottoms: When a price tries to break a ceiling or floor two or three times and fails, signaling a massive reversal is coming.

Rising and Falling Wedges: A squeezing shape on the chart that tells you a sudden, explosive price move is about to happen.

Megaphones and Consolidations: A widening, chaotic pattern that shows market confusion, teaching you when to wait safely on the sidelines.

Head and Shoulders: A classic three-hump pattern that warns you when a long upward trend is finally exhausted and about to fall.

The M-A Pattern: A distinct letter-shaped move that maps where big money is pushing price after a failed top.

The W-V Pattern: The mirror letter formation that helps you read bottoms and the roadmap of the next trend leg.

Exact Setups
Next you learn the precise triggers that tell you exactly when to click buy or sell:

The Engulfing Candle Setup: When one giant price bar completely swallows the previous one, signaling a sudden and powerful change in direction.

Topping and Bottoming Tails: Price bars with long tails that show the market tried to push one way, then was violently rejected.

The Doji Setup: A cross-shaped candle that means buyers and sellers are tied, warning you a big decision is coming.

Golden and Death Crosses: A long-term setup where slow and fast moving lines cross, signaling a major shift in market health.

Gaps and Gap Fills: When price jumps overnight leaving empty space, and how to trade the move back to fill that gap.

Retracing to the Scene of the Crime: Wait for a breakout, then patiently wait for price to return and test the exact line it just broke.

The Hit and Kiss: The difference between a light touch of a level (kiss) versus an aggressive crash into it (hit).

Downsloping and Upsloping Channels: Parallel trend corridors that show you where to buy dips and sell ripples inside the channel.

Exact Strategy
Finally, the rule-based playbook — 23 strategies total across patterns, setups, and strategy — for managing money and executing with process, not hope:

The 10% Risk/Reward Rule: A strict formula so you only take trades where potential reward heavily outweighs the risk.

The Confirmation Signal Strategy: Never guess — wait for the market to give a definitive green light before risking a penny.

Moving Average Bounces: Use trailing average lines to find safe, reliable entries during a strong trend.

The Time Counts (Nova 7) Strategy: A counting technique using the number 7 to spot when a price move is exhausted and ready to reverse.

RSI Divergence Strategy: Compare chart price to the RSI momentum tool — when they disagree, a trap and reversal are forming.

Mature vs. Immature Trading: Sit on your hands until a pattern fully develops, avoiding the fake-outs that trap impatient beginners.

Measured Move Strategy: Project how far price is likely to travel after a breakout by measuring the prior swing that started the move.`;

const PACK_DESCRIPTIONS: Partial<Record<VaultPackKey, string>> = {
  trading_technical_analysis: TRADING_VAULT_PACK_STRUCTURED_DESCRIPTION,
};

export function tradingVaultPackTeaser(description: string): string {
  return extractProgrammeIntroductionTeaser(description);
}

export function curatedTradingVaultPackDescription(pack: VaultPackKey): string | undefined {
  return PACK_DESCRIPTIONS[pack];
}
