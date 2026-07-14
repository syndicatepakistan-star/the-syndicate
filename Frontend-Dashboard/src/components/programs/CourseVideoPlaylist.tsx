"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Play } from "lucide-react";
import { fetchCourseVideos, postVideoProgress, resolveDjangoMediaUrl, resolveLessonVideoUrl, type VideoDto } from "@/lib/courses-api";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { StructuredDescriptionBody } from "@/components/programs/StructuredDescriptionBody";

type Props = {
  courseId: number;
  courseTitle: string;
  /** Course-level description from API (shown under the active lesson title). */
  courseDescription?: string;
  autoAdvance?: boolean;
};

function formatDurationPlaceholder(): string {
  return "—:—";
}

/** YouTube / Vimeo watch URLs → embed URL, or null if not recognized. */
function embedUrlFromWatchUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const h = u.hostname.replace(/^www\./, "");
    if (h === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (h.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const parts = u.pathname.split("/").filter(Boolean);
      const ei = parts.indexOf("embed");
      if (ei >= 0 && parts[ei + 1]) return `https://www.youtube.com/embed/${parts[ei + 1]}`;
      if (parts[0] === "shorts" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
    }
    if (h.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[parts.length - 1];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function CourseVideoPlaylist({
  courseId,
  courseTitle,
  courseDescription = "",
  autoAdvance = true,
}: Props) {
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const active = videos[activeIdx] ?? null;

  const loadList = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchCourseVideos(courseId);
      if (!res.ok) {
        setErr(
          typeof res.data === "object" && res.data && "detail" in (res.data as object)
            ? String((res.data as { detail?: string }).detail)
            : `Failed (${res.status}).`
        );
        setVideos([]);
        return;
      }
      const list = (Array.isArray(res.data) ? res.data : []) as VideoDto[];
      setVideos(list);
      setActiveIdx(0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load course videos.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const goNext = useCallback(() => {
    if (!active) return;
    void postVideoProgress(active.id, { position_seconds: 0, completed: true });
    if (!autoAdvance || activeIdx >= videos.length - 1) return;
    setActiveIdx((i) => i + 1);
  }, [active, activeIdx, autoAdvance, videos.length]);

  const sidebarTitle = useMemo(() => courseTitle, [courseTitle]);
  const programAbout = useMemo(() => (courseDescription || "").trim(), [courseDescription]);

  const playbackSrc = active ? resolveLessonVideoUrl(active.video_url) : null;
  const embedSrc = playbackSrc ? embedUrlFromWatchUrl(playbackSrc) : null;

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-10 text-center text-sm text-white/60">
        Loading course videos…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/35 bg-red-950/20 px-4 py-6 text-[14px] text-red-100/90">
        {err}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-black/35 px-4 py-8 text-center text-[14px] text-white/65">
        No published videos for this course yet.
      </div>
    );
  }

  const playerShell =
    "aspect-video max-h-[min(58vh,640px)] w-full overflow-hidden rounded-xl border border-white/10 bg-black/50 sm:max-h-[min(62vh,720px)]";

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start lg:gap-10">
      {/* Main column: player + lesson copy */}
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          <div>
            {!playbackSrc ? (
              <div className={`flex ${playerShell} items-center justify-center px-4 text-center text-sm text-white/55`}>
                No video URL for this lesson. Add a playback URL in Django admin (MP4/WebM, YouTube, or Vimeo).
              </div>
            ) : embedSrc ? (
              <iframe
                title={active?.title ?? "Lesson video"}
                src={embedSrc}
                className={playerShell}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                key={playbackSrc}
                className={playerShell}
                controls
                playsInline
                preload="metadata"
                src={playbackSrc}
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 transition hover:border-amber-400/45 hover:bg-black/60 hover:text-white"
              onClick={() =>
                toast("Refresh or switch lesson. If it keeps failing, check your connection.", {
                  duration: 3200,
                  className: "text-sm"
                })
              }
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-300/90" aria-hidden />
              Video issues?
            </button>
          </div>
        </div>

        {active ? (
          <>
            <div>
              <h2 className="text-[clamp(1.15rem,2.2vw+0.5rem,1.65rem)] font-black leading-tight tracking-tight text-white">
                {active.title}
              </h2>
              {(active.description || "").trim() ? (
                <p className="mt-3 max-w-3xl text-[14px] font-medium leading-[1.65] tracking-[0.01em] text-white/[0.88] antialiased">
                  {(active.description || "").trim()}
                </p>
              ) : null}
              {programAbout ? (
                <div className="mt-4 max-w-4xl">
                  <div className="mb-3 text-[13px] font-black uppercase tracking-[0.14em] text-[#f5c814] sm:text-[14px]">
                    About this program
                  </div>
                  <StructuredDescriptionBody text={programAbout} prominent />
                </div>
              ) : !(active.description || "").trim() ? (
                <p className="mt-3 max-w-3xl text-[13px] leading-[1.6] text-white/55">
                  Choose another lesson from the playlist anytime.
                </p>
              ) : null}
            </div>

            {autoAdvance && activeIdx < videos.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="text-[13px] font-semibold text-cyan-200/90 underline-offset-4 hover:underline"
              >
                Mark complete &amp; play next
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Playlist sidebar */}
      <aside
        aria-label="Lesson playlist"
        className="flex min-h-0 flex-col rounded-xl border border-white/12 bg-black/40 p-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]"
      >
        <div className="border-b border-white/10 px-1 pb-3 text-[13px] font-bold text-white/95">{sidebarTitle}</div>
        <ul className="mt-3 flex max-h-[min(52vh,560px)] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
          {videos.map((v, i) => {
            const on = i === activeIdx;
            const thumbSrc = resolveDjangoMediaUrl(v.thumbnail_url);
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "flex w-full gap-3 rounded-xl border p-2.5 text-left transition",
                    on ? "border-white/80 bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" : "border-transparent bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]"
                  )}
                >
                  <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-red-700/90 via-neutral-900 to-black">
                    {thumbSrc ? (
                      <img src={thumbSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                    ) : null}
                    <span className="absolute right-1 top-1 z-[1] text-lg font-black leading-none text-white/25">{i + 1}</span>
                    <span className="absolute inset-0 z-[1] flex items-center justify-center">
                      <Play className={cn("h-6 w-6 stroke-[1.75]", on ? "text-white" : "text-white/55")} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className={cn("text-[13px] font-semibold leading-snug", on ? "text-white" : "text-white/80")}>
                      {v.title}
                    </div>
                    <span className="mt-1.5 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tabular-nums text-neutral-900">
                      {formatDurationPlaceholder()}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
