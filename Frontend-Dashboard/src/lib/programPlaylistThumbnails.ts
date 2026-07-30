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
import { historyReplaceUrl } from "@/lib/historyUrl";
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
  13: "The Profitable Blogging Blueprint",
  14: "Rapid Web Building For Business (Vibe Coding)",
  16: "Social Media Content Automation",
  17: "AI content Automation for Businesses",
  19: "The Zero-Inventory Clothing Business Blueprint",
  20: "The Gaming Business Blueprint (Build, Launch, and Sell)",
  21: "App Building for Business (Vibe Coding)",
  23: "Graphics Design for Business (Graphics That Convert to Sales)",
  24: "Basics Python for Small Business",
  25: "eBook Business Blueprint (Monetize Your Knowledge)",
  28: "The Custom App Blueprint for Business",
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
  13: courseThumb("profitable-blogging-blueprint.png"),
  14: courseThumb("rapid-noncode-web-building.png"),
  15: courseThumb("faceless youtube.jpeg"),
  16: courseThumb("social-media-content-automation.jpg"),
  17: courseThumb("ai-content-automation-for-businesses.jpg"),
  18: courseThumb("trading with technical analysis.jpg"),
  19: courseThumb("zero-inventory-clothing-blueprint.png"),
  20: courseThumb("gaming-business-blueprint.png"),
  21: courseThumb("app-building-vibe-coding.png"),
  22: courseThumb(
    "make_best_thumbnails_or_cover_image_of_program_block_chain_and_smart_contract_building_with_solidit_c2ffy9e3r8tpkd09kzrk_2.png"
  ),
  23: courseThumb("graphics-design-for-business.png"),
  24: courseThumb("basics-python-small-business.png"),
  25: courseThumb("ebook-business-blueprint.jpg"),
  26: courseThumb("prompt engineering.jpg"),
  27: courseThumb("affiliate-marketing.jpg"),
  28: courseThumb("custom-app-blueprint.png"),
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

/** Dual deep-link hashes: `#spotlight` (zoom+glow) vs `#details` (description modal). */
export const PROGRAM_DETAILS_HASH = "details";
/** Zoom/glow deep link — must NOT match a DOM id (avoids browser hash scroll buzz). */
export const PROGRAM_SPOTLIGHT_HASH = "spotlight";
/** @deprecated Prefer PROGRAM_SPOTLIGHT_HASH for URLs; DOM section id remains `programs-library`. */
export const PROGRAM_LIBRARY_HASH = "programs-library";

/** Business Warfare — stable public cover (same file as program cards / globe). */
export const BUSINESS_WARFARE_LEGACY_ID = 99;
export const BUSINESS_WARFARE_LEVEL1_SLUG = "level1-psych-09";
export const BUSINESS_WARFARE_COVER_SRC = courseThumb("warfare.jpg");

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

/**
 * Level-1 library programs support `#spotlight` / `#details`.
 * Mid-ticket vault single modules (Agentic / AI Content / Trading lessons, etc.) are excluded.
 */
export function supportsProgramHashDeepLink(meta: {
  id?: number | null;
  slug?: string | null;
  title?: string | null;
  vault_plan_slug?: string | null;
}): boolean {
  if (isVaultSubmoduleStreamPlaylist(meta.vault_plan_slug)) return false;
  const slug = (meta.slug ?? "").trim().toLowerCase();
  if (slug && PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(slug)) return true;
  if (meta.id != null && meta.id > 0 && LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[meta.id]) return true;
  if (meta.id != null && PUBLIC_PROGRAMS_PAGE_IDS.has(meta.id)) return true;
  return false;
}

export function readProgramDetailsHash(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.replace(/^#/, "").toLowerCase() === PROGRAM_DETAILS_HASH;
}

export function readProgramSpotlightHash(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hash.replace(/^#/, "").toLowerCase();
  return h === PROGRAM_SPOTLIGHT_HASH || h === PROGRAM_LIBRARY_HASH || h === "";
}

type ProgramDeepLinkMeta = {
  id?: number | null;
  slug?: string | null;
};

/** Stable public slug for `?slug=` deep links (Level-1 catalog). */
export function resolveProgramDeepLinkSlug(meta: ProgramDeepLinkMeta): string | null {
  const raw = (meta.slug ?? "").trim().toLowerCase();
  if (raw && PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(raw)) return raw;
  if (meta.id != null && meta.id > 0) {
    const mapped = LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[meta.id];
    if (mapped) return mapped;
  }
  return null;
}

/**
 * Apply program identity (`?slug=` / `?program=` / dashboard `?playlist=`) + hash
 * onto a URL. Used so switching Details always updates the address bar at runtime.
 */
export function applyProgramDeepLinkToUrl(
  url: URL,
  meta: ProgramDeepLinkMeta,
  mode: "details" | "spotlight",
): void {
  const nextSlug = resolveProgramDeepLinkSlug(meta);
  const onDashboard = url.pathname.includes("/dashboard");

  if (nextSlug) {
    url.searchParams.set("slug", nextSlug);
    url.searchParams.delete("program");
  } else if (meta.id != null && meta.id > 0) {
    if (onDashboard) {
      url.searchParams.set("playlist", String(meta.id));
    } else {
      url.searchParams.set("program", String(meta.id));
      url.searchParams.delete("slug");
    }
  }

  if (onDashboard && meta.id != null && meta.id > 0) {
    url.searchParams.set("playlist", String(meta.id));
  }

  url.hash = mode === "details" ? PROGRAM_DETAILS_HASH : PROGRAM_SPOTLIGHT_HASH;
}

function replaceProgramDeepLink(meta: ProgramDeepLinkMeta, mode: "details" | "spotlight"): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const before = `${url.pathname}${url.search}${url.hash}`;
  applyProgramDeepLinkToUrl(url, meta, mode);
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (next !== before) {
    historyReplaceUrl(next);
  }
  return next;
}

/**
 * Sync address bar to the open program's query + `#details`.
 * Pass the playlist every time so switching cards updates `?slug=` at runtime.
 */
export function writeProgramDetailsHash(meta: ProgramDeepLinkMeta): string | null {
  return replaceProgramDeepLink(meta, "details");
}

/**
 * Drop `#details` when leaving the details modal (restore `#spotlight` for that same program).
 */
export function clearProgramDetailsHash(meta?: ProgramDeepLinkMeta): string | null {
  if (typeof window === "undefined") return null;
  if (meta) return replaceProgramDeepLink(meta, "spotlight");
  if (!readProgramDetailsHash()) return null;
  const url = new URL(window.location.href);
  url.hash = PROGRAM_SPOTLIGHT_HASH;
  const next = `${url.pathname}${url.search}${url.hash}`;
  historyReplaceUrl(next);
  return next;
}

function programSupportsDetailsOption(programId: number, slug?: string | null): boolean {
  return supportsProgramHashDeepLink({ id: programId > 0 ? programId : null, slug });
}

/** Deep link from homepage globe → public programs library card (stable level1 slug when mapped). */
export function programSlugDeepLink(slug: string, options?: { details?: boolean }): string {
  const eligible = PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(slug.trim().toLowerCase());
  const hash = options?.details && eligible ? PROGRAM_DETAILS_HASH : PROGRAM_SPOTLIGHT_HASH;
  return `/programs?slug=${encodeURIComponent(slug)}#${hash}`;
}

/** Deep link from homepage globe → public programs library card (zoom + glow). */
export function programPlaylistDeepLink(programId: number, options?: { details?: boolean }): string {
  const slug = LEGACY_PROGRAM_ID_TO_LEVEL1_SLUG[programId];
  if (slug) return programSlugDeepLink(slug, options);
  const eligible = programSupportsDetailsOption(programId);
  const hash = options?.details && eligible ? PROGRAM_DETAILS_HASH : PROGRAM_SPOTLIGHT_HASH;
  return `/programs?program=${programId}#${hash}`;
}

/**
 * Same query as the globe zoom link, but `#details` opens the description modal.
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
  const slug = PLAN_OFFER_DETAILS_SLUG[pack];
  return `/programs?slug=${encodeURIComponent(slug)}#syndicate-elite-offers`;
}

/** Friendly `?slug=` aliases for Klaviyo / marketing pack details deep links. */
const PACK_SLUG_ALIASES: Record<string, GlobePackKey> = {
  bundle: "bundle",
  "money-mastery": "bundle",
  money_mastery: "bundle",
  moneymastery: "bundle",
  king: "king",
  "the-knight": "king",
  the_knight: "king",
  knight: "king",
  agentic_ai: "agentic_ai",
  "agentic-ai": "agentic_ai",
  agenticai: "agentic_ai",
  ai_content_automation: "ai_content_automation",
  "ai-content-automation": "ai_content_automation",
  aicontentautomation: "ai_content_automation",
  trading_technical_analysis: "trading_technical_analysis",
  "trading-technical-analysis": "trading_technical_analysis",
  trading: "trading_technical_analysis",
};

/** Public slug used in `?slug=` for pack details URLs (Klaviyo-friendly). */
export const PLAN_OFFER_DETAILS_SLUG: Record<GlobePackKey, string> = {
  bundle: "money-mastery",
  king: "the-knight",
  agentic_ai: "agentic-ai",
  ai_content_automation: "ai-content-automation",
  trading_technical_analysis: "trading-technical-analysis",
};

export function parsePackDeepLinkSlug(raw: string | null | undefined): GlobePackKey | undefined {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return undefined;
  return PACK_SLUG_ALIASES[value];
}

/**
 * Same shape as Level-1 program details links — opens pack details modal.
 * Example: `/programs?slug=money-mastery#details`
 */
export function planOfferDetailsDeepLink(pack: GlobePackKey): string {
  const slug = PLAN_OFFER_DETAILS_SLUG[pack];
  return `/programs?slug=${encodeURIComponent(slug)}#${PROGRAM_DETAILS_HASH}`;
}

function replacePlanOfferDeepLink(pack: GlobePackKey, mode: "details" | "spotlight"): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const before = `${url.pathname}${url.search}${url.hash}`;
  url.searchParams.set("slug", PLAN_OFFER_DETAILS_SLUG[pack]);
  url.searchParams.delete("pack");
  url.searchParams.delete("program");
  url.hash = mode === "details" ? PROGRAM_DETAILS_HASH : "syndicate-elite-offers";
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (next !== before) historyReplaceUrl(next);
  return next;
}

export function writePlanOfferDetailsHash(pack: GlobePackKey): string | null {
  return replacePlanOfferDeepLink(pack, "details");
}

/** Unique pack slug in the address bar while focusing the card / vault (not the details modal). */
export function writePlanOfferSpotlightHash(pack: GlobePackKey): string | null {
  return replacePlanOfferDeepLink(pack, "spotlight");
}

export function clearPlanOfferDetailsHash(pack?: GlobePackKey): string | null {
  if (typeof window === "undefined") return null;
  if (pack) return replacePlanOfferDeepLink(pack, "spotlight");
  if (!readProgramDetailsHash()) return null;
  const url = new URL(window.location.href);
  url.hash = "syndicate-elite-offers";
  const next = `${url.pathname}${url.search}${url.hash}`;
  historyReplaceUrl(next);
  return next;
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
    href: planOfferDetailsDeepLink("bundle"),
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
    href: planOfferDetailsDeepLink("agentic_ai"),
    packKey: "agentic_ai",
  },
  {
    src: OFFER_PLAN_THUMB_AI_CONTENT_AUTOMATION,
    alt: "AI Content Automation",
    fileName: "Ai Content Automation.jpeg",
    href: planOfferDetailsDeepLink("ai_content_automation"),
    packKey: "ai_content_automation",
  },
  {
    src: OFFER_PLAN_THUMB_TRADING,
    alt: "Trading Advanced Technical Analysis",
    fileName: "trading.jpg",
    href: planOfferDetailsDeepLink("trading_technical_analysis"),
    packKey: "trading_technical_analysis",
  },
  { src: courseThumb("0 to 1M.jpg"), alt: "Zero to One Million", fileName: "0 to 1M.jpg", href: programPlaylistDeepLink(2), programId: 2 },
  { src: courseThumb("9-5.jpg"), alt: "The 9 to 5 Exit Strategy", fileName: "9-5.jpg", href: programPlaylistDeepLink(1), programId: 1 },
  { src: courseThumb("compound effect.jpg"), alt: "The Compound Effect", fileName: "compound effect.jpg", href: programPlaylistDeepLink(12), programId: 12 },
  { src: courseThumb("hustle.jpg"), alt: "Hustle Hard", fileName: "hustle.jpg", href: programPlaylistDeepLink(3), programId: 3 },
  { src: courseThumb("micro business.jpg"), alt: "Micro Business Protocols", fileName: "micro business.jpg", href: programPlaylistDeepLink(31), programId: 31 },
  { src: courseThumb("secret.jpg"), alt: "The Secret To Transformation", fileName: "secret.jpg", href: programPlaylistDeepLink(9), programId: 9 },
  { src: courseThumb("consistency.jpg"), alt: "Mastering Consistency", fileName: "consistency.jpg", href: programPlaylistDeepLink(6), programId: 6 },
  { src: courseThumb("uncertainty.jpg"), alt: "Mastering Risk and Uncertainty", fileName: "uncertainty.jpg", href: programPlaylistDeepLink(30), programId: 30 },
  { src: courseThumb("app-building-vibe-coding.png"), alt: "App Building for Business (Vibe Coding)", fileName: "app-building-vibe-coding.png", href: programPlaylistDeepLink(21), programId: 21 },
  { src: courseThumb("graphics-design-for-business.png"), alt: "Graphics Design for Business (Graphics That Convert to Sales)", fileName: "graphics-design-for-business.png", href: programPlaylistDeepLink(23), programId: 23 },
  { src: courseThumb("ebook-business-blueprint.jpg"), alt: "eBook Business Blueprint (Monetize Your Knowledge)", fileName: "ebook-business-blueprint.jpg", href: programPlaylistDeepLink(25), programId: 25 },
  { src: courseThumb("profitable-blogging-blueprint.png"), alt: "The Profitable Blogging Blueprint", fileName: "profitable-blogging-blueprint.png", href: programPlaylistDeepLink(13), programId: 13 },
  { src: courseThumb("custom-app-blueprint.png"), alt: "The Custom App Blueprint for Business", fileName: "custom-app-blueprint.png", href: programPlaylistDeepLink(28), programId: 28 },
  { src: courseThumb("basics-python-small-business.png"), alt: "Basics Python for Small Business", fileName: "basics-python-small-business.png", href: programPlaylistDeepLink(24), programId: 24 },
  { src: courseThumb("rapid-noncode-web-building.png"), alt: "Rapid Web Building For Business (Vibe Coding)", fileName: "rapid-noncode-web-building.png", href: programPlaylistDeepLink(14), programId: 14 },
  { src: courseThumb("gaming-business-blueprint.png"), alt: "The Gaming Business Blueprint (Build, Launch, and Sell)", fileName: "gaming-business-blueprint.png", href: programPlaylistDeepLink(20), programId: 20 },
  { src: courseThumb("zero-inventory-clothing-blueprint.png"), alt: "The Zero-Inventory Clothing Business Blueprint", fileName: "zero-inventory-clothing-blueprint.png", href: programPlaylistDeepLink(19), programId: 19 },
  { src: courseThumb("social-media-content-automation.jpg"), alt: "Social Media Content Automation", fileName: "social-media-content-automation.jpg", href: programPlaylistDeepLink(16), programId: 16 },
  { src: courseThumb("ai-content-automation-for-businesses.jpg"), alt: "AI content Automation for Businesses", fileName: "ai-content-automation-for-businesses.jpg", href: programPlaylistDeepLink(17), programId: 17 },
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
