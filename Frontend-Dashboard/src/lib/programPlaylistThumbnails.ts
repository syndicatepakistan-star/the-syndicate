import {
  OFFER_PLAN_THUMB_AGENTIC_AI,
  OFFER_PLAN_THUMB_AI_CONTENT_AUTOMATION,
  OFFER_PLAN_THUMB_MONEY_MASTERY,
  OFFER_PLAN_THUMB_THE_KNIGHT,
  OFFER_PLAN_THUMB_TRADING,
} from "@/components/programs/offerPlanThumbnails";

/** Public paths for program playlist cards and homepage globe deep links. */
const COURSE_IMAGES = "/assets/programs/cources%20imnages";

function courseThumb(fileName: string): string {
  return `${COURSE_IMAGES}/${encodeURIComponent(fileName)}`;
}

/** Playlists hidden from public and dashboard program libraries. */
export const HIDDEN_PROGRAM_PLAYLIST_IDS = new Set<number>([
  4, // The Art of Critical Thinking
  5, // The Art of Mastering Human Behavior in Business
  10, // The Business of Empire Building
  11, // The Art Of Business Persuasion
  15, // Faceless YouTube AI Content Creator Course
  22, // Block Chain and Smart Contract Building with Solidity
  26, // Prompt Engineering
  27, // Affiliate Marketing
]);

export const HIDDEN_PROGRAM_PLAYLIST_SLUGS = new Set<string>([
  "the-art-of-critical-thinking",
  "the-art-of-mastering-human-behavior-in-business",
  "the-business-of-empire-building",
  "the-art-of-business-persuasion",
  "faceless-youtube-ai-content-creator-course",
  "block-chain-and-smart-contract-building-with-solidity",
  "prompt-engineering",
  "affiliate-marketing",
]);

export type ProgramPlaylistVisibilityMeta = {
  slug?: string | null;
  title?: string | null;
};

/** Public /programs library — Business Psychology + Business Model (packs shown separately). */
export const PUBLIC_PROGRAMS_PAGE_IDS = new Set<number>([
  // Business Psychology
  1, // The 9 to 5 Exit Strategy
  2, // Zero to One Million
  3, // Hustle Hard
  6, // Mastering Consistency
  9, // The Secret To Transformation
  12, // The Compound Effect
  30, // The Micro Business Protocol
  31, // Mastering Risk and Uncertainty
  // Business Model
  13, // WordPress Blog
  14, // Framer Crash Course
  16, // AI Automations
  17, // N8N Ai Automation
  19, // Print On Demand
  20, // Building Games Using Unreal Engine
  21, // App Building (using Flutter)
  23, // Graphics Design Using Canva
  24, // Python Programming
  25, // Amazon KDP
  28, // Building Apps using React JS
]);

export const PROGRAM_DISPLAY_TITLE_OVERRIDES: Record<number, string> = {
  17: "N8N Ai Automation",
  19: "Print On Demand",
  25: "Amazon KDP",
  30: "The Micro Business Protocol",
};

/** Display order on /programs (Business Psychology column). */
export const PUBLIC_PSYCHOLOGY_PROGRAM_ORDER: readonly number[] = [
  3, 6, 31, 30, 1, 12, 2, 9,
];

/** Display order on /programs (Business Model column). */
export const PUBLIC_BUSINESS_MODEL_PROGRAM_ORDER: readonly number[] = [
  16, 17, 21, 28, 25, 20, 14, 23, 19, 24, 13,
];

/**
 * Stream playlist id → static cover image (used when Django has no cover_image).
 * Keys match admin playlist primary keys.
 */
export const PROGRAM_PLAYLIST_THUMBNAILS: Record<number, string> = {
  1: courseThumb("9-5.png"),
  2: courseThumb("0 to 1M.jpg"),
  3: courseThumb("hustle.png"),
  4: courseThumb("thinking.png"),
  5: courseThumb("humanbehaviou.png"),
  6: courseThumb("consistency.jpg"),
  7: courseThumb("13rules.png"),
  8: courseThumb("money-philosophy.jpeg"),
  9: courseThumb("secret.png"),
  10: courseThumb("empire.png"),
  11: courseThumb("persussation.png"),
  12: courseThumb("compound effect.jpg"),
  13: courseThumb("wordpress-blog.png"),
  14: courseThumb("framer.png"),
  15: courseThumb("faceless youtube.jpeg"),
  16: courseThumb("automaton-name-change.png"),
  17: courseThumb("N8N Ai.jpg"),
  18: courseThumb("trading with technical analysis.png"),
  19: courseThumb("print on demand.png"),
  20: courseThumb("unreal engine.png"),
  21: courseThumb("flutter-app-building.png"),
  22: courseThumb(
    "make_best_thumbnails_or_cover_image_of_program_block_chain_and_smart_contract_building_with_solidit_c2ffy9e3r8tpkd09kzrk_2.png"
  ),
  23: courseThumb("canvics-to-canva.png"),
  24: courseThumb("python.png"),
  25: courseThumb("cyber-dystopian-city.png"),
  26: courseThumb("prompt engineering.png"),
  27: courseThumb("affiliate-marketing.png"),
  28: courseThumb("react.jpeg"),
  29: courseThumb("1 minute scalpel.jpeg"),
  30: courseThumb("uncertainty.jpg"),
  31: courseThumb("micro business.jpg"),
};

/** Deep link from homepage globe → public programs library card. */
export function programPlaylistDeepLink(programId: number): string {
  return `/programs?program=${programId}#programs-library`;
}

/** Deep link from homepage globe → Syndicate Elite offer card. */
export type GlobePackKey =
  | "bundle"
  | "king"
  | "agentic_ai"
  | "ai_content_automation"
  | "trading_technical_analysis";

export const GLOBE_PACK_KEYS = new Set<GlobePackKey>([
  "bundle",
  "king",
  "agentic_ai",
  "ai_content_automation",
  "trading_technical_analysis",
]);

export function planOfferDeepLink(pack: GlobePackKey): string {
  return `/programs?pack=${encodeURIComponent(pack)}#syndicate-elite-offers`;
}

export type CuratedGlobeTile = {
  src: string;
  alt: string;
  fileName: string;
  href: string;
  programId?: number;
  packKey?: GlobePackKey;
};

/** Homepage globe — curated tiles only (offers + selected courses). */
export const CURATED_GLOBE_TILES: readonly CuratedGlobeTile[] = [
  {
    src: OFFER_PLAN_THUMB_MONEY_MASTERY,
    alt: "Money Mastery",
    fileName: "money-mastery-v2.png",
    href: planOfferDeepLink("bundle"),
    packKey: "bundle",
  },
  {
    src: OFFER_PLAN_THUMB_THE_KNIGHT,
    alt: "The Knight",
    fileName: "theknight.png",
    href: planOfferDeepLink("king"),
    packKey: "king",
  },
  {
    src: OFFER_PLAN_THUMB_AGENTIC_AI,
    alt: "Agentic AI",
    fileName: "Agentic Ai.jpeg",
    href: planOfferDeepLink("agentic_ai"),
    packKey: "agentic_ai",
  },
  {
    src: OFFER_PLAN_THUMB_AI_CONTENT_AUTOMATION,
    alt: "AI Content Automation",
    fileName: "Ai Content Automation.jpeg",
    href: planOfferDeepLink("ai_content_automation"),
    packKey: "ai_content_automation",
  },
  {
    src: OFFER_PLAN_THUMB_TRADING,
    alt: "Trading Advanced Technical Analysis",
    fileName: "trading.png",
    href: planOfferDeepLink("trading_technical_analysis"),
    packKey: "trading_technical_analysis",
  },
  { src: courseThumb("0 to 1M.jpg"), alt: "Zero to One Million", fileName: "0 to 1M.jpg", href: programPlaylistDeepLink(2), programId: 2 },
  { src: courseThumb("9-5.png"), alt: "The 9 to 5 Exit Strategy", fileName: "9-5.png", href: programPlaylistDeepLink(1), programId: 1 },
  { src: courseThumb("compound effect.jpg"), alt: "The Compound Effect", fileName: "compound effect.jpg", href: programPlaylistDeepLink(12), programId: 12 },
  { src: courseThumb("hustle.png"), alt: "Hustle Hard", fileName: "hustle.png", href: programPlaylistDeepLink(3), programId: 3 },
  { src: courseThumb("micro business.jpg"), alt: "The Micro Business Protocol", fileName: "micro business.jpg", href: programPlaylistDeepLink(31), programId: 31 },
  { src: courseThumb("secret.png"), alt: "The Secret To Transformation", fileName: "secret.png", href: programPlaylistDeepLink(9), programId: 9 },
  { src: courseThumb("flutter-app-building.png"), alt: "App Building (using Flutter)", fileName: "flutter-app-building.png", href: programPlaylistDeepLink(21), programId: 21 },
  { src: courseThumb("automaton-name-change.png"), alt: "AI Automations", fileName: "automaton-name-change.png", href: programPlaylistDeepLink(16), programId: 16 },
  { src: courseThumb("canvics-to-canva.png"), alt: "Graphics Design Using Canva", fileName: "canvics-to-canva.png", href: programPlaylistDeepLink(23), programId: 23 },
  { src: courseThumb("cyber-dystopian-city.png"), alt: "Amazon KDP", fileName: "cyber-dystopian-city.png", href: programPlaylistDeepLink(25), programId: 25 },
  { src: courseThumb("wordpress-blog.png"), alt: "WordPress Blog", fileName: "wordpress-blog.png", href: programPlaylistDeepLink(13), programId: 13 },
  { src: courseThumb("react.jpeg"), alt: "Building Apps using React JS", fileName: "react.jpeg", href: programPlaylistDeepLink(28), programId: 28 },
  { src: courseThumb("python.png"), alt: "Python Programming", fileName: "python.png", href: programPlaylistDeepLink(24), programId: 24 },
  { src: courseThumb("N8N Ai.jpg"), alt: "N8N Ai Automation", fileName: "N8N Ai.jpg", href: programPlaylistDeepLink(17), programId: 17 },
  { src: courseThumb("framer.png"), alt: "Framer Crash Course", fileName: "framer.png", href: programPlaylistDeepLink(14), programId: 14 },
  { src: courseThumb("uncertainty.jpg"), alt: "Mastering Risk and Uncertainty", fileName: "uncertainty.jpg", href: programPlaylistDeepLink(30), programId: 30 },
  { src: courseThumb("unreal engine.png"), alt: "Building Games Using Unreal Engine", fileName: "unreal engine.png", href: programPlaylistDeepLink(20), programId: 20 },
  { src: courseThumb("consistency.jpg"), alt: "Mastering Consistency", fileName: "consistency.jpg", href: programPlaylistDeepLink(6), programId: 6 },
  { src: courseThumb("print on demand.png"), alt: "Print On Demand", fileName: "print on demand.png", href: programPlaylistDeepLink(19), programId: 19 },
];

/** Shuffle tile positions on the globe without changing src/href/id bindings. */
function shuffleGlobeTiles<T>(tiles: readonly T[]): T[] {
  const arr = [...tiles];
  let seed = 7919;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function getCuratedGlobeGalleryImages(): CuratedGlobeTile[] {
  return shuffleGlobeTiles(CURATED_GLOBE_TILES);
}

export function getProgramPlaylistThumbnail(programId: number): string | undefined {
  return PROGRAM_PLAYLIST_THUMBNAILS[programId];
}

export function getProgramDisplayTitle(programId: number, fallback?: string | null): string {
  return PROGRAM_DISPLAY_TITLE_OVERRIDES[programId] ?? fallback?.trim() ?? "Syndicate Program";
}

function normalizeProgramTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hide deprecated or dashboard-excluded programs from the library grid. */
export function isHiddenProgramPlaylist(
  programId: number,
  meta?: ProgramPlaylistVisibilityMeta
): boolean {
  if (HIDDEN_PROGRAM_PLAYLIST_IDS.has(programId)) return true;
  const slug = meta?.slug?.trim().toLowerCase();
  if (slug && HIDDEN_PROGRAM_PLAYLIST_SLUGS.has(slug)) return true;
  const title = meta?.title ? normalizeProgramTitle(meta.title) : "";
  if (!title) return false;
  if (title.includes("critical thinking")) return true;
  if (title.includes("empire building")) return true;
  if (title.includes("human behavior")) return true;
  if (title.includes("persuasion") && title.includes("business")) return true;
  if (title.includes("affiliate marketing")) return true;
  if (title === "prompt engineering") return true;
  if (title.includes("faceless youtube")) return true;
  if (title.includes("block chain") || title.includes("blockchain")) return true;
  return false;
}

/** Public /programs course grid (excludes vault pack rows). */
export function isPublicProgramsLibraryPlaylist(
  programId: number,
  meta?: ProgramPlaylistVisibilityMeta
): boolean {
  if (isHiddenProgramPlaylist(programId, meta)) return false;
  return PUBLIC_PROGRAMS_PAGE_IDS.has(programId);
}
