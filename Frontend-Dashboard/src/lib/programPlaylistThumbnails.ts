/** Public paths for program playlist cards and homepage globe deep links. */
const COURSE_IMAGES = "/assets/programs/cources%20imnages";

function courseThumb(fileName: string): string {
  return `${COURSE_IMAGES}/${encodeURIComponent(fileName)}`;
}

/** Playlists hidden from the public /programs library grid. */
export const HIDDEN_PROGRAM_PLAYLIST_IDS = new Set<number>();

/**
 * Stream playlist id → static cover image (used when Django has no cover_image).
 * Keys match admin playlist primary keys.
 */
export const PROGRAM_PLAYLIST_THUMBNAILS: Record<number, string> = {
  1: courseThumb("9-5.png"),
  2: courseThumb("0-1.png"),
  3: courseThumb("hustle.png"),
  4: courseThumb("thinking.png"),
  5: courseThumb("humanbehaviou.png"),
  6: "/assets/programs/courses/mastering-consistency.png",
  7: courseThumb("13rules.png"),
  8: courseThumb("money-philosophy.jpeg"),
  9: courseThumb("secret.png"),
  10: courseThumb("empire.png"),
  11: courseThumb("persussation.png"),
  12: courseThumb("new-project (12).png"),
  13: courseThumb("wordpress-blog.png"),
  14: courseThumb(
    "make_best_thumbnails_or_cover_image_of_program_framer_crash_course__dystopian_futuristic_cyber__sv3m15ue62yv42axqzjz_3.png"
  ),
  15: courseThumb("faceless youtube.jpeg"),
  16: courseThumb("automaton-name-change.png"),
  17: courseThumb("new-project (1).png"),
  18: courseThumb("new-project.png"),
  19: courseThumb("dystopian-demand.png"),
  20: courseThumb(
    "make_best_thumbnails_or_cover_image_of_program_building_games_using_unreal_engine__dn7rcqknsnsvvwiu1pvf_0.png"
  ),
  21: courseThumb("flutter-app-building.png"),
  22: courseThumb(
    "make_best_thumbnails_or_cover_image_of_program_block_chain_and_smart_contract_building_with_solidit_c2ffy9e3r8tpkd09kzrk_2.png"
  ),
  23: courseThumb("canvics-to-canva.png"),
  24: courseThumb(
    "make_best_thumbnails_or_cover_image_of_program_python_programming__dystopian_cyber__pds64wpqtzleuu2ucwkp_0.png"
  ),
  25: courseThumb("cyber-dystopian-city.png"),
  26: courseThumb("prompt engineering.png"),
  27: courseThumb("affiliate-marketing.png"),
  28: courseThumb("react.jpeg"),
  29: courseThumb("1 minute scalpel.jpeg"),
};

/** Exact gallery filename → playlist id (homepage globe clicks). */
export const GLOBE_FILENAME_TO_PROGRAM_ID: Record<string, number> = Object.fromEntries(
  Object.entries(PROGRAM_PLAYLIST_THUMBNAILS).map(([id, url]) => {
    const segment = url.split("/").pop() ?? "";
    const fileName = decodeURIComponent(segment);
    return [fileName, Number(id)];
  })
);

export function getProgramPlaylistThumbnail(programId: number): string | undefined {
  return PROGRAM_PLAYLIST_THUMBNAILS[programId];
}

export function isHiddenProgramPlaylist(programId: number): boolean {
  return HIDDEN_PROGRAM_PLAYLIST_IDS.has(programId);
}

/** Deep link from homepage globe → public programs library card. */
export function programPlaylistDeepLink(programId: number): string {
  return `/programs?program=${programId}#programs-library`;
}
