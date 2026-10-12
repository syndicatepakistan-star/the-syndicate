/**
 * Public pack demo videos (CDN / R2 public bucket — not private Stream playback).
 *
 * Upload short MP4s to a PUBLIC bucket (e.g. syn-demos), then either:
 * 1) Set NEXT_PUBLIC_DEMO_CDN_BASE=https://your-public-host (no trailing slash), or
 * 2) Fill PACK_DEMO_VIDEO_URLS below with full URLs.
 *
 * Player loads the file only after the user clicks “Watch Demo Video”.
 */

export const VIMEO_PACK_DEMO_LABEL = "Watch Demo Video";

export type PackDemoKey =
  | "bundle"
  | "agentic_ai"
  | "ai_content_automation"
  | "trading_technical_analysis";

const DEMO_CDN_BASE = (process.env.NEXT_PUBLIC_DEMO_CDN_BASE || "").trim().replace(/\/+$/, "");

/** Optional full overrides (win over CDN base + default filenames). */
export const PACK_DEMO_VIDEO_URLS: Partial<Record<PackDemoKey, string>> = {
  // bundle: "https://cdn.example.com/demos/money-mastery.mp4",
  // agentic_ai: "https://cdn.example.com/demos/agentic-ai.mp4",
  // ai_content_automation: "https://cdn.example.com/demos/ai-content.mp4",
  // trading_technical_analysis: "https://cdn.example.com/demos/trading.mp4",
};

const DEFAULT_DEMO_FILES: Record<PackDemoKey, string> = {
  bundle: "demos/money-mastery.mp4",
  agentic_ai: "demos/agentic-ai.mp4",
  ai_content_automation: "demos/ai-content.mp4",
  trading_technical_analysis: "demos/trading.mp4",
};

const DEMO_KEYS = new Set<string>([
  "bundle",
  "agentic_ai",
  "ai_content_automation",
  "trading_technical_analysis",
]);

export function isPackDemoKey(plan: string): plan is PackDemoKey {
  return DEMO_KEYS.has(plan);
}

/** Resolve a public demo MP4 URL for a pack plan slug, or null if not configured yet. */
export function resolvePackDemoUrl(plan: string): string | null {
  if (!isPackDemoKey(plan)) return null;
  const override = (PACK_DEMO_VIDEO_URLS[plan] || "").trim();
  if (override) return override;
  if (!DEMO_CDN_BASE) return null;
  return `${DEMO_CDN_BASE}/${DEFAULT_DEMO_FILES[plan]}`;
}
