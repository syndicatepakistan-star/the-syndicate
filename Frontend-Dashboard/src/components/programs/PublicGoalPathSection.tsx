"use client";

import { useCallback, useMemo } from "react";
import { GoalPathSystem } from "@/components/dashboard/path/GoalPathSystem";
import type { DashboardCourseLike } from "@/components/dashboard/useDashboardSnapshots";
import { enrichProgramPlaylist } from "@/lib/programPlaylistCatalog";
import { scrollToProgramLibrary, type ProgramLibraryScrollTarget } from "@/lib/programCardScroll";
import { isPublicProgramsLibraryPlaylist } from "@/lib/programPlaylistThumbnails";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

type Props = {
  playlists: StreamPlaylistListItem[];
  /** Where Continue / card taps scroll — public /programs vs dashboard programs tab. */
  libraryTarget?: ProgramLibraryScrollTarget;
  /** Show YOUR PATH even when the public program grid is empty (pack/module paths still apply). */
  alwaysVisible?: boolean;
  className?: string;
};

/** YOUR PATH + Next opportunities — same cards on /programs and dashboard programs. */
export function PublicGoalPathSection({
  playlists,
  libraryTarget = "public",
  alwaysVisible = false,
  className,
}: Props) {
  const enrichedPlaylists = useMemo(
    () =>
      playlists
        .filter(
          (pl) =>
            !pl.is_coming_soon &&
            isPublicProgramsLibraryPlaylist(pl.id, {
              slug: pl.slug,
              title: pl.title,
              vault_plan_slug: pl.vault_plan_slug,
            }),
        )
        .map((pl) => enrichProgramPlaylist(pl)),
    [playlists],
  );

  const courses: DashboardCourseLike[] = useMemo(
    () =>
      enrichedPlaylists.map((pl) => ({
        id: String(pl.id),
        title: pl.title,
      })),
    [enrichedPlaylists],
  );

  const onContinue = useCallback(() => {
    scrollToProgramLibrary(libraryTarget);
  }, [libraryTarget]);

  if (!alwaysVisible && enrichedPlaylists.length === 0) return null;

  return (
    <section
      aria-label="Your path and recommended programs"
      className={
        className ??
        "relative mx-auto w-full max-w-[1400px] px-[clamp(1rem,3.2vw,1.5rem)] pb-8 pt-2 sm:px-6 sm:pb-12 sm:pt-4"
      }
    >
      <GoalPathSystem
        themeMode="default"
        courses={courses}
        playlists={enrichedPlaylists}
        opportunityCardFrame="methods"
        opportunityContentMode="program"
        manualScrollOnly
        onContinue={onContinue}
      />
    </section>
  );
}
