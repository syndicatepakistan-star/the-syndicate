import {
  OFFER_PLAN_THUMB_AGENTIC_AI,
  OFFER_PLAN_THUMB_AI_CONTENT_AUTOMATION,
  OFFER_PLAN_THUMB_MONEY_MASTERY,
  OFFER_PLAN_THUMB_THE_KNIGHT,
  OFFER_PLAN_THUMB_TRADING,
} from "@/components/programs/offerPlanThumbnails";
import { isVaultCourseSlug, VAULT_PACK_COURSES } from "@/components/programs/vaultPackCatalog";
import { allTradingSubmoduleOffers } from "@/components/programs/tradingVaultCatalog";
import {
  LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG,
  LEVEL1_SLUG_THUMBNAILS,
  LEVEL1_SLUG_TITLE_OVERRIDES,
  PUBLIC_LEVEL1_PLAYLIST_SLUGS,
} from "@/lib/level1ProgramCatalog";
import { nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

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
  15, // Faceless YouTube AI Content Creator Course (legacy — use ai_content_automation pack)
  18, // Crypto Trading (legacy — use trading_technical_analysis pack)
  22, // Block Chain and Smart Contract Building with Solidity
  26, // Prompt Engineering
  27, // Affiliate Marketing
  29, // THE 1 MINUTE SCALPEL (legacy — use trading_scalpel_protocol module)
]);

export const HIDDEN_PROGRAM_PLAYLIST_SLUGS = new Set<string>([
  "the-art-of-critical-thinking",
  "the-art-of-mastering-human-behavior-in-business",
  "the-business-of-empire-building",
  "the-art-of-business-persuasion",
  "faceless-youtube-ai-content-creator-course",
  "crypto-trading-with-technical-analysis-course",
  "the-1-minute-scalpel",
  "block-chain-and-smart-contract-building-with-solidity",
  "prompt-engineering",
  "affiliate-marketing",
]);

export type ProgramPlaylistVisibilityMeta = {
  slug?: string | null;
  title?: string | null;
  vault_plan_slug?: string | null;
};

/** Mid-ticket vault lessons/modules — browse/unlock only inside pack modals, not the main program grid. */
export function isVaultSubmoduleStreamPlaylist(vaultPlanSlug?: string | null): boolean {
  const slug = (vaultPlanSlug ?? "").trim();
  if (!slug) return false;
  return isVaultCourseSlug(slug);
}

/** Public /programs library — Business Psychology + Business Model (packs shown separately). */
export const PUBLIC_PROGRAMS_PAGE_IDS = new Set<number>([
  // Business Psychology (11)
  1, // The 9 to 5 Exit Strategy
  2, // Zero to One Million
  3, // Hustle Hard
  6, // Mastering Consistency
  7, // Syndicate 13 Business Rules
  8, // Syndicate Money Philosophy
  9, // The Secret To Transformation
  12, // The Compound Effect
  30, // Mastering Risk and Uncertainty
  31, // Micro Business Protocols
  99, // Business Warfare
  // Business Model (11)
  13, // WordPress Blog
  14, // Framer Crash Course
  16, // AI Automations
  17, // N8N AI Automation
  19, // Print On Demand
  20, // Building Games Using Unreal Engine
  21, // App Building (using Flutter)
  23, // Graphics Design Using Canva
  24, // Python Programming
  25, // Amazon KDP
  28, // Building Apps using React JS
]);

export const PROGRAM_DISPLAY_TITLE_OVERRIDES: Record<number, string> = {
  16: "AI Automations",
  17: "N8N AI Automation",
  19: "Print On Demand",
  25: "Amazon KDP",
  30: "Mastering Risk and Uncertainty",
  31: "Micro Business Protocols",
};

/** Display order on /programs (Business Psychology column) — legacy ids for globe/deep links. */
export const PUBLIC_PSYCHOLOGY_PROGRAM_ORDER: readonly number[] = [
  3, 6, 30, 31, 99, 7, 8, 1, 12, 2, 9,
];

/** Display order on /programs (Business Model column). */
export const PUBLIC_BUSINESS_MODEL_PROGRAM_ORDER: readonly number[] = [
  17, 16, 21, 28, 25, 20, 14, 23, 19, 24, 13,
];

/**
 * Stream playlist id → static cover image (used when Django has no cover_image).
 * Keys match admin playlist primary keys.
 */
export const PROGRAM_PLAYLIST_THUMBNAILS: Record<number, string> = {
  1: courseThumb("9-5.jpg"),
  2: courseThumb("0 to 1M.jpg"),
  3: courseThumb("hustle.jpg"),
  4: courseThumb("thinking.png"),
  5: courseThumb("humanbehaviou.png"),
  6: courseThumb("consistency.jpg"),
  7: courseThumb("13rules.jpg"),
  8: courseThumb("money-philosophy.jpg"),
  9: courseThumb("secret.jpg"),
  10: courseThumb("empire.png"),
  11: courseThumb("persussation.png"),
  12: courseThumb("compound effect.jpg"),
  13: courseThumb("wordpress-blog.jpg"),
  14: courseThumb("framer.jpg"),
  15: courseThumb("faceless youtube.jpeg"),
  16: courseThumb("ai automations.jpg"),
  17: courseThumb("N8N Ai.jpg"),
  18: courseThumb("trading with technical analysis.jpg"),
  19: courseThumb("print on demand.jpg"),
  20: courseThumb("unreal engine.jpg"),
  21: courseThumb("flutter-app-building.jpg"),
  22: courseThumb(
    "make_best_thumbnails_or_cover_image_of_program_block_chain_and_smart_contract_building_with_solidit_c2ffy9e3r8tpkd09kzrk_2.png"
  ),
  23: courseThumb("canvics-to-canva.jpg"),
  24: courseThumb("python.jpg"),
  25: courseThumb("cyber-dystopian-city.jpg"),
  26: courseThumb("prompt engineering.jpg"),
  27: courseThumb("affiliate-marketing.jpg"),
  28: courseThumb("react.jpg"),
  29: courseThumb("1 minute scalpel.jpeg"),
  30: courseThumb("uncertainty.jpg"),
  31: courseThumb("micro business.jpg"),
  99: courseThumb("warfare.jpg"),
};

/** Vault module slug → pack course thumbnail (Agentic AI, AI Content, Trading modules + lessons). */
export const VAULT_MODULE_THUMBNAILS: Record<string, string> = {
  ...Object.fromEntries(
    Object.values(VAULT_PACK_COURSES).flatMap((courses) =>
      courses.map((course) => [course.plan, course.imageSrc] as const)
    )
  ),
  ...Object.fromEntries(
    allTradingSubmoduleOffers().map((offer) => [offer.plan, offer.imageSrc] as const)
  ),
};

export function getVaultModuleThumbnail(vaultPlanSlug: string): string | undefined {
  const key = vaultPlanSlug.trim().toLowerCase();
  if (!key) return undefined;
  return VAULT_MODULE_THUMBNAILS[key];
}

/** Business Warfare — dual deep links (zoom vs details) for globe / testing. */
export const BUSINESS_WARFARE_LEGACY_ID = 99;
export const BUSINESS_WARFARE_LEVEL1_SLUG = "level1-psych-09";
export const PROGRAM_DETAILS_HASH = "details";
export const PROGRAM_LIBRARY_HASH = "programs-library";

export function isBusinessWarfareProgram(meta: {
  id?: number | null;
  slug?: string | null;
  title?: string | null;
}): boolean {
  if (meta.id === BUSINESS_WARFARE_LEGACY_ID) return true;
  const slug = (meta.slug ?? "").trim().toLowerCase();
  if (slug === BUSINESS_WARFARE_LEVEL1_SLUG) return true;
  if (LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[meta.id ?? -1] === BUSINESS_WARFARE_LEVEL1_SLUG) return true;
  const title = (meta.title ?? "").trim().toLowerCase();
  return title === "business warfare";
}

export function readProgramDetailsHash(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.replace(/^#/, "").toLowerCase() === PROGRAM_DETAILS_HASH;
}

/** Sync address bar to `#details` (Business Warfare details modal open). */
export function writeProgramDetailsHash(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.hash.replace(/^#/, "").toLowerCase() === PROGRAM_DETAILS_HASH) return;
  url.hash = PROGRAM_DETAILS_HASH;
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

/** Drop `#details` when leaving the details modal. */
export function clearProgramDetailsHash(): void {
  if (typeof window === "undefined") return;
  if (!readProgramDetailsHash()) return;
  const url = new URL(window.location.href);
  url.hash = PROGRAM_LIBRARY_HASH;
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

/** Deep link from homepage globe → public programs library card (stable level1 slug when mapped). */
export function programSlugDeepLink(slug: string, options?: { details?: boolean }): string {
  const hash =
    options?.details && slug.trim().toLowerCase() === BUSINESS_WARFARE_LEVEL1_SLUG
      ? PROGRAM_DETAILS_HASH
      : PROGRAM_LIBRARY_HASH;
  return `/programs?slug=${encodeURIComponent(slug)}#${hash}`;
}

/** Deep link from homepage globe → public programs library card (zoom + glow). */
export function programPlaylistDeepLink(programId: number, options?: { details?: boolean }): string {
  const slug = LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[programId];
  if (slug) return programSlugDeepLink(slug, options);
  const hash =
    options?.details && programId === BUSINESS_WARFARE_LEGACY_ID
      ? PROGRAM_DETAILS_HASH
      : PROGRAM_LIBRARY_HASH;
  return `/programs?program=${programId}#${hash}`;
}

/**
 * Business Warfare only (for now): same query as the globe zoom link, but `#details`
 * opens the description modal with unlock CTAs.
 * Example: `/programs?slug=level1-psych-09#details`
 */
export function programPlaylistDetailsDeepLink(programId: number): string {
  return programPlaylistDeepLink(programId, { details: true });
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
    fileName: "money-mastery-v2.jpg",
    href: planOfferDeepLink("bundle"),
    packKey: "bundle",
  },
  {
    src: OFFER_PLAN_THUMB_THE_KNIGHT,
    alt: "The Knight",
    fileName: "theknight.jpg",
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
    fileName: "trading.jpg",
    href: planOfferDeepLink("trading_technical_analysis"),
    packKey: "trading_technical_analysis",
  },
  { src: courseThumb("0 to 1M.jpg"), alt: "Zero to One Million", fileName: "0 to 1M.jpg", href: programPlaylistDeepLink(2), programId: 2 },
  { src: courseThumb("9-5.jpg"), alt: "The 9 to 5 Exit Strategy", fileName: "9-5.jpg", href: programPlaylistDeepLink(1), programId: 1 },
  { src: courseThumb("compound effect.jpg"), alt: "The Compound Effect", fileName: "compound effect.jpg", href: programPlaylistDeepLink(12), programId: 12 },
  { src: courseThumb("hustle.jpg"), alt: "Hustle Hard", fileName: "hustle.jpg", href: programPlaylistDeepLink(3), programId: 3 },
  { src: courseThumb("micro business.jpg"), alt: "Micro Business Protocols", fileName: "micro business.jpg", href: programPlaylistDeepLink(31), programId: 31 },
  { src: courseThumb("secret.jpg"), alt: "The Secret To Transformation", fileName: "secret.jpg", href: programPlaylistDeepLink(9), programId: 9 },
  { src: courseThumb("flutter-app-building.jpg"), alt: "App Building (using Flutter)", fileName: "flutter-app-building.jpg", href: programPlaylistDeepLink(21), programId: 21 },
  { src: courseThumb("canvics-to-canva.jpg"), alt: "Graphics Design Using Canva", fileName: "canvics-to-canva.jpg", href: programPlaylistDeepLink(23), programId: 23 },
  { src: courseThumb("cyber-dystopian-city.jpg"), alt: "Amazon KDP", fileName: "cyber-dystopian-city.jpg", href: programPlaylistDeepLink(25), programId: 25 },
  { src: courseThumb("wordpress-blog.jpg"), alt: "WordPress Blog", fileName: "wordpress-blog.jpg", href: programPlaylistDeepLink(13), programId: 13 },
  { src: courseThumb("react.jpg"), alt: "Building Apps using React JS", fileName: "react.jpg", href: programPlaylistDeepLink(28), programId: 28 },
  { src: courseThumb("python.jpg"), alt: "Python Programming", fileName: "python.jpg", href: programPlaylistDeepLink(24), programId: 24 },
  { src: courseThumb("framer.jpg"), alt: "Framer Crash Course", fileName: "framer.jpg", href: programPlaylistDeepLink(14), programId: 14 },
  { src: courseThumb("uncertainty.jpg"), alt: "Mastering Risk and Uncertainty", fileName: "uncertainty.jpg", href: programPlaylistDeepLink(30), programId: 30 },
  { src: courseThumb("unreal engine.jpg"), alt: "Building Games Using Unreal Engine", fileName: "unreal engine.jpg", href: programPlaylistDeepLink(20), programId: 20 },
  { src: courseThumb("consistency.jpg"), alt: "Mastering Consistency", fileName: "consistency.jpg", href: programPlaylistDeepLink(6), programId: 6 },
  { src: courseThumb("print on demand.jpg"), alt: "Print On Demand", fileName: "print on demand.jpg", href: programPlaylistDeepLink(19), programId: 19 },
  { src: courseThumb("ai automations.jpg"), alt: "AI Automations", fileName: "ai automations.jpg", href: programPlaylistDeepLink(16), programId: 16 },
  { src: courseThumb("N8N Ai.jpg"), alt: "N8N AI Automation", fileName: "N8N Ai.jpg", href: programPlaylistDeepLink(17), programId: 17 },
  { src: courseThumb("13rules.jpg"), alt: "Syndicate 13 Business Rules", fileName: "13rules.jpg", href: programPlaylistDeepLink(7), programId: 7 },
  { src: courseThumb("money-philosophy.jpg"), alt: "Syndicate Money Philosophy", fileName: "money-philosophy.jpg", href: programPlaylistDeepLink(8), programId: 8 },
  { src: courseThumb("warfare.jpg"), alt: "Business Warfare", fileName: "warfare.jpg", href: programPlaylistDeepLink(99), programId: 99 },
  // Details deep link (Business Warfare only): programPlaylistDetailsDeepLink(99) → …#details
];

/** All unique globe tile URLs — used for parallel preload on the home page. */
export const GLOBE_GALLERY_IMAGE_URLS: readonly string[] = [
  ...new Set(CURATED_GLOBE_TILES.map((tile) => tile.src)),
];

/** Mobile globe — mid-ticket packs only (no vault sub-modules). */
export const MOBILE_GLOBE_PACK_KEYS: readonly GlobePackKey[] = [
  "bundle",
  "king",
  "agentic_ai",
  "ai_content_automation",
  "trading_technical_analysis",
];

/** Mobile globe — all 11 Business Psychology programs (lighter optimized thumbs). */
export const MOBILE_GLOBE_PSYCHOLOGY_PROGRAM_IDS: readonly number[] = [
  ...PUBLIC_PSYCHOLOGY_PROGRAM_ORDER,
];

/** Mobile globe — all 11 Business Model programs (lighter optimized thumbs). */
export const MOBILE_GLOBE_BUSINESS_PROGRAM_IDS: readonly number[] = [
  ...PUBLIC_BUSINESS_MODEL_PROGRAM_ORDER,
];

export const MOBILE_GLOBE_TILE_COUNT =
  MOBILE_GLOBE_PACK_KEYS.length +
  MOBILE_GLOBE_PSYCHOLOGY_PROGRAM_IDS.length +
  MOBILE_GLOBE_BUSINESS_PROGRAM_IDS.length;

/** Pick packs + 11 psychology + 11 business model tiles for mobile. */
export function filterCuratedGlobeTilesForMobile(
  tiles: readonly CuratedGlobeTile[] = CURATED_GLOBE_TILES,
): CuratedGlobeTile[] {
  const byPack = (packKey: GlobePackKey) => tiles.find((tile) => tile.packKey === packKey);
  const byProgram = (programId: number) => tiles.find((tile) => tile.programId === programId);

  const packs = MOBILE_GLOBE_PACK_KEYS.map(byPack).filter(Boolean) as CuratedGlobeTile[];
  const psychology = MOBILE_GLOBE_PSYCHOLOGY_PROGRAM_IDS.map(byProgram).filter(
    Boolean,
  ) as CuratedGlobeTile[];
  const business = MOBILE_GLOBE_BUSINESS_PROGRAM_IDS.map(byProgram).filter(
    Boolean,
  ) as CuratedGlobeTile[];

  return [...packs, ...psychology, ...business];
}

/** Keep raw static paths for next/image — do not pre-wrap `/_next/image` (double-encode 400s). */
export function lightenGlobeTilesForMobile<T extends { src: string }>(tiles: readonly T[]): T[] {
  return tiles.map((tile) => ({ ...tile }));
}

/** Smaller optimizer URLs for `<img>` / fetch warm only (not for next/image `src`). */
export function warmGlobeTileUrls(tiles: readonly { src: string }[]): string[] {
  return [...new Set(tiles.map((tile) => nextOptimizedImageUrl(tile.src, 256, 60)))];
}

export const MOBILE_GLOBE_GALLERY_IMAGE_URLS: readonly string[] = [
  ...new Set(filterCuratedGlobeTilesForMobile().map((tile) => tile.src)),
];

export function getMobileGlobeGalleryImages(): CuratedGlobeTile[] {
  return shuffleGlobeTiles(filterCuratedGlobeTilesForMobile());
}

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

export function getGlobeGalleryImagesForViewport(mobile: boolean): CuratedGlobeTile[] {
  return mobile ? getMobileGlobeGalleryImages() : getCuratedGlobeGalleryImages();
}

export function getProgramPlaylistThumbnail(programId: number, slug?: string | null): string | undefined {
  const key = slug?.trim().toLowerCase();
  if (key && LEVEL1_SLUG_THUMBNAILS[key]) return LEVEL1_SLUG_THUMBNAILS[key];
  return PROGRAM_PLAYLIST_THUMBNAILS[programId];
}

export function getProgramDisplayTitle(
  programId: number,
  fallback?: string | null,
  slug?: string | null
): string {
  const key = slug?.trim().toLowerCase();
  if (key && LEVEL1_SLUG_TITLE_OVERRIDES[key]) return LEVEL1_SLUG_TITLE_OVERRIDES[key];
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
  if (isVaultSubmoduleStreamPlaylist(meta?.vault_plan_slug)) return true;
  const slug = meta?.slug?.trim().toLowerCase();
  if (slug && PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(slug)) return false;
  if (HIDDEN_PROGRAM_PLAYLIST_IDS.has(programId)) return true;
  if (slug && HIDDEN_PROGRAM_PLAYLIST_SLUGS.has(slug)) return true;
  if (PUBLIC_PROGRAMS_PAGE_IDS.has(programId)) return false;
  const title = meta?.title ? normalizeProgramTitle(meta.title) : "";
  if (!title) return false;
  if (title.includes("critical thinking")) return true;
  if (title.includes("empire building")) return true;
  if (title.includes("human behavior")) return true;
  if (title.includes("persuasion") && title.includes("business")) return true;
  if (title.includes("affiliate marketing")) return true;
  if (title === "prompt engineering") return true;
  if (title.includes("faceless youtube")) return true;
  if (title.includes("ai automations")) return true;
  if (title.includes("how to build") && title.includes("agent")) return true;
  if (title.includes("crypto trading")) return true;
  if (title.includes("1 minute scalpel")) return true;
  if (title.includes("block chain") || title.includes("blockchain")) return true;
  return false;
}

/** Public /programs course grid (excludes vault pack rows). */
export function isPublicProgramsLibraryPlaylist(
  programId: number,
  meta?: ProgramPlaylistVisibilityMeta
): boolean {
  if (isHiddenProgramPlaylist(programId, meta)) return false;
  const slug = meta?.slug?.trim().toLowerCase();
  if (slug && PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(slug)) return true;
  return PUBLIC_PROGRAMS_PAGE_IDS.has(programId);
}
