import { fetchCoursesList, type CourseDto } from "@/lib/courses-api";
import { formatProgramDisplayTitle } from "@/lib/programDisplayTitle";
import {
  HIDDEN_PROGRAM_PLAYLIST_IDS,
  HIDDEN_PROGRAM_PLAYLIST_SLUGS,
  type ProgramPlaylistVisibilityMeta,
} from "@/lib/programPlaylistThumbnails";
import { resolveProgramPlaylistTitle } from "@/lib/programPlaylistCatalog";
import { hasMoneyMasteryAccess } from "@/components/programs/vaultUnlock";
import { fetchPortalIdentity } from "@/lib/portal-api";
import { fetchStreamPlaylists, type StreamPlaylistListItem } from "@/lib/streaming-api";
import type { DashboardCourseLike } from "@/components/dashboard/useDashboardSnapshots";

const WATCH_PROGRESS_PREFIX = "syn_playlist_watch_progress_v1";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nested vault lessons ($9 rows) — exclude from dashboard active-program totals. */
function isNestedVaultLessonSlug(slug: string): boolean {
  const v = slug.trim().toLowerCase();
  return (
    /^trading_(secrets|setups|strategies|scalpel)_\d{2}$/.test(v) ||
    /^agentic_ai_c\d{2}$/.test(v) ||
    /^ai_content_c\d{2}$/.test(v)
  );
}

/** Whether an unlocked playlist should count toward dashboard “active programs”. */
export function isDashboardActiveProgramPlaylist(
  programId: number,
  meta?: ProgramPlaylistVisibilityMeta,
): boolean {
  if (HIDDEN_PROGRAM_PLAYLIST_IDS.has(programId)) return false;

  const vaultSlug = (meta?.vault_plan_slug ?? "").trim().toLowerCase();
  if (vaultSlug && isNestedVaultLessonSlug(vaultSlug)) return false;

  const slug = (meta?.slug ?? "").trim().toLowerCase();
  if (slug && HIDDEN_PROGRAM_PLAYLIST_SLUGS.has(slug)) return false;
  if (slug && isNestedVaultLessonSlug(slug)) return false;

  const title = meta?.title ? normalizeTitle(meta.title) : "";
  if (title) {
    if (title.includes("critical thinking")) return false;
    if (title.includes("empire building")) return false;
    if (title.includes("human behavior")) return false;
    if (title.includes("persuasion") && title.includes("business")) return false;
    if (title.includes("affiliate marketing")) return false;
    if (title === "prompt engineering") return false;
    if (title.includes("faceless youtube")) return false;
    if (title.includes("block chain") || title.includes("blockchain")) return false;
  }

  return true;
}

function playlistProgressPct(playlistId: number): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(`${WATCH_PROGRESS_PREFIX}:${playlistId}`);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Record<
      string,
      { watchedSeconds?: number; durationSeconds?: number; completed?: boolean }
    >;
    const rows = Object.values(parsed ?? {});
    if (!rows.length) return 0;
    let watched = 0;
    let duration = 0;
    let completed = 0;
    for (const row of rows) {
      watched += Number(row.watchedSeconds) || 0;
      duration += Number(row.durationSeconds) || 0;
      if (row.completed) completed += 1;
    }
    if (completed > 0 && completed === rows.length) return 100;
    if (duration <= 0) return watched > 0 ? 1 : 0;
    return Math.max(0, Math.min(100, Math.round((watched / duration) * 100)));
  } catch {
    return 0;
  }
}

function courseProgressPct(courseId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("dashboarded:course-progress");
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Record<string, number>;
    const v = parsed[courseId];
    return typeof v === "number" ? Math.max(0, Math.min(100, v)) : 0;
  } catch {
    return 0;
  }
}

function mapPlaylistToCourse(playlist: StreamPlaylistListItem): DashboardCourseLike {
  const title = formatProgramDisplayTitle(resolveProgramPlaylistTitle(playlist));
  const progressPct = playlistProgressPct(playlist.id);
  return {
    id: `playlist:${playlist.id}`,
    title,
    meta: playlist.category === "business_model" ? "Business Model" : "Business Psychology",
    statusText: playlist.is_unlocked ? "Unlocked" : "Locked",
    imageSrc: playlist.cover_image_url ?? undefined,
    progressPct,
    unlocked: !!playlist.is_unlocked,
  };
}

function mapApiCourseToDashboard(course: CourseDto): DashboardCourseLike {
  const id = `course:${course.id}`;
  return {
    id,
    title: formatProgramDisplayTitle(course.title),
    meta: "Course",
    statusText: course.can_access === false ? "Locked" : "Unlocked",
    imageSrc: course.cover_image_url ?? undefined,
    progressPct: courseProgressPct(id),
    unlocked: course.can_access !== false,
  };
}

export type UnlockedDashboardProgramsResult = {
  programs: DashboardCourseLike[];
  unlockedCount: number;
  inProgressCount: number;
};

export async function loadUnlockedDashboardPrograms(): Promise<UnlockedDashboardProgramsResult> {
  const identity = await fetchPortalIdentity().catch(() => null);
  const accessTier = identity?.access_tier ?? null;
  const moneyMasteryActive = !!identity?.money_mastery_active;
  const fullUnlock = hasMoneyMasteryAccess(accessTier, moneyMasteryActive);

  const [playlistList, coursesRes] = await Promise.all([
    fetchStreamPlaylists({ allowPublicFallback: false, forceRefresh: true }).catch(() => [] as StreamPlaylistListItem[]),
    fetchCoursesList().catch(() => ({ ok: false as const, data: null, status: 0 })),
  ]);

  const effectivePlaylists = fullUnlock
    ? playlistList.map((pl) => ({ ...pl, is_unlocked: true }))
    : playlistList;

  const playlistPrograms = effectivePlaylists
    .filter((pl) => !!pl.is_unlocked && !pl.is_coming_soon)
    .filter((pl) =>
      isDashboardActiveProgramPlaylist(pl.id, {
        slug: pl.slug,
        title: pl.title,
        vault_plan_slug: pl.vault_plan_slug,
      }),
    )
    .map(mapPlaylistToCourse);

  const apiCourses: CourseDto[] =
    coursesRes.ok && Array.isArray(coursesRes.data) ? (coursesRes.data as CourseDto[]) : [];

  const coursePrograms = apiCourses
    .filter((c) => c.is_published)
    .filter((c) =>
      isDashboardActiveProgramPlaylist(c.id, { slug: c.slug, title: c.title, vault_plan_slug: null }),
    )
    .filter((c) => fullUnlock || c.can_access !== false)
    .map(mapApiCourseToDashboard);

  const programs = [...playlistPrograms, ...coursePrograms].sort((a, b) => a.title.localeCompare(b.title));
  const inProgressCount = programs.filter((p) => (p.progressPct ?? 0) > 0).length;

  return {
    programs,
    unlockedCount: programs.length,
    inProgressCount,
  };
}
