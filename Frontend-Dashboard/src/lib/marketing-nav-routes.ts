export type NavSectionId =
  | "home"
  | "whatYouGet"
  | "ourMethods"
  | "joinNow"
  | "programs"
  | "membership"
  | "affiliate"
  | "syndicateAnalysis";

/** Radial nav + marketing CTAs */
export const MARKETING_NAV_HREF: Record<NavSectionId, string> = {
  home: "/",
  whatYouGet: "/what-you-get",
  ourMethods: "/our-methods",
  programs: "/programs",
  membership: "/membership",
  syndicateAnalysis: "/quiz",
  joinNow: "/login",
  affiliate: "/affiliate",
};

export const MARKETING_PREFETCH_ROUTES = [
  "/",
  "/what-you-get",
  "/our-methods",
  "/programs",
  "/membership",
  "/quiz",
  "/affiliate",
  "/affiliate-login",
  "/login",
] as const;

type PrefetchRouter = { prefetch: (href: string) => void };

export function prefetchMarketingRoutes(router: PrefetchRouter, extra: string[] = []) {
  const seen = new Set<string>();
  for (const route of [...MARKETING_PREFETCH_ROUTES, ...extra]) {
    if (seen.has(route)) continue;
    seen.add(route);
    router.prefetch(route);
  }
}
