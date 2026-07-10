import type { Metadata } from "next";

/** Canonical production domain — used when NEXT_PUBLIC_SITE_URL is unset. */
export const DEFAULT_SITE_URL = "https://the-syndicate.com";

export const SITE_NAME = "The Syndicate";

export const DEFAULT_OG_IMAGE_PATH = "/assets/logo.png";

/** Public marketing routes included in sitemap.xml (HTML pages only — never favicons). */
export const PUBLIC_SITEMAP_PATHS = [
  "",
  "/what-you-get",
  "/our-methods",
  "/our-founder",
  "/programs",
  "/membership",
  "/affiliate",
  "/quiz",
] as const;

export function getSiteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (configured) return configured.replace(/\/+$/, "");
  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function buildPageMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const image = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: image, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
