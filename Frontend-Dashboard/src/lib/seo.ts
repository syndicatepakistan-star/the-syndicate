import type { Metadata } from "next";

/** Canonical production domain — used when NEXT_PUBLIC_SITE_URL is unset. */
export const DEFAULT_SITE_URL = "https://the-syndicate.com";

export const SITE_NAME = "The Syndicate";

export const DEFAULT_OG_IMAGE_PATH = "/assets/logo.png";

export type PressFeature = {
  publisher: string;
  publisherUrl: string;
  title: string;
  description: string;
  url: string;
  datePublished: string;
  logoSrc: string;
  articleImageSrc: string;
  sourceImageUrl: string;
  accent: "cyan" | "violet" | "amber";
};

/** Independent coverage displayed on the founder page and referenced by its search markup. */
export const PRESS_FEATURES: readonly PressFeature[] = [
  {
    publisher: "Forbes Georgia",
    publisherUrl: "https://forbes.ge",
    title: "How The Syndicate Uses Mastery and Empowerment to Redefine Business",
    description:
      "Forbes Georgia explores how The Syndicate offers practical business education as an alternative to traditional courses that can leave people unprepared for real-world challenges. The feature discusses the Money Mastery Course, the 7 Levels of Power, and the organisation's focus on mastering money and influence without losing moral integrity. It also highlights a wider mission to help members build confidence, lead with purpose, and create a positive impact.",
    url: "https://forbes.ge/en/how-the-syndicate-uses-mastery-and-empowerment-to-redefine-business/",
    datePublished: "2025-02-03",
    logoSrc: "/assets/press-forbes.png",
    articleImageSrc: "/assets/press-forbes-feature.png",
    sourceImageUrl: "https://forbes.ge/wp-content/uploads/2025/02/WEB-General-25020804.jpg",
    accent: "cyan",
  },
  {
    publisher: "GQ South Africa",
    publisherUrl: "https://gq.co.za",
    title: "How The Syndicate Can Disrupt the Traditional Model of Influence and Education in the Digital Age",
    description:
      "GQ examines The Syndicate's practical approach to education, responsible influence, and financial independence in the digital age. The article explains how members begin with Money Mastery before learning wider lessons about power, leadership, and shaping their environment with confidence. It also explores the strength of alliances built on honour, loyalty, and trust, where shared success matters more than isolated competition.",
    url: "https://gq.co.za/wealth/2025-02-10-how-the-syndicate-can-disrupt-the-traditional-model-of-influence-and-education-in-the-digital-age/",
    datePublished: "2025-02-10",
    logoSrc: "/assets/press-gq.png",
    articleImageSrc: "/assets/press-gq-feature.png",
    sourceImageUrl: "https://iol-prod.appspot.com/image/223a56d96550a8cd2c1cdf3197e1825461527c83/1000/jpeg",
    accent: "violet",
  },
  {
    publisher: "Luxury Lifestyle Magazine",
    publisherUrl: "https://www.luxurylifestylemag.co.uk",
    title: "How The Syndicate Empowers Individuals to Master Power, Money, and Influence",
    description:
      "Luxury Lifestyle Magazine profiles Guss Qureshi and The Syndicate's mission to help people gain greater control over money, power, and influence. The feature describes the Money Mastery Course as practical, video-based learning that members can apply to decisions, negotiations, and real-life challenges. It also highlights moral strength, responsible leadership, and using personal success to make a lasting difference in the wider community.",
    url: "https://www.luxurylifestylemag.co.uk/money/how-the-syndicate-empowers-individuals-to-master-power-money-and-influence-in-the-money-mastery-course/",
    datePublished: "2025-02-14",
    logoSrc: "/assets/press-luxury.png",
    articleImageSrc: "/assets/press-luxury-feature.png",
    sourceImageUrl: "https://www.luxurylifestylemag.co.uk/wp-content/uploads/2025/02/The-Syndicate.jpg",
    accent: "amber",
  },
] as const;

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
  keywords,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const image = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
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
