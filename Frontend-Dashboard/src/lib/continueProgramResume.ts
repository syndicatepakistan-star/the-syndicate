/** Cross-session resume target for dashboard "Continue Program". */

export const CONTINUE_PROGRAM_KEY = "syn_continue_program_v1";
export const PLAYLIST_LAST_EPISODE_PREFIX = "syn_playlist_last_episode_v1";
export const WATCH_PROGRESS_PREFIX = "syn_playlist_watch_progress_v1";

export type ContinueProgramResume = {
  playlistId: number;
  videoId: number;
  positionSeconds: number;
  updatedAt: number;
};

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readContinueProgramResume(): ContinueProgramResume | null {
  if (typeof window === "undefined") return null;
  const parsed = safeParseJson<Partial<ContinueProgramResume>>(
    window.localStorage.getItem(CONTINUE_PROGRAM_KEY),
  );
  const playlistId = Number(parsed?.playlistId);
  const videoId = Number(parsed?.videoId);
  if (!Number.isFinite(playlistId) || playlistId <= 0) return null;
  if (!Number.isFinite(videoId) || videoId <= 0) return null;
  return {
    playlistId,
    videoId,
    positionSeconds: Math.max(0, Number(parsed?.positionSeconds) || 0),
    updatedAt: Math.max(0, Number(parsed?.updatedAt) || 0),
  };
}

export function writeContinueProgramResume(input: {
  playlistId: number;
  videoId: number;
  positionSeconds?: number;
}): void {
  if (typeof window === "undefined") return;
  const playlistId = Number(input.playlistId);
  const videoId = Number(input.videoId);
  if (!Number.isFinite(playlistId) || playlistId <= 0) return;
  if (!Number.isFinite(videoId) || videoId <= 0) return;
  const payload: ContinueProgramResume = {
    playlistId,
    videoId,
    positionSeconds: Math.max(0, Number(input.positionSeconds) || 0),
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(CONTINUE_PROGRAM_KEY, JSON.stringify(payload));
    window.localStorage.setItem(`${PLAYLIST_LAST_EPISODE_PREFIX}:${playlistId}`, String(videoId));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function readPlaylistLastEpisodeId(playlistId: number): number | null {
  if (typeof window === "undefined") return null;
  if (!Number.isFinite(playlistId) || playlistId <= 0) return null;
  try {
    const raw = window.localStorage.getItem(`${PLAYLIST_LAST_EPISODE_PREFIX}:${playlistId}`);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Prefer explicit continue pointer; else first playlist with any watch progress. */
export function resolveContinuePlaylistId(preferredUnlockedIds?: number[]): number | null {
  const resume = readContinueProgramResume();
  if (resume?.playlistId) {
    if (!preferredUnlockedIds?.length || preferredUnlockedIds.includes(resume.playlistId)) {
      return resume.playlistId;
    }
  }

  if (typeof window === "undefined") return null;

  const unlocked = preferredUnlockedIds?.length ? new Set(preferredUnlockedIds) : null;
  let bestId: number | null = null;
  let bestScore = -1;

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(`${WATCH_PROGRESS_PREFIX}:`)) continue;
      const playlistId = Number(key.slice(`${WATCH_PROGRESS_PREFIX}:`.length));
      if (!Number.isFinite(playlistId) || playlistId <= 0) continue;
      if (unlocked && !unlocked.has(playlistId)) continue;

      const parsed = safeParseJson<
        Record<string, { watchedSeconds?: number; currentPositionSeconds?: number; completed?: boolean }>
      >(window.localStorage.getItem(key));
      if (!parsed) continue;

      let score = 0;
      for (const row of Object.values(parsed)) {
        score += Number(row.watchedSeconds) || 0;
        score += Number(row.currentPositionSeconds) || 0;
        if (row.completed) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestId = playlistId;
      }
    }
  } catch {
    return resume?.playlistId ?? null;
  }

  return bestScore > 0 ? bestId : resume?.playlistId ?? null;
}

/** Pick episode index to resume inside a loaded playlist. */
export function resolveResumeEpisodeIndex(
  items: Array<{ stream_video?: { id?: number } | null }>,
  playlistId: number,
  progressMap: Record<
    number,
    { currentPositionSeconds?: number; completed?: boolean; durationSeconds?: number }
  >,
): number {
  if (!items.length) return 0;

  const resume = readContinueProgramResume();
  const preferredVideoId =
    (resume?.playlistId === playlistId ? resume.videoId : null) ??
    readPlaylistLastEpisodeId(playlistId);

  if (preferredVideoId) {
    const idx = items.findIndex((row) => row.stream_video?.id === preferredVideoId);
    if (idx >= 0) return idx;
  }

  // First incomplete episode with a saved playhead.
  for (let i = 0; i < items.length; i += 1) {
    const id = items[i]?.stream_video?.id;
    if (!id) continue;
    const p = progressMap[id];
    if (!p || p.completed) continue;
    const pos = Math.max(0, Number(p.currentPositionSeconds) || 0);
    const duration = Math.max(0, Number(p.durationSeconds) || 0);
    const nearEnd = duration > 0 && pos >= duration * 0.95;
    if (pos > 1 && !nearEnd) return i;
  }

  // First incomplete episode.
  for (let i = 0; i < items.length; i += 1) {
    const id = items[i]?.stream_video?.id;
    if (!id) continue;
    if (!progressMap[id]?.completed) return i;
  }

  return 0;
}
