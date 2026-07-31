/**
 * Above-fold library thumbs for /programs#businessprograms Lighthouse / LCP.
 * Mobile paint order (paired grid): psych[0], model[0], psych[1].
 * Desktop column end: last three business-model covers.
 */
import { LEVEL1_SLUG_THUMBNAILS } from "@/lib/level1ProgramCatalog";
import { nextOptimizedImageSrcSet, nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

const MOBILE_FIRST_3_SLUGS = [
  "level1-psych-03", // Hustle Hard
  "level1-model-01", // AI content Automation
  "level1-psych-04", // Mastering Consistency
] as const;

const DESKTOP_LAST_3_MODEL_SLUGS = [
  "level1-model-09",
  "level1-model-10",
  "level1-model-11",
] as const;

const LCP_Q = 55;
const LCP_W = 384;

function thumb(slug: string): string | undefined {
  return LEVEL1_SLUG_THUMBNAILS[slug];
}

export type ProgramsLibraryPreload = {
  href: string;
  imageSrcSet?: string;
  /** Match card `sizes` so the browser picks a small mobile file. */
  imageSizes: string;
  media?: string;
  fetchPriority?: "high" | "low" | "auto";
};

export const PROGRAMS_LIBRARY_MOBILE_LCP_SIZES =
  "(max-width: 640px) 48vw, (max-width: 1279px) 48vw, 360px";

export const PROGRAMS_LIBRARY_DESKTOP_LCP_SIZES =
  "(max-width: 1279px) 48vw, 360px";

export function programsLibraryMobileFirst3Preloads(): ProgramsLibraryPreload[] {
  return MOBILE_FIRST_3_SLUGS.map((slug) => {
    const src = thumb(slug)!;
    return {
      href: nextOptimizedImageUrl(src, LCP_W, LCP_Q),
      imageSrcSet: nextOptimizedImageSrcSet(src, LCP_Q, 640),
      imageSizes: PROGRAMS_LIBRARY_MOBILE_LCP_SIZES,
      media: "(max-width: 1279px)",
      fetchPriority: "high" as const,
    };
  });
}

export function programsLibraryDesktopLast3Preloads(): ProgramsLibraryPreload[] {
  return DESKTOP_LAST_3_MODEL_SLUGS.map((slug) => {
    const src = thumb(slug)!;
    return {
      href: nextOptimizedImageUrl(src, LCP_W, LCP_Q),
      imageSrcSet: nextOptimizedImageSrcSet(src, LCP_Q, 640),
      imageSizes: PROGRAMS_LIBRARY_DESKTOP_LCP_SIZES,
      media: "(min-width: 1280px)",
      fetchPriority: "low" as const,
    };
  });
}

/** Slug → eager cover for PlaylistCardsSection priority heuristics. */
export const PROGRAMS_LIBRARY_PRIORITY_SLUGS = new Set<string>([
  ...MOBILE_FIRST_3_SLUGS,
  ...DESKTOP_LAST_3_MODEL_SLUGS,
]);

export const PROGRAMS_LIBRARY_MOBILE_PRIORITY_SLUGS = new Set<string>(MOBILE_FIRST_3_SLUGS);
export const PROGRAMS_LIBRARY_DESKTOP_PRIORITY_SLUGS = new Set<string>(DESKTOP_LAST_3_MODEL_SLUGS);
