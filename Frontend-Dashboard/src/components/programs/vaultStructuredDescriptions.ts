import type { PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import { isVaultPackKey, vaultPackForPlanSlug } from "@/components/programs/vaultPackCatalog";
import { resolveVaultModuleDetail, resolveVaultModuleTeaser } from "@/components/programs/vaultModuleCopy";
import { TRADING_PACK_DESCRIPTION } from "@/components/programs/tradingVaultCopy";

const PACK_NAMES: Record<VaultPackKey, string> = {
  agentic_ai: "Agentic AI",
  ai_content_automation: "AI Content Automation",
  trading_technical_analysis: "Trading Advanced Technical Analysis",
};

const PACK_STRUCTURED: Record<VaultPackKey, string> = {
  agentic_ai: `The Hook
Manual labour disguised as entrepreneurship is the fastest path to irrelevance. The Agentic AI vault is not a course drop — it is an autonomous systems arsenal where n8n, Claude Code, MCP servers, and agentic workflows execute while you command strategy. Operators who still wire automations by hand are donating leverage to competitors who deploy agents overnight. This pack records lifetime ownership to your Syndicate dashboard the moment checkout completes — one payment, permanent entitlement, zero recurring rent on access.

The Core Protocol
You are installing executable intelligence: blog agents, WhatsApp responders, RAG pipelines, Antigravity deployments, and production-grade Claude Code systems that ship and sell. Every module inside this vault is a deployable protocol — not passive video consumption. Buy the full stack for $150 or unlock individual modules à la carte; either way, billing records permanently under your identity. Curriculum access activates as each module deploys in the vault. No vanity certificates. No fake progress bars. Only controlled entitlement wired to real systems inside your command dashboard. This is how elite operators replace headcount with agents without sacrificing quality or speed.

What You Will Learn
- Deploy n8n automations that research, draft, publish, and route without babysitting
- Command Claude Code skills that turn prompts into shippable applications and sellable products
- Wire MCP servers and agentic workflows that connect any tool your empire demands
- Build RAG agents, memory architecture, and persistent context for compounding intelligence
- Automate Gmail, scraping, blogging, Shorts, and YouTube pipelines from a single command surface
- Install Google Antigravity and 2026-era stacks that obsolete amateur n8n curricula
- Scale faceless content, marketing, and cowork automations without trading hours for output
- Record lifetime module ownership — one-time purchase per module or full vault unlock`,

  ai_content_automation: `The Hook
Content without a machine behind it is wage labour with a camera off. The AI Content Automation vault weaponizes faceless YouTube, Shorts, documentaries, finance niches, and viral 3D formats into pipelines that scale while your identity stays off-screen. Policy shifts, algorithm changes, and banned niches destroy lazy operators — this vault teaches you what survived, what replaced dead formats, and how to redeploy before saturation turns your edge into noise. One checkout. Lifetime access. Your Syndicate dashboard becomes the proof of ownership the second payment clears.

The Core Protocol
This is content warfare doctrine: channel architecture, script systems, bulk Shorts generation, NotebookLM cloning, motion graphics in minutes, and RPM-rich finance formats engineered for retention and monetization. You are not learning to "make videos" — you are engineering distribution machines that publish at volumes human teams cannot match. Full pack $150 unlocks the entire automation stack; individual modules deploy à la carte if you want surgical strikes. Every purchase is a one-time transaction with permanent billing record. Curriculum unlocks as modules go live in the vault. No subscriptions masquerading as education. Only operators who treat content as systems — not hobbies — belong here.

What You Will Learn
- Launch and scale faceless YouTube channels in 2026 without showing your face
- Navigate policy bans, dead niches, and algorithm shifts before competitors react
- Produce viral 3D documentaries, geography Shorts, philosophy channels, and prehistoric formats with free AI tools
- Engineer high-RPM finance videos, life advice formats, and inspirational finance content at scale
- Clone winning channels with NotebookLM Automation 2.0 and redeploy proven structures faster
- Generate 1,000+ Shorts in bulk and dominate volume games competitors cannot afford
- Write scripts that accumulate hundreds of millions of views using evidence-based viral patterns
- Master motion graphics, stickman POV niches, and cinematic AI production without a studio`,

  trading_technical_analysis: `The Hook
The financial markets are a battlefield engineered to transfer wealth from the emotional to the disciplined. If you trade on hype, hope, or uncalculated intuition, you are not an investor — you are liquidity. The Trading Advanced Technical Analysis vault is your definitive strategic weapon: master-level chart reading, probabilistic execution, and cold mathematical precision across stocks and crypto. Retail entertainment will not fix your P&L. This protocol strips emotion, installs systematic leverage, and architects compounding wealth through proven technical frameworks. One-time purchase. Lifetime entitlement. Your dashboard records ownership permanently.

The Core Protocol
${TRADING_PACK_DESCRIPTION} This vault deploys as modular warfare: Scalpel Protocol on the one-minute chart, Strategies of a Master Trader, Setups of a Master Trader, and Secrets of a Master Trader — each unlockable individually or as a full pack. Buy the complete matrix for $150 or purchase modules and individual lessons à la carte. Every transaction is a single checkout with permanent billing record under your Syndicate identity. Curriculum access activates as modules deploy. No recurring fees. No fake signals. Only controlled entitlement to professional-grade technical analysis built for operators who refuse to be exit liquidity.

What You Will Learn
- Read charts with systematic leverage instead of gambling psychology
- Deploy high-leverage indicators, candlestick strategies, and confirmation signals
- Execute multi-hit methodology, time counts, and flawless entry-point fine-tuning
- Weaponize RSI divergences, mature patterns, and complex setup architectures
- Master the one-minute Scalpel Protocol for precision wealth architecture
- Internalize master trader strategies, setups, and classified execution secrets
- Build a ruthless, self-sustaining trading system that compounds across market conditions
- Purchase once — lifetime module access recorded to your command dashboard`,
};

function buildModuleLearnItems(title: string, pack: VaultPackKey): string[] {
  const packName = PACK_NAMES[pack];
  return [
    `Install the complete ${title} protocol inside the ${packName} vault`,
    `Execute step-by-step systems without renting your time to manual repetition`,
    `Wire outputs into your existing Syndicate dashboard and billing record`,
    `Deploy battle-tested sequences that compress weeks of trial-and-error into one checkout`,
    `Scale operations using the same doctrine elite operators run in production`,
    `Integrate automations, agents, content pipelines, or chart systems with your stack`,
    `Own this module permanently — one-time purchase, lifetime entitlement, no subscription rent`,
    `Activate curriculum access as the module deploys — controlled access, not vanity unlocks`,
  ];
}

function formatStructured(hook: string, protocol: string, learnItems: string[]): string {
  const learn = learnItems.map((item) => `- ${item}`).join("\n");
  return `The Hook\n${hook}\n\nThe Core Protocol\n${protocol}\n\nWhat You Will Learn\n${learn}`;
}

export function resolveVaultPackStructuredDescription(pack: VaultPackKey): string {
  return PACK_STRUCTURED[pack];
}

export function resolveVaultModuleStructuredDescription(title: string, pack: VaultPackKey): string {
  const teaser = resolveVaultModuleTeaser(title, pack);
  const detail = resolveVaultModuleDetail(title, pack);
  const packName = PACK_NAMES[pack];

  const hook = [
    teaser,
    `This is not passive content — it is operational doctrine inside the ${packName} vault.`,
    `Operators who hesitate install systems last and pay the market for that delay.`,
    `One checkout records lifetime ownership to your Syndicate command dashboard.`,
  ].join(" ");

  const protocol = [
    detail,
    `You are purchasing permanent entitlement — a one-time transaction, not a subscription disguised as education.`,
    `Billing records instantly under your identity; curriculum access activates as this module deploys in the vault.`,
    `No vanity progress. No fake certificates. Only controlled access wired to real implementation inside your dashboard.`,
    `Deploy this module standalone or as part of the full ${packName} pack — your ownership is absolute either way.`,
  ].join(" ");

  return formatStructured(hook, protocol, buildModuleLearnItems(title, pack));
}

export function resolveOfferStructuredDescription(offer: PlanOfferDef): string {
  if (isVaultPackKey(offer.plan)) {
    return resolveVaultPackStructuredDescription(offer.plan);
  }
  const pack = offer.vaultPackPlan ?? vaultPackForPlanSlug(offer.plan);
  if (pack) {
    return resolveVaultModuleStructuredDescription(offer.title, pack);
  }
  return offer.detailDescription;
}
