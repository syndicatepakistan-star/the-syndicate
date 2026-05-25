"use client";

import { useCallback, useMemo } from "react";
import { GoalPathSystem } from "@/components/dashboard/path/GoalPathSystem";
import type { DashboardCourseLike } from "@/components/dashboard/useDashboardSnapshots";
import { enrichProgramPlaylist } from "@/lib/programPlaylistCatalog";
import { scrollToProgramLibrary, type ProgramLibraryScrollTarget } from "@/lib/programCardScroll";
import { isHiddenProgramPlaylist } from "@/lib/programPlaylistThumbnails";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

type Props = {
  playlists: StreamPlaylistListItem[];
  /** Where Continue / card taps scroll — public /programs vs dashboard programs tab. */
  libraryTarget?: ProgramLibraryScrollTarget;
  className?: string;
};

/** YOUR PATH + Next opportunities — same cards on /programs and dashboard programs. */
export function PublicGoalPathSection({ playlists, libraryTarget = "public", className }: Props) {
  const enrichedPlaylists = useMemo(
    () =>
      playlists
        .filter(
          (pl) =>
            !pl.is_coming_soon &&
            !isHiddenProgramPlaylist(pl.id, { slug: pl.slug, title: pl.title }),
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

  if (enrichedPlaylists.length === 0) return null;

  return (
    <section
      aria-label="Your path and recommended programs"
      className={
        className ??
        "relative mx-auto w-full max-w-[1400px] px-[clamp(1rem,3.2vw,1.5rem)] pb-2 pt-2 sm:px-6 sm:pb-4 sm:pt-4"
      }
    >
      <GoalPathSystem
        themeMode="default"
        courses={courses}
        playlists={enrichedPlaylists}
        opportunityCardFrame="methods"
        opportunityContentMode="program"
        onContinue={onContinue}
      />
    </section>
  );
}
