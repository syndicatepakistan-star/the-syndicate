/**
 * Curated Trading Advanced Technical Analysis full-pack copy.
 * Section headers: Programme Introduction, Programme Description, What You Will Learn,
 * Exact Chart Patterns, Exact Setups, Exact Strategy.
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
In this complete pack, you will learn to spot the visual shapes that predict market moves:

Bull and Bear Flags: Simple sideways movements that look like a flag on a pole, showing you that the price is resting before a massive breakout.

The Cup and Handle: A rounded bottom shape that looks like a teacup, telling you that buyers are slowly taking control for a big upward push.

Double and Triple Tops/Bottoms: When a price tries to break a ceiling or floor two or three times and fails, signaling a massive reversal is coming.

Rising and Falling Wedges: A squeezing shape on the chart that tells you a sudden, explosive price move is about to happen.

Megaphones and Consolidations: A widening, chaotic pattern that shows market confusion, teaching you when to wait safely on the sidelines.

Head and Shoulders: A classic three-hump pattern that warns you when a long upward trend is finally exhausted and about to fall.

The M-A and W-V Patterns: Distinct letter-shaped moves that help you read the hidden roadmap of where the big money is pushing the price.

Exact Setups
You will learn specific, step-by-step triggers that tell you exactly when to click buy or sell:

The Engulfing Candle Setup: When one giant price bar completely swallows the previous one, signaling a sudden and powerful change in direction.

Topping and Bottoming Tails: Price bars with long "tails" that show the market tried to push the price one way, but was violently rejected by the other side.

The Doji Setup: A specific cross-shaped candle that means the market is frozen in a tie between buyers and sellers, warning you a big decision is coming.

Golden and Death Crosses: A long-term setup where slow and fast moving lines cross each other, signaling a massive shift in the overall market health.

Gaps and Gap Fills: When a price jumps overnight leaving an empty space on the chart, and the strategy for trading when the price comes back to "fill" that empty space.

Retracing to the Scene of the Crime: A highly reliable setup where you wait for a price to break out, then patiently wait for it to come back and test the exact line it just broke.

The Hit and Kiss: A precise setup identifying the difference between a price slightly touching a line (kiss) versus aggressively crashing into it (hit).

Exact Strategy
Your complete playbook for how to manage your money and execute trades:

The 10% Risk/Reward Rule: A strict mathematical formula to ensure you only take trades where the potential reward heavily outweighs the risk.

The Confirmation Signal Strategy: A rule-based approach where you never guess; you wait for the market to give you a definitive green light before risking a penny.

Moving Average Bounces: A strategy using trailing lines on your chart to find safe, reliable places to enter a trade during a strong trend.

The Time Counts (Nova 7) Strategy: A hidden counting technique that uses the magic number 7 to predict when a price move is exhausted and ready to reverse.

RSI Divergence Strategy: A clever method where you compare the price on the chart to a hidden momentum tool. When they disagree, you know a trap is set and a reversal is coming.

Mature vs. Immature Trading: A patience-based strategy where you learn to sit on your hands and wait for a pattern to fully develop, avoiding the fake-outs that trap impatient beginners.`;

const PACK_DESCRIPTIONS: Partial<Record<VaultPackKey, string>> = {
  trading_technical_analysis: TRADING_VAULT_PACK_STRUCTURED_DESCRIPTION,
};

export function tradingVaultPackTeaser(description: string): string {
  return extractProgrammeIntroductionTeaser(description);
}

export function curatedTradingVaultPackDescription(pack: VaultPackKey): string | undefined {
  return PACK_DESCRIPTIONS[pack];
}
