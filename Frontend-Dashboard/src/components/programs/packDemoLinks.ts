/**
 * PUBLIC pack trailers only (Cloudflare R2 `syn-demos` + cdn.the-syndicate.com).
 *
 * Not connected to private Stream / syn-bucket / Django signed playback.
 * Player loads the MP4 only after “Watch Demo Video” click.
 */

export const VIMEO_PACK_DEMO_LABEL = "Watch Demo Video";

export type PackDemoKey =
  | "bundle"
  | "agentic_ai"
  | "ai_content_automation"
  | "trading_technical_analysis";

/** Custom domain on public `syn-demos` bucket (preferred over *.r2.dev). */
const DEMO_CDN_BASE = (
  process.env.NEXT_PUBLIC_DEMO_CDN_BASE || "https://cdn.the-syndicate.com"
)
  .trim()
  .replace(/\/+$/, "");

/**
 * Object keys inside `syn-demos` (paths as shown in Cloudflare R2).
 * Add / change keys here when you upload more trailers — leave blank = button disabled.
 */
const PACK_DEMO_OBJECT_KEYS: Partial<Record<PackDemoKey, string>> = {
  // Money Mastery — upload then set path, e.g. "Programs Demos/Money Mastery Trailer/xxx.mp4"
  // bundle: "Programs Demos/Money Mastery Trailer/money-mastery.mp4",

  /** Agentic AI pack trailer (already on R2). */
  agentic_ai:
    "Programs Demos/Ai Automation Trailer/4 Claude Code Hacks_converted.mp4",

  // ai_content_automation: "Programs Demos/AI Content Trailer/....mp4",
  // trading_technical_analysis: "Programs Demos/Trading Trailer/....mp4",
};

/** Optional full URL overrides (rarely needed). */
export const PACK_DEMO_VIDEO_URLS: Partial<Record<PackDemoKey, string>> = {};

const DEMO_KEYS = new Set<string>([
  "bundle",
  "agentic_ai",
  "ai_content_automation",
  "trading_technical_analysis",
]);

export function isPackDemoKey(plan: string): plan is PackDemoKey {
  return DEMO_KEYS.has(plan);
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

/** Resolve a public demo MP4 URL for a pack plan, or null if not configured. */
export function resolvePackDemoUrl(plan: string): string | null {
  if (!isPackDemoKey(plan)) return null;

  const fullOverride = (PACK_DEMO_VIDEO_URLS[plan] || "").trim();
  if (fullOverride) return fullOverride;

  const objectKey = (PACK_DEMO_OBJECT_KEYS[plan] || "").trim();
  if (!objectKey) return null;

  const url = publicDemoObjectUrl(objectKey);
  return url || null;
}
