"use client";

import { useEffect, useRef, useState } from "react";
import StreamHtmlVideoPlayer from "@/components/streaming/StreamHtmlVideoPlayer";
import {
  fetchStreamVideoDetail,
  fetchStreamVideoPlayback,
  type StreamPayload,
  type StreamVideoDetail
} from "@/lib/streaming-api";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  streamVideoId: number;
  /** Programs catalog vs membership secure hub (different playback authorization endpoints). */
  playbackContext?: "programs" | "membership";
  /** Called once when playback becomes ready (e.g. refetch list so "Processing" badges update). */
  onPlaybackReady?: () => void;
  /** Optional custom text block for the right details panel (membership-specific copy). */
  detailsOverride?: string;
};

const playerShell =
  "overflow-hidden rounded-xl border border-amber-300/50 bg-black/50 shadow-[0_0_30px_rgba(251,191,36,0.22),0_0_52px_rgba(34,211,238,0.12),inset_0_0_0_1px_rgba(255,255,255,0.12)]";

export function StreamVideoProgramPanel({
  streamVideoId,
  playbackContext = "programs",
  onPlaybackReady,
  detailsOverride
}: Props) {
  const [detail, setDetail] = useState<StreamVideoDetail | null>(null);
  const [playback, setPlayback] = useState<StreamPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reportedReadyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void (async () => {
      try {
        const [d, p] = await Promise.all([
          fetchStreamVideoDetail(streamVideoId),
          fetchStreamVideoPlayback(streamVideoId, { context: playbackContext })
        ]);
        if (!cancelled) {
          setDetail(d);
          setPlayback(p);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load video.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [streamVideoId, playbackContext]);

  useEffect(() => {
    reportedReadyRef.current = false;
  }, [streamVideoId, playbackContext]);

  useEffect(() => {
    if (!onPlaybackReady) return;
    const ready = playback?.status === "ready" && Boolean(playback?.playback_url);
    if (ready && !reportedReadyRef.current) {
      reportedReadyRef.current = true;
      onPlaybackReady();
    }
    if (!ready) {
      reportedReadyRef.current = false;
    }
  }, [playback?.status, playback?.playback_url, onPlaybackReady]);

  useEffect(() => {
    if (!playback || playback.status !== "processing") return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const p = await fetchStreamVideoPlayback(streamVideoId, { context: playbackContext });
          if (!cancelled) setPlayback(p);
        } catch {
          // Keep current UI state; next poll may recover.
        }
      })();
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [playback?.status, streamVideoId, playbackContext]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-10 text-center text-sm text-white/60">
        Loading stream…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/35 bg-red-950/20 px-4 py-6 text-[14px] text-red-100/90">{err}</div>
    );
  }

  if (!detail || !playback) {
    return null;
  }

  const playbackUrl = playback.playback_url;
  const ready = playback.status === "ready" && !!playbackUrl;
  const statusLabel = playback.status === "ready" ? "available" : playback.status;
  const hasDetailsOverride = Boolean((detailsOverride || "").trim());
  const detailsText = (detailsOverride || "").trim() || (detail.description || "").trim() || "No description added for this video yet.";
  const overrideLines = hasDetailsOverride
    ? detailsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const overrideHeading = overrideLines[0] ?? "";
  const overrideKeyPoints = overrideLines.slice(1, 5);
  const overrideClosing = overrideLines.slice(5);

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,460px)] lg:items-start lg:gap-8">
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          {!ready ? (
            <div
              className={`flex aspect-video max-h-[min(58vh,640px)] w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-white/65 sm:max-h-[min(62vh,720px)] ${playerShell}`}
            >
              <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100/90">
                {playback.status === "processing" ? "Processing" : playback.status}
              </span>
              <p>
                {playback.status === "processing"
                  ? "This video is still being prepared. It will auto-refresh automatically."
                  : "Playback is not available yet."}
              </p>
            </div>
          ) : (
            <StreamHtmlVideoPlayer
              src={playbackUrl ?? ""}
              className={playerShell}
              playerLayout={detail.player_layout ?? "auto"}
              sourceWidth={detail.source_width ?? null}
              sourceHeight={detail.source_height ?? null}
            />
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[clamp(1.2rem,2.3vw+0.5rem,1.8rem)] font-black leading-tight tracking-tight text-[#facc15] [text-shadow:0_0_16px_rgba(250,204,21,0.28)]">
              {detail.title}
            </h2>
          </div>
          {(detail.description || "").trim() ? (
            <p className="mt-3 max-w-3xl rounded-lg border border-[#facc15]/20 bg-black/35 px-4 py-3 text-[15px] font-medium leading-[1.75] tracking-[0.01em] text-white/95 antialiased">
              {(detail.description || "").trim()}
            </p>
          ) : null}
        </div>
      </div>

      <aside
        aria-label="Video details"
        className="flex min-h-0 flex-col rounded-xl border border-[#facc15]/25 bg-[linear-gradient(180deg,rgba(14,14,14,0.92),rgba(6,6,6,0.92))] p-5 shadow-[0_0_28px_rgba(250,204,21,0.08),inset_0_0_0_1px_rgba(255,255,255,0.04)] lg:sticky lg:top-24"
      >
        {hasDetailsOverride ? null : (
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#facc15]/85">Description</div>
        )}
        {hasDetailsOverride ? (
          <div className="mt-2 space-y-4">
            <h3 className="text-[clamp(1.14rem,0.7vw+1rem,1.42rem)] font-black uppercase tracking-[0.04em] text-[#facc15] [text-shadow:0_0_12px_rgba(250,204,21,0.4),0_0_22px_rgba(250,204,21,0.2)]">
              {overrideHeading}
            </h3>
            {overrideKeyPoints.length ? (
              <ul className="space-y-1.5">
                {overrideKeyPoints.map((point) => (
                  <li
                    key={point}
                    className="text-[clamp(1.02rem,0.65vw+0.9rem,1.26rem)] font-black tracking-[0.01em] text-white [text-shadow:0_0_11px_rgba(250,204,21,0.35),0_0_18px_rgba(250,204,21,0.14)]"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
            {overrideClosing.length ? (
              <div className="space-y-1.5">
                {overrideClosing.map((line) => (
                  <p
                    key={line}
                    className="text-[clamp(1.02rem,0.65vw+0.9rem,1.26rem)] font-black leading-[1.35] tracking-[0.01em] text-white [text-shadow:0_0_11px_rgba(250,204,21,0.35),0_0_18px_rgba(250,204,21,0.14)]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-white/85">{detailsText}</p>
        )}
        <dl className="mt-5 space-y-2 text-[12px] text-white/70">
          <div className="flex justify-between gap-2 border-t border-[#facc15]/20 pt-3">
            <dt className="text-white/60">Status</dt>
            <dd className={cn("font-semibold", ready ? "text-emerald-300/90" : "text-amber-200/90")}>
              {statusLabel}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
