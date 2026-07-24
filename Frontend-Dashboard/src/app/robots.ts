import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const PRIVATE_PATHS = [
  "/dashboard",
  "/dashboard/",
  "/login",
  "/signup",
  "/verify",
  "/verify-otp",
  "/checkout",
  "/syndicate-otp",
  "/affiliate-login",
  "/affiliate-portal",
  "/membership/content",
  "/membership/articles",
  "/membership/brief",
  "/api/",
  "/streaming/",
];

const PUBLIC_PATHS = [
  "/",
  "/programs",
  "/what-you-get",
  "/our-methods",
  "/our-founder",
  "/membership",
  "/affiliate",
  "/quiz",
  "/syndicate-guarantee",
];

/**
 * AI / LLM crawlers explicitly allowed on public marketing pages so the site can
 * appear in AI search answers (ChatGPT, Claude, Perplexity, Gemini, Copilot, Meta AI).
 */
const AI_CRAWLERS = [
  "GPTBot", // OpenAI training
  "OAI-SearchBot", // ChatGPT search results
  "ChatGPT-User", // ChatGPT live browsing
  "ClaudeBot", // Anthropic
  "Claude-Web", // Claude live browsing
  "anthropic-ai",
  "PerplexityBot", // Perplexity search
  "Perplexity-User",
  "Google-Extended", // Gemini training
  "Applebot-Extended", // Apple Intelligence
  "meta-externalagent", // Meta AI
  "Bytespider", // ByteDance
  "cohere-ai",
  "CCBot", // Common Crawl (feeds many LLMs)
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
      ...AI_CRAWLERS.map((agent) => ({
        userAgent: agent,
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
