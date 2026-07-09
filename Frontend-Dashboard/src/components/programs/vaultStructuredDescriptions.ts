import type { PlanOfferDef, VaultPackKey } from "@/components/programs/planOfferCatalog";
import {
  isVaultPackKey,
  vaultCoursesForPack,
  vaultPackForPlanSlug,
} from "@/components/programs/vaultPackCatalog";
import { resolveVaultModuleDetail, resolveVaultModuleTeaser } from "@/components/programs/vaultModuleCopy";
import {
  isTradingModuleSlug,
  tradingSubmodulesForModule,
  type TradingModuleSlug,
} from "@/components/programs/tradingVaultCatalog";
import { TRADING_PACK_DESCRIPTION, curatedTradingVaultDescription } from "@/components/programs/tradingVaultCopy";

const PACK_NAMES: Record<VaultPackKey, string> = {
  agentic_ai: "Agentic AI",
  ai_content_automation: "AI Content Automation",
  trading_technical_analysis: "Trading Advanced Technical Analysis",
};

const PACK_BODY: Record<VaultPackKey, { hook: string; protocol: string }> = {
  agentic_ai: {
    hook: `Manual labour disguised as entrepreneurship is the fastest path to irrelevance. The Agentic AI vault is not a course drop — it is an autonomous systems arsenal where n8n, Claude Code, MCP servers, and agentic workflows execute while you command strategy. Operators who still wire automations by hand are donating leverage to competitors who deploy agents overnight. This pack records lifetime ownership to your Syndicate dashboard the moment checkout completes — one payment, permanent entitlement, zero recurring rent on access.`,
    protocol: `You are installing executable intelligence: blog agents, WhatsApp responders, RAG pipelines, Antigravity deployments, and production-grade Claude Code systems that ship and sell. Every module inside this vault is a deployable protocol — not passive video consumption. Buy the full stack for $150 or unlock individual modules à la carte; either way, billing records permanently under your identity. Curriculum access activates as each module deploys in the vault. No vanity certificates. No fake progress bars. Only controlled entitlement wired to real systems inside your command dashboard. This is how elite operators replace headcount with agents without sacrificing quality or speed.`,
  },
  ai_content_automation: {
    hook: `Content without a machine behind it is wage labour with a camera off. The AI Content Automation vault weaponizes faceless YouTube, Shorts, documentaries, finance niches, and viral 3D formats into pipelines that scale while your identity stays off-screen. Policy shifts, algorithm changes, and banned niches destroy lazy operators — this vault teaches you what survived, what replaced dead formats, and how to redeploy before saturation turns your edge into noise. One checkout. Lifetime access. Your Syndicate dashboard becomes the proof of ownership the second payment clears.`,
    protocol: `This is content warfare doctrine: channel architecture, script systems, bulk Shorts generation, NotebookLM cloning, motion graphics in minutes, and RPM-rich finance formats engineered for retention and monetization. You are not learning to "make videos" — you are engineering distribution machines that publish at volumes human teams cannot match. Full pack $150 unlocks the entire automation stack; individual modules deploy à la carte if you want surgical strikes. Every purchase is a one-time transaction with permanent billing record. Curriculum unlocks as modules go live in the vault. No subscriptions masquerading as education. Only operators who treat content as systems — not hobbies — belong here.`,
  },
  trading_technical_analysis: {
    hook: `The financial markets are a battlefield engineered to transfer wealth from the emotional to the disciplined. If you trade on hype, hope, or uncalculated intuition, you are not an investor — you are liquidity. The Trading Advanced Technical Analysis vault is your definitive strategic weapon: master-level chart reading, probabilistic execution, and cold mathematical precision across stocks and crypto. Retail entertainment will not fix your P&L. This protocol strips emotion, installs systematic leverage, and architects compounding wealth through proven technical frameworks. One-time purchase. Lifetime entitlement. Your dashboard records ownership permanently.`,
    protocol: `${TRADING_PACK_DESCRIPTION} This vault deploys as modular warfare: Scalpel Protocol on the one-minute chart, Strategies of a Master Trader, Setups of a Master Trader, and Secrets of a Master Trader — each unlockable individually or as a full pack. Buy the complete matrix for $150 or purchase modules and individual lessons à la carte. Every transaction is a single checkout with permanent billing record under your Syndicate identity. Curriculum access activates as modules deploy. No recurring fees. No fake signals. Only controlled entitlement to professional-grade technical analysis built for operators who refuse to be exit liquidity.`,
  },
};

function formatStructured(hook: string, learnItems: string[]): string {
  const learn = learnItems.map((item) => `- ${item}`).join("\n");
  const intro = hook.trim();
  if (!intro && learnItems.length === 0) return "";
  if (!intro) return `What You Will Learn\n${learn}`;
  if (learnItems.length === 0) return `Introduction\n${intro}`;
  return `Introduction\n${intro}\n\nWhat You Will Learn\n${learn}`;
}

function packSubmoduleTitles(pack: VaultPackKey): string[] {
  return vaultCoursesForPack(pack).map((course) => course.title.trim()).filter(Boolean);
}

function moduleLearnItemTitles(offer: Pick<PlanOfferDef, "plan" | "title">): string[] {
  const plan = String(offer.plan).trim().toLowerCase();
  if (isTradingModuleSlug(plan)) {
    return tradingSubmodulesForModule(plan as TradingModuleSlug).map((row) => row.title.trim());
  }
  const title = offer.title.trim();
  return title ? [title] : [];
}

export function resolveVaultPackStructuredDescription(pack: VaultPackKey): string {
  const body = PACK_BODY[pack];
  return formatStructured(body.hook, packSubmoduleTitles(pack));
}

export function resolveVaultModuleStructuredDescription(
  offer: Pick<PlanOfferDef, "plan" | "title" | "vaultPackPlan">,
): string {
  const pack = offer.vaultPackPlan ?? vaultPackForPlanSlug(String(offer.plan));
  if (!pack) {
    return formatStructured("", moduleLearnItemTitles(offer));
  }

  const title = offer.title.trim();
  const planSlug = String(offer.plan);
  const teaser = resolveVaultModuleTeaser(title, pack, planSlug);
  const detail = resolveVaultModuleDetail(title, pack, planSlug);
  const packName = PACK_NAMES[pack];

  const hook = [
    teaser,
    `This is not passive content — it is operational doctrine inside the ${packName} vault.`,
    `Operators who hesitate install systems last and pay the market for that delay.`,
    `One checkout records lifetime ownership to your Syndicate command dashboard.`,
    detail,
    `You are purchasing permanent entitlement — a one-time transaction, not a subscription disguised as education.`,
    `Billing records instantly under your identity; curriculum access activates as this module deploys in the vault.`,
    `No vanity progress. No fake certificates. Only controlled access wired to real implementation inside your dashboard.`,
    `Deploy this module standalone or as part of the full ${packName} pack — your ownership is absolute either way.`,
  ].join(" ");

  return formatStructured(hook, moduleLearnItemTitles(offer));
}

export function resolveOfferStructuredDescription(offer: PlanOfferDef): string {
  const plan = String(offer.plan);
  const curated = curatedTradingVaultDescription(plan, offer.title);
  if (curated) return curated;
  if (isVaultPackKey(offer.plan)) {
    return resolveVaultPackStructuredDescription(offer.plan);
  }
  const pack = offer.vaultPackPlan ?? vaultPackForPlanSlug(offer.plan);
  if (pack) {
    return resolveVaultModuleStructuredDescription(offer);
  }
  return offer.detailDescription;
}
