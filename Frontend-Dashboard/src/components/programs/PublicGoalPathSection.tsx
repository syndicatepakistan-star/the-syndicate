"use client";

import { useCallback, useMemo } from "react";
import { GoalPathSystem } from "@/components/dashboard/path/GoalPathSystem";
import type { DashboardCourseLike } from "@/components/dashboard/useDashboardSnapshots";
import { enrichProgramPlaylist } from "@/lib/programPlaylistCatalog";
import { isHiddenProgramPlaylist } from "@/lib/programPlaylistThumbnails";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

type Props = {
  playlists: StreamPlaylistListItem[];
};

/** Public /programs: YOUR PATH + Next opportunities with live program cards and deep links. */
export function PublicGoalPathSection({ playlists }: Props) {
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
    const target = document.getElementById("programs-library");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.hash = "programs-library";
  }, []);

  return (
    <section
      aria-label="Your path and recommended programs"
      className="relative mx-auto w-full max-w-[1400px] px-[clamp(1rem,3.2vw,1.5rem)] pb-2 pt-2 sm:px-6 sm:pb-4 sm:pt-4"
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