import { homeFaqForStructuredData, type FaqItem } from "@/data/homeFaq";
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, getSiteUrl, SITE_NAME } from "@/lib/seo";

/** Brand social profiles (footer + structured data). */
export const SYNDICATE_SAME_AS = [
  "https://www.instagram.com/followthesyndicate",
  "https://www.tiktok.com/@followthesyndicate",
] as const;

export const DEFAULT_SITE_TITLE = "The Syndicate — Business Education, Trading Vaults & AI Programs";

export const DEFAULT_SITE_DESCRIPTION =
  "Elite business education: money mastery, trading technical analysis, AI automation, business psychology & operator programs. Explore courses, membership & vault packs at The Syndicate.";

function stripFaqAnswer(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function buildOrganizationJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site}/#organization`,
    name: SITE_NAME,
    url: site,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/favicon-192.png"),
      width: 192,
      height: 192,
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
    description: DEFAULT_SITE_DESCRIPTION,
    sameAs: [...SYNDICATE_SAME_AS],
  };
}

export function buildWebSiteJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site}/#website`,
    name: SITE_NAME,
    url: site,
    description: DEFAULT_SITE_DESCRIPTION,
    publisher: { "@id": `${site}/#organization` },
    inLanguage: "en-US",
  };
}

export function buildFaqPageJsonLd(items: FaqItem[] = homeFaqForStructuredData()) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripFaqAnswer(item.a),
      },
    })),
  };
}

export function buildHomeJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationJsonLd(), buildWebSiteJsonLd(), buildFaqPageJsonLd()],
  };
}
