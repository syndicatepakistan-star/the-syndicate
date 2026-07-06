import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/programs", "/what-you-get", "/our-methods", "/our-founder", "/membership", "/affiliate", "/quiz"],
      disallow: [
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
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
