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
 * Module-level trailers — key = checkout plan slug (agentic_ai_c01 … c26).
 * Paths = object keys inside public `syn-demos` bucket.
 *
 * Not uploaded yet (no Watch Demo on those cards until you add files + keys):
 * - agentic_ai_c09 Set up Google Credentials in n8n
 * - agentic_ai_c22 n8n MCP Servers tutorial
 * - agentic_ai_c26 Agentic Workflow for Businesses
 */
const MODULE_DEMO_OBJECT_KEYS: Record<string, string> = {
  // c01 Build a Blog Writing Agent With N8N
  agentic_ai_c01: `${AGENTIC_TRAILER_DIR}/Build a blog writing agent with n8n_converted.mp4`,
  // c02 Build a WhatsApp Agent with n8n
  agentic_ai_c02: `${AGENTIC_TRAILER_DIR}/Build Watsapp Agent In N8N_converted.mp4`,
  // c03 Build Apps With secret Claude Code Skill
  agentic_ai_c03: `${AGENTIC_TRAILER_DIR}/Build Apps With secret Claude Code Skill_converted.mp4`,
  // c04 Claude Code + Consensus for INSANE $50k+ App Ideas
  agentic_ai_c04: `${AGENTIC_TRAILER_DIR}/Claude Code + Consensus = INSANE $50k+ App Ideas_converted.mp4`,
  // c05 Is Claude Code Better than n8n
  agentic_ai_c05: `${AGENTIC_TRAILER_DIR}/Claude Code is Better at n8n than I am_converted.mp4`,
  // c06 Claude Code Memory Change
  agentic_ai_c06: `${AGENTIC_TRAILER_DIR}/Claude Code just changed Memory Forever (Tutorial)_converted.mp4`,
  // c07 Claude Cowork Automations
  agentic_ai_c07: `${AGENTIC_TRAILER_DIR}/10 Insane Claude Cowork Automations Nobody Is Talking About-_converted.mp4`,
  // c08 Scrap Any Website with N8N
  agentic_ai_c08: `${AGENTIC_TRAILER_DIR}/Scrap Any Website with N8N_converted.mp4`,
  // c09 — missing upload
  // c10 Google Antigravity FULL COURSE 2 HOURS
  agentic_ai_c10: `${AGENTIC_TRAILER_DIR}/Google Antigravity FULL COURSE 2 HOURS_converted.mp4`,
  // c11 n8n Tutorial 37 Tips and Tricks (n8n Masterclass)
  agentic_ai_c11: `${AGENTIC_TRAILER_DIR}/n8n Tutorial 37 Tips and Tricks (n8n Mastercl_converted.mp4`,
  // c12 CLAUDE CODE ADVANCED COURSE — 3 HOURS
  agentic_ai_c12: `${AGENTIC_TRAILER_DIR}/CLAUDE CODE ADVANCED COURSE — 3 HOURS_converted.mp4`,
  // c13 CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)
  agentic_ai_c13: `${AGENTIC_TRAILER_DIR}/CLAUDE CODE FULL COURSE 4 HOURS Build & Sell (2026)_converted.mp4`,
  // c14 4 Claude Code Hacks To Make Any Website Look Pro
  agentic_ai_c14: `${AGENTIC_TRAILER_DIR}/4 Claude Code Hacks_converted.mp4`,
  // c15 12 Ways to Fix Context in Claude Code
  agentic_ai_c15: `${AGENTIC_TRAILER_DIR}/12 Ways to Fix Context in Claude Code_converted.mp4`,
  // c16 27 Claude Code TIPS
  agentic_ai_c16: `${AGENTIC_TRAILER_DIR}/27 Claude Code TIPS_converted.mp4`,
  // c17 Automated Faceless Shorts with AI
  agentic_ai_c17: `${AGENTIC_TRAILER_DIR}/Automated Faceless (n8n)_converted.mp4`,
  // c18 Claude Cowork Marketing
  agentic_ai_c18: `${AGENTIC_TRAILER_DIR}/Claude Cowork just changed Marketing Forever_converted.mp4`,
  // c19 From Zero to RAG Agent
  agentic_ai_c19: `${AGENTIC_TRAILER_DIR}/From Zero to RAG Agent_converted.mp4`,
  // c20 Insane Youtube Automations
  agentic_ai_c20: `${AGENTIC_TRAILER_DIR}/Insane Youtube Automation!_converted.mp4`,
  // c21 n8n Blogging Automation: Generate SEO Blogs in Minutes
  agentic_ai_c21: `${AGENTIC_TRAILER_DIR}/n8n Blogging Automation_ Generate SEO Blogs in Minutes_converted.mp4`,
  // c22 — missing upload (MCP Servers)
  // c23 Never label gmail emails again
  agentic_ai_c23: `${AGENTIC_TRAILER_DIR}/Never label gmail emails again_converted.mp4`,
  // c24 Alternatives to N8N in 2026
  agentic_ai_c24: `${AGENTIC_TRAILER_DIR}/Stop Learning n8n in 2026.._converted.mp4`,
  // c25 VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity
  agentic_ai_c25: `${AGENTIC_TRAILER_DIR}/VIBE CODING FULL COURSE_ Gemini 3_converted.mp4`,
  // c26 — missing upload (Agentic Workflow for Businesses)
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
