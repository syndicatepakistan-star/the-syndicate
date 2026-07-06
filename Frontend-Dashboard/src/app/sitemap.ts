import type { MetadataRoute } from "next";
import { getSiteUrl, PUBLIC_SITEMAP_PATHS } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();

  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: path ? `${site}${path}` : site,
    lastModified: now,
    changeFrequency: path === "" || path === "/programs" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/programs" || path === "/membership" ? 0.9 : 0.8,
  }));
}
