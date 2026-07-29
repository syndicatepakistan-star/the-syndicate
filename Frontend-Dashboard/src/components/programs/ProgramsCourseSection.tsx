"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, Lock } from "lucide-react";
import toast from "react-hot-toast";
import type { ChromaItem } from "@/components/ChromaGrid";
import {
  ProgramPlaylistDescriptionModal,
  PROGRAM_DETAIL_TRIGGER_ATTR,
} from "@/components/programs/ProgramPlaylistDescriptionModal";
import { planOfferByKey, type CheckoutOfferKey, type PlanOfferKey } from "@/components/programs/planOfferCatalog";
import { isVaultCourseSlug, isVaultPackKey, vaultCourseBySlug } from "@/components/programs/vaultPackCatalog";
import { hasMoneyMasteryAccess } from "@/components/programs/vaultUnlock";
import { navigateToAlreadyUnlockedProgram } from "@/lib/programUnlockFlow";
import { markDashboardCheckoutReturn, resetProgramsInnerScrollOnly } from "@/lib/dashboardShellScroll";
import { cn, DASHBOARD_HEADING_LIGHTNING } from "@/components/dashboard/dashboardPrimitives";
import { fetchCoursesList, resolveDjangoMediaUrl, type CourseDto } from "@/lib/courses-api";
import {
  normalizeLevel1ProgramPlaylists,
  ownedVaultSubmodulePlaylistsForDashboard,
  resolveProgramPlaylistDescription,
  resolveProgramPlaylistHighlightId,
  resolveProgramPlaylistHighlightSlug,
  resolveProgramPlaylistTitle,
} from "@/lib/programPlaylistCatalog";
import { historyReplaceUrl } from "@/lib/historyUrl";
import {
  PUBLIC_BUSINESS_MODEL_SLUG_ORDER,
  PUBLIC_PSYCHOLOGY_SLUG_ORDER,
  LEVEL1_CANONICAL_TITLES,
} from "@/lib/level1ProgramCatalog";
import { GLOBE_PACK_KEYS, supportsProgramHashDeepLink, isHiddenProgramPlaylist, readProgramDetailsHash, writeProgramDetailsHash, clearProgramDetailsHash, parsePackDeepLinkSlug, type GlobePackKey } from "@/lib/programPlaylistThumbnails";
import { ProgramPlaylistCoverImage } from "@/components/programs/ProgramPlaylistCoverImage";
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
import {
  clearUnlockCelebrationStorage,
  consumePendingDashboardProgramOpen,
  DASHBOARD_OPEN_COURSE_EVENT,
  DASHBOARD_OPEN_PLAYLIST_EVENT,
  readDashboardProgramDeepLink,
  resolvePlaylistIdForPlan,
} from "@/lib/programUnlockFlow";
import { clearVaultPlaylistMapCache } from "@/lib/vaultPlaylistMap";
import { fetchPortalIdentity, hasSimpleAuthSessionClient } from "@/lib/portal-api";
import { buildPlaylistCheckoutAuthHref, startPlanCheckout } from "@/lib/plan-checkout";
import { createPlaylistCheckoutSession, fetchStreamPlaylists, clearStreamPlaylistsCache, prefetchStreamPlaylistExperience, purgeExpiredStreamPlaybackCache, type StreamPlaylistListItem } from "@/lib/streaming-api";
import { focusProgramCardWithRetries, scrollProgramCardIntoView } from "@/lib/programCardScroll";
import { STREAM_PLAYLIST_CATEGORY_LABELS, PLAYLIST_CATEGORY_HEADING_CLASS, STREAM_PLAYLIST_CATEGORY_HEADING_LINES } from "@/lib/streamPlaylistCategoryLabels";
import { Level1CategoryUnlockAllButton } from "@/components/programs/Level1CategoryUnlockAllButton";
import { categoryPlaylistsFullyUnlocked } from "@/lib/level1CategoryPacks";
import { registerDashboardTabResumeTask } from "@/lib/dashboardTabResume";
import { useCurrency } from "@/contexts/CurrencyContext";

const lessonPanelFallback = (
  <div className="min-h-[12rem] w-full animate-pulse rounded-xl bg-white/5" aria-hidden />
);

const CourseVideoPlaylist = dynamic(
  () => import("@/components/programs/CourseVideoPlaylist").then((m) => m.CourseVideoPlaylist),
  { ssr: false, loading: () => lessonPanelFallback },
);

const StreamPlaylistProgramPanel = dynamic(
  () =>
    import("@/components/programs/StreamPlaylistProgramPanel").then(
      (m) => m.StreamPlaylistProgramPanel,
    ),
  { ssr: false, loading: () => lessonPanelFallback },
);

const PublicPlanOfferCards = dynamic(
  () =>
    import("@/components/programs/PublicPlanOfferCards").then((m) => m.PublicPlanOfferCards),
  {
    ssr: false,
    loading: () => <div className="min-h-[20rem] w-full animate-pulse rounded-xl bg-white/5" aria-hidden />,
  },
);

const PublicGoalPathSection = dynamic(
  () =>
    import("@/components/programs/PublicGoalPathSection").then((m) => m.PublicGoalPathSection),
  {
    ssr: false,
    loading: () => <div className="min-h-[16rem] w-full animate-pulse rounded-xl bg-white/5" aria-hidden />,
  },
);

const ChromaGrid = dynamic(() => import("@/components/ChromaGrid"), {
  ssr: false,
  loading: () => <div className="min-h-[280px] w-full animate-pulse rounded-xl bg-white/5" aria-hidden />,
});

function coursesListErrorMessage(status: number, data: unknown): string {
  if (typeof data === "object" && data && "detail" in data) {
    return String((data as { detail?: string }).detail ?? "Request failed.");
  }
  if (status === 401) return "Sign in to load secure programs and playlists.";
  return `Could not load courses (${status}).`;
}

/** Visual accents for program cards (bottom gradient). */
const PROGRAM_CARD_BACKGROUNDS: readonly string[] = [
  "from-amber-600/85 via-orange-900/50 to-black",
  "from-rose-600/85 via-red-950/55 to-black",
  "from-violet-600/85 via-purple-950/50 to-black",
  "from-emerald-600/80 via-teal-950/50 to-black",
  "from-sky-600/85 via-blue-950/50 to-black",
  "from-fuchsia-600/80 via-pink-950/45 to-black",
];

const COURSE_CARD_THEMES = [
  {
    ring: "from-cyan-400/95 via-sky-400/95 to-cyan-300/95",
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(34,211,238,0.4),0_0_42px_rgba(34,211,238,0.3)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(125,211,252,0.82),0_0_96px_rgba(34,211,238,0.62)]",
    title: "text-cyan-200",
    chip: "border-cyan-300/60 bg-cyan-500/15 text-cyan-100",
    body: "border-cyan-300/45 bg-cyan-950/30",
  },
  {
    ring: "from-lime-400/95 via-emerald-400/95 to-green-300/95",
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(74,222,128,0.4),0_0_42px_rgba(74,222,128,0.28)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(134,239,172,0.82),0_0_96px_rgba(74,222,128,0.6)]",
    title: "text-lime-200",
    chip: "border-lime-300/60 bg-lime-500/15 text-lime-100",
    body: "border-lime-300/45 bg-emerald-950/30",
  },
  {
    ring: "from-fuchsia-400/95 via-violet-400/95 to-purple-300/95",
    glow: "shadow-[0_10px_34px_rgba(0,0,0,0.5),0_0_0_1px_rgba(217,70,239,0.4),0_0_42px_rgba(217,70,239,0.28)]",
    hoverGlow: "hover:shadow-[0_18px_56px_rgba(0,0,0,0.58),0_0_0_1px_rgba(232,121,249,0.82),0_0_96px_rgba(217,70,239,0.6)]",
    title: "text-fuchsia-200",
    chip: "border-fuchsia-300/60 bg-fuchsia-500/15 text-fuchsia-100",
    body: "border-fuchsia-300/45 bg-fuchsia-950/30",
  },
] as const;

const PLAYLIST_CARD_THEMES = [
  {
    spotlightA: "217,70,239",
    spotlightB: "139,92,246",
    aura: "bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.42)_0%,rgba(139,92,246,0.28)_35%,rgba(0,0,0,0)_75%)]",
    glow: "shadow-[0_4px_16px_rgba(0,0,0,0.45)]",
    hoverGlow: "hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)]",
    ring: "from-violet-300/95 via-purple-400/95 to-fuchsia-300/95",
    title: "text-white",
    panel: "border-violet-300/45 bg-violet-950/30",
    mediaBorder: "border-fuchsia-300/35",
    categoryChip: "border-fuchsia-300/35 bg-fuchsia-500/18 text-fuchsia-200",
    starColor: "text-fuchsia-300",
    infoPanel: "border-fuchsia-300/35 bg-fuchsia-950/28",
    priceColor: "text-fuchsia-300",
    priceGlow: "",
    dominantBorder: "border-fuchsia-300/60",
  },
  {
    spotlightA: "34,211,238",
    spotlightB: "14,165,233",
    aura: "bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.4)_0%,rgba(14,165,233,0.28)_35%,rgba(0,0,0,0)_75%)]",
    glow: "shadow-[0_4px_16px_rgba(0,0,0,0.45)]",
    hoverGlow: "hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)]",
    ring: "from-cyan-300/95 via-sky-400/95 to-blue-300/95",
    title: "text-white",
    panel: "border-cyan-300/45 bg-cyan-950/30",
    mediaBorder: "border-cyan-300/35",
    categoryChip: "border-cyan-300/35 bg-cyan-500/18 text-cyan-200",
    starColor: "text-cyan-300",
    infoPanel: "border-cyan-300/35 bg-cyan-950/28",
    priceColor: "text-cyan-300",
    priceGlow: "",
    dominantBorder: "border-cyan-300/60",
  },
  {
    spotlightA: "52,211,153",
    spotlightB: "16,185,129",
    aura: "bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.42)_0%,rgba(16,185,129,0.28)_35%,rgba(0,0,0,0)_75%)]",
    glow: "shadow-[0_4px_16px_rgba(0,0,0,0.45)]",
    hoverGlow: "hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)]",
    ring: "from-emerald-300/95 via-teal-400/95 to-lime-300/95",
    title: "text-white",
    panel: "border-emerald-300/45 bg-emerald-950/30",
    mediaBorder: "border-emerald-300/35",
    categoryChip: "border-emerald-300/35 bg-emerald-500/18 text-emerald-200",
    starColor: "text-emerald-300",
    infoPanel: "border-emerald-300/35 bg-emerald-950/28",
    priceColor: "text-emerald-300",
    priceGlow: "",
    dominantBorder: "border-emerald-300/60",
  },
  {
    spotlightA: "245,158,11",
    spotlightB: "234,88,12",
    aura: "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.45)_0%,rgba(234,88,12,0.28)_35%,rgba(0,0,0,0)_75%)]",
    glow: "shadow-[0_4px_16px_rgba(0,0,0,0.45)]",
    hoverGlow: "hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)]",
    ring: "from-amber-300/95 via-yellow-400/95 to-orange-300/95",
    title: "text-white",
    panel: "border-amber-300/45 bg-amber-950/30",
    mediaBorder: "border-amber-300/35",
    categoryChip: "border-amber-300/35 bg-amber-500/18 text-amber-200",
    starColor: "text-amber-300",
    infoPanel: "border-amber-300/35 bg-amber-950/28",
    priceColor: "text-amber-300",
    priceGlow: "",
    dominantBorder: "border-amber-300/60",
  },
] as const;

type PlaylistCategory = "all" | "business_model" | "business_psychology";

const DEFAULT_PLAYLIST_CATEGORY: PlaylistCategory = "all";

function parsePrice(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function ProgramThumbnailAccessBadge({
  comingSoon,
  locked,
}: {
  comingSoon: boolean;
  locked: boolean;
}) {
  if (comingSoon) {
    return (
      <span className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-3 text-center">
        <span className="rounded-xl border border-amber-300/60 bg-black/80 px-4 py-2 text-[clamp(1rem,3.8vw,1.35rem)] font-black uppercase tracking-[0.14em] text-[#f5c814] sm:text-[1.15rem]">
          Coming Soon
        </span>
      </span>
    );
  }
  if (!locked) return null;
  return (
    <span className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
      <span className="flex h-[clamp(2.75rem,11vw,4.25rem)] w-[clamp(2.75rem,11vw,4.25rem)] items-center justify-center rounded-full border border-red-400/55 bg-black/72 shadow-[0_0_28px_rgba(220,38,38,0.55)]">
        <Lock
          className="h-[clamp(1.35rem,5vw,2.1rem)] w-[clamp(1.35rem,5vw,2.1rem)] text-red-500"
          strokeWidth={2.4}
          aria-hidden
        />
      </span>
      <span className="sr-only">Locked</span>
    </span>
  );
}

type Course = {
  id: string;
  title: string;
  subtitle: string;
  statusText: string;
  progress: number;
  accent?: "gold" | "ice";
  imageSrc?: string;
  meta?: string;
  detail?: string;
};

type Props = {
  /** Optional hero slideshow — not shown on dashboard programs grid. */
  instructorHero?: ReactNode;
  chromaItems: ChromaItem[];
  selectedCourseId: string | null;
  onSelectCourse: (id: string) => void;
  sidebarOccupiesGrid: boolean;
  isNarrowViewport: boolean;
  isGoalsPanelOpen: boolean;
  /** When true, same interaction lock as Goals overlay (floating Quick Access). */
  isQuickAccessPanelOpen?: boolean;
  selectedCourseWithProgress: (Course & { progress: number }) | null;
  activeCoursePanel: ReactNode | null;
  /** False when dashboard keep-alive hides Programs — must not lock main shell scroll. */
  sectionActive?: boolean;
};

export const ProgramsCourseSection = memo(function ProgramsCourseSection({
  instructorHero,
  chromaItems,
  selectedCourseId,
  onSelectCourse,
  sidebarOccupiesGrid,
  isNarrowViewport,
  isGoalsPanelOpen,
  isQuickAccessPanelOpen = false,
  selectedCourseWithProgress,
  activeCoursePanel,
  sectionActive = true,
}: Props) {
  const { formatPrice: formatLocalizedPrice } = useCurrency();
  const sectionActiveRef = useRef(sectionActive);
  sectionActiveRef.current = sectionActive;

  const [apiCourses, setApiCourses] = useState<CourseDto[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [streamPlaylists, setStreamPlaylists] = useState<StreamPlaylistListItem[]>([]);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [staff, setStaff] = useState(false);
  const [accessTier, setAccessTier] = useState<string | null>(null);
  const [moneyMasteryActive, setMoneyMasteryActive] = useState(false);
  const [secureView, setSecureView] = useState<"grid" | "detail">("grid");
  const [detailCourseId, setDetailCourseId] = useState<number | null>(null);
  const [detailPlaylistId, setDetailPlaylistId] = useState<number | null>(null);
  const [playlistCategoryFilter, setPlaylistCategoryFilter] = useState<PlaylistCategory>(DEFAULT_PLAYLIST_CATEGORY);
  const [playlistTitleQuery, setPlaylistTitleQuery] = useState("");
  const [checkoutBusyPlaylistId, setCheckoutBusyPlaylistId] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [bundleCheckoutBusy, setBundleCheckoutBusy] = useState(false);
  const [playlistDescriptionModal, setPlaylistDescriptionModal] = useState<StreamPlaylistListItem | null>(null);
  const [highlightedPlaylistId, setHighlightedPlaylistId] = useState<number | null>(null);
  const [highlightProgramId, setHighlightProgramId] = useState<number | null>(null);
  const [highlightPack, setHighlightPack] = useState<GlobePackKey | undefined>(undefined);
  const highlightHandledRef = useRef(false);
  const skipHighlightScrollRef = useRef(false);
  /** Skip deep-link scroll/open when URL was updated from an in-app Details click. */
  const skipHighlightDeepLinkRef = useRef(false);
  const playlistDescriptionModalRef = useRef<StreamPlaylistListItem | null>(null);
  const spotlightClearTimerRef = useRef<number | null>(null);
  const openStreamPlaylistRef = useRef<(id: number) => void>(() => {});
  const globeSpotlightActive = highlightedPlaylistId != null;

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
    window.requestAnimationFrame(() => {
      run();
      window.setTimeout(run, 40);
    });
  }, []);

  const closePlaylistDescriptionModal = useCallback(() => {
    const pl = playlistDescriptionModal;
    const spotlightAfterClose =
      !!pl &&
      supportsProgramHashDeepLink({
        id: pl.id,
        slug: pl.slug,
        title: pl.title,
        vault_plan_slug: pl.vault_plan_slug,
      });
    setPlaylistDescriptionModal(null);
    playlistDescriptionModalRef.current = null;
    skipHighlightDeepLinkRef.current = true;
    highlightHandledRef.current = true;
    clearProgramDetailsHash(pl ? { id: pl.id, slug: pl.slug } : undefined);
    window.setTimeout(() => {
      skipHighlightDeepLinkRef.current = false;
    }, 100);
    if (spotlightAfterClose && pl) {
      window.setTimeout(() => applyProgramSpotlight(pl.id), 240);
    }
  }, [playlistDescriptionModal, applyProgramSpotlight]);

  const reloadApiCourses = useCallback(async () => {
    const res = await fetchCoursesList();
    if (res.ok && Array.isArray(res.data)) {
      setApiCourses(res.data as CourseDto[]);
      setCoursesError(null);
      return;
    }
    setApiCourses([]);
    setCoursesError(coursesListErrorMessage(res.status, res.data));
  }, []);

  const reloadStreamPlaylists = useCallback(async (options?: { forceRefresh?: boolean }) => {
    try {
      const list = await fetchStreamPlaylists({
        allowPublicFallback: false,
        forceRefresh: !!options?.forceRefresh,
      });
      setStreamPlaylists(Array.isArray(list) ? list : []);
      setPlaylistsError(null);
    } catch {
      setStreamPlaylists([]);
      setPlaylistsError("Could not load secure playlists right now.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const identity = await fetchPortalIdentity();
        if (!cancelled) {
          setStaff(!!identity?.is_staff);
          setAccessTier(identity?.access_tier ?? null);
          setMoneyMasteryActive(!!identity?.money_mastery_active);
        }
        clearStreamPlaylistsCache();
        await reloadApiCourses();
        if (!cancelled) await reloadStreamPlaylists();
      } catch {
        if (!cancelled) setStaff(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadApiCourses, reloadStreamPlaylists]);

  const refreshAfterTabResume = useCallback(() => {
    if (!hasSimpleAuthSessionClient() || !sectionActiveRef.current) return;
    purgeExpiredStreamPlaybackCache();
    void fetchPortalIdentity().then((identity) => {
      setStaff(!!identity?.is_staff);
      setAccessTier(identity?.access_tier ?? null);
      setMoneyMasteryActive(!!identity?.money_mastery_active);
    });
    clearStreamPlaylistsCache();
    void reloadStreamPlaylists({ forceRefresh: true });
    void reloadApiCourses();
  }, [reloadApiCourses, reloadStreamPlaylists]);

  useEffect(() => registerDashboardTabResumeTask(refreshAfterTabResume), [refreshAfterTabResume]);

  const effectiveStreamPlaylists = useMemo(() => {
    const normalized = normalizeLevel1ProgramPlaylists(streamPlaylists);
    const ownedVaultModules = ownedVaultSubmodulePlaylistsForDashboard(streamPlaylists);
    const mergedById = new Map<number, (typeof normalized)[number]>();
    for (const pl of normalized) mergedById.set(pl.id, pl);
    for (const pl of ownedVaultModules) {
      if (!mergedById.has(pl.id)) mergedById.set(pl.id, pl);
    }
    const merged = Array.from(mergedById.values());
    if (!hasMoneyMasteryAccess(accessTier, moneyMasteryActive)) return merged;
    return merged.map((pl) => ({ ...pl, is_unlocked: true }));
  }, [streamPlaylists, accessTier, moneyMasteryActive]);

  const effectiveApiCourses = useMemo(() => {
    if (!hasMoneyMasteryAccess(accessTier, moneyMasteryActive)) return apiCourses;
    return apiCourses.map((c) => (c.can_access === false ? { ...c, can_access: true } : c));
  }, [apiCourses, accessTier, moneyMasteryActive]);

  const openUnlockedPlaylistDirect = useCallback(
    (playlistId: number) => {
      if (!Number.isFinite(playlistId) || playlistId <= 0) return;
      skipHighlightScrollRef.current = true;
      clearUnlockCelebrationStorage();
      void reloadStreamPlaylists({ forceRefresh: true }).then(() => {
        openStreamPlaylistRef.current(playlistId);
      });
    },
    [reloadStreamPlaylists]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshFromCheckout = () => {
      markDashboardCheckoutReturn();
      clearStreamPlaylistsCache();
      clearVaultPlaylistMapCache();
      void reloadStreamPlaylists({ forceRefresh: true });
      void reloadApiCourses();
      try {
        window.sessionStorage.removeItem("playlist_checkout_confirmed");
        window.sessionStorage.removeItem("plan_checkout_confirmed");
      } catch {
        // Ignore storage exceptions.
      }
    };
    const onPlaylistConfirmed = (e: Event) => {
      refreshFromCheckout();
      const detail = (e as CustomEvent<{ playlistId?: number }>).detail;
      if (detail?.playlistId) {
        openUnlockedPlaylistDirect(detail.playlistId);
      }
    };
    const onPlanConfirmed = (e: Event) => {
      refreshFromCheckout();
      const detail = (e as CustomEvent<{ plan?: string; playlistId?: number }>).detail;
      const plan = (detail?.plan || "").trim().toLowerCase();
      if (detail?.playlistId) {
        openUnlockedPlaylistDirect(detail.playlistId);
        return;
      }
      if (plan && isVaultPackKey(plan)) {
        void resolvePlaylistIdForPlan(plan).then((playlistId) => {
          if (playlistId) {
            openUnlockedPlaylistDirect(playlistId);
            toast.success("Pack unlocked — opening your playlist.");
            return;
          }
          if (GLOBE_PACK_KEYS.has(plan as GlobePackKey)) {
            setHighlightPack(plan as GlobePackKey);
          }
          toast.success("Pack unlocked — choose a module below.");
        });
        return;
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get("playlist_checkout") === "success") {
      const t = window.setTimeout(refreshFromCheckout, 900);
      window.addEventListener("playlist-checkout-confirmed", onPlaylistConfirmed);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("playlist-checkout-confirmed", onPlaylistConfirmed);
      };
    }

    try {
      if (
        window.sessionStorage.getItem("playlist_checkout_confirmed") === "1" ||
        window.sessionStorage.getItem("plan_checkout_confirmed") === "1"
      ) {
        refreshFromCheckout();
      }
    } catch {
      // Ignore storage exceptions.
    }

    window.addEventListener("playlist-checkout-confirmed", onPlaylistConfirmed);
    window.addEventListener("plan-checkout-confirmed", onPlanConfirmed);
    return () => {
      window.removeEventListener("playlist-checkout-confirmed", onPlaylistConfirmed);
      window.removeEventListener("plan-checkout-confirmed", onPlanConfirmed);
    };
  }, [openUnlockedPlaylistDirect, reloadStreamPlaylists, reloadApiCourses]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pack =
      (params.get("pack") || "").trim() ||
      "";
    const fromPack = GLOBE_PACK_KEYS.has(pack as GlobePackKey) ? (pack as GlobePackKey) : undefined;
    const fromSlug = parsePackDeepLinkSlug(params.get("slug"));
    const resolved = fromPack ?? fromSlug;
    if (resolved) setHighlightPack(resolved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const slug = (params.get("slug") || "").trim().toLowerCase();
    if (slug) {
      if (parsePackDeepLinkSlug(slug)) return;
      const resolved = resolveProgramPlaylistHighlightSlug(streamPlaylists, slug);
      if (resolved) {
        setHighlightProgramId(resolved);
        return;
      }
    }
    const raw = params.get("program");
    if (!raw || !/^\d+$/.test(raw)) return;
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) setHighlightProgramId(id);
  }, [streamPlaylists]);

  useEffect(() => {
    if (!highlightProgramId) return;
    void reloadStreamPlaylists({ forceRefresh: true });
  }, [highlightProgramId, reloadStreamPlaylists]);

  useEffect(() => {
    highlightHandledRef.current = false;
  }, [highlightProgramId]);

  useLayoutEffect(() => {
    if (!highlightProgramId || streamPlaylists.length === 0) return;
    if (skipHighlightDeepLinkRef.current) {
      skipHighlightDeepLinkRef.current = false;
      highlightHandledRef.current = true;
      return;
    }
    const resolvedId = resolveProgramPlaylistHighlightId(streamPlaylists, highlightProgramId);
    if (!resolvedId) return;
    const target = effectiveStreamPlaylists.find((pl) => pl.id === resolvedId);
    if (!target) return;
    if (skipHighlightScrollRef.current) {
      skipHighlightScrollRef.current = false;
      highlightHandledRef.current = true;
      return;
    }
    if (secureView === "detail" && detailPlaylistId === resolvedId) {
      highlightHandledRef.current = true;
      return;
    }

    const openDetailsFromHash =
      readProgramDetailsHash() &&
      supportsProgramHashDeepLink({
        id: target.id,
        slug: target.slug,
        title: target.title,
        vault_plan_slug: target.vault_plan_slug,
      });

    if (openDetailsFromHash) {
      highlightHandledRef.current = true;
      if (playlistDescriptionModalRef.current?.id === target.id) return;
      setHighlightedPlaylistId(null);
      playlistDescriptionModalRef.current = target;
      setPlaylistDescriptionModal(target);
      return;
    }

    if (highlightHandledRef.current) return;
    highlightHandledRef.current = true;

    const hit = () => {
      if (scrollProgramCardIntoView(resolvedId, { behavior: "auto" })) {
        setHighlightedPlaylistId(resolvedId);
        return true;
      }
      return false;
    };

    if (hit()) {
      const clearHighlight = window.setTimeout(() => setHighlightedPlaylistId(null), 22000);
      return () => window.clearTimeout(clearHighlight);
    }

    const cancelScroll = focusProgramCardWithRetries(
      resolvedId,
      () => setHighlightedPlaylistId(resolvedId),
      { behavior: "auto", delays: [50, 150, 350, 700, 1400] },
    );
    const clearHighlight = window.setTimeout(() => setHighlightedPlaylistId(null), 22000);
    return () => {
      cancelScroll();
      window.clearTimeout(clearHighlight);
    };
  }, [highlightProgramId, streamPlaylists, effectiveStreamPlaylists, secureView, detailPlaylistId]);

  // Re-open Level-1 details on `#details` every time (hash re-entry / address bar Enter).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const openFromHash = () => {
      if (skipHighlightDeepLinkRef.current) return;
      if (!readProgramDetailsHash()) return;
      const params = new URLSearchParams(window.location.search);
      const slugParam = (params.get("slug") || "").trim().toLowerCase();
      const programParam = Number.parseInt(params.get("program") || params.get("playlist") || "", 10);
      const fromUrlSlug = slugParam
        ? resolveProgramPlaylistHighlightSlug(streamPlaylists, slugParam)
        : null;
      const fromUrlId =
        Number.isFinite(programParam) && programParam > 0
          ? resolveProgramPlaylistHighlightId(streamPlaylists, programParam) ?? programParam
          : null;
      const preferredId = fromUrlSlug ?? fromUrlId ?? highlightProgramId;
      const eligible = (pl: (typeof effectiveStreamPlaylists)[number]) =>
        supportsProgramHashDeepLink({
          id: pl.id,
          slug: pl.slug,
          title: pl.title,
          vault_plan_slug: pl.vault_plan_slug,
        });
      const target =
        (preferredId != null
          ? effectiveStreamPlaylists.find((pl) => pl.id === preferredId && eligible(pl))
          : undefined) ?? effectiveStreamPlaylists.find(eligible);
      if (!target) return;
      if (playlistDescriptionModalRef.current?.id === target.id) return;
      highlightHandledRef.current = true;
      setHighlightedPlaylistId(null);
      playlistDescriptionModalRef.current = target;
      setPlaylistDescriptionModal(target);
    };
    if (readProgramDetailsHash() && !playlistDescriptionModalRef.current) openFromHash();
    window.addEventListener("hashchange", openFromHash);
    window.addEventListener("popstate", openFromHash);
    window.addEventListener("pageshow", openFromHash);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener("popstate", openFromHash);
      window.removeEventListener("pageshow", openFromHash);
    };
  }, [effectiveStreamPlaylists, streamPlaylists, highlightProgramId]);

  useEffect(() => {
    playlistDescriptionModalRef.current = playlistDescriptionModal;
  }, [playlistDescriptionModal]);

  useEffect(() => {
    if (!globeSpotlightActive) return;
    document.body.classList.add("globe-program-spotlight");
    return () => document.body.classList.remove("globe-program-spotlight");
  }, [globeSpotlightActive]);

  useEffect(() => {
    if (apiCourses.length === 0) {
      setDetailCourseId(null);
    } else if (detailCourseId !== null && !apiCourses.some((c) => c.id === detailCourseId)) {
      setDetailCourseId(null);
    }
  }, [apiCourses, detailCourseId]);

  useEffect(() => {
    if (detailCourseId === null) return;
    const c = apiCourses.find((x) => x.id === detailCourseId);
    if (!c) return;
    if (c.can_access === false) {
      setDetailCourseId(null);
      setSecureView("grid");
      toast.error("This course is not included in your current purchase.");
    }
  }, [apiCourses, detailCourseId]);

  useEffect(() => {
    if (streamPlaylists.length === 0) return;
    if (detailPlaylistId === null) return;
    if (streamPlaylists.some((p) => p.id === detailPlaylistId)) return;
    const urlPlaylist = new URLSearchParams(window.location.search).get("playlist");
    if (urlPlaylist && Number(urlPlaylist) === detailPlaylistId) return;
    setDetailPlaylistId(null);
  }, [streamPlaylists, detailPlaylistId]);

  useEffect(() => {
    if (apiCourses.length === 0 && streamPlaylists.length === 0) {
      const deepLink = readDashboardProgramDeepLink();
      const hasPendingDetail = detailCourseId !== null || detailPlaylistId !== null;
      if (!hasPendingDetail && !deepLink.playlistId && !deepLink.courseId) {
        setSecureView("grid");
      }
      return;
    }
    if (detailCourseId === null && detailPlaylistId === null) {
      const deepLink = readDashboardProgramDeepLink();
      if (!deepLink.playlistId && !deepLink.courseId) {
        setSecureView("grid");
      }
    }
  }, [apiCourses.length, streamPlaylists.length, detailCourseId, detailPlaylistId]);

  const openProgram = (id: number) => {
    setDetailPlaylistId(null);
    setDetailCourseId(id);
    setSecureView("detail");
  };

  const resetProgramsViewportScroll = () => {
    resetProgramsInnerScrollOnly();
  };

  const openStreamPlaylist = (id: number) => {
    setDetailCourseId(null);
    setDetailPlaylistId(id);
    setSecureView("detail");
    void prefetchStreamPlaylistExperience(id, { context: "programs" });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.pathname = "/dashboard/programs";
      url.searchParams.delete("section");
      url.searchParams.set("playlist", String(id));
      historyReplaceUrl(`${url.pathname}${url.search}${url.hash}`);
    }
  };
  openStreamPlaylistRef.current = openStreamPlaylist;

  const startPlaylistCheckout = useCallback(async (playlistId: number) => {
    if (checkoutBusyPlaylistId === playlistId) return;
    setCheckoutError(null);
    if (!hasSimpleAuthSessionClient()) {
      const returnPath =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : `/programs?playlist=${playlistId}`;
      window.location.assign(buildPlaylistCheckoutAuthHref(playlistId, returnPath));
      return;
    }
    setCheckoutBusyPlaylistId(playlistId);
    try {
      const checkout = await createPlaylistCheckoutSession(playlistId, {
        returnBaseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (checkout.is_unlocked) {
        await reloadStreamPlaylists({ forceRefresh: true });
        openStreamPlaylist(playlistId);
        return;
      }
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url;
        return;
      }
      throw new Error(checkout.message || "Could not start checkout.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start checkout.";
      setCheckoutError(message);
    } finally {
      setCheckoutBusyPlaylistId(null);
    }
  }, [checkoutBusyPlaylistId, reloadStreamPlaylists]);

  const startBundleCheckout = useCallback(async () => {
    if (bundleCheckoutBusy) return;
    setCheckoutError(null);
    setBundleCheckoutBusy(true);
    try {
      const result = await startPlanCheckout({
        plan: "bundle",
        billing: "monthly",
        amount: "333",
        postAuthNext: "/dashboard/programs",
      });
      if (result.status === "checkout" || result.status === "auth_required") {
        return;
      }
      if (result.status === "already_unlocked") {
        await Promise.all([reloadApiCourses(), reloadStreamPlaylists()]);
        await navigateToAlreadyUnlockedProgram({
          plan: "bundle",
          postAuthNext: "/dashboard/programs",
        });
        return;
      }
      if (result.status === "error") {
        throw new Error(result.message);
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Could not start Money Mastery checkout.");
    } finally {
      setBundleCheckoutBusy(false);
    }
  }, [bundleCheckoutBusy, reloadApiCourses, reloadStreamPlaylists]);

  const backToProgramGrid = () => {
    setSecureView("grid");
    setDetailCourseId(null);
    setDetailPlaylistId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("playlist");
      historyReplaceUrl(url.toString());
      requestAnimationFrame(() => resetProgramsViewportScroll());
    }
  };

  const level1TitleNorms = useMemo(
    () => new Set(Object.values(LEVEL1_CANONICAL_TITLES).map((t) => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim())),
    [],
  );

  const isLevel1DuplicateCourse = useCallback(
    (title: string) => {
      const norm = title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (!norm) return false;
      if (level1TitleNorms.has(norm)) return true;
      for (const canonical of level1TitleNorms) {
        if (norm.includes(canonical) || canonical.includes(norm)) return true;
      }
      return false;
    },
    [level1TitleNorms],
  );

  const visibleApiCourses = useMemo(
    () =>
      effectiveApiCourses.filter(
        (course) =>
          !isHiddenProgramPlaylist(course.id, { slug: course.slug, title: course.title, vault_plan_slug: null }) &&
          !isLevel1DuplicateCourse(course.title ?? ""),
      ),
    [effectiveApiCourses, isLevel1DuplicateCourse],
  );

  const activeDetailCourse =
    detailCourseId !== null ? visibleApiCourses.find((c) => c.id === detailCourseId) : undefined;
  const hasCatalogItems = visibleApiCourses.length > 0 || streamPlaylists.length > 0;
  const inLessonDetail =
    secureView === "detail" && (detailPlaylistId !== null || detailCourseId !== null);
  const hasSecureErrors = coursesError !== null || playlistsError !== null;
  const showSecureBlock = staff || hasCatalogItems || hasSecureErrors || chromaItems.length === 0;
  const useApiProgramBrowser = hasCatalogItems || staff || hasSecureErrors || chromaItems.length === 0;
  /** Focused lesson view: hide marketing hero and grid header. */
  const inProgramLessonView = useApiProgramBrowser && secureView === "detail";
  /** Grid browser: gold frame fixed; entire programs panel scrolls inside. */
  const inProgramGridView = useApiProgramBrowser && secureView === "grid";
  const inPlaylistDetail = detailPlaylistId !== null;
  const inCourseDetail = detailCourseId !== null;

  const normalizedPlaylistTitleQuery = playlistTitleQuery.trim().toLowerCase();
  const sortPlaylistsBySlugOrder = useCallback(
    (items: StreamPlaylistListItem[], order: readonly string[]) => {
      const rank = new Map(order.map((slug, index) => [slug, index]));
      return [...items].sort((a, b) => {
        const aUnlocked = !!a.is_unlocked;
        const bUnlocked = !!b.is_unlocked;
        if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
        const aRank = rank.get(a.slug?.trim().toLowerCase() ?? "") ?? 999;
        const bRank = rank.get(b.slug?.trim().toLowerCase() ?? "") ?? 999;
        if (aRank !== bRank) return aRank - bRank;
        return a.title.localeCompare(b.title);
      });
    },
    [],
  );

  const searchablePlaylists = useMemo(() => {
    const filtered = effectiveStreamPlaylists.filter((playlist) => {
      return normalizedPlaylistTitleQuery.length === 0
        ? true
        : playlist.title.toLowerCase().includes(normalizedPlaylistTitleQuery);
    });
    return filtered;
  }, [effectiveStreamPlaylists, normalizedPlaylistTitleQuery]);

  const businessModelPlaylists = useMemo(
    () =>
      sortPlaylistsBySlugOrder(
        searchablePlaylists.filter((playlist) => playlist.category === "business_model"),
        PUBLIC_BUSINESS_MODEL_SLUG_ORDER,
      ),
    [searchablePlaylists, sortPlaylistsBySlugOrder],
  );
  const businessPsychologyPlaylists = useMemo(
    () =>
      sortPlaylistsBySlugOrder(
        searchablePlaylists.filter((playlist) => playlist.category !== "business_model"),
        PUBLIC_PSYCHOLOGY_SLUG_ORDER,
      ),
    [searchablePlaylists, sortPlaylistsBySlugOrder],
  );
  const visibleBusinessModelPlaylists = playlistCategoryFilter === "business_psychology" ? [] : businessModelPlaylists;
  const visibleBusinessPsychologyPlaylists = playlistCategoryFilter === "business_model" ? [] : businessPsychologyPlaylists;
  const visibleStreamPlaylistCount = visibleBusinessModelPlaylists.length + visibleBusinessPsychologyPlaylists.length;
  const showBothPlaylistColumns = visibleBusinessPsychologyPlaylists.length > 0 && visibleBusinessModelPlaylists.length > 0;
  const interleavedMobilePlaylistRows = useMemo(() => {
    if (!showBothPlaylistColumns) return [];
    const maxLen = Math.max(visibleBusinessPsychologyPlaylists.length, visibleBusinessModelPlaylists.length);
    return Array.from({ length: maxLen }, (_, idx) => ({
      psychology: visibleBusinessPsychologyPlaylists[idx] ?? null,
      model: visibleBusinessModelPlaylists[idx] ?? null,
      idx,
    }));
  }, [showBothPlaylistColumns, visibleBusinessPsychologyPlaylists, visibleBusinessModelPlaylists]);

  const psychologyPackUnlocked = useMemo(
    () => categoryPlaylistsFullyUnlocked(businessPsychologyPlaylists, "business_psychology"),
    [businessPsychologyPlaylists],
  );
  const modelsPackUnlocked = useMemo(
    () => categoryPlaylistsFullyUnlocked(businessModelPlaylists, "business_model"),
    [businessModelPlaylists],
  );

  const handleOfferAlreadyUnlocked = useCallback(
    async (plan: CheckoutOfferKey) => {
      if (plan === "bundle" || plan === "king") {
        await Promise.all([reloadApiCourses(), reloadStreamPlaylists()]);
        const message =
          plan === "bundle"
            ? "Money Mastery already active. All programs are unlocked."
            : "The Knight plan is already active for this account.";
        toast.success(message);
        return;
      }
      if (isVaultPackKey(plan)) {
        await Promise.all([reloadApiCourses(), reloadStreamPlaylists({ forceRefresh: true })]);
        const playlistId = await resolvePlaylistIdForPlan(plan);
        if (playlistId) {
          openUnlockedPlaylistDirect(playlistId);
          toast.success("Pack already active — opening your playlist.");
          return;
        }
        setHighlightPack(plan);
        toast.success("Pack already active — choose a module below.");
        return;
      }
      const offer = isVaultCourseSlug(plan)
        ? vaultCourseBySlug(plan)
        : planOfferByKey(plan as PlanOfferKey);
      const label = offer?.title ?? "This offer";
      const playlistId = await resolvePlaylistIdForPlan(plan);
      if (playlistId) {
        openUnlockedPlaylistDirect(playlistId);
        toast.success(`${label} is already active — opening now.`);
        return;
      }
      await Promise.all([reloadApiCourses(), reloadStreamPlaylists({ forceRefresh: true })]);
      toast.success(`${label} is already active on this account.`);
    },
    [openUnlockedPlaylistDirect, reloadApiCourses, reloadStreamPlaylists]
  );

  const streamPlaylistsRef = useRef(streamPlaylists);
  streamPlaylistsRef.current = streamPlaylists;

  const pendingPlaylistUrlRef = useRef<number | null>(null);

  const openPlaylistFromUrl = useCallback((playlistIdFromUrl: number) => {
    if (!Number.isFinite(playlistIdFromUrl) || playlistIdFromUrl <= 0) return;
    if (detailPlaylistId === playlistIdFromUrl && secureView === "detail") return;
    const target = streamPlaylistsRef.current.find((pl) => pl.id === playlistIdFromUrl);
    if (target?.is_coming_soon) return;
    pendingPlaylistUrlRef.current = playlistIdFromUrl;
    setDetailCourseId(null);
    setDetailPlaylistId(playlistIdFromUrl);
    setSecureView("detail");
    // Panel loads detail itself — skip prefetch here to avoid duplicate /404/500 storms.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.pathname = "/dashboard/programs";
      url.searchParams.delete("section");
      url.searchParams.set("playlist", String(playlistIdFromUrl));
      url.searchParams.delete("playlist_id");
      historyReplaceUrl(`${url.pathname}${url.search}${url.hash}`);
    }
  }, [detailPlaylistId, secureView]);

  const syncPlaylistDeepLinkFromUrl = useCallback(() => {
    const deepLink = readDashboardProgramDeepLink();
    if (deepLink.playlistId) {
      openPlaylistFromUrl(deepLink.playlistId);
      return;
    }
    const pending = consumePendingDashboardProgramOpen();
    if (pending.playlistId) openPlaylistFromUrl(pending.playlistId);
    else if (pending.courseId) openProgram(pending.courseId);
  }, [openPlaylistFromUrl]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    syncPlaylistDeepLinkFromUrl();
  }, [syncPlaylistDeepLinkFromUrl]);

  useEffect(() => {
    const pending = pendingPlaylistUrlRef.current ?? readDashboardProgramDeepLink().playlistId;
    if (!pending) return;
    const target = effectiveStreamPlaylists.find((pl) => pl.id === pending);
    if (!target || target.is_coming_soon) return;
    if (detailPlaylistId === pending && secureView === "detail") {
      pendingPlaylistUrlRef.current = null;
      return;
    }
    openPlaylistFromUrl(pending);
  }, [effectiveStreamPlaylists, detailPlaylistId, secureView, openPlaylistFromUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("playlist") || params.get("playlist_id");
      if (!raw || !/^\d+$/.test(raw)) return;
      openPlaylistFromUrl(Number(raw));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [openPlaylistFromUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onDashboardOpenPlaylist = (event: Event) => {
      const playlistId = (event as CustomEvent<{ playlistId?: number }>).detail?.playlistId;
      if (playlistId) openPlaylistFromUrl(playlistId);
    };
    const onDashboardOpenCourse = (event: Event) => {
      const courseId = (event as CustomEvent<{ courseId?: number }>).detail?.courseId;
      if (courseId) openProgram(courseId);
    };
    window.addEventListener(DASHBOARD_OPEN_PLAYLIST_EVENT, onDashboardOpenPlaylist);
    window.addEventListener(DASHBOARD_OPEN_COURSE_EVENT, onDashboardOpenCourse);
    syncPlaylistDeepLinkFromUrl();
    return () => {
      window.removeEventListener(DASHBOARD_OPEN_PLAYLIST_EVENT, onDashboardOpenPlaylist);
      window.removeEventListener(DASHBOARD_OPEN_COURSE_EVENT, onDashboardOpenCourse);
    };
  }, [openPlaylistFromUrl, syncPlaylistDeepLinkFromUrl]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const shell = document.querySelector<HTMLElement>("[data-main-shell-scroll]");
    if (!shell) return;

    if (!sectionActive) {
      shell.removeAttribute("data-programs-lesson-active");
      shell.removeAttribute("data-programs-grid-active");
      return;
    }

    const lessonActive = inPlaylistDetail || inCourseDetail;
    if (lessonActive) {
      shell.setAttribute("data-programs-lesson-active", "");
      shell.removeAttribute("data-programs-grid-active");
    } else if (inProgramGridView) {
      shell.setAttribute("data-programs-grid-active", "");
      shell.removeAttribute("data-programs-lesson-active");
    } else {
      shell.removeAttribute("data-programs-lesson-active");
      shell.removeAttribute("data-programs-grid-active");
    }
    return () => {
      shell.removeAttribute("data-programs-lesson-active");
      shell.removeAttribute("data-programs-grid-active");
    };
  }, [sectionActive, inPlaylistDetail, inCourseDetail, inProgramGridView]);

  const renderStreamPlaylistCard = (pl: StreamPlaylistListItem, j: number) => {
    const i = j;
    const grad = PROGRAM_CARD_BACKGROUNDS[i % PROGRAM_CARD_BACKGROUNDS.length];
    const cardTitle = resolveProgramPlaylistTitle(pl);
    const comingSoon = !!pl.is_coming_soon;
    const locked = !pl.is_unlocked;
    const theme = PLAYLIST_CARD_THEMES[j % PLAYLIST_CARD_THEMES.length];
    const detailSelector = `[${PROGRAM_DETAIL_TRIGGER_ATTR}]`;
    const isSpotlight = highlightedPlaylistId === pl.id;
    const spotlightActive = highlightedPlaylistId != null;
    const showIdleGlow = !spotlightActive;
    const spotlightStyle = isSpotlight
      ? ({
          ["--spotlight-a" as string]: theme.spotlightA,
          ["--spotlight-b" as string]: theme.spotlightB,
        } as CSSProperties)
      : undefined;
    const playlistCardPrimary = () => {
      if (comingSoon) return;
      if (locked) {
        void startPlaylistCheckout(pl.id);
        return;
      }
      openStreamPlaylist(pl.id);
    };
    return (
      <article
        key={`playlist-${pl.id}`}
        id={`program-playlist-${pl.id}`}
        data-program-playlist-id={pl.id}
        data-globe-spotlight={isSpotlight ? "true" : undefined}
        style={spotlightStyle}
        tabIndex={comingSoon ? -1 : 0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(detailSelector)) return;
          playlistCardPrimary();
        }}
        onKeyDown={(e) => {
          if ((e.target as HTMLElement).closest(detailSelector)) return;
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          playlistCardPrimary();
        }}
        onMouseEnter={() => {
          if (comingSoon || locked) return;
          void prefetchStreamPlaylistExperience(pl.id);
        }}
        className={cn(
          "program-playlist-card group/card relative flex h-full w-full min-w-0 max-w-none justify-self-stretch flex-col text-left outline-none",
          "min-h-0 max-lg:min-h-0 max-lg:rounded-[0.85rem] lg:min-h-[clamp(14rem,32vh,17rem)]",
          "rounded-2xl border-2 scroll-mt-32 transition-[transform,box-shadow] duration-300 ease-out",
          isSpotlight ? "program-card-globe-spotlight-host" : "overflow-hidden",
          showIdleGlow && !isSpotlight && theme.dominantBorder,
          showIdleGlow && !isSpotlight && theme.glow,
          comingSoon ? "cursor-not-allowed opacity-95" : cn("cursor-pointer hover:-translate-y-0.5", showIdleGlow && !isSpotlight && theme.hoverGlow),
          !comingSoon && "focus-visible:ring-2 focus-visible:ring-[color:var(--gold-neon-border-mid)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        )}
        aria-disabled={comingSoon}
      >
        {isSpotlight ? (
          <>
            <span className="program-card-spotlight-field" style={spotlightStyle} aria-hidden />
            <span className={cn("program-card-spotlight-aura", theme.aura)} aria-hidden />
          </>
        ) : null}
        <span
          className={cn(
            PROGRAM_CARD_FRAME,
            "z-[1] h-full rounded-[1.12rem] max-lg:rounded-[0.85rem]",
            isSpotlight && "program-card-globe-spotlight border-2"
          )}
        >
          <span className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[1.28rem]" aria-hidden>
            <span className="absolute -left-[40%] top-0 h-full w-[45%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 mix-blend-overlay transition-[transform,opacity] duration-700 ease-out group-hover/card:translate-x-[280%] group-hover/card:opacity-100" />
          </span>
          <span
            className="pointer-events-none absolute inset-0 z-[2] rounded-[1.28rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.12)]"
            aria-hidden
          />
            <div className={cn(PROGRAM_CARD_INNER_SHELL, "h-full")}>
            <div className={PROGRAM_CARD_LANDSCAPE_MEDIA}>
              <ProgramPlaylistCoverImage
                playlist={pl}
                gradClassName={grad}
                loading={j < 2 ? "eager" : "lazy"}
                fetchPriority={j < 1 ? "high" : undefined}
                objectFit="cover"
              />
              <div className={PROGRAM_CARD_LANDSCAPE_MEDIA_OVERLAY} />
              {locked && !comingSoon ? (
                <span className="pointer-events-none absolute inset-0 z-[4] bg-black/45" aria-hidden />
              ) : null}
              {comingSoon ? (
                <span className="pointer-events-none absolute inset-0 z-[4] bg-black/35" aria-hidden />
              ) : null}
              {!comingSoon ? (
                <div
                  className={cn(
                    "program-playlist-card__price-badge absolute bottom-2 left-2 z-[6] sm:bottom-2.5 sm:left-2.5",
                    PROGRAM_CARD_MOBILE_PRICE_BADGE_FACE,
                  )}
                >
                  <span
                    className="program-playlist-card__pack-price-badge shrink-0 border border-emerald-300/50 bg-[#03140d]/95 tabular-nums text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.28)]"
                    style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
                  >
                    <span className="program-playlist-card__pack-price-badge__amount">
                      {formatLocalizedPrice(Number.parseFloat(String(pl.price ?? "0")) || 0)}
                    </span>
                    <span className="program-playlist-card__pack-price-badge__suffix text-emerald-200/80">
                      lifetime
                    </span>
                  </span>
                </div>
              ) : null}
              <ProgramThumbnailAccessBadge comingSoon={comingSoon} locked={locked} />
            </div>
            <div
              className={cn(
                PROGRAM_CARD_INFO_INSET,
                PROGRAM_CARD_INFO_PANEL,
                PROGRAM_CARD_MOBILE_INFO_FACE,
                "justify-end gap-1.5 rounded-xl border px-2 py-2 max-lg:px-1 max-lg:py-1.5 sm:px-2.5 sm:py-2",
                theme.infoPanel,
                // Solid fill (no backdrop-blur) — blur + translucent bg drops paint mid-scroll on desktop.
                "bg-[#04060d] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
              )}
            >
              <div
                className={cn(
                  "text-left text-[clamp(13px,3.4vw,18px)] font-extrabold uppercase leading-snug tracking-[0.04em] antialiased [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_2px_14px_rgba(0,0,0,0.75)] sm:text-[clamp(14px,2.2vw,15px)] sm:tracking-[0.07em]",
                  PROGRAM_CARD_MOBILE_TITLE_FACE,
                  PROGRAM_CARD_TITLE_SLOT,
                  theme.title
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
                    className="max-xl:mt-0.5 shrink-0"
                  />
                </div>
              ) : (
                <div className={PROGRAM_CARD_STATS_SLOT} aria-hidden />
              )}
              {!comingSoon ? (
                <div className={cn("mt-auto grid shrink-0 grid-cols-2 gap-1.5", PROGRAM_CARD_MOBILE_ACTIONS_FACE)}>
                  <button
                    type="button"
                    {...{ [PROGRAM_DETAIL_TRIGGER_ATTR]: "" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaylistDescriptionModal(pl);
                      playlistDescriptionModalRef.current = pl;
                      if (
                        supportsProgramHashDeepLink({
                          id: pl.id,
                          slug: pl.slug,
                          title: pl.title,
                          vault_plan_slug: pl.vault_plan_slug,
                        })
                      ) {
                        skipHighlightDeepLinkRef.current = true;
                        highlightHandledRef.current = true;
                        writeProgramDetailsHash({ id: pl.id, slug: pl.slug });
                        window.setTimeout(() => {
                          skipHighlightDeepLinkRef.current = false;
                        }, 100);
                      }
                    }}
                    className="min-w-0 rounded-lg border border-white/40 bg-black/55 px-1.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white/95 transition hover:border-cyan-300/55 hover:text-cyan-100 sm:px-2 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    disabled={checkoutBusyPlaylistId === pl.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (locked) {
                        void startPlaylistCheckout(pl.id);
                        return;
                      }
                      openStreamPlaylist(pl.id);
                    }}
                    className={cn(
                      "min-w-0 rounded-lg border px-1.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] transition sm:px-2 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]",
                      locked
                        ? "border-amber-300/75 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] text-amber-100 hover:brightness-110"
                        : "border-emerald-300/70 bg-[linear-gradient(135deg,rgba(6,78,59,0.55),rgba(4,47,46,0.95))] text-emerald-100 hover:brightness-110",
                      checkoutBusyPlaylistId === pl.id && "cursor-wait opacity-70"
                    )}
                  >
                    {checkoutBusyPlaylistId === pl.id ? "Loading…" : locked ? "Unlock" : "Open"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </span>
      </article>
    );
  };

  const renderPlaylistCategoryFilterBar = (opts?: { stickyMobile?: boolean }) => {
    if (streamPlaylists.length === 0) return null;
    return (
      <div
        className={cn(
          "programs-playlist-filter-bar w-full max-w-full",
          opts?.stickyMobile && "programs-playlist-filter-bar--sticky-mobile",
        )}
      >
        <div className="mx-auto w-full max-w-4xl space-y-3 px-3 sm:px-4 md:px-5">
          <div
            className="grid grid-cols-2 gap-2 sm:gap-3 xl:hidden"
            role="tablist"
            aria-label="Filter playlists by category"
          >
            <button
              type="button"
              role="tab"
              aria-selected={playlistCategoryFilter === "business_psychology"}
              onClick={() => setPlaylistCategoryFilter("business_psychology")}
              className={cn(
                PLAYLIST_CATEGORY_HEADING_CLASS.psychology,
                "playlist-category-filter-heading w-full rounded-xl border px-2 py-2.5 text-balance transition sm:px-3 sm:py-3",
                "text-[11px] leading-tight tracking-[0.08em] sm:text-[13px] sm:leading-snug md:text-[15px]",
                playlistCategoryFilter === "business_psychology"
                  ? "border-fuchsia-200/90 bg-[linear-gradient(135deg,rgba(90,16,72,0.96),rgba(24,6,20,0.94))] shadow-[0_0_28px_rgba(217,70,239,0.75)]"
                  : "border-fuchsia-400/35 bg-black/35 opacity-80 hover:opacity-100 hover:border-fuchsia-200/70 hover:shadow-[0_0_20px_rgba(217,70,239,0.45)]",
              )}
            >
              {STREAM_PLAYLIST_CATEGORY_LABELS.business_psychology}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={playlistCategoryFilter === "business_model"}
              onClick={() => setPlaylistCategoryFilter("business_model")}
              className={cn(
                PLAYLIST_CATEGORY_HEADING_CLASS.businessModels,
                "playlist-category-filter-heading w-full rounded-xl border px-2 py-2.5 text-balance transition sm:px-3 sm:py-3",
                "text-[11px] leading-tight tracking-[0.08em] sm:text-[13px] sm:leading-snug md:text-[15px]",
                playlistCategoryFilter === "business_model"
                  ? "border-cyan-200/90 bg-[linear-gradient(135deg,rgba(8,70,82,0.96),rgba(5,34,40,0.94))] shadow-[0_0_28px_rgba(34,211,238,0.75)]"
                  : "border-cyan-400/35 bg-black/35 opacity-80 hover:opacity-100 hover:border-cyan-200/70 hover:shadow-[0_0_20px_rgba(34,211,238,0.45)]",
              )}
            >
              {STREAM_PLAYLIST_CATEGORY_LABELS.business_model}
            </button>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              role="tab"
              aria-selected={playlistCategoryFilter === "all"}
              onClick={() => setPlaylistCategoryFilter("all")}
              className={cn(
                "shrink-0 self-center rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition sm:text-[12px]",
                playlistCategoryFilter === "all"
                  ? "border-amber-200 bg-[linear-gradient(135deg,rgba(112,70,8,0.98),rgba(54,34,4,0.97))] text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.85)]"
                  : "border-amber-400/45 bg-[linear-gradient(135deg,rgba(70,44,7,0.9),rgba(34,22,3,0.9))] text-amber-100/95 hover:border-amber-200/80 hover:text-amber-50",
              )}
            >
              All
            </button>
            <div className="relative min-w-0 flex-1">
              <div className="relative rounded-xl border border-white/15 bg-black/50 p-[1px]">
                <input
                  type="text"
                  value={playlistTitleQuery}
                  onChange={(e) => setPlaylistTitleQuery(e.target.value)}
                  placeholder="Search playlist by title..."
                  className="w-full rounded-[11px] border-0 bg-black/80 px-3 py-2 text-[13px] text-cyan-50 outline-none transition placeholder:text-cyan-100/45 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300/30 lg:px-4 lg:py-3 lg:text-[14px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProgramsLibraryGrid = () => {
    if (!hasCatalogItems || secureView !== "grid") return null;
    return (
      <div
        id="dashboard-programs-library"
        className="program-playlist-library-band scroll-mt-24 space-y-6 max-lg:space-y-4"
        data-globe-spotlight-active={globeSpotlightActive ? "true" : undefined}
      >
        {visibleStreamPlaylistCount === 0 && streamPlaylists.length > 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[13px] text-white/70">
            No playlists found in this category yet.
          </div>
        ) : null}
        {visibleBusinessPsychologyPlaylists.length > 0 || visibleBusinessModelPlaylists.length > 0 ? (
          <div className="mx-auto max-w-[1800px]">
            {showBothPlaylistColumns ? (
              <div className="space-y-3 xl:hidden">
                <div className="grid grid-cols-2 items-start gap-3">
                  <Level1CategoryUnlockAllButton
                    category="business_psychology"
                    compact
                    alreadyUnlocked={psychologyPackUnlocked}
                    postAuthNext="/dashboard/programs"
                    onUnlocked={reloadStreamPlaylists}
                  />
                  <Level1CategoryUnlockAllButton
                    category="business_model"
                    compact
                    alreadyUnlocked={modelsPackUnlocked}
                    postAuthNext="/dashboard/programs"
                    onUnlocked={reloadStreamPlaylists}
                  />
                </div>
                <div className="space-y-4">
                  {interleavedMobilePlaylistRows.map((row) => (
                    <div key={`mobile-row-${row.idx}`} className="relative">
                      {row.psychology && row.model ? (
                        <>
                          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[4] w-3 -translate-x-1/2 bg-gradient-to-b from-transparent via-[color:var(--gold)]/22 to-transparent blur-[1px]" />
                          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[5] w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-[color:var(--gold)] to-transparent shadow-[0_0_16px_rgba(245,200,20,0.95),0_0_38px_rgba(245,200,20,0.75)]" />
                        </>
                      ) : null}
                      <div className="program-playlist-mobile-grid grid grid-cols-2 items-stretch justify-items-stretch gap-2 max-lg:gap-1.5 sm:gap-4">
                        <div className="flex min-h-0 min-w-0 h-full w-full">{row.psychology ? renderStreamPlaylistCard(row.psychology, row.idx * 2) : null}</div>
                        <div className="flex min-h-0 min-w-0 h-full w-full">{row.model ? renderStreamPlaylistCard(row.model, row.idx * 2 + 1) : null}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div
              className={cn(
                "grid grid-cols-1 gap-8",
                showBothPlaylistColumns
                  ? "hidden xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-stretch"
                  : "xl:grid-cols-1"
              )}
            >
              {visibleBusinessPsychologyPlaylists.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className={cn(PLAYLIST_CATEGORY_HEADING_CLASS.columnHeadingSlot, "max-xl:hidden")}>
                    <button
                      type="button"
                      onClick={() => setPlaylistCategoryFilter("business_psychology")}
                      className={cn(
                        PLAYLIST_CATEGORY_HEADING_CLASS.psychology,
                        PLAYLIST_CATEGORY_HEADING_CLASS.columnSize,
                        "text-balance transition hover:brightness-110",
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
                    </button>
                  </div>
                  <Level1CategoryUnlockAllButton
                    category="business_psychology"
                    alreadyUnlocked={psychologyPackUnlocked}
                    postAuthNext="/dashboard/programs"
                    onUnlocked={reloadStreamPlaylists}
                  />
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-300/90 to-transparent shadow-[0_0_14px_rgba(232,121,249,0.55)]" />
                  <div
                    className={cn(
                      "grid items-stretch justify-items-stretch gap-3 sm:gap-4 md:gap-5",
                      showBothPlaylistColumns ? "grid-cols-1 min-[560px]:grid-cols-2" : "grid-cols-1 min-[440px]:grid-cols-2"
                    )}
                  >
                    {visibleBusinessPsychologyPlaylists.map((pl, j) => (
                      <div key={`psychology-slot-${pl.id}`} className="flex min-h-0 min-w-0 h-full w-full">
                        {renderStreamPlaylistCard(pl, j)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {showBothPlaylistColumns ? (
                <div className="relative h-5 w-full xl:h-auto xl:w-4" aria-hidden>
                  <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#f5c814] to-transparent shadow-[0_0_14px_rgba(245,200,20,0.9),0_0_34px_rgba(245,200,20,0.65)] xl:hidden" />
                  <div className="absolute left-1/2 top-0 hidden h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f5c814] to-transparent shadow-[0_0_16px_rgba(245,200,20,0.95),0_0_40px_rgba(245,200,20,0.7)] xl:block" />
                </div>
              ) : null}
              {visibleBusinessModelPlaylists.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className={cn(PLAYLIST_CATEGORY_HEADING_CLASS.columnHeadingSlot, "max-xl:hidden")}>
                    <button
                      type="button"
                      onClick={() => setPlaylistCategoryFilter("business_model")}
                      className={cn(
                        PLAYLIST_CATEGORY_HEADING_CLASS.businessModels,
                        PLAYLIST_CATEGORY_HEADING_CLASS.columnSize,
                        "text-balance transition hover:brightness-110",
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
                    </button>
                  </div>
                  <Level1CategoryUnlockAllButton
                    category="business_model"
                    alreadyUnlocked={modelsPackUnlocked}
                    postAuthNext="/dashboard/programs"
                    onUnlocked={reloadStreamPlaylists}
                  />
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent shadow-[0_0_14px_rgba(103,232,249,0.55)]" />
                  <div
                    className={cn(
                      "grid items-stretch justify-items-stretch gap-3 sm:gap-4 md:gap-5",
                      showBothPlaylistColumns ? "grid-cols-1 min-[560px]:grid-cols-2 playlist-business-models-cards" : "grid-cols-1 min-[440px]:grid-cols-2"
                    )}
                  >
                    {visibleBusinessModelPlaylists.map((pl, j) => (
                      <div key={`models-slot-${pl.id}`} className="flex min-h-0 min-w-0 h-full w-full">
                        {renderStreamPlaylistCard(pl, j + visibleBusinessPsychologyPlaylists.length)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {visibleApiCourses.length > 0 ? (
          <div className="space-y-3">
            <div className="text-[12px] font-black uppercase tracking-[0.18em] text-cyan-100/80">Courses</div>
            <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 sm:gap-5 min-[400px]:grid-cols-2 md:gap-6">
              {visibleApiCourses.map((c, i) => {
                const grad = PROGRAM_CARD_BACKGROUNDS[(streamPlaylists.length + i) % PROGRAM_CARD_BACKGROUNDS.length];
                const courseMeta = {
                  id: c.id,
                  slug: c.slug,
                  title: c.title,
                  description: c.description,
                  cover_image_url: c.cover_image_url,
                };
                const cardTitle = resolveProgramPlaylistTitle(courseMeta);
                const theme = COURSE_CARD_THEMES[i % COURSE_CARD_THEMES.length];
                const courseLocked = c.can_access === false;
                return (
                  <button
                    key={`course-${c.id}`}
                    type="button"
                    onClick={() => {
                      if (courseLocked) {
                        void startBundleCheckout();
                        return;
                      }
                      openProgram(c.id);
                    }}
                    className={cn(
                      "group/card relative flex h-full w-full min-h-0 max-lg:min-h-0 lg:min-h-[clamp(14rem,32vh,17rem)] flex-col overflow-hidden text-left outline-none",
                      "rounded-2xl border-2",
                      theme.glow,
                      "transition-[transform,box-shadow] duration-300 ease-out",
                      !courseLocked && "hover:-translate-y-0.5",
                      theme.hoverGlow,
                      "focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                      courseLocked ? "cursor-not-allowed opacity-[0.78]" : "active:translate-y-0"
                    )}
                  >
                    <span className={cn(PROGRAM_CARD_FRAME, "z-[1] rounded-[1.12rem] max-lg:rounded-[0.85rem]")}>
                      <div className={PROGRAM_CARD_INNER_SHELL}>
                        <div className={PROGRAM_CARD_LANDSCAPE_MEDIA}>
                          <ProgramPlaylistCoverImage
                            playlist={courseMeta}
                            gradClassName={grad}
                            loading={i < 4 ? "eager" : "lazy"}
                            fetchPriority={i < 2 ? "high" : "auto"}
                            displayWidth={480}
                            objectFit="cover"
                          />
                          <div className={PROGRAM_CARD_LANDSCAPE_MEDIA_OVERLAY} />
                          {courseLocked ? (
                            <span className="pointer-events-none absolute inset-0 z-[4] bg-black/45" aria-hidden />
                          ) : null}
                          <ProgramThumbnailAccessBadge comingSoon={false} locked={courseLocked} />
                        </div>
                        <div
                          className={cn(
                            PROGRAM_CARD_INFO_INSET,
                            PROGRAM_CARD_INFO_PANEL,
                            "justify-end gap-1.5 rounded-xl border px-2 py-2 max-lg:px-1 max-lg:py-1.5 sm:px-2.5 sm:py-2",
                            theme.body,
                            "bg-[#04060d] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          )}
                        >
                          <div
                            className={cn(
                              "line-clamp-2 text-left text-[clamp(10px,2.4vw,15px)] font-extrabold uppercase leading-snug tracking-[0.04em] sm:tracking-[0.07em]",
                              theme.title
                            )}
                          >
                            {cardTitle}
                          </div>
                          <div
                            className={cn(
                              "inline-flex w-fit rounded-full border px-2 py-0.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px]",
                              theme.chip
                            )}
                          >
                            {courseLocked ? "Course · not included" : "Course · playlist"}
                          </div>
                        </div>
                      </div>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "dashboard-mobile-section-root programs-section-root flex min-h-0 w-full max-w-full flex-col overflow-x-clip",
        (inProgramLessonView || inProgramGridView) && "min-h-0 flex-1 overflow-hidden"
      )}
    >
    <>
      {showSecureBlock ? (
        <div
          className={cn(
            "w-full max-w-full",
            inProgramLessonView || inProgramGridView
              ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              : "mb-4 space-y-3 max-lg:pb-3 sm:mb-8 sm:space-y-5 sm:pb-6"
          )}
        >
          {inProgramGridView ? (
            <div className="programs-grid-shell flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
              <div className="programs-grid-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-4 pr-0.5">
                <div className="programs-grid-chrome space-y-3 pb-2 sm:space-y-4 sm:pb-3">
                  <div className="w-full max-w-full text-left">
                    <div
                      className={cn(
                        DASHBOARD_HEADING_LIGHTNING,
                        "text-[15px] font-black uppercase tracking-[0.14em] sm:text-[24px] sm:tracking-[0.16em]"
                      )}
                    >
                      Programs
                    </div>
                    <p className="mt-1.5 max-w-4xl text-[13px] leading-snug text-white/82 sm:mt-2 sm:text-[24px] sm:leading-[1.35]">
                      Browse all playlists here, and open courses for lesson playlists and progress.
                    </p>
                  </div>
                  <div className="w-full max-w-full space-y-4 sm:space-y-6">
                    <PublicPlanOfferCards
                      checkoutReturnPath="/dashboard/programs"
                      embedded
                      size="large"
                      highlightPack={highlightPack}
                      onAlreadyUnlocked={handleOfferAlreadyUnlocked}
                      onCheckoutError={setCheckoutError}
                      onOpenPlaylist={openStreamPlaylist}
                    />
                  </div>
                  {coursesError ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">
                      {coursesError}
                    </div>
                  ) : null}
                  {playlistsError ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">
                      {playlistsError}
                    </div>
                  ) : null}
                  {checkoutError ? (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-[13px] text-rose-100/95">
                      {checkoutError}
                    </div>
                  ) : null}
                  {!coursesError && staff && apiCourses.length === 0 && streamPlaylists.length === 0 ? (
                    <p className="text-[12px] text-white/50">
                      No programs yet. Add a Stream playlist (Video streaming → Stream playlists) and/or a course.
                      Uncheck “Show in programs” on legacy courses to hide them from this grid.
                    </p>
                  ) : null}
                  {!hasSecureErrors && !staff && apiCourses.length === 0 && streamPlaylists.length === 0 ? (
                    <p className="text-[12px] text-white/55">
                      No published programs are available for this account yet. Ask admin to publish a stream playlist or
                      enable “Show in programs” on a course.
                    </p>
                  ) : null}
                </div>
                {renderPlaylistCategoryFilterBar({ stickyMobile: true })}
                {renderProgramsLibraryGrid()}
                {effectiveStreamPlaylists.length > 0 ? (
                  <PublicGoalPathSection
                    playlists={effectiveStreamPlaylists}
                    libraryTarget="dashboard"
                    className="relative mt-6 w-full max-w-none px-0 pb-2 pt-2 sm:mt-8 sm:pb-4 sm:pt-3"
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {inLessonDetail ? (
            <div className="programs-lesson-shell flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
              <div className="programs-lesson-nav shrink-0 pt-3 sm:pt-4 md:pt-5">
                <button
                  type="button"
                  onClick={backToProgramGrid}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white/80 transition hover:border-[color:var(--gold-neon-border-mid)] hover:text-[color:var(--gold)]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Programs
                </button>
              </div>
              <div className="programs-lesson-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pr-0.5">
                {inCourseDetail && detailCourseId !== null ? (
                  <CourseVideoPlaylist
                    courseId={detailCourseId}
                    courseTitle={
                      activeDetailCourse
                        ? resolveProgramPlaylistTitle(activeDetailCourse)
                        : "Program"
                    }
                    courseDescription={
                      activeDetailCourse
                        ? resolveProgramPlaylistDescription(activeDetailCourse)
                        : ""
                    }
                    autoAdvance
                  />
                ) : null}
                {inPlaylistDetail && detailPlaylistId !== null ? (
                  <StreamPlaylistProgramPanel key={detailPlaylistId} playlistId={detailPlaylistId} />
                ) : null}
              </div>
            </div>
          ) : null}

        </div>
      ) : null}

      {useApiProgramBrowser ? null : (
        <>
          <div className="mb-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-[14px] font-extrabold uppercase tracking-[0.22em] text-white/65">Courses</div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/40">Hover / Select</div>
            </div>
          </div>
          <div className="pr-1" data-cards-wrap>
            <div
              className={cn(
                "relative",
                sidebarOccupiesGrid ? "min-h-[min(52vh,560px)] sm:min-h-[min(58vh,640px)]" : "min-h-[min(56vh,620px)] sm:min-h-[min(64vh,720px)]"
              )}
            >
              <ChromaGrid
                items={chromaItems}
                selectedId={selectedCourseId}
                onSelect={onSelectCourse}
                columns={sidebarOccupiesGrid ? (isNarrowViewport ? 2 : 3) : 4}
                radius={sidebarOccupiesGrid ? (isNarrowViewport ? 280 : 380) : 440}
                damping={0.45}
                fadeOut={0.6}
                ease="power3.out"
                interactionDisabled={isGoalsPanelOpen || isQuickAccessPanelOpen}
                className={cn(sidebarOccupiesGrid ? "py-2" : "py-4")}
              />
            </div>

            {selectedCourseWithProgress ? <div className="mt-6">{activeCoursePanel}</div> : null}
          </div>
        </>
      )}
      <ProgramPlaylistDescriptionModal
        playlist={playlistDescriptionModal}
        onClose={closePlaylistDescriptionModal}
        priceLabel={
          playlistDescriptionModal
            ? formatLocalizedPrice(Number.parseFloat(String(playlistDescriptionModal.price ?? "0")) || 0)
            : null
        }
        restoreScrollOnClose={
          !(
            playlistDescriptionModal &&
            supportsProgramHashDeepLink({
              id: playlistDescriptionModal.id,
              slug: playlistDescriptionModal.slug,
              title: playlistDescriptionModal.title,
              vault_plan_slug: playlistDescriptionModal.vault_plan_slug,
            })
          )
        }
        onUnlock={
          playlistDescriptionModal
            ? () => {
                const pl = playlistDescriptionModal;
                closePlaylistDescriptionModal();
                if (pl.is_coming_soon) return;
                if (pl.is_unlocked) {
                  openStreamPlaylist(pl.id);
                  return;
                }
                void startPlaylistCheckout(pl.id);
              }
            : undefined
        }
        unlockLabel={
          playlistDescriptionModal?.is_coming_soon
            ? "Coming Soon"
            : playlistDescriptionModal?.is_unlocked
              ? "Open Program"
              : checkoutBusyPlaylistId === playlistDescriptionModal?.id
                ? "Loading…"
                : "Unlock"
        }
        unlockDisabled={
          !!playlistDescriptionModal?.is_coming_soon ||
          checkoutBusyPlaylistId === playlistDescriptionModal?.id
        }
      />
    </>
    </div>
  );
});
