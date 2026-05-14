/** Dispatched on `window` so `GoalsGlobalChrome` can request shell nav without prop drilling. */
export const DASHBOARD_SHELL_NAV_EVENT = "dashboard-shell:nav";

export type DashboardShellNavEventDetail = { key: string };

export function requestDashboardShellNav(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DashboardShellNavEventDetail>(DASHBOARD_SHELL_NAV_EVENT, { detail: { key } }));
}
