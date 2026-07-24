export type NavSectionId =
  | "home"
  | "whatYouGet"
  | "ourMethods"
  | "ourFounder"
  | "joinNow"
  | "programs"
  | "membership"
  | "affiliate"
  | "syndicateAnalysis"
  | "syndicateGuarantee";

/** Radial nav + marketing CTAs */
export const MARKETING_NAV_HREF: Record<NavSectionId, string> = {
  home: "/",
  whatYouGet: "/what-you-get",
  ourMethods: "/our-methods",
  ourFounder: "/our-founder",
  programs: "/programs",
  membership: "/membership",
  syndicateAnalysis: "/quiz",
  syndicateGuarantee: "/syndicate-guarantee",
  joinNow: "/login",
  affiliate: "/affiliate",
};

export const MARKETING_PREFETCH_ROUTES = [
  "/",
  "/what-you-get",
  "/our-methods",
  "/our-founder",
  "/programs",
  "/membership",
  "/quiz",
  "/syndicate-guarantee",
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
