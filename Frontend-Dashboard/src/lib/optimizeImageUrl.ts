/**
 * Smaller/faster image URLs for covers and thumbnails (Cloudinary + same-origin static).
 */

/** Cloudinary: request WebP/AVIF-friendly transforms at display width. */
export function optimizeCloudinaryUrl(url: string, width = 640): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  if (/\/upload\/[^/]*w_\d+/.test(url)) {
    return url;
  }
  const w = Math.max(320, Math.min(width, 1200));
  return url.replace("/upload/", `/upload/w_${w},q_auto:good,f_auto/`);
}

export function optimizeCoverImageSrc(src: string | undefined, width = 640): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("/")) {
    return src;
  }
  if (/^https?:\/\//i.test(src)) {
    return optimizeCloudinaryUrl(src, width);
  }
  return src;
}

/** Widths must exist in next.config.js images.deviceSizes/imageSizes. */
const NEXT_IMAGE_WIDTHS = [256, 384, 480, 640, 768, 828, 1080, 1200] as const;

/** Must match next.config.js `images.qualities` — invalid q → 400 blank images. */
const NEXT_IMAGE_QUALITIES = [55, 60, 62, 70, 72, 75, 78, 85, 88] as const;

function clampNextImageQuality(quality: number): number {
  const allowed = NEXT_IMAGE_QUALITIES as readonly number[];
  if (allowed.includes(quality)) return quality;
  return allowed.reduce((best, q) =>
    Math.abs(q - quality) < Math.abs(best - quality) ? q : best,
  );
}

function isNextOptimizableStatic(src: string): boolean {
  return (
    src.startsWith("/") &&
    !src.startsWith("/_next/") &&
    !/\.(svg|gif|mp4|webm)(\?|$)/i.test(src)
  );
}

/**
 * Route a same-origin static image through the Next.js optimizer (`/_next/image`)
 * so multi-MB source JPG/PNGs are served resized as AVIF/WebP.
 * Quality must be listed in next.config.js images.qualities.
 */
export function nextOptimizedImageUrl(src: string, width: number, quality = 70): string {
  if (!isNextOptimizableStatic(src)) return src;
  const w = NEXT_IMAGE_WIDTHS.find((candidate) => candidate >= width) ?? 1200;
  const q = clampNextImageQuality(quality);
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${q}`;
}

/** srcSet across optimizer widths for plain `<img>` tags (pair with a `sizes` attr). */
export function nextOptimizedImageSrcSet(
  src: string,
  quality = 70,
  /** Cap candidate widths so mobile does not download oversized variants. */
  maxWidth = 1200,
): string | undefined {
  if (!isNextOptimizableStatic(src)) return undefined;
  const q = clampNextImageQuality(quality);
  const widths = NEXT_IMAGE_WIDTHS.filter((w) => w <= maxWidth);
  const list = widths.length > 0 ? widths : [NEXT_IMAGE_WIDTHS[0]];
  return list
    .map((w) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${q} ${w}w`)
    .join(", ");
}
