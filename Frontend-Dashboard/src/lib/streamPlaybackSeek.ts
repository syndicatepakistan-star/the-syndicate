/** HTTP Range helpers so MP4 playback can start / seek near the target byte, not always from 0. */

const playbackByteLengthCache = new Map<string, number>();
const inflightSeekPrefetch = new Set<string>();
const warmedHeaderUrls = new Set<string>();

/** First ~512KB — moov atom for faststart MP4s; cheap warm-up before play. */
export const PLAYBACK_HEADER_WARM_BYTES = 512 * 1024;

/** Byte window prefetched when the user scrubs the timeline. */
export const PLAYBACK_SEEK_PREFETCH_BYTES = 3 * 1024 * 1024;

export async function getPlaybackByteLength(url: string): Promise<number | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const cached = playbackByteLengthCache.get(trimmed);
  if (cached && cached > 0) return cached;

  try {
    const res = await fetch(trimmed, { method: "HEAD", cache: "no-store" });
    if (!res.ok) return null;
    const len = Number.parseInt(res.headers.get("Content-Length") || "0", 10);
    if (Number.isFinite(len) && len > 0) {
      playbackByteLengthCache.set(trimmed, len);
      return len;
    }
  } catch {
    // HEAD may fail on some CDNs; seek prefetch becomes a no-op.
  }
  return null;
}

export function clearPlaybackByteLengthCache(url?: string): void {
  if (!url) {
    playbackByteLengthCache.clear();
    return;
  }
  playbackByteLengthCache.delete(url.trim());
}

async function fetchByteRange(url: string, start: number, end: number): Promise<void> {
  if (end < start) return;
  await fetch(url, {
    headers: { Range: `bytes=${start}-${end}` },
    cache: "force-cache",
  });
}

/** Warm file header (metadata) — does not download the whole MP4. */
export function warmPlaybackHeader(url: string): void {
  const trimmed = url.trim();
  if (!trimmed || warmedHeaderUrls.has(trimmed)) return;
  warmedHeaderUrls.add(trimmed);
  void (async () => {
    try {
      await fetchByteRange(trimmed, 0, PLAYBACK_HEADER_WARM_BYTES - 1);
    } catch {
      warmedHeaderUrls.delete(trimmed);
    }
  })();
}

/**
 * Prefetch the byte range that likely contains frames near `timeSeconds`.
 * Linear mapping is approximate (VBR) but matches what browsers do for coarse seeks.
 */
export function prefetchPlaybackNearTime(
  url: string,
  timeSeconds: number,
  durationSeconds: number
): void {
  const trimmed = url.trim();
  if (!trimmed || !(durationSeconds > 0) || !Number.isFinite(timeSeconds)) return;

  const bucket = Math.floor(timeSeconds / 4);
  const key = `${trimmed}::${bucket}`;
  if (inflightSeekPrefetch.has(key)) return;
  inflightSeekPrefetch.add(key);

  void (async () => {
    try {
      const size = await getPlaybackByteLength(trimmed);
      if (!size) return;

      const ratio = Math.min(1, Math.max(0, timeSeconds / durationSeconds));
      const center = Math.floor(size * ratio);
      const half = Math.floor(PLAYBACK_SEEK_PREFETCH_BYTES / 2);
      const start = Math.max(0, center - half);
      const end = Math.min(size - 1, center + half);
      await fetchByteRange(trimmed, start, end);
    } catch {
      // Best-effort; native <video> Range requests still run.
    } finally {
      inflightSeekPrefetch.delete(key);
    }
  })();
}
