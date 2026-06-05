"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  confirmPlaylistCheckoutSuccess,
  createPlaylistCheckoutSession,
  fetchPublicStreamPlaylists,
  fetchStreamPlaylists,
  type StreamPlaylistListItem,
} from "@/lib/streaming-api";
import { focusProgramCardWithRetries } from "@/lib/programCardScroll";
import {
  resolveProgramPlaylistSummary,
  resolveProgramPlaylistThumbnail,
  resolveProgramPlaylistTitle,
} from "@/lib/programPlaylistCatalog";
import {
  GLOBE_LINKABLE_HIDDEN_PROGRAM_IDS,
  isHiddenProgramPlaylist,
} from "@/lib/programPlaylistThumbnails";
import { ProgramPlaylistCoverImage } from "@/components/programs/ProgramPlaylistCoverImage";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { formatPrice } from "@/lib/currency";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";
import { ProgramPlaylistDescriptionModal } from "@/components/programs/ProgramPlaylistDescriptionModal";

const PROGRAM_CARD_BACKGROUNDS: readonly string[] = [
  "from-amber-600/85 via-orange-900/50 to-black",
  "from-rose-600/85 via-red-950/55 to-black",
  "from-violet-600/85 via-purple-950/50 to-black",
  "from-emerald-600/80 via-teal-950/50 to-black",
  "from-sky-600/85 via-blue-950/50 to-black",
  "from-fuchsia-600/80 via-pink-950/45 to-black",
];

const PLAYLIST_CARD_THEMES = [
  {
    spotlightA: "217,70,239",
    spotlightB: "139,92,246",
    glow: "shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(196,181,253,0.42),0_0_58px_rgba(139,92,246,0.5),0_0_110px_rgba(217,70,239,0.26)]",
    ring: "from-violet-300/95 via-purple-400/95 to-fuchsia-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.42)_0%,rgba(139,92,246,0.28)_35%,rgba(0,0,0,0)_75%)]",
    spark: "from-fuchsia-200/0 via-fuchsia-200/85 to-white/0",
    title: "text-white",
    infoPanel: "border-fuchsia-300/35 bg-fuchsia-950/28",
    dominantBorder: "border-fuchsia-300/75",
  },
  {
    spotlightA: "34,211,238",
    spotlightB: "14,165,233",
    glow: "shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(103,232,249,0.42),0_0_58px_rgba(34,211,238,0.5),0_0_110px_rgba(14,165,233,0.24)]",
    ring: "from-cyan-300/95 via-sky-400/95 to-blue-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.4)_0%,rgba(14,165,233,0.28)_35%,rgba(0,0,0,0)_75%)]",
    spark: "from-cyan-200/0 via-cyan-100/85 to-white/0",
    title: "text-white",
    infoPanel: "border-cyan-300/35 bg-cyan-950/28",
    dominantBorder: "border-cyan-300/75",
  },
  {
    spotlightA: "52,211,153",
    spotlightB: "16,185,129",
    glow: "shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(110,231,183,0.42),0_0_58px_rgba(52,211,153,0.5),0_0_110px_rgba(16,185,129,0.24)]",
    ring: "from-emerald-300/95 via-teal-400/95 to-lime-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.42)_0%,rgba(16,185,129,0.28)_35%,rgba(0,0,0,0)_75%)]",
    spark: "from-emerald-200/0 via-emerald-100/85 to-white/0",
    title: "text-white",
    infoPanel: "border-emerald-300/35 bg-emerald-950/28",
    dominantBorder: "border-emerald-300/75",
  },
  {
    spotlightA: "245,158,11",
    spotlightB: "234,88,12",
    glow: "shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(251,191,36,0.42),0_0_58px_rgba(245,158,11,0.52),0_0_110px_rgba(245,158,11,0.26)]",
    ring: "from-amber-300/95 via-yellow-400/95 to-orange-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.45)_0%,rgba(234,88,12,0.28)_35%,rgba(0,0,0,0)_75%)]",
    spark: "from-amber-100/0 via-amber-100/90 to-white/0",
    title: "text-white",
    infoPanel: "border-amber-300/35 bg-amber-950/28",
    dominantBorder: "border-amber-300/75",
  },
] as const;

function parseNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
  /** Scroll to and open details for this playlist when arriving from a deep link. */
  highlightPlaylistId?: number;
};

const CATEGORY_LABELS: Record<"business_model" | "business_psychology", string> = {
  business_model: "Business Model",
  business_psychology: "Business Psychology",
};

export function PlaylistCardsSection({
  title = "Programs",
  subtitle = "All playlists added from admin are shown here. Open dashboard to continue learning.",
  className,
  highlightPlaylistId,
}: Props) {
  const readInitialPlaylistsFromSession = (): StreamPlaylistListItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem("syn:streaming:playlists:v1");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { data?: StreamPlaylistListItem[] };
      return Array.isArray(parsed?.data) ? parsed.data : [];
    } catch {
      return [];
    }
  };
  const router = useRouter();
  const [playlists, setPlaylists] = useState<StreamPlaylistListItem[]>(() => readInitialPlaylistsFromSession());
  const [error, setError] = useState<string | null>(null);
  const [descriptionModalPlaylist, setDescriptionModalPlaylist] = useState<StreamPlaylistListItem | null>(null);
  const [pendingCheckoutPlaylistId, setPendingCheckoutPlaylistId] = useState<number | null>(null);
  const [highlightedPlaylistId, setHighlightedPlaylistId] = useState<number | null>(null);
  const highlightHandledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const authed = hasSimpleAuthSessionClient();
        const list = authed
          ? await fetchStreamPlaylists({ allowPublicFallback: true, forceRefresh: true })
          : await fetchPublicStreamPlaylists();
        if (!cancelled) {
          setPlaylists(Array.isArray(list) ? list : []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setPlaylists([]);
          setError("Could not load playlists right now.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = (params.get("playlist_checkout") || "").trim();
    const sessionId = (params.get("session_id") || "").trim();
    if (status !== "success" || !sessionId) return;
    if (!hasSimpleAuthSessionClient()) return;
    void (async () => {
      try {
        await confirmPlaylistCheckoutSuccess(sessionId);
        const list = await fetchPublicStreamPlaylists();
        setPlaylists(Array.isArray(list) ? list : []);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Payment confirmation failed.");
      } finally {
        const clean = new URL(window.location.href);
        clean.searchParams.delete("playlist_checkout");
        clean.searchParams.delete("session_id");
        clean.searchParams.delete("playlist_id");
        window.history.replaceState({}, "", clean.toString());
      }
    })();
  }, []);

  const visiblePlaylists = useMemo(
    () =>
      playlists.filter((pl) => {
        if (pl.is_coming_soon) return false;
        const hidden = isHiddenProgramPlaylist(pl.id, { slug: pl.slug, title: pl.title });
        if (!hidden) return true;
        return (
          highlightPlaylistId === pl.id && GLOBE_LINKABLE_HIDDEN_PROGRAM_IDS.has(pl.id)
        );
      }),
    [playlists, highlightPlaylistId]
  );
  const businessPsychologyPlaylists = useMemo(
    () => visiblePlaylists.filter((pl) => pl.category !== "business_model"),
    [visiblePlaylists]
  );
  const businessModelPlaylists = useMemo(
    () => visiblePlaylists.filter((pl) => pl.category === "business_model"),
    [visiblePlaylists]
  );
  const mobilePairedRows = useMemo(() => {
    const maxLen = Math.max(businessPsychologyPlaylists.length, businessModelPlaylists.length);
    return Array.from({ length: maxLen }, (_, idx) => ({
      psychology: businessPsychologyPlaylists[idx] ?? null,
      model: businessModelPlaylists[idx] ?? null,
      idx,
    }));
  }, [businessPsychologyPlaylists, businessModelPlaylists]);

  useEffect(() => {
    highlightHandledRef.current = false;
  }, [highlightPlaylistId]);

  useEffect(() => {
    if (!highlightPlaylistId || !visiblePlaylists.length) return;
    const target = visiblePlaylists.find((pl) => pl.id === highlightPlaylistId);
    if (!target) return;
    if (highlightHandledRef.current) return;

    highlightHandledRef.current = true;
    setHighlightedPlaylistId(target.id);

    const cancelScroll = focusProgramCardWithRetries(target.id);
    const clearHighlight = window.setTimeout(() => setHighlightedPlaylistId(null), 22000);

    return () => {
      cancelScroll();
      window.clearTimeout(clearHighlight);
    };
  }, [highlightPlaylistId, visiblePlaylists]);

  useEffect(() => {
    // Warm first visible cover images so public route transitions feel snappier.
    const topCovers = visiblePlaylists
      .map((pl) => resolveProgramPlaylistThumbnail(pl, null))
      .filter((src): src is string => Boolean(src))
      .slice(0, 8);
    topCovers.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [visiblePlaylists]);

  const spotlightActive = highlightedPlaylistId != null;
  const activeSpotlightTheme = useMemo(() => {
    if (highlightedPlaylistId == null) return null;
    const idx = visiblePlaylists.findIndex((pl) => pl.id === highlightedPlaylistId);
    const themeIdx = idx >= 0 ? idx : 0;
    return PLAYLIST_CARD_THEMES[themeIdx % PLAYLIST_CARD_THEMES.length];
  }, [highlightedPlaylistId, visiblePlaylists]);
  const sectionSpotlightStyle = activeSpotlightTheme
    ? ({
        ["--spotlight-a" as string]: activeSpotlightTheme.spotlightA,
        ["--spotlight-b" as string]: activeSpotlightTheme.spotlightB,
      } as CSSProperties)
    : undefined;

  const renderPlaylistCard = (pl: StreamPlaylistListItem, j: number) => {
    const grad = PROGRAM_CARD_BACKGROUNDS[j % PROGRAM_CARD_BACKGROUNDS.length];
    const cardTitle = resolveProgramPlaylistTitle(pl);
    const cardSummary = resolveProgramPlaylistSummary(pl);
    const playlistThemeIdx = visiblePlaylists.findIndex((item) => item.id === pl.id);
    const themeIdx = playlistThemeIdx >= 0 ? playlistThemeIdx : j;
    const theme = PLAYLIST_CARD_THEMES[themeIdx % PLAYLIST_CARD_THEMES.length];
    const price = parseNumber(pl.price);
    const isSpotlight = highlightedPlaylistId === pl.id;
    const showIdleGlow = !spotlightActive;
    const spotlightStyle = isSpotlight
      ? ({
          ["--spotlight-a" as string]: theme.spotlightA,
          ["--spotlight-b" as string]: theme.spotlightB,
        } as CSSProperties)
      : undefined;
    return (
      <article
        id={`program-playlist-${pl.id}`}
        data-program-playlist-id={pl.id}
        data-globe-spotlight={isSpotlight ? "true" : undefined}
        key={`playlist-${pl.id}`}
        style={spotlightStyle}
        className={cn(
          "group/card relative flex min-h-[22rem] w-full flex-col text-left sm:min-h-[27rem]",
          "rounded-3xl border-2 scroll-mt-32 transition-shadow duration-500",
          isSpotlight ? "program-card-globe-spotlight-host" : "overflow-hidden",
          showIdleGlow && !isSpotlight && theme.dominantBorder,
          showIdleGlow && !isSpotlight && theme.glow
        )}
      >
        {isSpotlight ? (
          <>
            <span className="program-card-spotlight-field" style={spotlightStyle} aria-hidden />
            <span className={cn("program-card-spotlight-aura", theme.aura)} aria-hidden />
          </>
        ) : showIdleGlow ? (
          <>
            <span
              className={cn(
                "pointer-events-none absolute inset-[-22%] z-0 rounded-[2.2rem] blur-[38px]",
                theme.aura
              )}
              aria-hidden
            />
            <span
              className={cn(
                "pointer-events-none absolute left-[-40%] top-[8%] z-[1] h-[24%] w-[180%] -rotate-[28deg] bg-gradient-to-r opacity-85 mix-blend-screen blur-[10px]",
                theme.spark
              )}
              aria-hidden
            />
            <span
              className={cn(
                "pointer-events-none absolute right-[-28%] top-[58%] z-[1] h-[17%] w-[130%] -rotate-[24deg] bg-gradient-to-r opacity-70 mix-blend-screen blur-[12px]",
                theme.spark
              )}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute right-3 top-3 z-[2] h-10 w-10 rounded-full bg-white/45 blur-[14px] mix-blend-screen"
              aria-hidden
            />
            <span
              className={cn(
                "pointer-events-none absolute left-1/2 top-1/2 z-[1] aspect-square w-[185%] max-w-none -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r",
                theme.ring
              )}
              aria-hidden
            />
          </>
        ) : null}
        <span
          className={cn(
            "relative z-[2] m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-[#04060d] ring-1 ring-black/70",
            isSpotlight && "program-card-globe-spotlight border-2",
          )}
        >
          <div className="relative z-[3] flex h-full min-h-0 flex-col gap-2 p-3 sm:p-3.5">
            <div className="relative min-h-[12.5rem] overflow-hidden rounded-2xl border-2 border-white/20 sm:min-h-[17rem] sm:flex-1">
              <ProgramPlaylistCoverImage
                playlist={pl}
                gradClassName={grad}
                loading={j < 2 ? "eager" : "lazy"}
                fetchPriority={j < 2 ? "high" : "auto"}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45" />
            </div>
            <div className="absolute right-3 top-3 z-[4]">
              <span
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-emerald-300/50 bg-[#03140d]/95 px-2 py-0.5 tabular-nums text-[12px] font-black tracking-normal text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.28)] sm:px-3 sm:py-1 sm:text-[15px]"
                style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif", fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
              >
                {formatPrice(price)}
              </span>
            </div>
            <div
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border-2 px-2.5 py-2 sm:px-3 sm:py-2.5",
                theme.infoPanel,
                "bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
              )}
            >
              <div className={cn("line-clamp-2 text-left text-[clamp(10px,2.4vw,17px)] font-extrabold uppercase leading-snug tracking-[0.04em] sm:tracking-[0.07em]", theme.title)}>
                {cardTitle}
              </div>
              {cardSummary ? (
                <p className="mt-1.5 line-clamp-3 text-left text-[11px] font-medium leading-snug text-white/72 sm:text-[12px]">
                  {cardSummary}
                </p>
              ) : null}
              <div className="mt-2" />
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setDescriptionModalPlaylist(pl)}
                  className="min-w-0 rounded-xl border border-white/40 bg-black/55 px-1.5 py-1.5 text-[clamp(9px,2.3vw,11px)] font-black uppercase tracking-[0.09em] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#f5c814]/55 hover:text-[#ffe9a3] sm:px-2 sm:py-2 sm:tracking-[0.14em]"
                >
                  Details
                </button>
                <button
                  type="button"
                  disabled={pendingCheckoutPlaylistId === pl.id}
                  onClick={() => {
                    void (async () => {
                      if (pl.is_unlocked) {
                        router.push(`/dashboard?section=programs&playlist=${pl.id}`);
                        return;
                      }
                      if (!hasSimpleAuthSessionClient()) {
                        router.push(`/login?next=${encodeURIComponent(`/programs?program=${pl.id}#programs-library`)}`);
                        return;
                      }
                      setPendingCheckoutPlaylistId(pl.id);
                      setError(null);
                      try {
                        const payload = await createPlaylistCheckoutSession(pl.id, {
                          returnBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
                        });
                        const checkoutUrl =
                          typeof payload.checkout_url === "string" ? payload.checkout_url.trim() : "";
                        if (checkoutUrl) {
                          window.location.assign(checkoutUrl);
                          return;
                        }
                        if (payload.is_unlocked) {
                          router.push(`/dashboard?section=programs&playlist=${pl.id}`);
                          return;
                        }
                        router.push(`/login?next=${encodeURIComponent(`/programs?program=${pl.id}#programs-library`)}`);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Could not start checkout.");
                      } finally {
                        setPendingCheckoutPlaylistId((current) => (current === pl.id ? null : current));
                      }
                    })();
                  }}
                  className="min-w-0 rounded-xl border border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] px-1.5 py-1.5 text-[clamp(9px,2.3vw,11px)] font-black uppercase tracking-[0.09em] text-[#ffe9a3] shadow-[0_0_20px_rgba(202,167,36,0.6),inset_0_0_0_1px_rgba(202,167,36,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(202,167,36,0.9),0_0_52px_rgba(202,167,36,0.5),inset_0_0_0_1px_rgba(202,167,36,0.55)] sm:px-2 sm:py-2 sm:tracking-[0.15em]"
                >
                  {pendingCheckoutPlaylistId === pl.id
                    ? "Loading..."
                    : pl.is_unlocked
                      ? "Open Program"
                      : "Unlock"}
                </button>
              </div>
            </div>
          </div>
        </span>
      </article>
    );
  };

  return (
    <section
      className={cn(
        "relative space-y-5 overflow-visible rounded-3xl px-[clamp(0.65rem,2.8vw,1.75rem)] py-2 sm:px-4 sm:py-3",
        className,
      )}
      data-globe-spotlight-active={spotlightActive ? "true" : undefined}
      style={sectionSpotlightStyle}
    >
      <ProgramPlaylistDescriptionModal playlist={descriptionModalPlaylist} onClose={() => setDescriptionModalPlaylist(null)} />
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-[-8%] top-[12%] h-[250px] w-[250px] rounded-full bg-fuchsia-500/20 blur-[90px] sm:h-[380px] sm:w-[380px] sm:blur-[125px]" />
        <div className="absolute right-[-10%] top-[20%] h-[260px] w-[260px] rounded-full bg-cyan-400/18 blur-[95px] sm:h-[400px] sm:w-[400px] sm:blur-[130px]" />
        <div className="absolute left-1/2 top-[48%] h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-amber-300/14 blur-[90px] sm:h-[340px] sm:w-[340px] sm:blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[20%] h-[230px] w-[230px] rounded-full bg-violet-400/16 blur-[95px] sm:h-[360px] sm:w-[360px] sm:blur-[130px]" />
        <div className="absolute bottom-[-12%] right-[16%] h-[230px] w-[230px] rounded-full bg-sky-300/14 blur-[95px] sm:h-[350px] sm:w-[350px] sm:blur-[125px]" />
      </div>
      {error ? <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{error}</div> : null}
      {!error && visiblePlaylists.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[13px] text-white/70">No playlists are published yet.</div>
      ) : null}

      {visiblePlaylists.length > 0 ? (
        <>
          <div className="mx-auto w-full max-w-[1800px] overflow-visible xl:hidden">
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="text-center font-mono text-[12px] font-extrabold uppercase tracking-[0.16em] text-fuchsia-100 [text-shadow:0_0_10px_rgba(232,121,249,0.7)] sm:text-[13px]">
                {CATEGORY_LABELS.business_psychology}
              </div>
              <div className="text-center font-mono text-[12px] font-extrabold uppercase tracking-[0.16em] text-cyan-100 [text-shadow:0_0_10px_rgba(103,232,249,0.7)] sm:text-[13px]">
                {CATEGORY_LABELS.business_model}
              </div>
            </div>
            <div className="relative space-y-4 overflow-visible">
              <div
                className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f5c814]/90 to-transparent shadow-[0_0_10px_rgba(245,200,20,0.55)]"
                aria-hidden
              />
              {mobilePairedRows.map((row) => (
                <div key={`mobile-row-${row.idx}`} className="grid grid-cols-2 gap-3 overflow-visible sm:gap-4">
                  {row.psychology ? renderPlaylistCard(row.psychology, row.idx * 2) : <div aria-hidden />}
                  {row.model ? renderPlaylistCard(row.model, row.idx * 2 + 1) : <div aria-hidden />}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto hidden max-w-[1800px] grid-cols-1 gap-6 overflow-visible xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-start">
            <div className="space-y-3 overflow-visible">
              <div className="text-center font-mono text-[15px] font-extrabold uppercase tracking-[0.2em] text-fuchsia-100 [text-shadow:0_0_10px_rgba(232,121,249,0.7),0_0_26px_rgba(232,121,249,0.82)] sm:text-[17px]">
                {CATEGORY_LABELS.business_psychology}
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-300/90 to-transparent shadow-[0_0_14px_rgba(232,121,249,0.55)]" />
              <div className="grid grid-cols-1 gap-4 overflow-visible sm:grid-cols-2 sm:gap-5">
                {businessPsychologyPlaylists.map((pl, j) => renderPlaylistCard(pl, j))}
              </div>
            </div>

            <div className="relative h-5 w-full xl:h-full xl:w-4" aria-hidden>
              <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#f5c814] to-transparent shadow-[0_0_14px_rgba(245,200,20,0.9),0_0_34px_rgba(245,200,20,0.65)] xl:hidden" />
              <div className="absolute left-1/2 top-0 hidden h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f5c814] to-transparent shadow-[0_0_16px_rgba(245,200,20,0.95),0_0_40px_rgba(245,200,20,0.7)] xl:block" />
            </div>

            <div className="space-y-3 overflow-visible">
              <div className="text-center font-mono text-[15px] font-extrabold uppercase tracking-[0.2em] text-cyan-100 [text-shadow:0_0_10px_rgba(103,232,249,0.7),0_0_26px_rgba(103,232,249,0.82)] sm:text-[17px]">
                {CATEGORY_LABELS.business_model}
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_14px_rgba(103,232,249,0.55)]" />
              <div className="grid grid-cols-1 gap-4 overflow-visible sm:grid-cols-2 sm:gap-5">
                {businessModelPlaylists.map((pl, j) => renderPlaylistCard(pl, j + businessPsychologyPlaylists.length))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
