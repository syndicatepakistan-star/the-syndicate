/**
 * PUBLIC demo / trailer MP4s only (R2 `syn-demos` → cdn.the-syndicate.com).
 *
 * Two levels (independent of private Stream / syn-bucket):
 * 1) Pack trailers  → Watch Demo on Money Mastery / vault pack modals
 * 2) Module trailers → Watch Demo on each module card
 *
 * Player loads the file only after click.
 */

export const VIMEO_PACK_DEMO_LABEL = "Watch Demo Video";
export const MODULE_DEMO_LABEL = "Watch Demo";

export type PackDemoKey =
  | "bundle"
  | "agentic_ai"
  | "ai_content_automation"
  | "trading_technical_analysis";

const DEMO_CDN_BASE = (
  process.env.NEXT_PUBLIC_DEMO_CDN_BASE || "https://cdn.the-syndicate.com"
)
  .trim()
  .replace(/\/+$/, "");

const AGENTIC_TRAILER_DIR = "Programs Demos/Ai Automation Trailer";
const AI_CONTENT_TRAILER_DIR = "Programs Demos/Ai Content Automation";
const Trading_Technical_Analysis_DIR = "Programs Demos/Trading Trailer";
const BUSINESS_MODELS_TRAILER_DIR = "Programs Demos/11 Business Models Trailer";
/**
 * Pack-level trailers (whole vault / Money Mastery).
 * Leave blank until you upload a true pack trailer.
 */
const PACK_DEMO_OBJECT_KEYS: Partial<Record<PackDemoKey, string>> = {
  // bundle: "Programs Demos/Money Mastery Trailer/money-mastery.mp4",
  // agentic_ai: "Programs Demos/Ai Automation Trailer/pack-trailer.mp4",
  // ai_content_automation: "Programs Demos/AI Content Trailer/pack-trailer.mp4",
  // trading_technical_analysis: "Programs Demos/Trading Trailer/pack-trailer.mp4",
};

/**
 * Module-level trailers — key = checkout plan slug.
 * Paths = object keys inside public `syn-demos` bucket.
 *
 * Agentic AI still missing uploads:
 * - agentic_ai_c09 Set up Google Credentials in n8n
 * - agentic_ai_c22 n8n MCP Servers tutorial
 * - agentic_ai_c26 Agentic Workflow for Businesses
 *
 * AI Content R2 folder: `Programs Demos/Ai Content Automation`
 */
const MODULE_DEMO_OBJECT_KEYS: Record<string, string> = {
  // ——— Agentic AI (ai_content uses ai_content_c##) ———
  agentic_ai_c01: `${AGENTIC_TRAILER_DIR}/Build a blog writing agent with n8n_converted.mp4`,
  agentic_ai_c02: `${AGENTIC_TRAILER_DIR}/Build Watsapp Agent In N8N_converted.mp4`,
  agentic_ai_c03: `${AGENTIC_TRAILER_DIR}/Build Apps With secret Claude Code Skill_converted.mp4`,
  agentic_ai_c04: `${AGENTIC_TRAILER_DIR}/Claude Code + Consensus = INSANE $50k+ App Ideas_converted.mp4`,
  agentic_ai_c05: `${AGENTIC_TRAILER_DIR}/Claude Code is Better at n8n than I am_converted.mp4`,
  agentic_ai_c06: `${AGENTIC_TRAILER_DIR}/Claude Code just changed Memory Forever (Tutorial)_converted.mp4`,
  agentic_ai_c07: `${AGENTIC_TRAILER_DIR}/10 Insane Claude Cowork Automations Nobody Is Talking About-_converted.mp4`,
  agentic_ai_c08: `${AGENTIC_TRAILER_DIR}/Scrap Any Website with N8N_converted.mp4`,
  agentic_ai_c09: `${AGENTIC_TRAILER_DIR}/n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)_converted.mp4`,
  agentic_ai_c10: `${AGENTIC_TRAILER_DIR}/Google Antigravity FULL COURSE 2 HOURS_converted.mp4`,
  agentic_ai_c11: `${AGENTIC_TRAILER_DIR}/n8n Tutorial 37 Tips and Tricks (n8n Mastercl_converted.mp4`,
  agentic_ai_c12: `${AGENTIC_TRAILER_DIR}/CLAUDE CODE ADVANCED COURSE — 3 HOURS_converted.mp4`,
  agentic_ai_c13: `${AGENTIC_TRAILER_DIR}/CLAUDE CODE FULL COURSE 4 HOURS Build & Sell (2026)_converted.mp4`,
  agentic_ai_c14: `${AGENTIC_TRAILER_DIR}/4 Claude Code Hacks_converted.mp4`,
  agentic_ai_c15: `${AGENTIC_TRAILER_DIR}/12 Ways to Fix Context in Claude Code_converted.mp4`,
  agentic_ai_c16: `${AGENTIC_TRAILER_DIR}/27 Claude Code TIPS_converted.mp4`,
  agentic_ai_c17: `${AGENTIC_TRAILER_DIR}/Automated Faceless (n8n)_converted.mp4`,
  agentic_ai_c18: `${AGENTIC_TRAILER_DIR}/Claude Cowork just changed Marketing Forever_converted.mp4`,
  agentic_ai_c19: `${AGENTIC_TRAILER_DIR}/From Zero to RAG Agent_converted.mp4`,
  agentic_ai_c20: `${AGENTIC_TRAILER_DIR}/Insane Youtube Automation!_converted.mp4`,
  agentic_ai_c21: `${AGENTIC_TRAILER_DIR}/n8n Blogging Automation_ Generate SEO Blogs in Minutes_converted.mp4`,
  agentic_ai_c22: `${AGENTIC_TRAILER_DIR}/Agentic WorkFlow For Buisnesses-2_converted.mp4`,
  agentic_ai_c23: `${AGENTIC_TRAILER_DIR}/Never label gmail emails again_converted.mp4`,
  agentic_ai_c24: `${AGENTIC_TRAILER_DIR}/Stop Learning n8n in 2026.._converted.mp4`,
  agentic_ai_c25: `${AGENTIC_TRAILER_DIR}/VIBE CODING FULL COURSE_ Gemini 3_converted.mp4`,
  agentic_ai_c26: `${AGENTIC_TRAILER_DIR}/Set up Google Credentials in n8n in 5 minutes (2025)_converted.mp4`,
  // ——— AI Content Automation (29 modules) ———
  // c01 Beginners Guide to Faceless YouTube in 2026 (3 hours)
  ai_content_c01: `${AI_CONTENT_TRAILER_DIR}/Beginners Guide to Faceless YouTube in 2026 (3 hours)_converted.mp4`,
  // c02 New YouTube Policy ENDS These Faceless YouTube Channels
  ai_content_c02: `${AI_CONTENT_TRAILER_DIR}/New YouTube Policy ENDS Those Faceless YouTube Channels_converted.mp4`,
  // c03 Start YouTube Automation in 2026 (Step By Step) NO FACE
  ai_content_c03: `${AI_CONTENT_TRAILER_DIR}/How to Start YouTube Automation in 2026 (Step By Step) NO FACE _ FREE COURSE_converted.mp4`,
  // c04 Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)
  ai_content_c04: `${AI_CONTENT_TRAILER_DIR}/How I Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)_converted.mp4`,
  // c05 Build a VIRAL AI Movie Channel Using Only AI Tools
  ai_content_c05: `${AI_CONTENT_TRAILER_DIR}/How I Built a VIRAL AI Movie Channel Using Only AI Tools_converted.mp4`,
  // c06 Create Viral High RPM Finance Videos Using AI (Full Blueprint)
  ai_content_c06: `${AI_CONTENT_TRAILER_DIR}/How I Create Viral High RPM Finance Videos Using AI (Full Blueprint)_converted.mp4`,
  // c07 Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)
  ai_content_c07: `${AI_CONTENT_TRAILER_DIR}/How I Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)_converted.mp4`,
  // c08 Build a Viral AI Influencer (AI Instagram Models)
  ai_content_c08: `${AI_CONTENT_TRAILER_DIR}/How I Built a Viral AI Influencer Like Aitana Lope_converted.mp4`,
  // c09 Make a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)
  ai_content_c09: `${AI_CONTENT_TRAILER_DIR}/How I Made a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)_converted.mp4`,
  // c10 Build a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)
  ai_content_c10: `${AI_CONTENT_TRAILER_DIR}/This Is How I Built a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)_converted.mp4`,
  // c11 Use AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)
  ai_content_c11: `${AI_CONTENT_TRAILER_DIR}/How I Used AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)_converted.mp4`,
  // c12 Clone a VIRAL 3D Documentary Channel Using AI (Full Course)
  ai_content_c12: `${AI_CONTENT_TRAILER_DIR}/I Cloned a VIRAL 3D Documentary Channel Using AI (Full Course)_converted.mp4`,
  // c13 Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)
  ai_content_c13: `${AI_CONTENT_TRAILER_DIR}/How I Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)_converted.mp4`,
  // c14 Build a Viral Universe Documentary Channel Using Only AI (Step by Step!)
  ai_content_c14: `${AI_CONTENT_TRAILER_DIR}/How I Built a Viral Universe Documentary Channel Using Only AI (Step by Step!)_converted.mp4`,
  // c15 ACTUALLY Go Viral
  ai_content_c15: `${AI_CONTENT_TRAILER_DIR}/I Studied 5,000 Faceless YouTube Videos - Here's How To ACTUALLY Go Viral_converted.mp4`,
  // c16 50 Easy Faceless Niches
  ai_content_c16: `${AI_CONTENT_TRAILER_DIR}/50 Easy Faceless Niches Explained in 19 Minutes_converted.mp4`,
  // c17 Create 1,000 YouTube Shorts Using FREE AI - Free Auto Shorts in Bulk
  ai_content_c17: `${AI_CONTENT_TRAILER_DIR}/Create 1,000 YouTube Shorts in 13 Minutes Using FREE AI - Free Auto Shorts in Bulk_converted.mp4`,
  // c18 Crack The NEW Algorithm
  ai_content_c18: `${AI_CONTENT_TRAILER_DIR}/I Studied 70+ Faceless Channels To Crack The NEW Algorithm_converted.mp4`,
  // c19 These Faceless YouTube Niches Are Now BANNED
  ai_content_c19: `${AI_CONTENT_TRAILER_DIR}/WARNING- These Faceless YouTube Niches Are Now BANNED_converted.mp4`,
  // c20 Write Faceless YouTube Scripts That Get 100s Of Millions Of Views
  ai_content_c20: `${AI_CONTENT_TRAILER_DIR}/How I Write Faceless YouTube Scripts That Get 100s Of Millions Of Views_converted.mp4`,
  // c21 The Smart Way to Build a Faceless Finance Channel
  ai_content_c21: `${AI_CONTENT_TRAILER_DIR}/The Smart Way to Build a Faceless Finance Channel (Nick Invests EXPOSED!)_converted.mp4`,
  // c22 New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)
  ai_content_c22: `${AI_CONTENT_TRAILER_DIR}/I Found a New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)_converted.mp4`,
  // c23 Create Motion Graphics videos in MINUTES with AI
  ai_content_c23: `${AI_CONTENT_TRAILER_DIR}/How I create Motion Graphics videos in MINUTES wit_converted.mp4`,
  // c24 Viral Faceless Stickman POV
  ai_content_c24: `${AI_CONTENT_TRAILER_DIR}/This Viral Faceless Stickman POV Niche Is Dominating Youtube (Full Guide)_converted.mp4`,
  // c25 The Secret NotebookLM Workflow Every YouTuber Needs!
  ai_content_c25: `${AI_CONTENT_TRAILER_DIR}/The Secret NotebookLM Workflow Every YouTuber Needs!_converted.mp4`,
  // c26 Create viral 3D documentary videos using ai(FERN 3D STYLE)
  ai_content_c26: `${AI_CONTENT_TRAILER_DIR}/How to create viral 3D documentary videos using ai(FERN 3D STYLE)_converted.mp4`,
  // c27 Make VIRAL Life Advice Videos Using Only FREE AI Tools
  ai_content_c27: `${AI_CONTENT_TRAILER_DIR}/How I Make VIRAL Life Advice Videos Using Only FREE AI Tools (FULL COURSE)_converted.mp4`,
  // c28 Create Viral inspirational finance Videos with Free AI Tools
  ai_content_c28: `${AI_CONTENT_TRAILER_DIR}/Create Viral inspirational finance Videos with Fre_converted.mp4`,
  // c29 Clone ANY YouTube Channel With AI (NotebookLM Hack)
  ai_content_c29: `${AI_CONTENT_TRAILER_DIR}/Clone ANY YouTube Channel With AI (NotebookLM Hack_converted.mp4`,

  // Trading Technical Analysis Modules
  trading_scalpel_protocol: `${Trading_Technical_Analysis_DIR}/The Scalpel Protocol Architecting Wealth on the 1-Minute Chart_converted.mp4`,
  trading_master_strategies: `${Trading_Technical_Analysis_DIR}/Starategies_converted.mp4`,
  trading_master_setups: `${Trading_Technical_Analysis_DIR}/Setups_converted.mp4`,
  trading_master_secrets: `${Trading_Technical_Analysis_DIR}/Secrets_converted.mp4`,

  // ——— 11 Business Models (Level 1) ———
  // level1-model-01 AI / N8N automation
  "level1-model-01": `${BUSINESS_MODELS_TRAILER_DIR}/N8N AI Automation_converted.mp4`,
  // level1-model-02 Social / YouTube AI automation
  "level1-model-02": `${BUSINESS_MODELS_TRAILER_DIR}/Youtube AI Automation_converted.mp4`,
  // level1-model-03 App Building Flutter
  "level1-model-03": `${BUSINESS_MODELS_TRAILER_DIR}/App Building using Flutter_converted.mp4`,
  // level1-model-04 Custom App / React
  "level1-model-04": `${BUSINESS_MODELS_TRAILER_DIR}/Build a real react app_converted.mp4`,
  // level1-model-05 Amazon KDP / eBook
  "level1-model-05": `${BUSINESS_MODELS_TRAILER_DIR}/Amazon KDP_converted.mp4`,
  // level1-model-06 Gaming / Unreal
  "level1-model-06": `${BUSINESS_MODELS_TRAILER_DIR}/Building Games Using Unreal Engine_converted.mp4`,
  // level1-model-07 Framer
  "level1-model-07": `${BUSINESS_MODELS_TRAILER_DIR}/Framer Crash Course_converted.mp4`,
  // level1-model-08 Canva
  "level1-model-08": `${BUSINESS_MODELS_TRAILER_DIR}/Canva for Begineers_converted.mp4`,
  // level1-model-09 Print On Demand
  "level1-model-09": `${BUSINESS_MODELS_TRAILER_DIR}/Print On Demand_converted.mp4`,
  // level1-model-10 Python
  "level1-model-10": `${BUSINESS_MODELS_TRAILER_DIR}/Python Full Course_converted.mp4`,
  // level1-model-11 WordPress Blog
  "level1-model-11": `${BUSINESS_MODELS_TRAILER_DIR}/WordPress Blog_converted.mp4`,

};

/** Rare full-URL overrides (pack or module plan slug → https://…). */
export const PACK_DEMO_VIDEO_URLS: Partial<Record<string, string>> = {};

const PACK_DEMO_KEYS = new Set<string>([
  "bundle",
  "agentic_ai",
  "ai_content_automation",
  "trading_technical_analysis",
]);

export function isPackDemoKey(plan: string): plan is PackDemoKey {
  return PACK_DEMO_KEYS.has(plan);
}

/** Encode each path segment so spaces work on the CDN. */
export function publicDemoObjectUrl(objectKey: string): string {
  const key = objectKey.replace(/^\/+/, "").trim();
  if (!key) return "";
  const encoded = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${DEMO_CDN_BASE}/${encoded}`;
}

function urlFromObjectKey(objectKey: string | undefined): string | null {
  const key = (objectKey || "").trim();
  if (!key) return null;
  const url = publicDemoObjectUrl(key);
  return url || null;
}

/** True when this plan has a public demo configured (pack or module). */
export function hasPublicDemo(plan: string): boolean {
  return Boolean(resolvePackDemoUrl(plan));
}

/**
 * Resolve public demo URL for a pack OR module plan slug.
 * Module keys win when both exist (should not overlap).
 */
export function resolvePackDemoUrl(plan: string): string | null {
  const fullOverride = (PACK_DEMO_VIDEO_URLS[plan] || "").trim();
  if (fullOverride) return fullOverride;

  const moduleUrl = urlFromObjectKey(MODULE_DEMO_OBJECT_KEYS[plan]);
  if (moduleUrl) return moduleUrl;

  if (!isPackDemoKey(plan)) return null;
  return urlFromObjectKey(PACK_DEMO_OBJECT_KEYS[plan]);
}
