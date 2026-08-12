import { djangoStreamingApiUrl } from "@/lib/djangoBackendOrigin";
import { affiliateCheckoutFields } from "@/lib/affiliateAttribution";
import { getActiveCurrency } from "@/lib/currency";
import { portalFetch, resolveClientApiUrl } from "@/lib/portal-api";
import { formatProgramDisplayTitle } from "@/lib/programDisplayTitle";
import { warmPlaybackHeader } from "@/lib/streamPlaybackSeek";

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

export type StreamPlaybackType = "mp4" | "hls";

export type StreamPayload = {
  id: number;
  status: string;
  /** ``mp4`` for single-file playback; ``hls`` for m3u8 + segments. Omitted on older API → treat as mp4. */
  playback_type?: StreamPlaybackType;
  playback_url: string | null;
  /** Unix epoch seconds when ``playback_url`` expires (for client-side refresh). */
  playback_expires_at?: number | null;
};

/** Next.js 308-strips `/playback/285/?token=` — hls.js breaks on that redirect. */
function stripStreamingPathTrailingSlash(pathAndQuery: string): string {
  const qIdx = pathAndQuery.indexOf("?");
  const pathOnly = (qIdx === -1 ? pathAndQuery : pathAndQuery.slice(0, qIdx)).replace(/\/+$/, "");
  const query = qIdx === -1 ? "" : pathAndQuery.slice(qIdx);
  return query ? `${pathOnly}${query}` : pathOnly;
}

/** Same-origin playback URL for Next `/api/streaming` proxy (hls.js requires this on localhost). */
export function resolveStreamPlaybackUrl(playbackUrl: string | null | undefined): string | null {
  if (!playbackUrl) return null;
  const raw = playbackUrl.trim();
  if (!raw) return null;
  if (raw.startsWith("/api/streaming/")) {
    return stripStreamingPathTrailingSlash(raw);
  }
  try {
    const u = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (u.pathname.startsWith("/api/streaming/")) {
      return stripStreamingPathTrailingSlash(`${u.pathname}${u.search}`);
    }
  } catch {
    // keep raw below
  }
  return raw;
}

/** HLS manifest URL — proxy path has no `.m3u8` suffix (Django serves rewritten playlist). */
function isHlsManifestWarmUrl(url: string): boolean {
  const pathOnly = url.split("?")[0]?.replace(/\/+$/, "") ?? "";
  if (/\.m3u8$/i.test(pathOnly)) return true;
  return /\/api\/streaming\/videos\/playback\/\d+$/i.test(pathOnly);
}

function normalizeStreamPayload(payload: StreamPayload): StreamPayload {
  const url = resolveStreamPlaybackUrl(payload.playback_url);
  if (url === payload.playback_url) return payload;
  return { ...payload, playback_url: url };
}

/** Parsed from admin `description` when section title lines are used (see API / admin help). */
export type StreamPlaylistDescriptionSections = {
  hook: string;
  core_protocol: string;
  projects_you_will_build: string;
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

export type StreamPlaylistAttachment = {
  id: number;
  title: string;
  order: number;
  file_name: string;
  file_size: number | null;
  content_type: string;
  /** Relative API path — use with fetchAuthenticatedPdfBlob (works for any file type). */
  download_url: string;
};

export type StreamPlaylistDetail = StreamPlaylistListItem & {
  items: StreamPlaylistItemRow[];
  attachments?: StreamPlaylistAttachment[];
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
const PLAYLIST_DETAIL_FAIL_TTL_MS = 20 * 1000;
const PLAYBACK_CACHE_TTL_MS = 45 * 60 * 1000;
/** Client treats URL as stale this many ms before server expiry (matches useStreamPlaybackRefresh buffer). */
const PLAYBACK_EXPIRY_BUFFER_MS = 90 * 1000;
const WARM_VIDEO_POOL_LIMIT = 22;
const preloadedStreamVideoUrls = new Set<string>();
const SESSION_PLAYLISTS_CACHE_KEY = "syn:streaming:playlists:v2";

let playlistsCache: { at: number; data: StreamPlaylistListItem[] } | null = null;
let playlistsFetchInflight: Promise<StreamPlaylistListItem[]> | null = null;
const playlistDetailCache = new Map<number, { at: number; data: StreamPlaylistDetail }>();
const playlistDetailFailCache = new Map<number, { at: number; message: string; status: number }>();
const playbackCache = new Map<string, { at: number; data: StreamPayload }>();

function playbackCacheKey(id: number, context: "programs" | "membership"): string {
  return `${context}:${id}`;
}

function errMessage(status: number, data: unknown, fallback: string): string {
  if (typeof data === "object" && data) {
    const row = data as { detail?: string; error?: string; message?: string };
    const msg = (row.detail || row.error || row.message || "").trim();
    if (msg) return msg;
  }
  if (typeof data === "string" && data.trim()) {
    const snippet = data.replace(/\s+/g, " ").trim().slice(0, 200);
    if (snippet.toLowerCase().includes("<!doctype") || snippet.toLowerCase().includes("<html")) {
      if (status === 502 || status === 503 || status === 504) {
        return "Checkout service is temporarily unavailable. Wait a minute and try again.";
      }
      if (status === 500) {
        return "Checkout service error. Verify STRIPE_SECRET_KEY on the backend and BACKEND_INTERNAL_URL on the frontend.";
      }
    }
    return snippet;
  }
  if (status === 502 || status === 503 || status === 504) {
    return "Checkout service is temporarily unavailable. Wait a minute and try again.";
  }
  return fallback || `Request failed (${status}).`;
}

function isFresh(ts: number, ttlMs: number): boolean {
  return Date.now() - ts < ttlMs;
}

function isStreamPlaybackPayloadValid(payload: StreamPayload): boolean {
  const exp = payload.playback_expires_at;
  if (typeof exp === "number" && Number.isFinite(exp) && exp > 0) {
    return Date.now() < exp * 1000 - PLAYBACK_EXPIRY_BUFFER_MS;
  }
  return true;
}

function isStreamPlaybackCacheEntryValid(entry: { at: number; data: StreamPayload }): boolean {
  if (!isFresh(entry.at, PLAYBACK_CACHE_TTL_MS)) return false;
  if (entry.data.status === "ready" && entry.data.playback_url) {
    return isStreamPlaybackPayloadValid(entry.data);
  }
  return true;
}

/** Drop expired signed playback URLs (background tabs miss refresh timers). */
export function purgeExpiredStreamPlaybackCache(): void {
  for (const [key, entry] of playbackCache.entries()) {
    if (!isStreamPlaybackCacheEntryValid(entry)) {
      playbackCache.delete(key);
    }
  }
}

export function isStreamPlaybackUrlStale(payload: StreamPayload | null | undefined): boolean {
  if (!payload?.playback_url) return true;
  return !isStreamPlaybackPayloadValid(payload);
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

/** Drop cached playlist lock state (call after checkout, login, or tier change). */
export function clearStreamPlaylistsCache(): void {
  playlistsCache = null;
  playlistsFetchInflight = null;
  playlistDetailCache.clear();
  playlistDetailFailCache.clear();
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_PLAYLISTS_CACHE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

/** Allow an immediate retry after a hard playlist detail failure (404/5xx). */
export function clearStreamPlaylistDetailFailure(id: number): void {
  playlistDetailFailCache.delete(id);
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

  if (!forceRefresh && playlistsFetchInflight) {
    return playlistsFetchInflight;
  }

  const fetchPromise = (async (): Promise<StreamPlaylistListItem[]> => {
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
  })();

  if (!forceRefresh) {
    playlistsFetchInflight = fetchPromise.finally(() => {
      playlistsFetchInflight = null;
    });
    return playlistsFetchInflight;
  }

  return fetchPromise;
}

export async function fetchPublicStreamPlaylists(): Promise<StreamPlaylistListItem[]> {
  // Browser: same-origin /api/streaming/… hits Next route handler (runtime BACKEND_INTERNAL_URL).
  // Server / explicit NEXT_PUBLIC_*: call Django directly.
  const direct = djangoStreamingApiUrl("public-playlists");
  const url =
    direct ||
    (typeof window !== "undefined"
      ? "/api/streaming/public-playlists"
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
    {
      method: "POST",
      body: JSON.stringify({
        return_base_url: options?.returnBaseUrl || "",
        currency: getActiveCurrency(),
        ...affiliateCheckoutFields(),
      }),
    }
  );
  if (!res.ok) {
    throw new Error(errMessage(res.status, res.data, "Could not start playlist checkout."));
  }
  return res.data ?? {};
}

export async function confirmPlaylistCheckoutSuccess(sessionId: string): Promise<{
  playlist_id: number;
  is_unlocked: boolean;
  already_purchased?: boolean;
  message?: string;
  amount_paid?: number;
  currency?: string;
  playlist_title?: string;
}> {
  const res = await portalFetch<{
    playlist_id?: number;
    is_unlocked?: boolean;
    already_purchased?: boolean;
    message?: string;
    amount_paid?: string | number;
    currency?: string;
    playlist_title?: string;
    detail?: string;
  }>(
    "/api/streaming/playlists/checkout/success/",
    {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }
  );
  if (!res.ok || !res.data?.playlist_id) {
    throw new Error(errMessage(res.status, res.data, "Could not confirm playlist payment."));
  }
  const amountRaw = res.data.amount_paid;
  const amountPaid =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string"
        ? Number(String(amountRaw).replace(/[^0-9.]/g, ""))
        : undefined;
  return {
    playlist_id: Number(res.data.playlist_id),
    is_unlocked: !!res.data.is_unlocked,
    already_purchased: !!res.data.already_purchased,
    message: res.data.message,
    amount_paid: typeof amountPaid === "number" && Number.isFinite(amountPaid) ? amountPaid : undefined,
    currency: typeof res.data.currency === "string" ? res.data.currency : undefined,
    playlist_title: typeof res.data.playlist_title === "string" ? res.data.playlist_title : undefined,
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
  const failed = playlistDetailFailCache.get(id);
  if (failed && isFresh(failed.at, PLAYLIST_DETAIL_FAIL_TTL_MS)) {
    throw new Error(failed.message);
  }
  const res = await portalFetch<StreamPlaylistDetail>(`/api/streaming/playlists/${id}/`);
  if (!res.ok) {
    const message = errMessage(
      res.status,
      res.data,
      res.status === 401 || res.status === 403
        ? "Sign in to open this playlist."
        : res.status === 404
          ? "Playlist not found or not available for your account."
          : res.status >= 500
            ? "Playlist temporarily unavailable. Try again in a moment."
            : "Could not load playlist."
    );
    if (res.status === 404 || res.status === 403 || res.status >= 500) {
      playlistDetailFailCache.set(id, { at: Date.now(), message, status: res.status });
    }
    throw new Error(message);
  }
  playlistDetailFailCache.delete(id);
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
  if (!cached || !isStreamPlaybackCacheEntryValid(cached)) return null;
  return cached.data;
}

export async function fetchStreamVideoPlayback(
  id: number,
  options?: { context?: "programs" | "membership"; forceRefresh?: boolean }
): Promise<StreamPayload> {
  const ctx = options?.context === "membership" ? "membership" : "programs";
  const cacheKey = playbackCacheKey(id, ctx);
  const cached = playbackCache.get(cacheKey);
  if (!options?.forceRefresh && cached && isStreamPlaybackCacheEntryValid(cached)) {
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
  const payload = normalizeStreamPayload(res.data as StreamPayload);
  playbackCache.set(cacheKey, { at: Date.now(), data: payload });
  return payload;
}

export async function fetchStreamVideoPlaybacksBatch(
  ids: number[],
  options?: { context?: "programs" | "membership" }
): Promise<Record<number, StreamPayload>> {
  const ctx = options?.context === "membership" ? "membership" : "programs";
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  const out: Record<number, StreamPayload> = {};
  const missing: number[] = [];

  for (const videoId of unique) {
    const cached = getCachedStreamVideoPlayback(videoId, { context: ctx });
    if (cached) {
      out[videoId] = cached;
    } else {
      missing.push(videoId);
    }
  }

  if (!missing.length || ctx !== "programs") {
    return out;
  }

  if (missing.length === 1) {
    try {
      out[missing[0]!] = await fetchStreamVideoPlayback(missing[0]!, { context: ctx });
    } catch {
      // Caller handles missing entries.
    }
    return out;
  }

  const res = await portalFetch<{ playbacks?: Record<string, StreamPayload> }>(
    "/api/streaming/videos/stream/batch/",
    {
      method: "POST",
      body: JSON.stringify({ video_ids: missing }),
    }
  );
  if (!res.ok) {
    throw new Error(errMessage(res.status, res.data, "Could not load playback batch."));
  }
  const playbacks = res.data?.playbacks ?? {};
  for (const [rawId, payload] of Object.entries(playbacks)) {
    const videoId = Number(rawId);
    if (!Number.isFinite(videoId) || videoId <= 0 || !payload) continue;
    const normalized = normalizeStreamPayload(payload);
    playbackCache.set(playbackCacheKey(videoId, ctx), { at: Date.now(), data: normalized });
    out[videoId] = normalized;
  }
  return out;
}

/** Fetch signed playback URLs for many videos (playlist warm-up). */
export async function prefetchStreamVideoPlaybacks(
  ids: number[],
  options?: {
    context?: "programs" | "membership";
    priorityId?: number;
    concurrency?: number;
  }
): Promise<Record<number, StreamPayload>> {
  const ctx = options?.context === "membership" ? "membership" : "programs";
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  if (options?.priorityId && unique.includes(options.priorityId)) {
    unique.sort((a, b) => {
      if (a === options.priorityId) return -1;
      if (b === options.priorityId) return 1;
      return a - b;
    });
  }

  if (ctx === "programs" && unique.length > 1) {
    try {
      return await fetchStreamVideoPlaybacksBatch(unique, { context: ctx });
    } catch {
      // Fall through to per-video requests.
    }
  }

  const concurrency = Math.max(1, Math.min(options?.concurrency ?? 6, 12));
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

/** Warm playlist detail + playback URLs before the detail panel mounts. */
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

    const priorityId = ids[0]!;
    const cachedFirst = getCachedStreamVideoPlayback(priorityId, { context: options?.context });
    if (cachedFirst?.playback_url) {
      warmStreamVideoMedia([cachedFirst.playback_url], { priority: true });
    } else {
      try {
        const first = await fetchStreamVideoPlayback(priorityId, { context: options?.context });
        if (first.playback_url) warmStreamVideoMedia([first.playback_url], { priority: true });
      } catch {
        // Continue warming the rest.
      }
    }

    const eagerCount = ids.length > 12 ? 1 : Math.min(2, ids.length);
    const eagerIds = ids.slice(0, eagerCount);
    const prefetched = await prefetchStreamVideoPlaybacks(eagerIds, {
      context: options?.context,
      priorityId,
      concurrency: 2,
    });
    warmStreamVideoMedia(
      eagerIds
        .map(
          (id) =>
            prefetched[id]?.playback_url ??
            getCachedStreamVideoPlayback(id, { context: options?.context })?.playback_url
        )
        .filter((url): url is string => Boolean(url)),
      { priority: true }
    );

    // Skip warming the full remainder — detail panel loads neighbors on demand.
  } catch {
    // Best-effort warm-up; panel still loads normally.
  }
}

/** Warm MP4 header bytes only — do not prefetch HLS manifests (races hls.js xhr → 0 kB / no segments). */
export function warmStreamVideoMedia(urls: string[], options?: { priority?: boolean }): void {
  if (typeof window === "undefined") return;
  const unique = [...new Set(urls.map((raw) => (raw || "").trim()).filter(Boolean))];
  for (const [index, url] of unique.entries()) {
    if (!url || preloadedStreamVideoUrls.has(url)) continue;
    const shouldWarm = options?.priority === true || index === 0;
    if (!shouldWarm) continue;
    if (isHlsManifestWarmUrl(url)) {
      // hls.js must own the manifest request; a parallel fetch here breaks playback.
      continue;
    }
    preloadedStreamVideoUrls.add(url);
    warmPlaybackHeader(url);
  }
  while (preloadedStreamVideoUrls.size > WARM_VIDEO_POOL_LIMIT) {
    const oldest = preloadedStreamVideoUrls.values().next().value;
    if (!oldest) break;
    preloadedStreamVideoUrls.delete(oldest);
  }
}
