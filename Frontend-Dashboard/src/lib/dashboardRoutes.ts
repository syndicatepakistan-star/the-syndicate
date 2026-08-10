/** Canonical private dashboard section routes (path-based, legacy ?section= still accepted). */

export const DASHBOARD_SECTION_KEYS = [
  "dashboard",
  "programs",
  "monk",
  "resources",
  "support",
  "quickaccess",
  "settings",
  "admin",
] as const;

export type DashboardSectionKey = (typeof DASHBOARD_SECTION_KEYS)[number];

const SECTION_SET = new Set<string>(DASHBOARD_SECTION_KEYS);

export function isDashboardSectionKey(value: string | null | undefined): value is DashboardSectionKey {
  return !!value && SECTION_SET.has(value);
}

/** Build `/dashboard` or `/dashboard/programs?...` (never `?section=`). */
export function dashboardHref(
  section: DashboardSectionKey | "affiliate" = "dashboard",
  query?: Record<string, string | number | null | undefined> | URLSearchParams,
): string {
  if (section === "affiliate") return "/affiliate";

  const path = section === "dashboard" ? "/dashboard" : `/dashboard/${section}`;
  const params =
    query instanceof URLSearchParams
      ? new URLSearchParams(query.toString())
      : new URLSearchParams();

  if (!(query instanceof URLSearchParams) && query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === "") continue;
      params.set(key, String(value));
    }
  }

  params.delete("section");
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Resolve active section from pathname + optional legacy ?section=. */
export function resolveDashboardSectionFromLocation(
  pathname: string,
  search: string | URLSearchParams = "",
): DashboardSectionKey {
  const path = (pathname || "").replace(/\/+$/, "") || "/dashboard";
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "dashboard" && parts[1] && isDashboardSectionKey(parts[1])) {
    return parts[1];
  }

  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const legacy = params.get("section");
  if (isDashboardSectionKey(legacy) && legacy !== "dashboard") return legacy;
  return "dashboard";
}

export function dashboardProgramsHref(
  query?: Record<string, string | number | null | undefined>,
): string {
  return dashboardHref("programs", query);
}
