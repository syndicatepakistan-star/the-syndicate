import {
  buildVaultModulePlaylistHref,
  fetchVaultPlaylistMap,
  resolveVaultPackPlaylistId,
  vaultPlaylistIdForPlan,
} from "@/lib/vaultPlaylistMap";
import { isVaultPackKey } from "@/components/programs/vaultPackCatalog";

/** @deprecated Unlock celebration removed; kept for clearing legacy session keys. */
export const PROGRAM_UNLOCK_CELEBRATION_KEY = "program_unlock_celebration_id";

export function buildDashboardPlaylistPath(playlistId: number): string {
  return `/dashboard?section=programs&playlist=${playlistId}`;
}

export const DASHBOARD_OPEN_PLAYLIST_EVENT = "dashboard-open-playlist";
export const DASHBOARD_OPEN_COURSE_EVENT = "dashboard-open-course";

/** Switch to Programs and open a playlist/course (works when Programs pane is keep-alive mounted). */
export function requestDashboardProgramOpen(opts: {
  playlistId?: number;
  courseId?: number;
  onNavigate?: (section: "programs") => void;
}): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  params.set("section", "programs");

  if (opts.playlistId != null && Number.isFinite(opts.playlistId) && opts.playlistId > 0) {
    params.set("playlist", String(opts.playlistId));
    params.delete("program");
  } else if (opts.courseId != null && Number.isFinite(opts.courseId) && opts.courseId > 0) {
    params.set("program", String(opts.courseId));
    params.delete("playlist");
  }

  const href = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({ dashboardSection: "programs" }, "", href);
  opts.onNavigate?.("programs");

  if (opts.playlistId != null && opts.playlistId > 0) {
    window.dispatchEvent(
      new CustomEvent(DASHBOARD_OPEN_PLAYLIST_EVENT, { detail: { playlistId: opts.playlistId } }),
    );
  } else if (opts.courseId != null && opts.courseId > 0) {
    window.dispatchEvent(
      new CustomEvent(DASHBOARD_OPEN_COURSE_EVENT, { detail: { courseId: opts.courseId } }),
    );
  }
}

export function parseDashboardProgramRef(
  id: string,
): { type: "playlist"; id: number } | { type: "course"; id: number } | null {
  if (id.startsWith("playlist:")) {
    const n = Number(id.slice("playlist:".length));
    return Number.isFinite(n) && n > 0 ? { type: "playlist", id: n } : null;
  }
  if (id.startsWith("course:")) {
    const n = Number(id.slice("course:".length));
    return Number.isFinite(n) && n > 0 ? { type: "course", id: n } : null;
  }
  return null;
}

export function clearUnlockCelebrationStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PROGRAM_UNLOCK_CELEBRATION_KEY);
  } catch {
    // Ignore storage exceptions.
  }
}

export async function resolveDashboardPathForPlan(
  plan: string,
  fallback = "/dashboard?section=programs"
): Promise<string> {
  try {
    const map = await fetchVaultPlaylistMap();
    return buildVaultModulePlaylistHref(plan, map, fallback);
  } catch {
    return fallback;
  }
}

export async function resolvePlaylistIdForPlan(plan: string): Promise<number | null> {
  try {
    const map = await fetchVaultPlaylistMap();
    const key = plan.trim().toLowerCase();
    if (isVaultPackKey(key)) {
      return resolveVaultPackPlaylistId(key, map);
    }
    return vaultPlaylistIdForPlan(key, map);
  } catch {
    return null;
  }
}

export function normalizePostAuthPath(raw: string | undefined): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "/dashboard?section=programs";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed.split("#")[0] || trimmed;
  }
  try {
    const url = new URL(trimmed);
    return `${url.pathname}${url.search}` || "/dashboard?section=programs";
  } catch {
    return "/dashboard?section=programs";
  }
}

export async function resolveAlreadyUnlockedRedirect(
  intent: { playlistId?: string; plan?: string; postAuthNext?: string }
): Promise<string> {
  const plan = (intent.plan || "").trim().toLowerCase();
  const playlistRaw = (intent.playlistId || "").trim();
  if (playlistRaw && /^\d+$/.test(playlistRaw)) {
    return buildDashboardPlaylistPath(Number(playlistRaw));
  }
  const fallback = normalizePostAuthPath(intent.postAuthNext);
  if (plan) {
    return resolveDashboardPathForPlan(plan, fallback);
  }
  return fallback;
}

/** Skip Stripe celebration and open the owned program in the dashboard. */
export async function navigateToAlreadyUnlockedProgram(
  intent: { playlistId?: string; plan?: string; postAuthNext?: string }
): Promise<void> {
  if (typeof window === "undefined") return;
  clearUnlockCelebrationStorage();
  const href = await resolveAlreadyUnlockedRedirect(intent);
  window.location.replace(href);
}
