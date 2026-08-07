import DashboardPageClient from "./DashboardPageClient";
import {
  isDashboardSectionKey,
  type DashboardSectionKey,
} from "@/lib/dashboardRoutes";
import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { INSTRUCTOR_SLIDES } from "@/data/instructorSlides";
import { nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

type PageProps = {
  searchParams: Promise<{ section?: string | string[]; playlist?: string | string[] }>;
};

const MONEY_MASTERY_LCP = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 384, 55);
const INSTRUCTOR_LCP = nextOptimizedImageUrl(INSTRUCTOR_SLIDES[0]?.src ?? "", 640, 70);

function sectionFromSearchParams(
  section: string | string[] | undefined,
): DashboardSectionKey {
  const raw = Array.isArray(section) ? section[0] : section;
  const value = (raw || "").trim().toLowerCase();
  if (isDashboardSectionKey(value)) return value;
  return "dashboard";
}

function hasPlaylistParam(playlist: string | string[] | undefined): boolean {
  if (Array.isArray(playlist)) return playlist.some((v) => Boolean(v && String(v).trim()));
  return Boolean(playlist && String(playlist).trim());
}

/**
 * Server entry: pass the rewritten `?section=` so client hydration matches SSR.
 * Middleware maps `/dashboard/programs` → `/dashboard?section=programs`.
 * Emits exactly one LCP image preload in the initial HTML (no logo competition).
 */
export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialSection = sectionFromSearchParams(params.section);
  const playlistOpen = hasPlaylistParam(params.playlist);

  const lcpHref =
    initialSection === "programs" && !playlistOpen
      ? MONEY_MASTERY_LCP
      : initialSection === "dashboard"
        ? INSTRUCTOR_LCP
        : null;

  return (
    <>
      {lcpHref ? (
        <link
          rel="preload"
          as="image"
          href={lcpHref}
          // @ts-expect-error — React DOM typings lag fetchPriority on link
          fetchPriority="high"
          imageSrcSet={`${lcpHref} 640w`}
          imageSizes="(max-width: 767px) 94vw, (max-width: 1024px) 46vw, 480px"
        />
      ) : null}
      <DashboardPageClient initialSection={initialSection} />
    </>
  );
}
