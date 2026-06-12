import { djangoStreamingApiUrl } from "@/lib/djangoBackendOrigin";
import { portalFetch, resolveClientApiUrl } from "@/lib/portal-api";
import { formatProgramDisplayTitle } from "@/lib/programDisplayTitle";

export type StreamVideoPlayerLayout = "auto" | "landscape" | "portrait";

export type StreamVideoListItem = {
  id: number;
  title: string;
  description: string;
  price: string;
  thumbnail_url: string | null;
  status: string;
  /** Omitted on older API responses; treat as `"auto"`. */
  player_layout?: StreamVideoPlayerLayout;
  source_width?: number | null;
  source_height?: number | null;
  created_at: string;
};

export type StreamVideoDetail = StreamVideoListItem;

export type StreamPayload = {
  id: number;
  status: string;
  playback_url: string | null;
  /** Unix epoch seconds when ``playback_url`` expires (for client-side refresh). */
  playback_expires_at?: number | null;
};

/** Parsed from admin `description` when section title lines are used (see API / admin help). */
export type StreamPlaylistDescriptionSections = {
  hook: string;
  core_protocol: string;
  what_you_will_learn: string;
};

export type StreamPlaylistListItem = {
  id: number;
  title: string;
  slug: string;
  /** Mid-ticket vault module checkout slug when linked in Django admin. */
  vault_plan_slug?: string;
  category: "business_model" | "business_psychology";
  description: string;
  /** Present on current API; each string is body under that heading in admin description. */
  description_sections?: StreamPlaylistDescriptionSections;
  price: string;
  rating: string;
  cover_image_url: string | null;
  video_count: number;
  is_published: boolean;
  is_coming_soon: boolean;
  is_unlocked?: boolean;
  created_at: string;
};

export type StreamPlaylistItemRow = {
  id: number;
  order: number;
  stream_video: StreamVideoListItem;
};

export type StreamPlaylistDetail = StreamPlaylistListItem & {
  items: StreamPlaylistItemRow[];
};

export type StreamPlaylistPurchaseHistoryItem = {
  id: number;
  playlist_id: number;
  playlist_title: string;
  status: "pending" | "paid" | "cancelled" | "failed" | string;
  amount_paid: string;
  currency: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

const PLAYLISTS_CACHE_TTL_MS = 2 * 60 * 1000;
const PLAYLIST_DETAIL_CACHE_TTL_MS = 2 * 60 * 1000;
const PLAYBACK_CACHE_TTL_MS = 45 * 60 * 1000;
const WARM_VIDEO_POOL_LIMIT = 14;
const SESSION_PLAYLISTS_CACHE_KEY = "syn:streaming:playlists:v2";

let playlistsCache: { at: number; data: StreamPlaylistListItem[] } | null = null;
const playlistDetailCache = new Map<number, { at: number; data: StreamPlaylistDetail }>();
const playbackCache = new Map<string, { at: number; data: StreamPayload }>();

function playbackCacheKey(id: number, context: "programs" | "membership"): string {
  return `${context}:${id}`;
}

function errMessage(status: number, data: unknown, fallback: string): string {
  if (typeof data === "object" && data && "detail" in data) {
    return String((data as { detail?: string }).detail ?? fallback);
  }
  return fallback || `Request failed (${status}).`;
}

function isFresh(ts: number, ttlMs: number): boolean {
  return Date.now() - ts < ttlMs;
}

function readPlaylistsSessionCache(): StreamPlaylistListItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_PLAYLISTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; data?: StreamPlaylistListItem[] };
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.at !== "number") return null;
    if (!isFresh(parsed.at, PLAYLISTS_CACHE_TTL_MS)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function normalizePlaylistItem<T extends StreamPlaylistListItem>(item: T): T {
  return { ...item, title: formatProgramDisplayTitle(item.title) };
}

function normalizePlaylistList(list: StreamPlaylistListItem[]): StreamPlaylistListItem[] {
  return list.map((item) => normalizePlaylistItem(item));
}

function writePlaylistsSessionCache(data: StreamPlaylistListItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      SESSION_PLAYLISTS_CACHE_KEY,
      JSON.stringify({ at: Date.now(), data })
    );
  } catch {
    // Ignore storage quota/private mode errors.
  }
}

export async function fetchStreamVideosList(): Promise<StreamVideoListItem[]> {
  const res = await portalFetch<StreamVideoListItem[]>("/api/streaming/videos/");
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return [];
    throw new Error(errMessage(res.status, res.data, "Could not load stream catalog."));
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchStreamVideoDetail(id: number): Promise<StreamVideoDetail> {
  const res = await portalFetch<StreamVideoDetail>(`/api/streaming/videos/${id}/`);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to watch this video." : "Could not load video."
      )
    );
  }
  return res.data as StreamVideoDetail;
}

export async function fetchStreamPlaylists(options?: {
  allowPublicFallback?: boolean;
  forceRefresh?: boolean;
}): Promise<StreamPlaylistListItem[]> {
  const forceRefresh = !!options?.forceRefresh;
  if (!forceRefresh && playlistsCache && isFresh(playlistsCache.at, PLAYLISTS_CACHE_TTL_MS)) {
    return playlistsCache.data;
  }
  const sessionCached = forceRefresh ? null : readPlaylistsSessionCache();
  if (sessionCached) {
    const normalized = normalizePlaylistList(sessionCached);
    playlistsCache = { at: Date.now(), data: normalized };
    return normalized;
  }

  const res = await portalFetch<StreamPlaylistListItem[]>("/api/streaming/playlists/");
  if (res.ok) {
    const list = normalizePlaylistList(Array.isArray(res.data) ? res.data : []);
    playlistsCache = { at: Date.now(), data: list };
    writePlaylistsSessionCache(list);
    return list;
  }
  if (!options?.allowPublicFallback) {
    throw new Error(errMessage(res.status, res.data, "Could not load playlists."));
  }
  try {
    const list = await fetchPublicStreamPlaylists();
    playlistsCache = { at: Date.now(), data: list };
    writePlaylistsSessionCache(list);
    return list;
  } catch {
    throw new Error(errMessage(res.status, res.data, "Could not load playlists."));
  }
}

export async function fetchPublicStreamPlaylists(): Promise<StreamPlaylistListItem[]> {
  // Browser: same-origin /api/streaming/… hits Next route handler (runtime BACKEND_INTERNAL_URL).
  // Server / explicit NEXT_PUBLIC_*: call Django directly.
  const direct = djangoStreamingApiUrl("public-playlists");
  const url =
    direct ||
    (typeof window !== "undefined"
      ? "/api/streaming/public-playlists/"
      : resolveClientApiUrl("/api/streaming/public-playlists/"));
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  const txt = await res.text();
  let data: unknown = [];
  try {
    data = txt ? (JSON.parse(txt) as unknown) : [];
  } catch {
    data = [];
  }
  if (!res.ok) {
    throw new Error(errMessage(res.status, data, "Could not load public playlists."));
  }
  const list = Array.isArray(data) ? (data as StreamPlaylistListItem[]) : [];
  return normalizePlaylistList(list);
}

export async function createPlaylistCheckoutSession(
  playlistId: number,
  options?: { returnBaseUrl?: string }
): Promise<{ checkout_url?: string; session_id?: string; playlist_id?: number; is_unlocked?: boolean; message?: string }> {
  const res = await portalFetch<{ checkout_url?: string; session_id?: string; playlist_id?: number; is_unlocked?: boolean; message?: string; detail?: string }>(
    `/api/streaming/playlists/${playlistId}/checkout/`,
    { method: "POST", body: JSON.stringify({ return_base_url: options?.returnBaseUrl || "" }) }
  );
  if (!res.ok) {
    throw new Error(errMessage(res.status, res.data, "Could not start playlist checkout."));
  }
  return res.data ?? {};
}

export async function confirmPlaylistCheckoutSuccess(sessionId: string): Promise<{ playlist_id: number; is_unlocked: boolean; message?: string }> {
  const res = await portalFetch<{ playlist_id?: number; is_unlocked?: boolean; message?: string; detail?: string }>(
    "/api/streaming/playlists/checkout/success/",
    {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }
  );
  if (!res.ok || !res.data?.playlist_id) {
    throw new Error(errMessage(res.status, res.data, "Could not confirm playlist payment."));
  }
  return {
    playlist_id: Number(res.data.playlist_id),
    is_unlocked: !!res.data.is_unlocked,
    message: res.data.message,
  };
}

export async function fetchStreamPlaylistBillingHistory(): Promise<StreamPlaylistPurchaseHistoryItem[]> {
  const res = await portalFetch<StreamPlaylistPurchaseHistoryItem[]>("/api/streaming/playlists/purchases/");
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to view billing history." : "Could not load billing history."
      )
    );
  }
  return Array.isArray(res.data) ? res.data : [];
}

/** Playlists + plan bundles (Money Mastery, King) from `/api/auth/billing-purchases/`. Plan rows use `playlist_id: 0`. */
export async function fetchBillingPurchaseHistory(): Promise<StreamPlaylistPurchaseHistoryItem[]> {
  const res = await portalFetch<StreamPlaylistPurchaseHistoryItem[]>("/api/auth/billing-purchases/");
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to view billing history." : "Could not load billing history."
      )
    );
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchStreamPlaylistDetail(id: number): Promise<StreamPlaylistDetail> {
  const cached = playlistDetailCache.get(id);
  if (cached && isFresh(cached.at, PLAYLIST_DETAIL_CACHE_TTL_MS)) {
    return normalizePlaylistItem(cached.data);
  }
  const res = await portalFetch<StreamPlaylistDetail>(`/api/streaming/playlists/${id}/`);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in to open this playlist." : "Could not load playlist."
      )
    );
  }
  const raw = res.data as StreamPlaylistDetail;
  const detail: StreamPlaylistDetail = {
    ...raw,
    title: formatProgramDisplayTitle(raw.title),
  };
  playlistDetailCache.set(id, { at: Date.now(), data: detail });
  return detail;
}

export function getCachedStreamVideoPlayback(
  id: number,
  options?: { context?: "programs" | "membership" }
): StreamPayload | null {
  const ctx = options?.context === "membership" ? "membership" : "programs";
  const cached = playbackCache.get(playbackCacheKey(id, ctx));
  if (!cached || !isFresh(cached.at, PLAYBACK_CACHE_TTL_MS)) return null;
  return cached.data;
}

export async function fetchStreamVideoPlayback(
  id: number,
  options?: { context?: "programs" | "membership"; forceRefresh?: boolean }
): Promise<StreamPayload> {
  const ctx = options?.context === "membership" ? "membership" : "programs";
  const cacheKey = playbackCacheKey(id, ctx);
  const cached = playbackCache.get(cacheKey);
  if (!options?.forceRefresh && cached && isFresh(cached.at, PLAYBACK_CACHE_TTL_MS)) {
    return cached.data;
  }
  const path =
    ctx === "membership"
      ? `/api/portal/membership/secure-videos/stream/${id}/`
      : `/api/streaming/videos/stream/${id}/`;
  const res = await portalFetch<StreamPayload>(path);
  if (!res.ok) {
    throw new Error(
      errMessage(
        res.status,
        res.data,
        res.status === 401 || res.status === 403 ? "Sign in for playback." : "Could not load playback info."
      )
    );
  }
  const payload = res.data as StreamPayload;
  playbackCache.set(cacheKey, { at: Date.now(), data: payload });
  return payload;
}

/** Fetch signed playback URLs for many videos in parallel (playlist warm-up). */
export async function prefetchStreamVideoPlaybacks(
  ids: number[],
  options?: {
    context?: "programs" | "membership";
    priorityId?: number;
    concurrency?: number;
  }
): Promise<Record<number, StreamPayload>> {
  const ctx = options?.context === "membership" ? "membership" : "programs";
  const concurrency = Math.max(1, Math.min(options?.concurrency ?? 6, 12));
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  if (options?.priorityId && unique.includes(options.priorityId)) {
    unique.sort((a, b) => {
      if (a === options.priorityId) return -1;
      if (b === options.priorityId) return 1;
      return a - b;
    });
  }
  const out: Record<number, StreamPayload> = {};
  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (videoId) => {
        const cached = getCachedStreamVideoPlayback(videoId, { context: ctx });
        if (cached) {
          out[videoId] = cached;
          return;
        }
        try {
          out[videoId] = await fetchStreamVideoPlayback(videoId, { context: ctx });
        } catch {
          // Caller handles missing entries.
        }
      })
    );
  }
  return out;
}

/** Warm playlist detail + all playback URLs before the detail panel mounts. */
export async function prefetchStreamPlaylistExperience(
  playlistId: number,
  options?: { context?: "programs" | "membership" }
): Promise<void> {
  try {
    const detail = await fetchStreamPlaylistDetail(playlistId);
    const ids = (detail.items ?? [])
      .map((row) => row.stream_video?.id)
      .filter((id): id is number => Number.isFinite(id) && id > 0);
    if (!ids.length) return;
    await prefetchStreamVideoPlaybacks(ids, {
      context: options?.context,
      priorityId: ids[0],
      concurrency: 6,
    });
    warmStreamVideoMedia(
      ids
        .slice(0, 4)
        .map((id) => getCachedStreamVideoPlayback(id, { context: options?.context })?.playback_url)
        .filter((url): url is string => Boolean(url))
    );
  } catch {
    // Best-effort warm-up; panel still loads normally.
  }
}

const warmVideoPool = new Map<string, HTMLVideoElement>();

/** Start buffering MP4 bytes in hidden video elements (browser cache). */
export function warmStreamVideoMedia(urls: string[]): void {
  if (typeof window === "undefined") return;
  for (const raw of urls) {
    const url = (raw || "").trim();
    if (!url || warmVideoPool.has(url)) continue;
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.load();
    warmVideoPool.set(url, video);
  }
  while (warmVideoPool.size > WARM_VIDEO_POOL_LIMIT) {
    const oldest = warmVideoPool.keys().next().value;
    if (!oldest) break;
    const el = warmVideoPool.get(oldest);
    el?.removeAttribute("src");
    el?.load();
    warmVideoPool.delete(oldest);
  }
}
