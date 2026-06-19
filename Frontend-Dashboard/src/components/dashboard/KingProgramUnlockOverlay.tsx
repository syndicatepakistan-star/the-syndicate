"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Lock } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { resolveDjangoMediaUrl } from "@/lib/courses-api";
import { filterKnightSelectablePlaylists } from "@/lib/knightProgramSelection";
import { warmImage } from "@/lib/mediaWarmCache";
import { resolveProgramPlaylistThumbnail } from "@/lib/programPlaylistCatalog";
import type { KingProgramSelectionState } from "@/lib/portal-api";

type Choice = { program_type: "course" | "playlist"; id: number };

type Props = {
  state: KingProgramSelectionState | null;
  loading: boolean;
  error: string;
  onSubmit: (payload: { course_ids: number[]; playlist_ids: number[] }) => Promise<void>;
};

const ROW_THEMES = [
  {
    border: "border-fuchsia-300/55",
    bg: "bg-fuchsia-950/18",
    glow: "shadow-[0_0_20px_rgba(232,121,249,0.22)]",
    checked: "border-fuchsia-200/80 bg-fuchsia-500/20 shadow-[0_0_28px_rgba(232,121,249,0.42)]",
    thumbBorder: "border-fuchsia-300/55",
  },
  {
    border: "border-cyan-300/55",
    bg: "bg-cyan-950/18",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.22)]",
    checked: "border-cyan-200/80 bg-cyan-500/20 shadow-[0_0_28px_rgba(34,211,238,0.42)]",
    thumbBorder: "border-cyan-300/55",
  },
  {
    border: "border-emerald-300/55",
    bg: "bg-emerald-950/18",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.22)]",
    checked: "border-emerald-200/80 bg-emerald-500/20 shadow-[0_0_28px_rgba(16,185,129,0.42)]",
    thumbBorder: "border-emerald-300/55",
  },
  {
    border: "border-amber-300/55",
    bg: "bg-amber-950/18",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.22)]",
    checked: "border-amber-200/80 bg-amber-500/20 shadow-[0_0_28px_rgba(245,158,11,0.42)]",
    thumbBorder: "border-amber-300/55",
  },
] as const;

/** Rows visible in the scroll panel without scrolling — load these thumbnails first. */
const PRIORITY_THUMB_COUNT = 6;

function KnightRowThumb({
  src,
  fallback,
  eager,
  thumbBorder,
}: {
  src: string | undefined;
  fallback: string | undefined;
  eager: boolean;
  thumbBorder: string;
}) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const resolved = src ?? fallback;

  useEffect(() => {
    if (shouldLoad) return;
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px 0px", threshold: 0.01 }
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <span
      ref={hostRef}
      className={cn(
        "relative h-12 w-[4.25rem] shrink-0 overflow-hidden rounded-md border bg-black/55 sm:h-14 sm:w-[5.25rem]",
        thumbBorder
      )}
    >
      {shouldLoad && resolved ? (
        <img
          src={resolved}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          onError={(e) => {
            const img = e.currentTarget;
            if (fallback && img.src !== fallback && !img.dataset.fallbackApplied) {
              img.dataset.fallbackApplied = "1";
              img.src = fallback;
              return;
            }
            img.style.display = "none";
          }}
          className="h-full w-full object-cover object-center [image-rendering:high-quality]"
        />
      ) : (
        <span
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40"
          aria-hidden
        />
      )}
    </span>
  );
}

export default function KingProgramUnlockOverlay({ state, loading, error, onSubmit }: Props) {
  const required = state?.required_count ?? 5;
  const [selected, setSelected] = useState<Choice[]>(() => state?.selected_items ?? []);
  useEffect(() => {
    if (!state) {
      setSelected([]);
      return;
    }
    const validKeys = new Set<string>();
    for (const course of state.courses ?? []) {
      validKeys.add(`course:${course.id}`);
    }
    for (const playlist of filterKnightSelectablePlaylists(state.playlists ?? [])) {
      validKeys.add(`playlist:${playlist.id}`);
    }
    const next = (state.selected_items ?? []).filter((item) =>
      validKeys.has(`${item.program_type}:${item.id}`)
    );
    setSelected(next);
  }, [state]);

  const selectedCount = selected.length;
  const isReady = selectedCount === required;
  const isOver = selectedCount > required;

  const rows = useMemo(() => {
    const playlists = filterKnightSelectablePlaylists(state?.playlists ?? []).map((p) => ({
      program_type: "playlist" as const,
      id: p.id,
      title: p.title,
      thumbnail_url: p.thumbnail_url ?? null,
      vault_plan_slug: p.vault_plan_slug ?? null,
    }));
    return playlists;
  }, [state]);

  const thumbUrls = useMemo(
    () =>
      rows.map((row) => {
        const playlistMeta = {
          id: row.id,
          title: row.title,
          vault_plan_slug: row.vault_plan_slug,
        };
        const thumbSrc = resolveProgramPlaylistThumbnail(
          playlistMeta,
          resolveDjangoMediaUrl(row.thumbnail_url)
        );
        const thumbFallback = resolveProgramPlaylistThumbnail(playlistMeta, null);
        return thumbSrc ?? thumbFallback ?? null;
      }),
    [rows]
  );

  useEffect(() => {
    const priority = thumbUrls.slice(0, PRIORITY_THUMB_COUNT).filter((url): url is string => Boolean(url));
    if (!priority.length) return;
    void Promise.all(priority.map((url) => warmImage(url)));
  }, [thumbUrls]);

  const keyOf = (item: Choice) => `${item.program_type}:${item.id}`;
  const selectedSet = useMemo(() => new Set(selected.map(keyOf)), [selected]);

  const toggle = (item: Choice) => {
    const key = keyOf(item);
    if (selectedSet.has(key)) {
      setSelected((prev) => prev.filter((x) => keyOf(x) !== key));
      return;
    }
    if (selected.length >= required) return;
    setSelected((prev) => [...prev, item]);
  };

  const submit = async () => {
    const course_ids = selected.filter((x) => x.program_type === "course").map((x) => x.id);
    const playlist_ids = selected.filter((x) => x.program_type === "playlist").map((x) => x.id);
    await onSubmit({ course_ids, playlist_ids });
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-amber-400/45 bg-[#050505] p-5 shadow-[0_0_70px_rgba(250,204,21,0.24)] sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-amber-400/50 bg-amber-500/14 text-amber-200">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black uppercase tracking-[0.12em] text-amber-100">The Knight unlock step</h2>
              <p className="mt-1 text-sm text-white/75">
                Pick exactly {required} standalone programs from the library — individual psychology and business
                courses only (no vault packs, mid-ticket modules, or Money Mastery). This unlocks your full dashboard,
                membership, goals and milestones, and Syndicate Mode access.
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/70">
            Selected {selectedCount}/{required}
            {isOver ? <span className="ml-2 text-rose-300">Too many selected</span> : null}
          </div>

          <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {rows.map((row, idx) => {
              const choice: Choice = { program_type: row.program_type, id: row.id };
              const checked = selectedSet.has(keyOf(choice));
              const theme = ROW_THEMES[idx % ROW_THEMES.length];
              const playlistMeta = {
                id: row.id,
                title: row.title,
                vault_plan_slug: row.vault_plan_slug,
              };
              const thumbSrc = resolveProgramPlaylistThumbnail(
                playlistMeta,
                resolveDjangoMediaUrl(row.thumbnail_url)
              );
              const thumbFallback = resolveProgramPlaylistThumbnail(playlistMeta, null);
              const eagerThumb = idx < PRIORITY_THUMB_COUNT;
              return (
                <label
                  key={`${row.program_type}-${row.id}`}
                  className={cn(
                    "flex min-h-[56px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition",
                    checked ? cn(theme.checked, "text-white") : cn(theme.border, theme.bg, theme.glow, "text-white/90")
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(choice)}
                    className="h-4 w-4 accent-amber-400"
                  />
                  <KnightRowThumb
                    src={thumbSrc}
                    fallback={thumbFallback}
                    eager={eagerThumb}
                    thumbBorder={theme.thumbBorder}
                  />
                  <span className="truncate text-[16px] font-semibold leading-tight">{row.title}</span>
                </label>
              );
            })}
          </div>

          {error ? (
            <div className="mt-4 rounded-md border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={loading || !isReady}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition",
                loading || !isReady
                  ? "cursor-not-allowed border-white/20 bg-black/40 text-white/45"
                  : "border-amber-400/70 bg-amber-500/18 text-amber-100 hover:bg-amber-500/26"
              )}
            >
              <Lock className="h-3.5 w-3.5" />
              {loading ? "Unlocking..." : "Unlock"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
