"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { VideoCard, type VideoDto } from "./VideoCard";
import { getVideoGridSlot } from "./videoGridSlots";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function startOfDayMs(ymd: string): number {
  return new Date(`${ymd}T00:00:00`).getTime();
}

function endOfDayMs(ymd: string): number {
  return new Date(`${ymd}T23:59:59.999`).getTime();
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-[rgba(250,204,21,0.28)] bg-black/55 px-3 py-2.5 text-[12px] font-semibold text-white/90 outline-none transition " +
  "focus:border-[rgba(250,204,21,0.55)] focus:shadow-[0_0_20px_rgba(250,204,21,0.12)] " +
  "[color-scheme:dark]";

type MembershipVideoGalleryProps = {
  videos: VideoDto[];
  loading: boolean;
  error: string | null;
  videoNext?: string | null;
  onLoadMore?: () => void;
  onPlay: (video: VideoDto) => void;
  activeTab?: "articles" | "videos";
  onSwitchTab?: (tab: "articles" | "videos") => void;
};

export function MembershipVideoGallery({
  videos,
  loading,
  error,
  videoNext = null,
  onLoadMore,
  onPlay,
  activeTab = "videos",
  onSwitchTab
}: MembershipVideoGalleryProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredVideos = useMemo(() => {
    if (!dateFrom && !dateTo) return videos;
    return videos.filter((v) => {
      const t = new Date(v.created_at).getTime();
      if (Number.isNaN(t)) return true;
      if (dateFrom && t < startOfDayMs(dateFrom)) return false;
      if (dateTo && t > endOfDayMs(dateTo)) return false;
      return true;
    });
  }, [videos, dateFrom, dateTo]);

  const filterActive = Boolean(dateFrom || dateTo);
  const showFilteredEmpty = !loading && videos.length > 0 && filteredVideos.length === 0;

  return (
    <div className="space-y-[clamp(1rem,2.5vw+0.35rem,1.35rem)]">
      {error ? (
        <div className="rounded-xl border border-red-500/35 bg-red-950/25 p-[var(--fluid-card-p)] text-[clamp(0.72rem,0.45vw+0.55rem,0.85rem)] text-red-200/90">
          <p>{error}</p>
          {error.includes("Sign in") || error.includes("signed-in") ? (
            <Link
              href="/login"
              className="mt-3 inline-flex rounded-lg border border-[rgba(250,204,21,0.45)] bg-black/40 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--gold-neon)] transition hover:border-[rgba(250,204,21,0.65)]"
            >
              Log in
            </Link>
          ) : null}
        </div>
      ) : null}

      <div
        className={cx(
          "relative overflow-hidden rounded-2xl border border-[rgba(250,204,21,0.22)]",
          "bg-gradient-to-br from-black/85 via-black/70 to-[rgba(250,204,21,0.07)]",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(250,204,21,0.12)]"
        )}
      >
        <div
          className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-[rgba(250,204,21,0.06)] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-[rgba(220,38,38,0.05)] blur-3xl"
          aria-hidden
        />

        <div className="relative border-b border-white/[0.08] bg-black/35 px-3 py-3.5 sm:px-4 sm:py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end xl:flex-nowrap">
            <label className="block min-w-0 flex-1 sm:min-w-[170px] xl:max-w-[240px]">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                }}
                className={inputClass}
              />
            </label>
            <label className="block min-w-0 flex-1 sm:min-w-[170px] xl:max-w-[240px]">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                }}
                className={inputClass}
              />
            </label>
            <div className="flex w-full flex-wrap items-center gap-2 xl:ml-auto xl:w-auto">
              {onSwitchTab
                ? ([
                    { id: "articles" as const, label: "Articles", sub: "Text archive" },
                    { id: "videos" as const, label: "Videos", sub: "Visual feed" },
                  ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSwitchTab(t.id)}
                  className={cx(
                    "group relative min-w-0 flex-1 overflow-hidden rounded-lg border px-3 py-2 text-left transition sm:flex-none sm:px-6 sm:py-3",
                    activeTab === t.id
                      ? "cut-frame-sm cyber-frame gold-stroke border-[color:var(--gold-neon-border)] bg-[rgba(250,204,21,0.14)] text-[color:var(--gold-neon)] shadow-[0_0_24px_rgba(250,204,21,0.18)]"
                      : "cut-frame-sm cyber-frame border-white/15 bg-black/55 text-neutral-400 hover:border-[color:var(--gold-neon-border-mid)] hover:text-[color:var(--gold-neon)]/90"
                  )}
                >
                  <span className="block text-[12px] font-black uppercase tracking-[0.14em] sm:text-[13px] sm:tracking-[0.16em]">{t.label}</span>
                  <span className="mt-0.5 block text-[9px] font-mono uppercase tracking-wider text-neutral-500 group-hover:text-neutral-400 sm:text-[10px]">
                    {t.sub}
                  </span>
                </button>
              ))
                : null}
            </div>
          </div>
          {filterActive ? (
            <div className="mt-3 text-right text-[10px] text-white/45">
              Showing <span className="font-bold text-white/75">{filteredVideos.length}</span> of {videos.length}
            </div>
          ) : null}
        </div>

        <div className="relative p-3 sm:p-4 md:p-6">
          {loading && !videos.length ? (
            <VideoGridSkeleton />
          ) : showFilteredEmpty ? (
            <div className="rounded-xl border border-white/10 bg-black/35 px-6 py-14 text-center">
              <p className="text-[13px] font-semibold text-white/75">No videos in this date range.</p>
              <p className="mt-2 text-[12px] text-white/45">Widen the range or clear filters to see everything loaded.</p>
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="mt-6 rounded-lg border border-[rgba(250,204,21,0.45)] bg-black/50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--gold-neon)] transition hover:border-[rgba(250,204,21,0.65)]"
              >
                Reset filters
              </button>
            </div>
          ) : !videos.length && !loading ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-6 py-14 text-center text-[13px] text-white/50">
              No videos yet. When briefings are published, they appear in this grid.
            </div>
          ) : (
            <div
              className={cx(
                "grid grid-flow-dense auto-rows-auto grid-cols-2 gap-[clamp(0.75rem,2vw+0.25rem,1.25rem)]",
                "md:grid-cols-6 xl:grid-cols-12"
              )}
            >
              {filteredVideos.map((v, i) => {
                const slot = getVideoGridSlot(i, v);
                return (
                  <div key={v.id} className={slot.cell}>
                    <VideoCard
                      video={v}
                      onPlay={onPlay}
                      index={i}
                      visual={slot.visual}
                      frame={slot.frame}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {videoNext && onLoadMore ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            className="cut-frame-sm cyber-frame gold-stroke premium-gold-border rounded-lg bg-black/40 px-6 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[color:var(--gold-neon)]/88 transition hover:border-[rgba(255,215,0,0.55)]"
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}

function VideoGridSkeleton() {
  return (
    <div
      className={cx(
        "grid grid-flow-dense auto-rows-auto grid-cols-2 gap-[clamp(0.75rem,2vw+0.25rem,1.25rem)]",
        "md:grid-cols-6 xl:grid-cols-12"
      )}
    >
      {Array.from({ length: 8 }).map((_, i) => {
        const slot = getVideoGridSlot(i, undefined);
        return (
          <div key={i} className={slot.cell}>
            <div
              className={cx(
                "h-full min-h-[200px] animate-pulse rounded-xl border border-[rgba(250,204,21,0.15)] bg-gradient-to-br from-white/[0.06] to-transparent",
                slot.visual === "portrait" && "min-h-[280px]"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
