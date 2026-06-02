import type { SyndicateCopySection } from "@/data/syndicateWebsiteCopy";
import { SYNDICATE_WEBSITE_COPY } from "@/data/syndicateWebsiteCopy";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Lookup section copy by heading from Syndicate Website Text NEW.odt */
export function getSyndicateCopy(title: string): SyndicateCopySection | undefined {
  const key = normalizeTitle(title);
  return SYNDICATE_WEBSITE_COPY.find((s) => normalizeTitle(s.title) === key);
}

export function getSyndicateCopyParagraphs(title: string): string[] {
  return getSyndicateCopy(title)?.paragraphs ?? [];
}

/** Merged struggle + comfort sections (empty struggle block in source doc). */
export function getHomeStruggleParagraphs(): string[] {
  const struggle = getSyndicateCopy("Success Is Born From Struggle")?.paragraphs ?? [];
  const comfort = getSyndicateCopy("And Failure Is Born From Comfort")?.paragraphs ?? [];
  return [...struggle, ...comfort];
}
