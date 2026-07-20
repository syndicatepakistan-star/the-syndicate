"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Play } from "lucide-react";
import StreamHtmlVideoPlayer from "@/components/streaming/StreamHtmlVideoPlayer";
import { useStreamPlaybackRefresh } from "@/hooks/useStreamPlaybackRefresh";
import { useTabResume } from "@/hooks/useTabResume";
import {
  fetchStreamPlaylistDetail,
  fetchStreamVideoPlayback,
  getCachedStreamVideoPlayback,
  prefetchStreamVideoPlaybacks,
  purgeExpiredStreamPlaybackCache,
  warmStreamVideoMedia,
  type StreamPayload,
  type StreamPlaylistAttachment,
  type StreamPlaylistDetail,
  type StreamVideoListItem
} from "@/lib/streaming-api";
import { fetchAuthenticatedPdfBlob } from "@/lib/portal-api";
import { resolveDjangoMediaUrl } from "@/lib/courses-api";
import { resolveProgramPlaylistThumbnail } from "@/lib/programPlaylistCatalog";
import { issuePlaylistCertificate } from "@/lib/certificates-api";
import { requestDashboardShellNav } from "@/lib/dashboardShellNavEvent";
import { formatPrice } from "@/lib/currency";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  playlistId: number;
};

const playerShell = "overflow-hidden rounded-xl border border-white/10 bg-black/50";
const WATCH_PROGRESS_PREFIX = "syn_playlist_watch_progress_v1";
const CERTIFICATE_PREFIX = "syn_playlist_certificate_v1";
const MAX_REAL_PLAYBACK_DELTA_SECONDS = 6;
const SEEK_COOLDOWN_MS = 1400;
const MIN_WATCHED_INCREMENT_SECONDS = 0.2;
const DISPLAY_GAP_SMOOTH_SECONDS = 1.2;

function parsePlaylistNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function formatAttachmentSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function openPlaylistAttachment(attachment: StreamPlaylistAttachment): Promise<void> {
  const path = attachment.download_url?.trim();
  if (!path) return;
  try {
    const blob = await fetchAuthenticatedPdfBlob(path);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    window.open(path, "_blank", "noopener,noreferrer");
  }
}

function attachmentFileLabel(attachment: StreamPlaylistAttachment): string {
  const name = (attachment.file_name || attachment.title || "").toLowerCase();
  if (name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "DOC";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "XLS";
  if (name.endsWith(".zip")) return "ZIP";
  const type = (attachment.content_type || "").split("/").pop()?.toUpperCase();
  return type && type.length <= 8 ? type : "FILE";
}

const RESOURCE_CARD_THEMES = [
  {
    border: "border-cyan-400/55",
    badge: "border-cyan-300/60 bg-[linear-gradient(135deg,rgba(34,211,238,0.28),rgba(14,116,144,0.18))] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.35)]",
    title: "text-cyan-50",
    panel: "bg-cyan-950/15 shadow-[inset_0_0_24px_rgba(34,211,238,0.06)]",
    btn: "border-cyan-400/55 bg-[linear-gradient(135deg,rgba(8,51,68,0.85),rgba(4,30,40,0.98))] text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.28)] hover:border-cyan-300/75",
  },
  {
    border: "border-violet-400/55",
    badge: "border-violet-300/60 bg-[linear-gradient(135deg,rgba(167,139,250,0.28),rgba(109,40,217,0.18))] text-violet-100 shadow-[0_0_16px_rgba(167,139,250,0.35)]",
    title: "text-violet-50",
    panel: "bg-violet-950/15 shadow-[inset_0_0_24px_rgba(167,139,250,0.06)]",
    btn: "border-violet-400/55 bg-[linear-gradient(135deg,rgba(76,29,149,0.75),rgba(46,16,101,0.98))] text-violet-50 shadow-[0_0_18px_rgba(167,139,250,0.28)] hover:border-violet-300/75",
  },
  {
    border: "border-amber-400/55",
    badge: "border-amber-300/60 bg-[linear-gradient(135deg,rgba(251,191,36,0.28),rgba(180,120,20,0.18))] text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.35)]",
    title: "text-amber-50",
    panel: "bg-amber-950/15 shadow-[inset_0_0_24px_rgba(251,191,36,0.06)]",
    btn: "border-amber-400/55 bg-[linear-gradient(135deg,rgba(120,80,8,0.85),rgba(54,34,4,0.98))] text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.28)] hover:border-amber-300/75",
  },
  {
    border: "border-fuchsia-400/55",
    badge: "border-fuchsia-300/60 bg-[linear-gradient(135deg,rgba(232,121,249,0.28),rgba(192,38,211,0.18))] text-fuchsia-100 shadow-[0_0_16px_rgba(232,121,249,0.35)]",
    title: "text-fuchsia-50",
    panel: "bg-fuchsia-950/15 shadow-[inset_0_0_24px_rgba(232,121,249,0.06)]",
    btn: "border-fuchsia-400/55 bg-[linear-gradient(135deg,rgba(134,25,143,0.75),rgba(74,4,78,0.98))] text-fuchsia-50 shadow-[0_0_18px_rgba(232,121,249,0.28)] hover:border-fuchsia-300/75",
  },
  {
    border: "border-orange-400/55",
    badge: "border-orange-300/60 bg-[linear-gradient(135deg,rgba(251,146,60,0.28),rgba(194,65,12,0.18))] text-orange-100 shadow-[0_0_16px_rgba(251,146,60,0.35)]",
    title: "text-orange-50",
    panel: "bg-orange-950/15 shadow-[inset_0_0_24px_rgba(251,146,60,0.06)]",
    btn: "border-orange-400/55 bg-[linear-gradient(135deg,rgba(154,52,18,0.75),rgba(67,20,7,0.98))] text-orange-50 shadow-[0_0_18px_rgba(251,146,60,0.28)] hover:border-orange-300/75",
  },
  {
    border: "border-emerald-400/55",
    badge: "border-emerald-300/60 bg-[linear-gradient(135deg,rgba(52,211,153,0.28),rgba(16,185,129,0.18))] text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.35)]",
    title: "text-emerald-50",
    panel: "bg-emerald-950/15 shadow-[inset_0_0_24px_rgba(52,211,153,0.06)]",
    btn: "border-emerald-400/55 bg-[linear-gradient(135deg,rgba(6,78,59,0.85),rgba(4,47,46,0.98))] text-emerald-50 shadow-[0_0_18px_rgba(52,211,153,0.28)] hover:border-emerald-300/75",
  },
] as const;

function humanResourceTitle(raw: string): string {
  const cleaned = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Program resource";
  return cleaned;
}

function humanResourceDescription(title: string, fileLabel: string): string {
  const t = title.toLowerCase();
  if (t.includes("quiz") && t.includes("funnel")) {
    return "A clear breakdown of how quiz funnels work — save it, study it, and use it to build offers that convert without guessing.";
  }
  if (t.includes("quiz")) {
    return "Step-by-step quiz guidance you can follow at your own pace — built to help you turn attention into qualified leads.";
  }
  if (t.includes("funnel")) {
    return "The full funnel map in one place — so you know what to build, in what order, and why each step matters.";
  }
  if (t.includes("workbook") || t.includes("worksheet")) {
    return "Exercises and prompts you can print or fill in on screen — made to turn watching into doing, not just note-taking.";
  }
  if (t.includes("cheat") || t.includes("checklist")) {
    return "A quick-reference sheet for when you are executing — keep it open so you do not miss the steps that actually move the needle.";
  }
  if (t.includes("template")) {
    return "A ready-to-use template — copy, adapt, and deploy so you are not starting from a blank page every time.";
  }
  if (t.includes("guide") || t.includes("playbook")) {
    return "A practical guide written to support this program — read it alongside the lessons and apply each section as you go.";
  }
  if (fileLabel === "PDF") {
    return "Your PDF for this program — download it, keep it forever, and come back whenever you need a clear reference.";
  }
  return "A file included with this program — yours to download and use whenever you need it alongside the lessons.";
}

function PlaylistResourcesBlock({
  attachments,
  className,
}: {
  attachments: StreamPlaylistAttachment[];
  className?: string;
}) {
  if (attachments.length === 0) return null;
  return (
    <div
      className={cn(
        "playlist-resources-panel relative w-full overflow-hidden rounded-2xl",
        "border-2 border-cyan-400/50 bg-[linear-gradient(165deg,rgba(4,10,22,0.98),rgba(2,5,12,0.99))]",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_0_48px_rgba(34,211,238,0.16),inset_0_1px_0_rgba(255,255,255,0.1)]",
        className
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(34,211,238,0.14),transparent_60%)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-[3px] rounded-[13px] border border-emerald-400/25 max-sm:hidden"
        aria-hidden
      />
      <div className="relative px-3 py-2.5 sm:px-6 sm:py-6">
        <h3 className="hidden text-center text-[clamp(1.1rem,2.4vw,1.45rem)] font-black uppercase tracking-[0.14em] text-cyan-100 [text-shadow:0_0_22px_rgba(34,211,238,0.45)] sm:block">
          Download Resources
        </h3>

        <ul className="space-y-2 sm:mt-5 sm:space-y-3.5">
          {attachments.map((attachment, index) => {
            const theme = RESOURCE_CARD_THEMES[index % RESOURCE_CARD_THEMES.length];
            const displayTitle = humanResourceTitle(attachment.title || attachment.file_name);
            const fileLabel = attachmentFileLabel(attachment);
            const sizeLabel = formatAttachmentSize(attachment.file_size);
            const description = humanResourceDescription(displayTitle, fileLabel);
            const step = String(index + 1).padStart(2, "0");

            return (
              <li
                key={attachment.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border-2 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4",
                  "max-sm:border max-sm:border-cyan-400/40 max-sm:bg-black/35 max-sm:p-2 max-sm:gap-0",
                  theme.border,
                  theme.panel
                )}
              >
                <div className="hidden min-w-0 flex-1 items-start gap-3 sm:flex sm:gap-4">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-[13px] font-black tabular-nums",
                      theme.badge
                    )}
                  >
                    {step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-[13px] font-black uppercase leading-snug tracking-[0.06em] sm:text-[14px] sm:tracking-[0.08em]",
                        theme.title
                      )}
                    >
                      {displayTitle}
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-white/82 sm:text-[13px] sm:leading-6">
                      {description}
                    </p>
                    {sizeLabel ? (
                      <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.1em] text-white/45">
                        {fileLabel} · {sizeLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void openPlaylistAttachment(attachment)}
                  className={cn(
                    "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[10px] font-black normal-case tracking-[0.06em] transition hover:brightness-110 sm:w-auto sm:min-w-[9.5rem]",
                    "max-sm:py-2 max-sm:text-[11px]",
                    theme.btn
                  )}
                  aria-label={`Download ${displayTitle}`}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  Download Pdf
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (!ranges.length) return [];
  const sorted = [...ranges]
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
    .sort((a, b) => a.start - b.start);
  if (!sorted.length) return [];
  const merged: Array<{ start: number; end: number }> = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end + 0.4) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function mergeRangesWithGap(
  ranges: Array<{ start: number; end: number }>,
  gapSeconds: number
): Array<{ start: number; end: number }> {
  if (!ranges.length) return [];
  const sorted = [...ranges]
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
    .sort((a, b) => a.start - b.start);
  if (!sorted.length) return [];
  const merged: Array<{ start: number; end: number }> = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end + Math.max(0, gapSeconds)) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function subtractRange(
  ranges: Array<{ start: number; end: number }>,
  remove: { start: number; end: number }
): Array<{ start: number; end: number }> {
  const removeStart = Math.min(remove.start, remove.end);
  const removeEnd = Math.max(remove.start, remove.end);
  if (!Number.isFinite(removeStart) || !Number.isFinite(removeEnd) || removeEnd <= removeStart) {
    return ranges;
  }
  const next: Array<{ start: number; end: number }> = [];
  ranges.forEach((range) => {
    if (range.end <= removeStart || range.start >= removeEnd) {
      next.push(range);
      return;
    }
    if (range.start < removeStart) {
      next.push({ start: range.start, end: removeStart });
    }
    if (range.end > removeEnd) {
      next.push({ start: removeEnd, end: range.end });
    }
  });
  return mergeRanges(next);
}

function invertRanges(duration: number, ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  const safeDuration = Math.max(0, duration);
  if (safeDuration <= 0) return [];
  const merged = mergeRanges(
    ranges.map((r) => ({
      start: Math.max(0, Math.min(r.start, safeDuration)),
      end: Math.max(0, Math.min(r.end, safeDuration)),
    }))
  );
  const inverted: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  merged.forEach((r) => {
    if (r.start > cursor) inverted.push({ start: cursor, end: r.start });
    cursor = Math.max(cursor, r.end);
  });
  if (cursor < safeDuration) inverted.push({ start: cursor, end: safeDuration });
  return inverted.filter((r) => r.end - r.start > 0.12);
}

function totalRangeDuration(ranges: Array<{ start: number; end: number }>, maxDuration?: number): number {
  const merged = mergeRanges(ranges);
  const total = merged.reduce((sum, r) => sum + Math.max(0, r.end - r.start), 0);
  if (typeof maxDuration === "number" && Number.isFinite(maxDuration)) {
    return Math.min(Math.max(0, maxDuration), Math.max(0, total));
  }
  return Math.max(0, total);
}

const SETTINGS_CERTIFICATES_ID = "settings-certificates";

function goToSettingsCertificates() {
  requestDashboardShellNav("settings");
  window.setTimeout(() => {
    const el = document.getElementById(SETTINGS_CERTIFICATES_ID);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    const params = new URLSearchParams(window.location.search);
    params.set("section", "settings");
    const qs = params.toString();
    const next = `${window.location.pathname}?${qs}#${SETTINGS_CERTIFICATES_ID}`;
    window.history.replaceState(null, "", next);
  }, 200);
}

export function StreamPlaylistProgramPanel({ playlistId }: Props) {
  const { formatPrice: formatLocalizedPrice } = useCurrency();
  const [playlist, setPlaylist] = useState<StreamPlaylistDetail | null>(null);
  const [playbackCache, setPlaybackCache] = useState<Record<number, StreamPayload>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [didAutoPickReady, setDidAutoPickReady] = useState(false);
  const [progressMap, setProgressMap] = useState<
    Record<
      number,
      {
        watchedSeconds: number;
        durationSeconds: number;
        currentPositionSeconds: number;
        completed: boolean;
        skippedRanges?: Array<{ start: number; end: number }>;
        watchedRanges?: Array<{ start: number; end: number }>;
      }
    >
  >({});
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [certificateName, setCertificateName] = useState("");
  const [certificateMessage, setCertificateMessage] = useState<string | null>(null);
  const [certificateSubmitting, setCertificateSubmitting] = useState(false);
  const [progressHydrated, setProgressHydrated] = useState(false);
  /** Snapshot for HTML5 resume only; must not follow live `timeupdate` or the player reloads every tick. */
  const [resumeStartSeconds, setResumeStartSeconds] = useState(0);
  const [seekRequest, setSeekRequest] = useState<{ id: number; seconds: number; autoplay?: boolean } | null>(null);
  const lastPlaybackPositionRef = useRef<Record<number, number>>({});
  const ignorePlaybackUntilRef = useRef(0);
  const pendingAutoplayRef = useRef(false);
  const playerAnchorRef = useRef<HTMLDivElement | null>(null);

  const loadPlaylist = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const p = await fetchStreamPlaylistDetail(playlistId);
      setPlaylist(p);
      setActiveIdx(0);
      setDidAutoPickReady(false);
      setCertificateMessage(null);
      lastPlaybackPositionRef.current = {};
      pendingAutoplayRef.current = false;

      const videoIds = (p.items ?? [])
        .map((row) => row.stream_video?.id)
        .filter((id): id is number => Number.isFinite(id) && id > 0);
      const seededCache: Record<number, StreamPayload> = {};
      for (const id of videoIds) {
        const cached = getCachedStreamVideoPlayback(id);
        if (cached) seededCache[id] = cached;
      }
      setPlaybackCache(seededCache);

      if (videoIds.length > 0) {
        const priorityId = videoIds[0]!;
        const eagerCount = videoIds.length > 12 ? 1 : Math.min(3, videoIds.length);
        const eagerIds = videoIds.slice(0, eagerCount);

        try {
          const firstPb =
            seededCache[priorityId] ??
            (await fetchStreamVideoPlayback(priorityId, { context: "programs" }));
          setPlaybackCache((prev) => ({ ...prev, [priorityId]: firstPb }));
          if (firstPb.playback_url) warmStreamVideoMedia([firstPb.playback_url], { priority: true });
        } catch {
          // Panel still mounts; hook retries playback.
        }

        void prefetchStreamVideoPlaybacks(eagerIds, {
          context: "programs",
          priorityId,
          concurrency: eagerCount,
        }).then((prefetched) => {
          setPlaybackCache((prev) => ({ ...prev, ...prefetched }));
          warmStreamVideoMedia(
            eagerIds
              .map(
                (id) =>
                  prefetched[id]?.playback_url ?? getCachedStreamVideoPlayback(id)?.playback_url ?? null
              )
              .filter((url): url is string => Boolean(url)),
            { priority: true }
          );
        });

        const restIds = videoIds.slice(eagerCount);
        if (restIds.length > 0) {
          const warmRest = () => {
            void prefetchStreamVideoPlaybacks(restIds, { context: "programs", concurrency: 3 }).then((prefetched) => {
              setPlaybackCache((prev) => ({ ...prev, ...prefetched }));
            });
          };
          if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(warmRest, { timeout: 4000 });
          } else {
            window.setTimeout(warmRest, 1200);
          }
        }
      }
    } catch (e) {
      setPlaylist(null);
      setPlaybackCache({});
      setErr(e instanceof Error ? e.message : "Failed to load playlist.");
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProgressHydrated(false);
    const raw = window.localStorage.getItem(`${WATCH_PROGRESS_PREFIX}:${playlistId}`);
    if (!raw) {
      setProgressHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<
        number,
        {
          watchedSeconds: number;
          durationSeconds: number;
          currentPositionSeconds?: number;
          completed: boolean;
          skippedRanges?: Array<{ start: number; end: number }>;
          watchedRanges?: Array<{ start: number; end: number }>;
        }
      >;
      const upgraded = Object.fromEntries(
        Object.entries(parsed ?? {}).map(([videoId, value]) => {
          const duration = Math.max(0, Number(value?.durationSeconds ?? 0));
          const watched = Math.min(duration, Math.max(0, Number(value?.watchedSeconds ?? 0)));
          const hasWatchedRanges = Array.isArray(value?.watchedRanges) && value.watchedRanges.length > 0;
          const watchedRanges = hasWatchedRanges ? mergeRanges(value.watchedRanges ?? []) : watched > 0 ? [{ start: 0, end: watched }] : [];
          const watchedFromRanges = totalRangeDuration(watchedRanges, duration);
          return [
            Number(videoId),
            {
              watchedSeconds: watchedFromRanges,
              durationSeconds: duration,
              currentPositionSeconds: Math.max(0, Number(value?.currentPositionSeconds ?? 0)),
              completed: Boolean(value?.completed),
              skippedRanges: Array.isArray(value?.skippedRanges) ? value.skippedRanges : [],
              watchedRanges,
            },
          ];
        })
      ) as Record<
        number,
        {
          watchedSeconds: number;
          durationSeconds: number;
          currentPositionSeconds: number;
          completed: boolean;
          skippedRanges: Array<{ start: number; end: number }>;
          watchedRanges: Array<{ start: number; end: number }>;
        }
      >;
      setProgressMap(upgraded);
    } catch {
      setProgressMap({});
    } finally {
      setProgressHydrated(true);
    }
  }, [playlistId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!progressHydrated) return;
    window.localStorage.setItem(`${WATCH_PROGRESS_PREFIX}:${playlistId}`, JSON.stringify(progressMap));
  }, [playlistId, progressMap, progressHydrated]);

  useEffect(() => {
    void loadPlaylist();
  }, [loadPlaylist]);

  useTabResume(() => {
    purgeExpiredStreamPlaybackCache();
  });

  const items = useMemo(() => {
    if (!playlist?.items?.length) return [];
    return [...playlist.items].sort((a, b) => a.order - b.order || a.id - b.id);
  }, [playlist]);

  const activeVideo: StreamVideoListItem | null = items[activeIdx]?.stream_video ?? null;

  const {
    playback: activePlaybackFromHook,
    srcRevision: activeSrcRevision,
    loading: playbackLoading,
    refreshPlaybackNow,
    ensureFreshPlayback,
  } = useStreamPlaybackRefresh(activeVideo?.id, { enabled: Boolean(activeVideo?.id) });

  useEffect(() => {
    if (!activeVideo?.id || !activePlaybackFromHook) return;
    setPlaybackCache((prev) => ({ ...prev, [activeVideo.id]: activePlaybackFromHook }));
  }, [activeVideo?.id, activePlaybackFromHook]);

  useEffect(() => {
    if (!activeVideo?.id) {
      setResumeStartSeconds(0);
      return;
    }
    setResumeStartSeconds(progressMap[activeVideo.id]?.currentPositionSeconds ?? 0);
  }, [activeVideo?.id, activeIdx, progressHydrated]);

  const activePlayback =
    activeVideo?.id != null
      ? (activePlaybackFromHook?.id === activeVideo.id ? activePlaybackFromHook : null) ??
        playbackCache[activeVideo.id] ??
        null
      : null;
  const totalDuration = useMemo(
    () =>
      items.reduce((sum, row) => {
        const p = progressMap[row.stream_video.id];
        return sum + Math.max(0, p?.durationSeconds ?? 0);
      }, 0),
    [items, progressMap]
  );
  const watchedDuration = useMemo(
    () =>
      items.reduce((sum, row) => {
        const p = progressMap[row.stream_video.id];
        if (!p) return sum;
        return sum + Math.min(Math.max(0, p.watchedSeconds || 0), Math.max(0, p.durationSeconds || 0));
      }, 0),
    [items, progressMap]
  );
  const completedCount = useMemo(
    () => items.filter((row) => progressMap[row.stream_video.id]?.completed).length,
    [items, progressMap]
  );
  const completionPercent = totalDuration > 0 ? Math.min(100, (watchedDuration / totalDuration) * 100) : 0;
  const isPlaylistCompleted = items.length > 0 && completedCount === items.length;
  const activeProgress = activeVideo?.id ? progressMap[activeVideo.id] : undefined;
  const activeUnwatchedRanges = useMemo(() => {
    if (!activeProgress?.durationSeconds) return [];
    return mergeRangesWithGap(
      invertRanges(activeProgress.durationSeconds, activeProgress.watchedRanges ?? []),
      DISPLAY_GAP_SMOOTH_SECONDS
    );
  }, [activeProgress?.durationSeconds, activeProgress?.watchedRanges]);

  useEffect(() => {
    if (!items.length) return;
    const videoIds = items.map((row) => row.stream_video.id).filter(Boolean);
    const priorityId = videoIds[activeIdx] ?? videoIds[0];
    const neighborIds = videoIds.slice(Math.max(0, activeIdx - 1), activeIdx + 4);

    void (async () => {
      const prefetched = await prefetchStreamVideoPlaybacks(neighborIds, {
        priorityId,
        concurrency: 3,
      });
      setPlaybackCache((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const [id, payload] of Object.entries(prefetched)) {
          const vid = Number(id);
          if (!next[vid] || next[vid]?.playback_url !== payload.playback_url) {
            next[vid] = payload;
            changed = true;
          }
        }
        return changed ? next : prev;
      });

      const warmUrls = neighborIds
        .map((id) => prefetched[id]?.playback_url ?? getCachedStreamVideoPlayback(id)?.playback_url)
        .filter((url): url is string => Boolean(url));
      warmStreamVideoMedia(warmUrls, { priority: true });
    })();
  }, [items, activeIdx]);

  useEffect(() => {
    if (!activeVideo?.id) return;
    const neighborIds = [activeIdx - 1, activeIdx, activeIdx + 1]
      .map((i) => items[i]?.stream_video.id)
      .filter((id): id is number => Number.isFinite(id) && id > 0);
    const warmUrls = neighborIds
      .map((id) => playbackCache[id]?.playback_url ?? (activeVideo.id === id ? activePlayback?.playback_url : null))
      .filter((url): url is string => Boolean(url));
    warmStreamVideoMedia(warmUrls);
  }, [activeVideo?.id, activeIdx, items, playbackCache, activePlayback?.playback_url]);

  useEffect(() => {
    if (!items.length) return;
    if (didAutoPickReady) return;
    const currentStatus = activePlayback?.status ?? "";
    if (currentStatus === "ready") {
      setDidAutoPickReady(true);
      return;
    }
    const firstReadyIdx = items.findIndex((row) => playbackCache[row.stream_video.id]?.status === "ready");
    if (firstReadyIdx >= 0 && firstReadyIdx !== activeIdx) {
      setActiveIdx(firstReadyIdx);
      setDidAutoPickReady(true);
    }
  }, [items, playbackCache, activeIdx, activePlayback?.status, didAutoPickReady]);

  const selectEpisode = useCallback(
    (index: number, opts?: { autoplay?: boolean }) => {
      if (index < 0 || index >= items.length) return;
      const videoId = items[index]?.stream_video.id;
      const resumeAt =
        videoId != null ? progressMap[videoId]?.currentPositionSeconds ?? 0 : 0;
      pendingAutoplayRef.current = Boolean(opts?.autoplay);
      setActiveIdx(index);
      setResumeStartSeconds(resumeAt);
      // Do not scroll — jumping hides the fixed dashboard navbar on mobile.
    },
    [items, progressMap],
  );

  useEffect(() => {
    if (!pendingAutoplayRef.current) return;
    if (!activeVideo?.id) return;
    const url = activePlayback?.playback_url;
    if (activePlayback?.status !== "ready" || !url) return;
    const resumeAt = progressMap[activeVideo.id]?.currentPositionSeconds ?? resumeStartSeconds ?? 0;
    pendingAutoplayRef.current = false;
    setSeekRequest({
      id: Date.now(),
      seconds: Math.max(0, resumeAt),
      autoplay: true,
    });
  }, [
    activeVideo?.id,
    activePlayback?.status,
    activePlayback?.playback_url,
    progressMap,
    resumeStartSeconds,
  ]);

  const handleTimeProgress = useCallback(
    ({ currentTime, duration }: { currentTime: number; duration: number }) => {
      if (!activeVideo?.id || duration <= 0) return;
      const videoId = activeVideo.id;
      const now = Math.min(Math.max(currentTime, 0), duration);
      const prevPosition = lastPlaybackPositionRef.current[videoId];
      lastPlaybackPositionRef.current[videoId] = now;
      const inSeekCooldown = Date.now() < ignorePlaybackUntilRef.current;

      // Prevent seek/forward jumps from inflating watched time.
      // Count only realistic forward deltas that represent real playback progression.
      const delta = typeof prevPosition === "number" ? now - prevPosition : 0;
      const playbackIncrement =
        !inSeekCooldown && delta > 0 && delta <= MAX_REAL_PLAYBACK_DELTA_SECONDS ? delta : 0;
      const hasMeaningfulPlayback = playbackIncrement >= MIN_WATCHED_INCREMENT_SECONDS;

      setProgressMap((prev) => {
        const existing = prev[videoId];
        const existingRanges = existing?.skippedRanges ?? [];
        const existingWatchedRanges = existing?.watchedRanges ?? [];
        // Fallback: treat large positive jumps as skipped/forwarded segments.
        const autoSkipRange =
          !inSeekCooldown && typeof prevPosition === "number" && delta > MAX_REAL_PLAYBACK_DELTA_SECONDS
            ? { start: Math.max(0, prevPosition), end: Math.min(duration, now) }
            : null;
        const watchedRange =
          typeof prevPosition === "number" && hasMeaningfulPlayback
            ? { start: Math.max(0, prevPosition), end: Math.min(duration, now) }
            : null;
        const nextWatchedRanges = watchedRange ? mergeRanges([...existingWatchedRanges, watchedRange]) : existingWatchedRanges;
        const withAutoSkip = autoSkipRange ? mergeRanges([...existingRanges, autoSkipRange]) : existingRanges;
        const nextRanges = watchedRange ? subtractRange(withAutoSkip, watchedRange) : withAutoSkip;
        const nextWatched = totalRangeDuration(nextWatchedRanges, duration);
        const completed = (existing?.completed ?? false) || nextWatched >= duration * 0.98;
        return {
          ...prev,
          [videoId]: {
            watchedSeconds: nextWatched,
            durationSeconds: Math.max(existing?.durationSeconds ?? 0, duration),
            currentPositionSeconds: now,
            completed,
            skippedRanges: nextRanges,
            watchedRanges: nextWatchedRanges,
          },
        };
      });
    },
    [activeVideo?.id]
  );

  const handlePlaybackEnded = useCallback(() => {
    if (!activeVideo?.id) return;
    setProgressMap((prev) => {
      const existing = prev[activeVideo.id];
      const duration = Math.max(existing?.durationSeconds ?? 0, 1);
      const watchedRanges = mergeRanges([...(existing?.watchedRanges ?? []), { start: 0, end: duration }]);
      const watched = totalRangeDuration(watchedRanges, duration);
      const completed = watched >= duration * 0.98;
      return {
        ...prev,
        [activeVideo.id]: {
          watchedSeconds: watched,
          durationSeconds: duration,
          currentPositionSeconds: duration,
          completed,
          skippedRanges: existing?.skippedRanges ?? [],
          watchedRanges,
        },
      };
    });
  }, [activeVideo?.id]);

  const handleSeekSegment = useCallback(
    ({ from, to, duration }: { from: number; to: number; duration: number }) => {
      if (!activeVideo?.id || to <= from) return;
      const safeFrom = Math.max(0, Math.min(from, duration));
      const safeTo = Math.max(0, Math.min(to, duration));
      if (safeTo - safeFrom <= 1) return;
      ignorePlaybackUntilRef.current = Date.now() + SEEK_COOLDOWN_MS;
      lastPlaybackPositionRef.current[activeVideo.id] = safeTo;
      setProgressMap((prev) => {
        const existing = prev[activeVideo.id];
        const currentRanges = existing?.skippedRanges ?? [];
        const nextRanges = mergeRanges([...currentRanges, { start: safeFrom, end: safeTo }]);
        return {
          ...prev,
          [activeVideo.id]: {
            watchedSeconds: existing?.watchedSeconds ?? 0,
            durationSeconds: Math.max(existing?.durationSeconds ?? 0, duration),
            currentPositionSeconds: existing?.currentPositionSeconds ?? safeTo,
            completed: existing?.completed ?? false,
            skippedRanges: nextRanges,
            watchedRanges: existing?.watchedRanges ?? [],
          },
        };
      });
    },
    [activeVideo?.id]
  );

  const handleTimelineSeek = useCallback(
    (seconds: number) => {
      if (!activeVideo?.id) return;
      const duration = Math.max(activeProgress?.durationSeconds ?? 0, 0);
      if (!Number.isFinite(duration) || duration <= 0) return;
      const target = Math.min(Math.max(0, seconds), Math.max(0, duration - 0.05));
      ignorePlaybackUntilRef.current = Date.now() + SEEK_COOLDOWN_MS;
      lastPlaybackPositionRef.current[activeVideo.id] = target;
      setProgressMap((prev) => {
        const existing = prev[activeVideo.id];
        return {
          ...prev,
          [activeVideo.id]: {
            watchedSeconds: existing?.watchedSeconds ?? 0,
            durationSeconds: Math.max(existing?.durationSeconds ?? 0, duration),
            currentPositionSeconds: target,
            completed: existing?.completed ?? false,
            skippedRanges: existing?.skippedRanges ?? [],
            watchedRanges: existing?.watchedRanges ?? [],
          },
        };
      });
      setSeekRequest({ id: Date.now(), seconds: target, autoplay: true });
    },
    [activeProgress?.durationSeconds, activeVideo?.id]
  );

  const handleApplyForToken = useCallback(async () => {
    const displayName = certificateName.trim();
    if (!displayName) {
      setCertificateMessage("Please enter your name for the certificate.");
      return;
    }
    setCertificateSubmitting(true);
    setCertificateMessage(null);
    try {
      const issued = await issuePlaylistCertificate(playlistId, displayName);
      const certificateId = issued.token_id || issued.certificate_id;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          `${CERTIFICATE_PREFIX}:${playlistId}`,
          JSON.stringify({
            certificateId,
            playlistTitle: issued.playlist_title || playlist?.title || "Playlist",
            name: issued.holder_name || displayName,
            issuedAt: issued.issued_at || new Date().toISOString(),
          })
        );
        window.dispatchEvent(new Event("syn-certificates-updated"));
      }
      setShowApplyModal(false);
      setCertificateName("");
      setCertificateMessage(null);
      goToSettingsCertificates();
    } catch (e) {
      setCertificateMessage(e instanceof Error ? e.message : "Could not issue certificate.");
    } finally {
      setCertificateSubmitting(false);
    }
  }, [certificateName, playlistId, playlist?.title]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-10 text-center text-sm text-white/60">
        Loading playlist…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/35 bg-red-950/20 px-4 py-6 text-[14px] text-red-100/90">{err}</div>
    );
  }

  if (!playlist) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-black/35 px-4 py-8 text-center text-[14px] text-white/65">
        This playlist could not be loaded.
      </div>
    );
  }

  const playlistAttachments = playlist.attachments ?? [];
  const hasVideos = items.length > 0;
  const hasResources = playlistAttachments.length > 0;

  if (!hasVideos && !hasResources) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-black/35 px-4 py-8 text-center text-[14px] text-white/65">
        This playlist has no videos yet. Add Stream videos in Django admin.
      </div>
    );
  }

  if (!hasVideos && hasResources) {
    return (
      <div className="w-full space-y-4">
        <h2 className="text-[clamp(1.15rem,2.2vw+0.5rem,1.65rem)] font-black leading-tight tracking-tight text-[#f5c814]">
          {playlist.title}
        </h2>
        <PlaylistResourcesBlock attachments={playlistAttachments} className="w-full" />
      </div>
    );
  }

  if (playlist.is_coming_soon) {
    return (
      <div className="rounded-xl border border-amber-400/35 bg-amber-950/20 px-4 py-10 text-center text-[14px] text-amber-100/90">
        <div className="mx-auto mb-2 inline-flex rounded-full border border-amber-300/55 bg-amber-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">
          Coming soon
        </div>
        <p>This playlist is marked as coming soon. Please check back later.</p>
      </div>
    );
  }

  const playbackUrl = activePlayback?.playback_url ?? null;
  /** Mount player as soon as a signed URL exists; resume position hydrates separately. */
  const ready = activePlayback?.status === "ready" && !!playbackUrl;
  const playbackFailed = Boolean(activeVideo?.id) && !playbackLoading && !ready && activePlayback?.status !== "processing";
  const playlistPrice = parsePlaylistNumber(playlist.price);
  const playlistCoverThumb = resolveProgramPlaylistThumbnail(playlist);

  const renderEpisodeButton = (row: (typeof items)[number], i: number) => {
    const v = row.stream_video;
    const on = i === activeIdx;
    const thumbSrc = resolveDjangoMediaUrl(v.thumbnail_url) || playlistCoverThumb;
    return (
      <li key={row.id}>
        <button
          type="button"
          onClick={() => selectEpisode(i, { autoplay: true })}
          className={cn(
            "flex w-full gap-3.5 rounded-xl border p-3 text-left transition max-sm:gap-2.5 max-sm:p-2",
            on
              ? "border-violet-300/70 bg-violet-500/10 shadow-[0_0_0_1px_rgba(196,181,253,0.2)]"
              : "border-transparent bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]"
          )}
        >
          <div className="relative h-16 w-[6.4rem] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-violet-800/90 via-neutral-900 to-black max-sm:h-12 max-sm:w-[5.2rem]">
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt=""
                loading={i < 4 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i < 4 ? "high" : "auto"}
                className="absolute inset-0 h-full w-full object-cover opacity-90"
              />
            ) : null}
            <span className="pointer-events-none absolute inset-y-0 left-0 z-[2] flex w-7 items-center justify-center bg-gradient-to-r from-black/70 via-black/35 to-transparent max-sm:w-6">
              <span className="text-[32px] font-black leading-none text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)] max-sm:text-[22px]">
                {i + 1}
              </span>
            </span>
            <span className="absolute inset-0 z-[1] flex items-center justify-center">
              <Play className={cn("h-6 w-6 stroke-[1.75] max-sm:h-5 max-sm:w-5", on ? "text-white" : "text-white/55")} />
            </span>
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <div
              className={cn(
                "font-sans text-[14px] font-semibold leading-[1.35] tracking-normal antialiased max-sm:text-[13px]",
                on ? "text-white" : "text-white/85"
              )}
            >
              {v.title}
            </div>
            <div className="mt-1 text-[10px] font-semibold text-cyan-100/85">
              {Math.round(
                ((progressMap[v.id]?.watchedSeconds ?? 0) /
                  Math.max(1, progressMap[v.id]?.durationSeconds ?? 0)) *
                  100
              )}
              % watched
            </div>
          </div>
        </button>
      </li>
    );
  };

  return (
    <div className="programs-playlist-lesson-root flex min-h-0 w-full max-w-full flex-col gap-3 overflow-hidden max-sm:gap-2.5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-start lg:gap-8 lg:overflow-hidden lg:min-h-0">
      {/* Mobile: video column first; playlist below. Desktop: video | sidebar. */}
      <aside
        aria-label="Playlist"
        className="order-2 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-white/12 bg-black/40 p-2.5 max-sm:max-h-[min(48vh,420px)] lg:order-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] lg:shrink-0 lg:self-start lg:p-3"
      >
        <div className="border-b border-white/10 px-1 pb-2 lg:pb-3">
          <div className="text-[13px] font-bold text-[#f5c814] max-sm:text-[12px]">{playlist.title}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] lg:mt-2">
            <span className="rounded-full border border-emerald-300/45 bg-emerald-500/12 px-2 py-0.5 font-sans font-extrabold tracking-normal text-emerald-200">
              {formatLocalizedPrice(playlistPrice)}
            </span>
          </div>
          <div className="mt-2 space-y-1.5 rounded-lg border border-cyan-300/35 bg-cyan-950/20 p-2 lg:mt-3 lg:space-y-3 lg:p-3.5">
            <div className="flex items-center justify-between text-[11px] lg:text-[13px]">
              <span className="font-black uppercase tracking-[0.12em] text-cyan-100">Progress</span>
              <span className="font-black text-cyan-100">{completionPercent.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/55 lg:h-3">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.85),rgba(129,140,248,0.85),rgba(232,121,249,0.85))] transition-[width] duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="hidden items-center justify-between text-[12px] font-semibold text-white/90 lg:flex">
              <span>{formatDuration(watchedDuration)} watched</span>
              <span>{formatDuration(totalDuration)} total</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-200 lg:text-[12px]">
              {completedCount}/{items.length} videos
            </div>
          </div>
          {isPlaylistCompleted ? (
            <button
              type="button"
              onClick={() => {
                setCertificateName("");
                setCertificateMessage(null);
                setShowApplyModal(true);
              }}
              className="mt-2 w-full rounded-lg border border-emerald-300/45 bg-emerald-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.28)] transition hover:bg-emerald-500/25 lg:mt-3 lg:py-2 lg:text-[11px]"
            >
              Apply for SYN token for this course
            </button>
          ) : null}
        </div>
        <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain pr-1 touch-pan-y lg:mt-3 lg:gap-2">
          {items.map((row, i) => renderEpisodeButton(row, i))}
        </ul>
      </aside>

      <div className="order-1 min-w-0 shrink-0 space-y-3 lg:order-1 lg:shrink lg:space-y-5">
        <div ref={playerAnchorRef} className="space-y-2">
          {!ready ? (
            <div
              className={`flex aspect-video max-h-[min(58vh,640px)] w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-white/65 sm:max-h-[min(62vh,720px)] ${playerShell}`}
            >
              <span className="rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100/90">
                {activePlayback?.status === "processing"
                  ? "Processing"
                  : playbackFailed
                    ? "Playback unavailable"
                    : activePlayback?.status === "ready"
                      ? "Loading video…"
                      : activePlayback?.status ?? "Loading video…"}
              </span>
              <p>
                {activePlayback?.status === "processing"
                  ? "This episode is still being prepared."
                  : playbackFailed
                    ? "Could not load a secure playback link for this episode. Check access or try again."
                    : "Fetching a secure playback link for this episode."}
              </p>
              {playbackFailed ? (
                <button
                  type="button"
                  className="mt-1 rounded-md border border-amber-300/40 bg-amber-500/15 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-amber-100"
                  onClick={() => void refreshPlaybackNow({ force: true })}
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : (
            <StreamHtmlVideoPlayer
              sessionKey={`playlist-${playlistId}`}
              episodeKey={activeVideo.id}
              src={playbackUrl}
              playbackType={activePlayback?.playback_type}
              srcRevision={activeSrcRevision}
              className={playerShell}
              playerLayout={activeVideo.player_layout ?? "auto"}
              sourceWidth={activeVideo.source_width ?? null}
              sourceHeight={activeVideo.source_height ?? null}
              onTimeProgress={handleTimeProgress}
              onPlaybackEnded={handlePlaybackEnded}
              startAtSeconds={resumeStartSeconds}
              onSeekSegment={handleSeekSegment}
              seekRequest={seekRequest}
              onNeedFreshSrc={() => void refreshPlaybackNow({ force: true })}
              onEnsurePlayback={() => ensureFreshPlayback()}
            />
          )}
          {activeProgress?.durationSeconds ? (
            <div className="mt-2 rounded-md border border-cyan-300/25 bg-cyan-950/12 p-1.5 max-sm:p-1 lg:p-2">
              <div className="mb-1 flex items-center justify-between text-[10px] max-sm:mb-0.5">
                <span className="font-bold uppercase tracking-[0.1em] text-cyan-100/90">Video Timeline</span>
                <span className="hidden text-rose-100/85 sm:inline">red = not watched</span>
              </div>
              <div
                className="relative h-2 cursor-pointer overflow-hidden rounded-full bg-black/60 lg:h-2.5"
                onClick={(event) => {
                  const duration = Math.max(activeProgress.durationSeconds, 1);
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
                  const ratio = rect.width > 0 ? x / rect.width : 0;
                  handleTimelineSeek(ratio * duration);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  const duration = Math.max(activeProgress.durationSeconds, 1);
                  handleTimelineSeek((activeProgress.currentPositionSeconds ?? 0) + duration * 0.03);
                }}
                aria-label="Seek video from timeline"
              >
                <span
                  className="absolute left-0 top-0 h-full bg-white/75"
                  style={{
                    width: `${(() => {
                      const dur = Math.max(1, activeProgress.durationSeconds);
                      const pos = Math.max(0, activeProgress.currentPositionSeconds ?? 0);
                      const rawPct = (pos / dur) * 100;
                      if (pos <= 0) return 0;
                      const minPct = rawPct > 0 && rawPct < 1.25 ? 1.25 : rawPct;
                      return Math.min(100, minPct);
                    })()}%`,
                  }}
                />
                {activeUnwatchedRanges.map((range, idx) => {
                  const dur = Math.max(1, activeProgress.durationSeconds);
                  const left = (Math.max(0, range.start) / dur) * 100;
                  const width = (Math.max(0, range.end - range.start) / dur) * 100;
                  return (
                    <span
                      key={`skip-${idx}-${range.start}-${range.end}`}
                      className="absolute top-0 h-full cursor-pointer bg-rose-500/95"
                      style={{ left: `${left}%`, width: `${Math.max(width, 0.8)}%` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        const rect = event.currentTarget.getBoundingClientRect();
                        const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
                        const ratio = rect.width > 0 ? x / rect.width : 0;
                        const segmentSeconds = range.start + ratio * Math.max(0, range.end - range.start);
                        handleTimelineSeek(segmentSeconds);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {playlistAttachments.length > 0 ? (
          <PlaylistResourcesBlock attachments={playlistAttachments} className="w-full" />
        ) : null}

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[clamp(1.05rem,2.2vw+0.5rem,1.65rem)] font-black leading-tight tracking-tight text-[#f5c814]">
              {activeVideo?.title ?? "Episode"}
            </h2>
            <span className="rounded-full border border-emerald-300/45 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-black text-emerald-200">
              {formatLocalizedPrice(playlistPrice)}
            </span>
          </div>
          {(activeVideo?.description || "").trim() ? (
            <div className="mt-3 max-w-4xl rounded-xl border border-white/12 bg-black/35 px-4 py-3 max-sm:mt-2 max-sm:px-3 max-sm:py-2">
              <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#f5c814]">Description</div>
              <p className="font-sans whitespace-pre-line break-words [overflow-wrap:anywhere] text-left text-[15px] font-normal leading-7 tracking-normal text-white/92 antialiased max-sm:text-[13px] max-sm:leading-6">
                {(activeVideo?.description || "").trim()}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      {showApplyModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-emerald-300/40 bg-[#040a12] p-4 shadow-[0_0_26px_rgba(16,185,129,0.26)]">
            <h3 className="text-lg font-black uppercase tracking-[0.08em] text-emerald-100">Apply for SYN Token</h3>
            <p className="mt-2 text-sm text-white/80">
              Playlist complete. Enter your full name to issue your certificate for <span className="font-semibold text-emerald-100">{playlist.title}</span>.
            </p>
            <input
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              placeholder="Your full name"
              className="mt-3 w-full rounded-md border border-emerald-300/35 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/70"
            />
            {certificateMessage ? <p className="mt-2 text-xs text-emerald-200">{certificateMessage}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="rounded-md border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white/85"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleApplyForToken()}
                disabled={certificateSubmitting}
                className="rounded-md border border-emerald-300/50 bg-emerald-500/18 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {certificateSubmitting ? "Issuing…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
