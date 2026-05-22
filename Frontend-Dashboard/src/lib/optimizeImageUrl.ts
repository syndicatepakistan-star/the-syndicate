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
