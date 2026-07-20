import DashboardPageClient from "./DashboardPageClient";
import {
  isDashboardSectionKey,
  type DashboardSectionKey,
} from "@/lib/dashboardRoutes";

type PageProps = {
  searchParams: Promise<{ section?: string | string[] }>;
};

function sectionFromSearchParams(
  section: string | string[] | undefined,
): DashboardSectionKey {
  const raw = Array.isArray(section) ? section[0] : section;
  const value = (raw || "").trim().toLowerCase();
  if (isDashboardSectionKey(value)) return value;
  return "dashboard";
}

/**
 * Server entry: pass the rewritten `?section=` so client hydration matches SSR.
 * Middleware maps `/dashboard/programs` → `/dashboard?section=programs`.
 */
export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialSection = sectionFromSearchParams(params.section);
  return <DashboardPageClient initialSection={initialSection} />;
}
