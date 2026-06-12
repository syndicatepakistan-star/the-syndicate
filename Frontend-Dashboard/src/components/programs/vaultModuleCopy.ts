import type { VaultPackKey } from "@/components/programs/planOfferCatalog";

const PACK_FRAMING: Record<
  VaultPackKey,
  { teaserLead: string; detailLead: string }
> = {
  agentic_ai: {
    teaserLead: "Deploy this autonomous protocol once — your dashboard records ownership.",
    detailLead:
      "This is not passive content — it is an executable agentic system inside the Agentic AI vault.",
  },
  ai_content_automation: {
    teaserLead: "Remove your face from the machine — this module scales output from your command dashboard.",
    detailLead:
      "This is not a watch-and-forget tutorial — it is a content warfare protocol inside the AI Content Automation vault.",
  },
  trading_technical_analysis: {
    teaserLead: "Install this edge at the chart — discipline over noise, execution over emotion.",
    detailLead:
      "This is not retail entertainment — it is a trading protocol inside the Advanced Technical Analysis vault.",
  },
};

/** Card + modal copy keyed by exact vault module title. */
export const VAULT_MODULE_TEASERS: Readonly<Record<string, string>> = {
  // — Agentic AI —
  "Build a Blog Writing Agent With N8N":
    "Manual publishing is wage labour disguised as entrepreneurship — wire an n8n blog agent that researches, drafts, and ships SEO content on command.",
  "Build a WhatsApp Agent with n8n":
    "Every unanswered message is lost leverage — deploy a WhatsApp agent that responds, qualifies, and converts while you control the strategy.",
  "Build Apps With secret Claude Code Skill":
    "Most builders rent their output — unlock the Claude Code skill layer that turns prompts into shippable applications without a dev team.",
  "Claude Code + Consensus = INSANE $50k+ App Ideas":
    "Ideas without validation die in notebooks — run this consensus protocol to surface $50k+ app concepts worth building and selling.",
  "Claude Code is Better at n8n":
    "Stop fighting two tools — fuse Claude Code with n8n and command automations that think, route, and execute without babysitting.",
  "Claude Code just changed Memory Forever":
    "Stateless agents forget your empire — install persistent memory architecture so every workflow remembers context and compounds intelligence.",
  "Claude Cowork Automations":
    "Solo execution caps your ceiling — deploy Claude Cowork automations that parallelize research, build, and ship across your stack.",
  "Scrap Any Website with N8N":
    "Public data is free ammunition — scrape, structure, and route web intelligence through n8n pipelines built for operators, not hobbyists.",
  "Set up Google Credentials in n8n":
    "Broken credentials kill automations before they start — lock in Google auth the right way so your agents run without silent failure.",
  "Google Antigravity FULL COURSE 2 HOURS":
    "Two hours to command Google's agentic surface — Antigravity is not a demo, it is deployment doctrine for the next automation era.",
  "n8n Tutorial 37 Tips and Tricks (n8n Masterclass)":
    "Amateur automations leak time — absorb 37 master-level n8n tactics that separate operators from button-clickers.",
  "CLAUDE CODE ADVANCED COURSE — 3 HOURS":
    "Three hours of advanced Claude Code doctrine — move from prompt toy to production systems that ship, sell, and scale.",
  "CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)":
    "Four hours. Build. Sell. 2026 — the full Claude Code operating system for creators who refuse to trade hours for output.",
  "4 Claude Code Hacks To Make Any Website Look 10 by 10":
    "Design debt kills conversion — four Claude Code hacks that elevate any site to premium-grade presentation without hiring a studio.",
  "12 Ways to Fix Context in Claude Code":
    "Context drift destroys agent output — install twelve fixes that keep Claude Code locked on mission, memory, and measurable results.",
  "27 Claude Code TIPS":
    "Twenty-seven tactical edges — shortcuts, patterns, and execution layers that compress weeks of trial-and-error into one protocol.",
  "Automated Faceless Shorts with AI":
    "Short-form without automation is invisible labour — wire AI pipelines that batch-produce faceless Shorts while you command the niche.",
  "Claude Cowork just changed Marketing Forever":
    "Marketing teams move slow — Claude Cowork rewrites the speed of campaign execution, research, and multi-channel deployment.",
  "From Zero to RAG Agent":
    "Generic AI forgets your data — build a RAG agent from zero that retrieves, reasons, and answers with your proprietary intelligence.",
  "Insane Youtube Automation!":
    "YouTube without a machine behind you is a second job — deploy insane automation stacks that publish while you architect the channel.",
  "n8n Blogging Automation: Generate SEO Blogs in Minutes":
    "SEO blogs written by hand do not scale — generate rank-ready posts in minutes through n8n blogging automation built for volume.",
  "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)":
    "MCP servers unlock unlimited tool access — go beginner to pro wiring n8n into any system your empire demands.",
  "Never label gmail emails again":
    "Inbox chaos is operational debt — automate Gmail labelling forever and reclaim the hours elite operators refuse to waste.",
  "Stop Learning n8n in 2026...Learn THIS Instead":
    "The old n8n curriculum is obsolete — learn the 2026 stack that agents, MCP, and Claude Code operators actually deploy.",
  "VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity":
    "Vibe coding is the new compile layer — master Gemini 3.1 + Antigravity and ship products at the speed ideas arrive.",
  "Agentic Workflow for Businesses":
    "Businesses that automate last lose first — architect agentic workflows that execute revenue tasks without headcount bloat.",

  // — AI Content Automation —
  "Beginners Guide to Faceless YouTube in 2026 (3 hours)":
    "Faceless YouTube in 2026 is a warfare niche — three hours of doctrine to launch channels that scale without showing your face.",
  "New YouTube Policy ENDS Those Faceless YouTube Channels":
    "Policy shifts liquidate lazy operators — understand what ended, what survived, and how to reposition before the algorithm buries you.",
  "How to Start YouTube Automation in 2026 (Step By Step) NO FACE | FREE COURSE":
    "Step-by-step automation doctrine — start a faceless YouTube machine in 2026 without trading your identity for views.",
  "How I Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)":
    "One tool. Full channel. Zero face — Genspark AI compresses research, scripting, and production into a single command surface.",
  "How I Built a VIRAL AI Movie Channel Using Only AI Tools":
    "Viral movie channels are systems, not luck — replicate the AI-only production stack that turns cinematic niches into repeatable traffic.",
  "How I Create Viral High RPM Finance Videos Using AI (Full Blueprint)":
    "Finance RPM is a math game — full blueprint for AI finance videos engineered for high RPM, retention, and scalable publishing.",
  "How I Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)":
    "3D animation used to require studios — produce viral 3D content with free AI tools and own the visual niche competitors cannot afford.",
  "How I Built a Viral AI Influencer Like Aitana Lopez (AI Instagram Model)":
    "Synthetic influence is the new frontier — build a viral AI persona with the same leverage as human creators, minus the liability.",
  "How I Made a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)":
    "Documentary channels dominate watch time — full course on viral AI documentary production using free tools and ruthless consistency.",
  "This Is How I Built a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)":
    "Philosophy audiences binge — deploy free AI tools to build a viral philosophy channel that educates, retains, and monetizes.",
  "How I Used AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)":
    "Prehistoric niches print views — full course on faceless prehistoric channels built entirely with AI production pipelines.",
  "I Cloned a VIRAL 3D Documentary Channel Using AI (Full Course)":
    "Clone what already won — reverse-engineer a viral 3D documentary channel and redeploy the stack under your command.",
  "How I Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)":
    "Geography Shorts explode on autopilot — full guide to AI-only geography content that hooks in three seconds and scales in bulk.",
  "How I Built a Viral Universe Documentary Channel Using Only AI (Step by Step!)":
    "Universe documentaries own curiosity — step-by-step AI channel build for cosmic niches with infinite content runway.",
  "I Studied 5,000 Faceless YouTube Videos — Here's How To ACTUALLY Go Viral":
    "Five thousand videos dissected — viral is not random; it is pattern. Install the evidence layer most creators never see.",
  "50 Easy Faceless Niches Explained in 19 Minutes":
    "Niche selection decides everything — fifty faceless niches explained in nineteen minutes so you deploy where competition is weak.",
  "Create 1,000 YouTube Shorts in 13 Minutes Using FREE AI — Free Auto Shorts in Bulk":
    "Volume wins Shorts — generate one thousand Shorts in thirteen minutes with free AI bulk automation built for operators.",
  "I Studied 70+ Faceless Channels To Crack The NEW Algorithm":
    "Seventy channels cracked open — decode the new algorithm signals faceless operators use to stay ahead of policy and competition.",
  "WARNING: These Faceless YouTube Niches Are Now BANNED":
    "Banned niches destroy channels overnight — know what is dead, what replaced it, and where to redeploy capital and attention.",
  "How I Write Faceless YouTube Scripts That Get 100s Of Millions Of Views":
    "Scripts are the weapon — learn the writing doctrine behind faceless videos that accumulate hundreds of millions of views.",
  "The Smart Way to Build a Faceless Finance Channel (Nick Invests EXPOSED!)":
    "Finance faceless is crowded — smart channel architecture exposed so you build RPM-rich finance content without copying noise.",
  "I Found a New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)":
    "First movers own Shorts — exploit a new niche exploding now before saturation turns edge into commodity.",
  "How I create Motion Graphics videos in MINUTES with AI":
    "Motion graphics used to take days — produce broadcast-grade motion content in minutes with AI pipelines built for speed.",
  "This Viral Faceless Stickman POV Niche Is Dominating Youtube (Full Guide)":
    "Stickman POV is dominating feeds — full guide to the viral faceless format competitors underestimate until it is too late.",
  "The Secret NotebookLM Workflow Every YouTuber Needs!":
    "NotebookLM is the hidden research engine — deploy the workflow elite YouTubers use to script, clone, and outproduce channels.",
  "How to create viral 3D documentary videos using ai (FERN 3D STYLE)":
    "FERN 3D style documentary is a category killer — create viral 3D documentary videos with AI and own the aesthetic.",
  "How I Make VIRAL Life Advice Videos Using Only FREE AI Tools (FULL COURSE)":
    "Life advice niches never sleep — full course on viral life advice videos using only free AI tools and systematic publishing.",
  "Create Viral inspirational finance Videos with Free AI Tools":
    "Inspirational finance merges emotion and RPM — create viral finance motivation videos with free AI and scale the format.",
  "Clone ANY YouTube Channel With AI (NotebookLM Hack) | Automation 2.0":
    "Competitor channels are blueprints — clone any YouTube channel with NotebookLM Automation 2.0 and redeploy proven formats faster.",

  // — Trading —
  "The Scalpel Protocol: Architecting Wealth on the 1-Minute Chart":
    "The one-minute chart is a battlefield — precision entry architecture, risk containment, and compounding math for operators who refuse random execution.",
  "Strategies of a Master Trader":
    "Master traders do not improvise — install strategic frameworks that separate systematic edge from retail noise and emotional liquidation.",
  "Setups of a Master Trader":
    "Setups are ammunition — catalogue high-probability chart configurations with the discipline to wait and the courage to strike.",
  "Secrets of a Master Trader":
    "Institutions hide process, not magic — unlock the classified execution layer reserved for operators who treat markets as warfare, not gambling.",
};

export function resolveVaultModuleTeaser(title: string, pack: VaultPackKey): string {
  const custom = VAULT_MODULE_TEASERS[title];
  if (custom) return custom;
  const lead = PACK_FRAMING[pack].teaserLead;
  const short = title.length > 72 ? `${title.slice(0, 69)}…` : title;
  return `${lead} ${short}`;
}

export function resolveVaultModuleDetail(title: string, pack: VaultPackKey): string {
  const teaser = VAULT_MODULE_TEASERS[title] ?? title;
  const lead = PACK_FRAMING[pack].detailLead;
  return `${lead} ${teaser} Buy once — your dashboard records ownership. Curriculum access activates when the module deploys in the vault. No vanity access. Only controlled entitlement under your Syndicate identity.`;
}
