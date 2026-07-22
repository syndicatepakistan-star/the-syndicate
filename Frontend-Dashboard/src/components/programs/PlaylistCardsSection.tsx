"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  confirmPlaylistCheckoutSuccess,
  fetchPublicStreamPlaylists,
  fetchStreamPlaylists,
  type StreamPlaylistListItem,
} from "@/lib/streaming-api";
import { focusProgramCardWithRetries, scrollProgramCardIntoView } from "@/lib/programCardScroll";
import {
  fillMissingPublicProgramPlaylists,
  normalizeLevel1ProgramPlaylists,
  resolveProgramPlaylistHighlightId,
  resolveProgramPlaylistThumbnail,
  resolveProgramPlaylistTitle,
} from "@/lib/programPlaylistCatalog";
import {
  PUBLIC_BUSINESS_MODEL_SLUG_ORDER,
  PUBLIC_LEVEL1_PLAYLIST_SLUGS,
  PUBLIC_PSYCHOLOGY_SLUG_ORDER,
} from "@/lib/level1ProgramCatalog";
import {
  programPlaylistDeepLink,
  programSlugDeepLink,
  isBusinessWarfareProgram,
  readProgramDetailsHash,
  writeProgramDetailsHash,
  clearProgramDetailsHash,
} from "@/lib/programPlaylistThumbnails";
import { PLAYLIST_CATEGORY_HEADING_CLASS, STREAM_PLAYLIST_CATEGORY_HEADING_LINES } from "@/lib/streamPlaylistCategoryLabels";
import { ProgramPlaylistCoverImage } from "@/components/programs/ProgramPlaylistCoverImage";
import { Level1CategoryUnlockAllButton } from "@/components/programs/Level1CategoryUnlockAllButton";
import { categoryPlaylistsFullyUnlocked } from "@/lib/level1CategoryPacks";
import {
  PROGRAM_CARD_FRAME,
  PROGRAM_CARD_INFO_INSET,
  PROGRAM_CARD_INFO_PANEL,
  PROGRAM_CARD_INNER_SHELL,
  PROGRAM_CARD_LANDSCAPE_MEDIA,
  PROGRAM_CARD_LANDSCAPE_MEDIA_OVERLAY,
  PROGRAM_CARD_MOBILE_ACTIONS_FACE,
  PROGRAM_CARD_MOBILE_INFO_FACE,
  PROGRAM_CARD_MOBILE_PRICE_BADGE_FACE,
  PROGRAM_CARD_MOBILE_TITLE_FACE,
  PROGRAM_CARD_TITLE_SLOT,
  PROGRAM_CARD_STATS_SLOT,
} from "@/components/programs/programCardMedia";
import { ProgramCardStatsLines } from "@/components/programs/ProgramCardStatsLines";
import { streamPlaylistCardStats } from "@/components/programs/vaultProgramCardStats";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { useCurrency } from "@/contexts/CurrencyContext";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";
import { ProgramPlaylistDescriptionModal } from "@/components/programs/ProgramPlaylistDescriptionModal";
import { useUnlockCartOptional } from "@/components/programs/UnlockCartContext";
import {
  cartItemKey,
  isPlaylistUnlockCartEligible,
  playlistToCartItem,
} from "@/lib/unlockCart";
import toast from "react-hot-toast";

function playlistProgramsReturnHref(pl: StreamPlaylistListItem): string {
  const slug = pl.slug?.trim();
  if (slug && PUBLIC_LEVEL1_PLAYLIST_SLUGS.has(slug)) {
    return programSlugDeepLink(slug);
  }
  return programPlaylistDeepLink(pl.id);
}

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

function sortPlaylistsBySlugOrder(
  playlists: StreamPlaylistListItem[],
  order: readonly string[],
): StreamPlaylistListItem[] {
  const rank = new Map(order.map((slug, index) => [slug, index]));
  return [...playlists].sort((a, b) => {
    const aRank = rank.get(a.slug?.trim().toLowerCase() ?? "") ?? 999;
    const bRank = rank.get(b.slug?.trim().toLowerCase() ?? "") ?? 999;
    return aRank - bRank;
  });
}

export function PlaylistCardsSection({
  title = "Programs",
  subtitle = "All playlists added from admin are shown here. Open dashboard to continue learning.",
  className,
  highlightPlaylistId,
}: Props) {
  const { formatPrice: formatLocalizedPrice } = useCurrency();
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
  const [playlists, setPlaylists] = useState<StreamPlaylistListItem[]>(() =>
    fillMissingPublicProgramPlaylists(readInitialPlaylistsFromSession())
  );
  const [error, setError] = useState<string | null>(null);
  const [descriptionModalPlaylist, setDescriptionModalPlaylist] = useState<StreamPlaylistListItem | null>(null);
  const [highlightedPlaylistId, setHighlightedPlaylistId] = useState<number | null>(null);
  const unlockCart = useUnlockCartOptional();
  const highlightHandledRef = useRef(false);
  const detailsOpenedFromHashRef = useRef(false);
  const pendingDetailsHashRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const authed = hasSimpleAuthSessionClient();
        const list = authed
          ? await fetchStreamPlaylists({ allowPublicFallback: true, forceRefresh: true })
          : await fetchPublicStreamPlaylists();
        if (!cancelled) {
          setPlaylists(fillMissingPublicProgramPlaylists(Array.isArray(list) ? list : []));
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
        setPlaylists(fillMissingPublicProgramPlaylists(Array.isArray(list) ? list : []));
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
    () => normalizeLevel1ProgramPlaylists(playlists),
    [playlists],
  );
  const businessPsychologyPlaylists = useMemo(
    () =>
      sortPlaylistsBySlugOrder(
        visiblePlaylists.filter((pl) => pl.category !== "business_model"),
        PUBLIC_PSYCHOLOGY_SLUG_ORDER,
      ),
    [visiblePlaylists],
  );
  const businessModelPlaylists = useMemo(
    () =>
      sortPlaylistsBySlugOrder(
        visiblePlaylists.filter((pl) => pl.category === "business_model"),
        PUBLIC_BUSINESS_MODEL_SLUG_ORDER,
      ),
    [visiblePlaylists],
  );
  const mobilePairedRows = useMemo(() => {
    const maxLen = Math.max(businessPsychologyPlaylists.length, businessModelPlaylists.length);
    return Array.from({ length: maxLen }, (_, idx) => ({
      psychology: businessPsychologyPlaylists[idx] ?? null,
      model: businessModelPlaylists[idx] ?? null,
      idx,
    }));
  }, [businessPsychologyPlaylists, businessModelPlaylists]);

  const psychologyPackUnlocked = useMemo(
    () => categoryPlaylistsFullyUnlocked(visiblePlaylists, "business_psychology"),
    [visiblePlaylists],
  );
  const modelsPackUnlocked = useMemo(
    () => categoryPlaylistsFullyUnlocked(visiblePlaylists, "business_model"),
    [visiblePlaylists],
  );

  useEffect(() => {
    highlightHandledRef.current = false;
    detailsOpenedFromHashRef.current = false;
  }, [highlightPlaylistId]);

  const openBusinessWarfareDetailsFromHash = useCallback(() => {
    if (!readProgramDetailsHash() || !visiblePlaylists.length) return false;
    const fromHighlight =
      highlightPlaylistId != null
        ? resolveProgramPlaylistHighlightId(playlists, highlightPlaylistId) ?? highlightPlaylistId
        : null;
    const target =
      visiblePlaylists.find(
        (pl) =>
          isBusinessWarfareProgram({ id: pl.id, slug: pl.slug, title: pl.title }) &&
          (fromHighlight == null || pl.id === fromHighlight),
      ) ??
      visiblePlaylists.find((pl) =>
        isBusinessWarfareProgram({ id: pl.id, slug: pl.slug, title: pl.title }),
      );
    if (!target) return false;
    detailsOpenedFromHashRef.current = true;
    pendingDetailsHashRef.current = false;
    setHighlightedPlaylistId(null);
    // Force remount so re-entering the same `#details` URL always reopens the modal.
    setDescriptionModalPlaylist(null);
    window.requestAnimationFrame(() => {
      setDescriptionModalPlaylist(target);
    });
    return true;
  }, [visiblePlaylists, playlists, highlightPlaylistId]);

  useLayoutEffect(() => {
    if (!highlightPlaylistId || !visiblePlaylists.length) return;
    const resolved =
      resolveProgramPlaylistHighlightId(playlists, highlightPlaylistId) ?? highlightPlaylistId;
    const target = visiblePlaylists.find((pl) => pl.id === resolved);
    if (!target) return;

    if (readProgramDetailsHash() && isBusinessWarfareProgram({ id: target.id, slug: target.slug, title: target.title })) {
      highlightHandledRef.current = true;
      openBusinessWarfareDetailsFromHash();
      return;
    }

    if (highlightHandledRef.current) return;
    highlightHandledRef.current = true;

    // One instant center + glow in the same layout pass (no delayed re-scrolls).
    const hit = () => {
      if (scrollProgramCardIntoView(target.id, { behavior: "auto" })) {
        setHighlightedPlaylistId(target.id);
        return true;
      }
      return false;
    };

    if (hit()) {
      const clearHighlight = window.setTimeout(() => setHighlightedPlaylistId(null), 22000);
      return () => window.clearTimeout(clearHighlight);
    }

    const cancelScroll = focusProgramCardWithRetries(
      target.id,
      () => setHighlightedPlaylistId(target.id),
      { behavior: "auto", delays: [50, 150, 350, 700] },
    );
    const clearHighlight = window.setTimeout(() => setHighlightedPlaylistId(null), 22000);
    return () => {
      cancelScroll();
      window.clearTimeout(clearHighlight);
    };
  }, [highlightPlaylistId, visiblePlaylists, playlists, openBusinessWarfareDetailsFromHash]);

  // Retry `#details` once playlists are ready, and on every hash re-entry / address-bar navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      // ignore
    }

    const syncFromHash = () => {
      if (!readProgramDetailsHash()) {
        pendingDetailsHashRef.current = false;
        return;
      }
      pendingDetailsHashRef.current = true;
      detailsOpenedFromHashRef.current = false;
      highlightHandledRef.current = false;
      openBusinessWarfareDetailsFromHash();
    };

    if (readProgramDetailsHash() || pendingDetailsHashRef.current) {
      openBusinessWarfareDetailsFromHash();
    }

    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    window.addEventListener("pageshow", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
      window.removeEventListener("pageshow", syncFromHash);
    };
  }, [openBusinessWarfareDetailsFromHash, visiblePlaylists.length]);

  const spotlightClearTimerRef = useRef<number | null>(null);

  const applyProgramSpotlight = useCallback((programId: number) => {
    if (spotlightClearTimerRef.current != null) {
      window.clearTimeout(spotlightClearTimerRef.current);
      spotlightClearTimerRef.current = null;
    }
    const run = () => {
      scrollProgramCardIntoView(programId, { behavior: "auto" });
      setHighlightedPlaylistId(programId);
      spotlightClearTimerRef.current = window.setTimeout(() => {
        setHighlightedPlaylistId(null);
        spotlightClearTimerRef.current = null;
      }, 22000);
    };
    // After modal unmount / scroll-lock release, center + glow.
    window.requestAnimationFrame(() => {
      run();
      window.setTimeout(run, 40);
    });
  }, []);

  const openProgramDetails = (pl: StreamPlaylistListItem) => {
    setDescriptionModalPlaylist(pl);
    if (isBusinessWarfareProgram({ id: pl.id, slug: pl.slug, title: pl.title })) {
      writeProgramDetailsHash();
    }
  };

  const closeDescriptionModal = () => {
    const pl = descriptionModalPlaylist;
    const spotlightAfterClose =
      !!pl && isBusinessWarfareProgram({ id: pl.id, slug: pl.slug, title: pl.title });
    setDescriptionModalPlaylist(null);
    detailsOpenedFromHashRef.current = false;
    pendingDetailsHashRef.current = false;
    clearProgramDetailsHash();
    if (spotlightAfterClose && pl) {
      highlightHandledRef.current = true;
      applyProgramSpotlight(pl.id);
    }
  };

  const spotlightActive = highlightedPlaylistId != null;

  useEffect(() => {
    if (!spotlightActive) return;
    document.body.classList.add("globe-program-spotlight");
    return () => document.body.classList.remove("globe-program-spotlight");
  }, [spotlightActive]);

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

  const requestPlaylistUnlock = (pl: StreamPlaylistListItem, cardTitle: string) => {
    if (pl.is_unlocked) {
      router.push(`/dashboard/programs?playlist=${pl.id}`);
      return;
    }
    if (pl.is_coming_soon) return;
    if (unlockCart && isPlaylistUnlockCartEligible(pl)) {
      const thumb = resolveProgramPlaylistThumbnail(pl, null) || pl.cover_image_url || undefined;
      const added = unlockCart.addPlaylist(pl, cardTitle, thumb || undefined);
      if (added) {
        toast.success(`Added to unlock bucket — ${cardTitle}`, { duration: 2800 });
      } else {
        toast(`Already in unlock bucket — ${cardTitle}`, { duration: 2200 });
        unlockCart.setPanelExpanded(true);
      }
      return;
    }
    setError("This program cannot be added to the unlock bucket right now.");
  };

  const descriptionUnlockLabel = (() => {
    const pl = descriptionModalPlaylist;
    if (!pl) return "Unlock";
    if (pl.is_coming_soon) return "Coming Soon";
    if (pl.is_unlocked) return "Open Program";
    const title = resolveProgramPlaylistTitle(pl);
    if (unlockCart?.isInCartKey(cartItemKey(playlistToCartItem(pl, title)))) return "In bucket";
    return "Unlock";
  })();

  const descriptionPriceLabel = descriptionModalPlaylist
    ? formatLocalizedPrice(parseNumber(descriptionModalPlaylist.price))
    : null;

  const descriptionRestoreScroll = !(
    descriptionModalPlaylist &&
    isBusinessWarfareProgram({
      id: descriptionModalPlaylist.id,
      slug: descriptionModalPlaylist.slug,
      title: descriptionModalPlaylist.title,
    })
  );

  const renderPlaylistCard = (pl: StreamPlaylistListItem, j: number) => {
    const grad = PROGRAM_CARD_BACKGROUNDS[j % PROGRAM_CARD_BACKGROUNDS.length];
    const cardTitle = resolveProgramPlaylistTitle(pl);
    const playlistThemeIdx = visiblePlaylists.findIndex((item) => item.id === pl.id);
    const themeIdx = playlistThemeIdx >= 0 ? playlistThemeIdx : j;
    const theme = PLAYLIST_CARD_THEMES[themeIdx % PLAYLIST_CARD_THEMES.length];
    const price = parseNumber(pl.price);
    const isSpotlight = highlightedPlaylistId === pl.id;
    const comingSoon = !!pl.is_coming_soon;
    const inCart = unlockCart?.isInCartKey(cartItemKey(playlistToCartItem(pl, cardTitle))) ?? false;
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
          "program-playlist-card group/card relative flex h-full min-h-0 w-full flex-col text-left max-lg:min-h-0 max-lg:rounded-[0.85rem] lg:min-h-[16.5rem]",
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
            PROGRAM_CARD_FRAME,
            "z-[2] h-full",
            isSpotlight && "program-card-globe-spotlight border-2",
          )}
        >
          <div className={cn(PROGRAM_CARD_INNER_SHELL, "h-full")}>
            <div className={PROGRAM_CARD_LANDSCAPE_MEDIA}>
              <ProgramPlaylistCoverImage
                playlist={pl}
                gradClassName={grad}
                loading={j < 2 ? "eager" : "lazy"}
                fetchPriority={j < 2 ? "high" : "auto"}
                objectFit="cover"
              />
              {comingSoon ? (
                <span className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-3 text-center">
                  <span className="rounded-xl border border-amber-300/60 bg-black/80 px-4 py-2 text-[clamp(1rem,3.8vw,1.35rem)] font-black uppercase tracking-[0.14em] text-[#f5c814] sm:text-[1.15rem]">
                    Coming Soon
                  </span>
                </span>
              ) : null}
              <div className={PROGRAM_CARD_LANDSCAPE_MEDIA_OVERLAY} />
              <div className={cn("program-playlist-card__price-badge absolute right-2 top-2 z-[6] sm:right-2.5 sm:top-2.5", PROGRAM_CARD_MOBILE_PRICE_BADGE_FACE)}>
                <span
                  className="program-playlist-card__pack-price-badge shrink-0 border border-emerald-300/50 bg-[#03140d]/95 tabular-nums text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.28)]"
                  style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
                >
                  <span className="program-playlist-card__pack-price-badge__amount">{formatLocalizedPrice(price)}</span>
                  <span className="program-playlist-card__pack-price-badge__suffix text-emerald-200/80">lifetime</span>
                </span>
              </div>
            </div>
            <div
              className={cn(
                PROGRAM_CARD_INFO_INSET,
                PROGRAM_CARD_INFO_PANEL,
                PROGRAM_CARD_MOBILE_INFO_FACE,
                "rounded-xl border-2 px-2.5 py-2 max-lg:px-1 max-lg:py-1.5 sm:px-3 sm:py-2.5",
                theme.infoPanel,
                "bg-[#04060d] shadow-[0_10px_30px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.12)]"
              )}
            >
              <div
                className={cn(
                  "text-left text-[clamp(13px,3.4vw,18px)] font-extrabold uppercase leading-snug tracking-[0.04em] sm:text-[clamp(14px,2.2vw,17px)] sm:tracking-[0.07em]",
                  PROGRAM_CARD_MOBILE_TITLE_FACE,
                  PROGRAM_CARD_TITLE_SLOT,
                  theme.title,
                )}
              >
                {cardTitle}
              </div>
              {!comingSoon ? (
                <div className={PROGRAM_CARD_STATS_SLOT}>
                  <ProgramCardStatsLines
                    stats={streamPlaylistCardStats(pl.video_count, { slug: pl.slug, title: pl.title })}
                    size="stream"
                    denseMobile
                    className="max-xl:mt-0.5"
                  />
                </div>
              ) : (
                <div className={PROGRAM_CARD_STATS_SLOT} aria-hidden />
              )}
              <div className={cn("mt-auto grid grid-cols-2 gap-1.5 sm:gap-2", PROGRAM_CARD_MOBILE_ACTIONS_FACE)}>
                <button
                  type="button"
                  onClick={() => openProgramDetails(pl)}
                  className="min-w-0 rounded-xl border border-white/40 bg-black/55 px-1.5 py-1.5 text-[clamp(9px,2.3vw,11px)] font-black uppercase tracking-[0.09em] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#f5c814]/55 hover:text-[#ffe9a3] sm:px-2 sm:py-2 sm:tracking-[0.14em]"
                >
                  Details
                </button>
                <button
                  type="button"
                  disabled={comingSoon}
                  onClick={() => {
                    if (comingSoon) return;
                    requestPlaylistUnlock(pl, cardTitle);
                  }}
                  className={cn(
                    "min-w-0 rounded-xl border border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] px-1.5 py-1.5 text-[clamp(9px,2.3vw,11px)] font-black uppercase tracking-[0.09em] text-[#ffe9a3] shadow-[0_0_20px_rgba(202,167,36,0.6),inset_0_0_0_1px_rgba(202,167,36,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(202,167,36,0.9),0_0_52px_rgba(202,167,36,0.5),inset_0_0_0_1px_rgba(202,167,36,0.55)] sm:px-2 sm:py-2 sm:tracking-[0.15em]",
                    comingSoon && "cursor-not-allowed opacity-60 hover:scale-100",
                    inCart && "border-cyan-300/70 text-cyan-100",
                  )}
                >
                  {comingSoon
                    ? "Coming Soon"
                    : pl.is_unlocked
                      ? "Open Program"
                      : inCart
                        ? "In bucket"
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
        "program-playlist-library-band relative space-y-5 overflow-visible rounded-3xl px-[clamp(0.65rem,2.8vw,1.75rem)] py-2 max-lg:rounded-none max-lg:px-1.5 max-lg:py-1 sm:px-4 sm:py-3",
        className,
      )}
      data-globe-spotlight-active={spotlightActive ? "true" : undefined}
      style={sectionSpotlightStyle}
    >
      <ProgramPlaylistDescriptionModal
        playlist={descriptionModalPlaylist}
        onClose={closeDescriptionModal}
        priceLabel={descriptionPriceLabel}
        restoreScrollOnClose={descriptionRestoreScroll}
        onUnlock={
          descriptionModalPlaylist
            ? () => {
                const pl = descriptionModalPlaylist;
                const title = resolveProgramPlaylistTitle(pl);
                closeDescriptionModal();
                requestPlaylistUnlock(pl, title);
              }
            : undefined
        }
        unlockLabel={descriptionUnlockLabel}
        unlockDisabled={!!descriptionModalPlaylist?.is_coming_soon}
      />
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
            <div className="mb-3 grid grid-cols-2 items-start gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <div className={PLAYLIST_CATEGORY_HEADING_CLASS.splitHeadingSlot}>
                  <div
                    className={cn(
                      PLAYLIST_CATEGORY_HEADING_CLASS.psychology,
                      PLAYLIST_CATEGORY_HEADING_CLASS.splitSize,
                      "text-balance"
                    )}
                  >
                    <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineStack}>
                      <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineLead}>
                        {STREAM_PLAYLIST_CATEGORY_HEADING_LINES.business_psychology[0]}
                      </span>
                      <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineTail}>
                        {STREAM_PLAYLIST_CATEGORY_HEADING_LINES.business_psychology[1]}
                      </span>
                    </span>
                  </div>
                </div>
                {businessPsychologyPlaylists.length > 0 ? (
                  <Level1CategoryUnlockAllButton
                    category="business_psychology"
                    compact
                    alreadyUnlocked={psychologyPackUnlocked}
                    postAuthNext="/programs"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <div className={PLAYLIST_CATEGORY_HEADING_CLASS.splitHeadingSlot}>
                  <div
                    className={cn(
                      PLAYLIST_CATEGORY_HEADING_CLASS.businessModels,
                      PLAYLIST_CATEGORY_HEADING_CLASS.splitSize,
                      "text-balance"
                    )}
                  >
                    <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineStack}>
                      <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineLead}>
                        {STREAM_PLAYLIST_CATEGORY_HEADING_LINES.business_model[0]}
                      </span>
                      <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineTail}>
                        {STREAM_PLAYLIST_CATEGORY_HEADING_LINES.business_model[1]}
                      </span>
                    </span>
                  </div>
                </div>
                {businessModelPlaylists.length > 0 ? (
                  <Level1CategoryUnlockAllButton
                    category="business_model"
                    compact
                    alreadyUnlocked={modelsPackUnlocked}
                    postAuthNext="/programs"
                  />
                ) : null}
              </div>
            </div>
            <div className="relative space-y-4 overflow-visible">
              <div
                className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f5c814]/90 to-transparent shadow-[0_0_10px_rgba(245,200,20,0.55)]"
                aria-hidden
              />
              {mobilePairedRows.map((row) => (
                <div key={`mobile-row-${row.idx}`} className="program-playlist-mobile-grid grid grid-cols-2 items-stretch justify-items-stretch gap-2 overflow-visible max-lg:gap-1.5 sm:gap-4">
                  <div className="flex min-h-0 min-w-0 h-full w-full">{row.psychology ? renderPlaylistCard(row.psychology, row.idx * 2) : <div aria-hidden className="h-full w-full" />}</div>
                  <div className="flex min-h-0 min-w-0 h-full w-full">{row.model ? renderPlaylistCard(row.model, row.idx * 2 + 1) : <div aria-hidden className="h-full w-full" />}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto hidden max-w-[1800px] grid-cols-1 gap-6 overflow-visible xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-stretch">
            <div className="flex flex-col gap-3 overflow-visible">
              <div className={PLAYLIST_CATEGORY_HEADING_CLASS.columnHeadingSlot}>
                <div
                  className={cn(
                    PLAYLIST_CATEGORY_HEADING_CLASS.psychology,
                    PLAYLIST_CATEGORY_HEADING_CLASS.columnSize,
                    "text-balance"
                  )}
                >
                  <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineStack}>
                    <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineLead}>
                      {STREAM_PLAYLIST_CATEGORY_HEADING_LINES.business_psychology[0]}
                    </span>
                    <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineTail}>
                      {STREAM_PLAYLIST_CATEGORY_HEADING_LINES.business_psychology[1]}
                    </span>
                  </span>
                </div>
              </div>
              <Level1CategoryUnlockAllButton
                category="business_psychology"
                alreadyUnlocked={psychologyPackUnlocked}
                postAuthNext="/programs"
              />
              <div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-300/90 to-transparent shadow-[0_0_14px_rgba(232,121,249,0.55)]" />
              <div className="grid grid-cols-1 items-stretch gap-4 overflow-visible min-[560px]:grid-cols-2 min-[560px]:gap-5">
                {businessPsychologyPlaylists.map((pl, j) => (
                  <div key={`psychology-slot-${pl.id}`} className="flex min-h-0 min-w-0 h-full w-full">
                    {renderPlaylistCard(pl, j)}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-5 w-full xl:h-full xl:w-4" aria-hidden>
              <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#f5c814] to-transparent shadow-[0_0_14px_rgba(245,200,20,0.9),0_0_34px_rgba(245,200,20,0.65)] xl:hidden" />
              <div className="absolute left-1/2 top-0 hidden h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f5c814] to-transparent shadow-[0_0_16px_rgba(245,200,20,0.95),0_0_40px_rgba(245,200,20,0.7)] xl:block" />
            </div>

            <div className="flex flex-col gap-3 overflow-visible">
              <div className={PLAYLIST_CATEGORY_HEADING_CLASS.columnHeadingSlot}>
                <div
                  className={cn(
                    PLAYLIST_CATEGORY_HEADING_CLASS.businessModels,
                    PLAYLIST_CATEGORY_HEADING_CLASS.columnSize,
                    "text-balance"
                  )}
                >
                  <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineStack}>
                    <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineLead}>
                      {STREAM_PLAYLIST_CATEGORY_HEADING_LINES.business_model[0]}
                    </span>
                    <span className={PLAYLIST_CATEGORY_HEADING_CLASS.twoLineTail}>
                      {STREAM_PLAYLIST_CATEGORY_HEADING_LINES.business_model[1]}
                    </span>
                  </span>
                </div>
              </div>
              <Level1CategoryUnlockAllButton
                category="business_model"
                alreadyUnlocked={modelsPackUnlocked}
                postAuthNext="/programs"
              />
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_14px_rgba(103,232,249,0.55)]" />
              <div className="grid grid-cols-1 items-stretch gap-4 overflow-visible min-[560px]:grid-cols-2 min-[560px]:gap-5 playlist-business-models-cards">
                {businessModelPlaylists.map((pl, j) => (
                  <div key={`models-slot-${pl.id}`} className="flex min-h-0 min-w-0 h-full w-full">
                    {renderPlaylistCard(pl, j + businessPsychologyPlaylists.length)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
