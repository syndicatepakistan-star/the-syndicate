"use client";

import { type CSSProperties } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { PlanOfferDef, PlanOfferAccent } from "@/components/programs/planOfferCatalog";
import { KNIGHT_LAUNCHING_SOON_LABEL } from "@/components/programs/planOfferCatalog";
import { ProgramCardStatsLines } from "@/components/programs/ProgramCardStatsLines";
import { ReadMoreText } from "@/components/programs/ReadMoreText";
import { isTradingModuleSlug, isTradingSubmoduleSlug } from "@/components/programs/tradingVaultCatalog";
import type { ProgramCardStats } from "@/components/programs/vaultProgramCardStats";
import { nextOptimizedImageSrcSet, nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

type Props = {
  offer: PlanOfferDef;
  size?: "large" | "compact" | "module";
  /** Visual tier badge on vault picker cards. */
  cardKind?: "pack" | "module";
  /** Optional lesson count / watch time shown inside the card. */
  cardStats?: ProgramCardStats;
  busy?: boolean;
  /** Overrides openLabel (e.g. Open when already purchased). */
  actionLabel?: string;
  highlighted?: boolean;
  comingSoon?: boolean;
  /** Compact left-aligned hero inside vault pack / module picker modals. */
  vaultHero?: boolean;
  /** Shows syndicate unlock-bucket badge on module/pack cards. */
  inCart?: boolean;
  onDetails: () => void;
  onOpen: () => void;
};

const PLAN_OFFER_THEMES = {
  amber: {
    glow: "shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(251,191,36,0.42),0_0_58px_rgba(245,158,11,0.52),0_0_110px_rgba(245,158,11,0.26)]",
    hoverGlow:
      "group-hover/card:shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(251,191,36,0.55),0_0_72px_rgba(245,158,11,0.72),0_0_140px_rgba(245,158,11,0.38),0_0_200px_rgba(245,158,11,0.18)]",
    ring: "from-amber-300/95 via-yellow-400/95 to-orange-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.45)_0%,rgba(234,88,12,0.28)_35%,rgba(0,0,0,0)_75%)]",
    spark: "from-amber-100/0 via-amber-100/90 to-white/0",
    infoPanel: "border-amber-300/35 bg-amber-950/28",
    dominantBorder: "border-amber-300/75",
    priceBadge:
      "border-amber-300/50 bg-[#1a1204]/95 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.28)]",
    openBtn:
      "border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] text-[#ffe9a3] shadow-[0_0_20px_rgba(202,167,36,0.6),inset_0_0_0_1px_rgba(202,167,36,0.35)] hover:shadow-[0_0_30px_rgba(202,167,36,0.9),0_0_52px_rgba(202,167,36,0.5),inset_0_0_0_1px_rgba(202,167,36,0.55)]",
  },
  cyan: {
    glow: "shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(103,232,249,0.42),0_0_58px_rgba(34,211,238,0.5),0_0_110px_rgba(14,165,233,0.24)]",
    hoverGlow:
      "group-hover/card:shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(103,232,249,0.55),0_0_72px_rgba(34,211,238,0.68),0_0_140px_rgba(14,165,233,0.36),0_0_200px_rgba(34,211,238,0.16)]",
    ring: "from-cyan-300/95 via-sky-400/95 to-blue-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.4)_0%,rgba(14,165,233,0.28)_35%,rgba(0,0,0,0)_75%)]",
    spark: "from-cyan-200/0 via-cyan-100/85 to-white/0",
    infoPanel: "border-cyan-300/35 bg-cyan-950/28",
    dominantBorder: "border-cyan-300/75",
    priceBadge:
      "border-cyan-300/50 bg-[#031018]/95 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.28)]",
    openBtn:
      "border-cyan-300/85 bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(6,26,42,0.98))] text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.45),inset_0_0_0_1px_rgba(103,232,249,0.35)] hover:shadow-[0_0_30px_rgba(34,211,238,0.65),0_0_52px_rgba(14,165,233,0.35),inset_0_0_0_1px_rgba(103,232,249,0.5)]",
  },
  pink: {
    glow: "shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(244,114,182,0.55),0_0_72px_rgba(236,72,153,0.62),0_0_130px_rgba(217,70,239,0.38),0_0_180px_rgba(244,114,182,0.18)]",
    hoverGlow:
      "group-hover/card:shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(244,114,182,0.68),0_0_88px_rgba(236,72,153,0.82),0_0_160px_rgba(217,70,239,0.48),0_0_220px_rgba(244,114,182,0.24)]",
    ring: "from-fuchsia-300/95 via-pink-400/95 to-rose-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.52)_0%,rgba(217,70,239,0.32)_38%,rgba(0,0,0,0)_76%)]",
    spark: "from-pink-200/0 via-fuchsia-200/95 to-white/0",
    infoPanel: "border-fuchsia-300/40 bg-fuchsia-950/30",
    dominantBorder: "border-fuchsia-300/85",
    priceBadge:
      "border-fuchsia-300/55 bg-[#180818]/95 text-fuchsia-100 shadow-[0_0_22px_rgba(236,72,153,0.45)]",
    openBtn:
      "border-fuchsia-300/90 bg-[linear-gradient(135deg,rgba(236,72,153,0.32),rgba(76,5,50,0.98))] text-pink-100 shadow-[0_0_24px_rgba(236,72,153,0.65),0_0_48px_rgba(217,70,239,0.35),inset_0_0_0_1px_rgba(244,114,182,0.45)] hover:shadow-[0_0_36px_rgba(236,72,153,0.85),0_0_72px_rgba(217,70,239,0.55),inset_0_0_0_1px_rgba(244,114,182,0.65)]",
  },
  green: {
    glow: "shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(74,222,128,0.55),0_0_72px_rgba(52,211,153,0.62),0_0_130px_rgba(16,185,129,0.38),0_0_180px_rgba(74,222,128,0.18)]",
    hoverGlow:
      "group-hover/card:shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(74,222,128,0.68),0_0_88px_rgba(52,211,153,0.82),0_0_160px_rgba(16,185,129,0.48),0_0_220px_rgba(74,222,128,0.24)]",
    ring: "from-emerald-300/95 via-lime-400/95 to-green-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.52)_0%,rgba(16,185,129,0.32)_38%,rgba(0,0,0,0)_76%)]",
    spark: "from-lime-200/0 via-emerald-200/95 to-white/0",
    infoPanel: "border-emerald-300/40 bg-emerald-950/30",
    dominantBorder: "border-emerald-300/85",
    priceBadge:
      "border-emerald-300/55 bg-[#041208]/95 text-emerald-100 shadow-[0_0_22px_rgba(52,211,153,0.45)]",
    openBtn:
      "border-emerald-300/90 bg-[linear-gradient(135deg,rgba(52,211,153,0.32),rgba(4,47,28,0.98))] text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.65),0_0_48px_rgba(16,185,129,0.35),inset_0_0_0_1px_rgba(74,222,128,0.45)] hover:shadow-[0_0_36px_rgba(52,211,153,0.85),0_0_72px_rgba(16,185,129,0.55),inset_0_0_0_1px_rgba(74,222,128,0.65)]",
  },
  purple: {
    glow: "shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(192,132,252,0.55),0_0_72px_rgba(168,85,247,0.62),0_0_130px_rgba(139,92,246,0.38),0_0_180px_rgba(192,132,252,0.18)]",
    hoverGlow:
      "group-hover/card:shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(192,132,252,0.68),0_0_88px_rgba(168,85,247,0.82),0_0_160px_rgba(139,92,246,0.48),0_0_220px_rgba(192,132,252,0.24)]",
    ring: "from-violet-300/95 via-purple-400/95 to-fuchsia-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.52)_0%,rgba(124,58,237,0.32)_38%,rgba(0,0,0,0)_76%)]",
    spark: "from-violet-200/0 via-purple-200/95 to-white/0",
    infoPanel: "border-violet-300/40 bg-violet-950/30",
    dominantBorder: "border-violet-300/85",
    priceBadge:
      "border-violet-300/55 bg-[#120818]/95 text-violet-100 shadow-[0_0_22px_rgba(168,85,247,0.45)]",
    openBtn:
      "border-violet-300/90 bg-[linear-gradient(135deg,rgba(168,85,247,0.32),rgba(46,8,62,0.98))] text-violet-100 shadow-[0_0_24px_rgba(168,85,247,0.65),0_0_48px_rgba(139,92,246,0.35),inset_0_0_0_1px_rgba(192,132,252,0.45)] hover:shadow-[0_0_36px_rgba(168,85,247,0.85),0_0_72px_rgba(139,92,246,0.55),inset_0_0_0_1px_rgba(192,132,252,0.65)]",
  },
  red: {
    glow: "shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(248,113,113,0.55),0_0_72px_rgba(239,68,68,0.62),0_0_130px_rgba(220,38,38,0.38)]",
    hoverGlow:
      "group-hover/card:shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(248,113,113,0.68),0_0_88px_rgba(239,68,68,0.82),0_0_160px_rgba(220,38,38,0.48)]",
    ring: "from-red-300/95 via-rose-400/95 to-orange-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.48)_0%,rgba(185,28,28,0.28)_38%,rgba(0,0,0,0)_76%)]",
    spark: "from-red-200/0 via-rose-200/95 to-white/0",
    infoPanel: "border-red-400/40 bg-red-950/30",
    dominantBorder: "border-red-400/85",
    priceBadge: "border-red-400/55 bg-[#180808]/95 text-red-100 shadow-[0_0_22px_rgba(239,68,68,0.45)]",
    openBtn:
      "border-red-400/90 bg-[linear-gradient(135deg,rgba(239,68,68,0.32),rgba(62,8,8,0.98))] text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.65),inset_0_0_0_1px_rgba(248,113,113,0.45)] hover:shadow-[0_0_36px_rgba(239,68,68,0.85),inset_0_0_0_1px_rgba(248,113,113,0.65)]",
  },
  orange: {
    glow: "shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(251,146,60,0.55),0_0_72px_rgba(249,115,22,0.62),0_0_130px_rgba(234,88,12,0.38)]",
    hoverGlow:
      "group-hover/card:shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(251,146,60,0.68),0_0_88px_rgba(249,115,22,0.82),0_0_160px_rgba(234,88,12,0.48)]",
    ring: "from-orange-300/95 via-amber-400/95 to-yellow-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.48)_0%,rgba(194,65,12,0.28)_38%,rgba(0,0,0,0)_76%)]",
    spark: "from-orange-200/0 via-amber-200/95 to-white/0",
    infoPanel: "border-orange-400/40 bg-orange-950/28",
    dominantBorder: "border-orange-400/85",
    priceBadge: "border-orange-400/55 bg-[#180e04]/95 text-orange-100 shadow-[0_0_22px_rgba(249,115,22,0.45)]",
    openBtn:
      "border-orange-400/90 bg-[linear-gradient(135deg,rgba(249,115,22,0.32),rgba(62,28,8,0.98))] text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.65),inset_0_0_0_1px_rgba(251,146,60,0.45)] hover:shadow-[0_0_36px_rgba(249,115,22,0.85),inset_0_0_0_1px_rgba(251,146,60,0.65)]",
  },
  blue: {
    glow: "shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(96,165,250,0.55),0_0_72px_rgba(59,130,246,0.62),0_0_130px_rgba(37,99,235,0.38)]",
    hoverGlow:
      "group-hover/card:shadow-[0_16px_42px_rgba(0,0,0,0.62),0_0_0_1px_rgba(96,165,250,0.68),0_0_88px_rgba(59,130,246,0.82),0_0_160px_rgba(37,99,235,0.48)]",
    ring: "from-blue-300/95 via-indigo-400/95 to-sky-300/95",
    aura: "bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.48)_0%,rgba(29,78,216,0.28)_38%,rgba(0,0,0,0)_76%)]",
    spark: "from-blue-200/0 via-indigo-200/95 to-white/0",
    infoPanel: "border-blue-400/40 bg-blue-950/30",
    dominantBorder: "border-blue-400/85",
    priceBadge: "border-blue-400/55 bg-[#081018]/95 text-blue-100 shadow-[0_0_22px_rgba(59,130,246,0.45)]",
    openBtn:
      "border-blue-400/90 bg-[linear-gradient(135deg,rgba(59,130,246,0.32),rgba(8,22,62,0.98))] text-blue-100 shadow-[0_0_24px_rgba(59,130,246,0.65),inset_0_0_0_1px_rgba(96,165,250,0.45)] hover:shadow-[0_0_36px_rgba(59,130,246,0.85),inset_0_0_0_1px_rgba(96,165,250,0.65)]",
  },
} as const;

const PACK_SPOTLIGHT: Record<PlanOfferAccent, { a: string; b: string }> = {
  amber: { a: "245,158,11", b: "234,88,12" },
  cyan: { a: "34,211,238", b: "14,165,233" },
  pink: { a: "217,70,239", b: "236,72,153" },
  green: { a: "52,211,153", b: "16,185,129" },
  purple: { a: "192,132,252", b: "139,92,246" },
  red: { a: "248,113,113", b: "239,68,68" },
  orange: { a: "251,146,60", b: "249,115,22" },
  blue: { a: "96,165,250", b: "59,130,246" },
};

function isTradingVaultModuleCard(offer: PlanOfferDef, isModule: boolean): boolean {
  if (!isModule) return false;
  return isTradingModuleSlug(offer.plan) || isTradingSubmoduleSlug(offer.plan);
}

export function PlanOfferCard({
  offer,
  size = "large",
  cardKind,
  cardStats,
  busy = false,
  actionLabel,
  highlighted = false,
  comingSoon = false,
  vaultHero = false,
  inCart = false,
  onDetails,
  onOpen,
}: Props) {
  const isLarge = size === "large";
  const isModule = size === "module";
  const isCompact = size === "compact";
  const isVaultSubmoduleCard = cardKind === "module" && isModule;
  const isVaultHero = vaultHero && isLarge;
  const isVaultPackCard = cardKind === "pack" && isLarge && !isVaultHero;
  const isPack = !isModule;
  const showPackPriceBadge = (isLarge && isPack) || isVaultPackCard;
  const isLongPackPrice = offer.displayPrice.length > 5;
  const tradingMobileProgramFace = isTradingVaultModuleCard(offer, isModule);
  const portraitCoverArt = offer.imageMobileFit === "contain";
  const theme = PLAN_OFFER_THEMES[offer.accent];
  const spotlight = PACK_SPOTLIGHT[offer.accent];
  const spotlightStyle = highlighted
    ? ({
        ["--spotlight-a" as string]: spotlight.a,
        ["--spotlight-b" as string]: spotlight.b,
      } as CSSProperties)
    : undefined;

  return (
    <article
      id={`plan-offer-${offer.plan}`}
      data-plan-offer={offer.plan}
      data-globe-spotlight={highlighted ? "true" : undefined}
      style={spotlightStyle}
      className={cn(
        "plan-offer-card group/card relative flex w-full flex-col text-left scroll-mt-32",
        `plan-offer-card--${offer.accent}`,
        cardKind === "pack" && "plan-offer-card--vault-pack z-[1] hover:z-[10] focus-within:z-[10]",
        cardKind === "module" && "plan-offer-card--vault-module",
        highlighted && "program-card-globe-spotlight-host",
        isLarge && !isVaultHero && "mx-auto h-full min-h-0 max-w-none max-lg:min-h-0 sm:min-h-[30rem]",
        isVaultHero && "plan-offer-card--vault-hero mr-auto w-full max-w-[min(100%,20.5rem)] min-h-0 sm:max-w-[24rem]",
        isModule && "mx-auto h-full w-full min-h-[13rem] max-h-full sm:min-h-[15rem]",
        tradingMobileProgramFace && "max-xl:min-h-0",
        isCompact && "w-[min(90vw,272px)] shrink-0 sm:w-[260px] lg:w-[276px] min-h-[18rem] sm:min-h-[20rem]"
      )}
    >
      {highlighted ? (
        <>
          <span className="program-card-spotlight-field" style={spotlightStyle} aria-hidden />
          <span className={cn("program-card-spotlight-aura", theme.aura)} aria-hidden />
        </>
      ) : null}
      <div
        className={cn(
          "plan-offer-card__shell relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl transition-shadow duration-300",
          cardKind === "pack" && "z-[2]",
          !highlighted && !isModule && theme.glow,
          !highlighted && !isModule && theme.hoverGlow,
          isModule && "plan-offer-card__vault-module-shell",
          highlighted && "plan-offer-globe-border-glow"
        )}
      >
        {!highlighted && !isModule ? (
          <>
        <span
          className={cn("pointer-events-none absolute inset-[-22%] z-0 rounded-[2.2rem] blur-[38px] transition-[opacity,filter] duration-300 group-hover/card:opacity-100 group-hover/card:saturate-125", theme.aura)}
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
          </>
        ) : null}

        <span className={cn("relative z-[2] m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-[#04060d] ring-1 ring-black/70", highlighted && "border-2")}>
          {cardKind && !isVaultPackCard ? (
            <div
              className={cn(
                "relative z-[5] mx-3 mt-3 inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px]",
                cardKind === "pack"
                  ? "border-white/35 bg-white/10 text-white shadow-[0_0_18px_rgba(255,255,255,0.12)]"
                  : cn("bg-black/70", theme.priceBadge)
              )}
            >
              {cardKind === "pack" ? "Full pack" : "Module"}
            </div>
          ) : null}
          {inCart ? (
            <div className="relative z-[6] mx-3 mt-2 inline-flex w-fit items-center rounded-full border border-cyan-300/55 bg-cyan-950/40 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.28)] sm:text-[10px]">
              In bucket
            </div>
          ) : null}
          <div
            className={cn(
              "relative z-[3] flex h-full min-h-0 flex-col",
              isVaultPackCard ? "gap-0 p-0" : "gap-2",
              isLarge && !isVaultHero && !isVaultPackCard ? "p-3 sm:p-5" : isVaultHero ? "p-2.5 sm:p-3" : isModule ? "p-2 sm:p-2.5" : !isVaultPackCard ? "p-2 sm:p-2.5" : null,
              tradingMobileProgramFace && "max-xl:gap-0 max-xl:p-0"
            )}
          >
            <div
              className={cn(
                "relative w-full overflow-hidden",
                !isVaultPackCard && "rounded-2xl border-2 border-white/20",
                isVaultPackCard && "plan-offer-card__media plan-offer-card__media--vault-pack-fill rounded-t-[1.35rem] border-0",
                isLarge && isPack && !isVaultHero && "plan-offer-card__media min-h-[min(28dvh,9.5rem)] flex-1 sm:min-h-[18.5rem]",
                isVaultHero &&
                  isPack &&
                  "plan-offer-card__media plan-offer-card__media--vault-hero min-h-[8rem] max-h-[10rem] shrink-0 sm:min-h-[9rem] sm:max-h-[11rem]",
                portraitCoverArt &&
                  isLarge &&
                  isPack &&
                  !isVaultHero &&
                  "plan-offer-card__media--portrait-cover bg-[#050508] max-xl:aspect-[4/5] max-xl:min-h-[min(52dvh,16.5rem)] max-xl:max-h-[min(62dvh,22rem)] sm:max-xl:aspect-[3/4] sm:max-xl:min-h-[min(48dvh,20rem)] xl:aspect-[3/4] xl:max-h-[22rem] xl:min-h-[18.5rem]",
                portraitCoverArt &&
                  isVaultHero &&
                  isPack &&
                  "plan-offer-card__media--portrait-cover plan-offer-card__media--vault-hero bg-[#050508] aspect-[4/5] min-h-[8.5rem] max-h-[10.5rem] sm:aspect-[3/4] sm:min-h-[9rem] sm:max-h-[11rem]",
                isLarge && !isPack && !isVaultHero && "plan-offer-card__media aspect-[16/10] min-h-[min(24dvh,8.5rem)] shrink-0 sm:aspect-[4/3] sm:min-h-[15rem]",
                isVaultHero &&
                  !isPack &&
                  "plan-offer-card__media plan-offer-card__media--vault-hero aspect-[16/10] min-h-[7rem] max-h-[9rem] shrink-0 sm:min-h-[8rem] sm:max-h-[9.5rem]",
                isModule && "aspect-[16/10] min-h-[7rem] shrink-0 sm:min-h-[8.5rem]",
                tradingMobileProgramFace && "max-xl:aspect-video max-xl:min-h-0 max-xl:rounded-none max-xl:border-0",
                isCompact && isPack && "min-h-[11.5rem] flex-1 sm:min-h-[12.5rem]",
                portraitCoverArt &&
                  isCompact &&
                  isPack &&
                  "plan-offer-card__media--portrait-cover bg-[#050508] aspect-[4/5] min-h-[14rem] sm:aspect-[3/4] sm:min-h-[15rem]",
                isCompact && !isPack && "aspect-[4/3] min-h-[9.5rem] shrink-0"
              )}
            >
              <img
                src={nextOptimizedImageUrl(offer.imageSrc, isModule ? 480 : 828)}
                srcSet={nextOptimizedImageSrcSet(offer.imageSrc)}
                sizes={
                  isModule
                    ? "(max-width: 640px) 92vw, (max-width: 1024px) 44vw, 320px"
                    : "(max-width: 640px) 94vw, (max-width: 1024px) 46vw, 420px"
                }
                alt={offer.title}
                loading={isModule || offer.plan !== "bundle" ? "lazy" : "eager"}
                fetchPriority={offer.plan === "bundle" ? "high" : "low"}
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
                style={offer.imageObjectPosition ? { objectPosition: offer.imageObjectPosition } : undefined}
                className={cn(
                  "absolute inset-0 h-full w-full [image-rendering:high-quality]",
                  isVaultPackCard || !portraitCoverArt ? "object-cover object-center" : "object-contain object-center",
                  !portraitCoverArt &&
                    !offer.imageObjectPosition &&
                    (offer.plan === "bundle" ? "object-[center_38%]" : "object-center")
                )}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45" />
              {comingSoon ? (
                <span className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-3 text-center">
                  <span className="rounded-xl border border-amber-300/60 bg-black/80 px-4 py-2 text-[clamp(1rem,3.8vw,1.35rem)] font-black uppercase tracking-[0.14em] text-[#f5c814] sm:text-[1.15rem]">
                    {KNIGHT_LAUNCHING_SOON_LABEL}
                  </span>
                </span>
              ) : null}
              {isVaultPackCard ? (
                <span
                  className="absolute left-3 top-3 z-[5] inline-flex w-fit items-center rounded-full border border-white/35 bg-black/55 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_18px_rgba(255,255,255,0.12)] sm:text-[10px]"
                >
                  Full pack
                </span>
              ) : null}
            </div>

            <div
              className={cn(
                "absolute z-[4]",
                isVaultPackCard ? "right-3 top-3 sm:right-4 sm:top-4" : isLarge ? "right-4 top-4" : isVaultSubmoduleCard ? "right-0 top-0 z-[8] sm:right-0.5 sm:top-0.5" : "right-2 top-2"
              )}
            >
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center whitespace-nowrap border font-black tabular-nums tracking-normal",
                  theme.priceBadge,
                  showPackPriceBadge
                    ? cn(
                        "plan-offer-card__pack-price-badge rounded-md leading-none",
                        isLongPackPrice && "plan-offer-card__pack-price-badge--long",
                      )
                    : isVaultSubmoduleCard
                      ? "plan-offer-card__vault-price-badge rounded-md leading-none"
                      : cn("rounded-full px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-[12px]"),
                  isModule && !isVaultSubmoduleCard && !isLarge && "text-[10px] sm:text-[11px]"
                )}
                style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
              >
                {offer.displayPrice}
              </span>
            </div>

            <div
              className={cn(
                "plan-offer-card__info-panel flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 px-2.5 py-2 sm:px-3 sm:py-2.5",
                theme.infoPanel,
                isVaultPackCard && "plan-offer-card__vault-pack-body mx-2 mb-2 mt-2 sm:mx-3 sm:mb-3 sm:mt-2.5",
                isLarge && isPack && !isVaultHero && !isVaultPackCard && "min-h-[8.5rem] shrink-0 px-2 py-1.5 sm:min-h-[9.25rem] sm:px-2.5 sm:py-2",
                isVaultPackCard && "min-h-[8.5rem] shrink-0 px-2 py-1.5 sm:min-h-[9.25rem] sm:px-2.5 sm:py-2",
                isVaultHero && isPack && "min-h-0 shrink-0 px-2 py-1.5 sm:px-2.5 sm:py-2",
                isLarge && !isPack && !isVaultHero && "min-h-[12rem] sm:min-h-[13rem]",
                isVaultHero && !isPack && "min-h-0 shrink-0",
                isModule && "min-h-[7.5rem] sm:min-h-[8rem]",
                tradingMobileProgramFace && "max-xl:min-h-0 max-xl:justify-end max-xl:rounded-none max-xl:border-x-0 max-xl:border-b-0 max-xl:px-1 max-xl:py-1.5",
                isCompact && isPack && "shrink-0 px-2 py-1.5 sm:px-2.5 sm:py-2",
                "bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
              )}
            >
              <div
                className={cn(
                  "line-clamp-3 text-left font-extrabold uppercase leading-snug tracking-[0.04em] text-white sm:tracking-[0.07em]",
                  isLarge && isPack && "min-h-[2.2em] text-[clamp(11px,2.2vw,18px)]",
                  isLarge && !isPack && "min-h-[2.75em] text-[clamp(11px,2.2vw,18px)]",
                  isModule && "min-h-[2.75em] text-[10px] sm:text-[11px]",
                  tradingMobileProgramFace && "max-xl:line-clamp-2 max-xl:min-h-0 max-xl:text-[clamp(10px,2.4vw,17px)]",
                  isCompact && "text-[10px] sm:text-[11px]"
                )}
              >
                {offer.title}
              </div>

              {cardStats ? (
                <ProgramCardStatsLines
                  stats={cardStats}
                  size={size}
                  denseMobile={tradingMobileProgramFace}
                  className={cn("mt-1", tradingMobileProgramFace && "max-xl:mt-0.5")}
                />
              ) : null}

              {!isVaultHero ? (
                <ReadMoreText
                  text={offer.teaser}
                  maxLines={isLarge && isPack ? 6 : isModule ? 5 : 5}
                  className={cn(
                    isLarge && isPack && "mt-1",
                    isLarge && !isPack && "mt-1.5",
                    isModule && "mt-1.5",
                    isCompact && "mt-1",
                    tradingMobileProgramFace && "hidden xl:block"
                  )}
                  textClassName={cn(
                    "text-left font-medium text-white/72",
                    offer.plan === "bundle" && "text-[13px] leading-relaxed sm:text-[15px]",
                    isLarge && isPack && offer.plan !== "bundle" && "text-[11px] sm:text-[12px]",
                    isLarge && !isPack && "text-[11px] sm:text-[13px]",
                    isModule && "text-[9px] sm:text-[10px]",
                    isCompact && isPack && "text-[9px] sm:text-[10px]",
                    isCompact && !isPack && "text-[9px] sm:text-[10px]"
                  )}
                  buttonClassName={isModule || isCompact ? "text-[9px]" : undefined}
                />
              ) : null}
              <span className="sr-only">_</span>

              <div
                className={cn(
                  "grid grid-cols-2",
                  isLarge && isPack && "mt-1.5 gap-1.5 sm:gap-2",
                  isLarge && !isPack && "mt-2 gap-2 sm:gap-2.5",
                  isModule && "mt-2 gap-1",
                  tradingMobileProgramFace && "max-xl:mt-auto max-xl:gap-1.5",
                  isCompact && isPack && "mt-1.5 gap-1",
                  isCompact && !isPack && "mt-2 gap-1"
                )}
              >
                <button
                  type="button"
                  onClick={onDetails}
                  className={cn(
                    "min-w-0 rounded-xl border border-white/40 bg-black/55 font-black uppercase tracking-[0.09em] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#f5c814]/55 hover:text-[#ffe9a3]",
                    isLarge &&
                      isPack &&
                      "px-2 py-1.5 text-[clamp(10px,2vw,12px)] sm:px-2 sm:py-2 sm:tracking-[0.14em]",
                    isLarge &&
                      !isPack &&
                      "px-2 py-2 text-[clamp(10px,2vw,12px)] sm:px-2.5 sm:py-2.5 sm:tracking-[0.14em]",
                    isModule && "px-1.5 py-1.5 text-[9px] sm:text-[10px]",
                    isCompact && "px-1.5 py-1.5 text-[9px]"
                  )}
                >
                  {offer.detailsLabel ?? "Details"}
                </button>
                <button
                  type="button"
                  disabled={busy || comingSoon}
                  onClick={onOpen}
                  className={cn(
                    "min-w-0 rounded-xl border px-1.5 py-1.5 font-black uppercase tracking-[0.09em] transition disabled:opacity-65",
                    busy && !comingSoon && "disabled:cursor-wait",
                    comingSoon && "disabled:cursor-not-allowed",
                    theme.openBtn,
                    isLarge &&
                      isPack &&
                      "px-2 py-1.5 text-[clamp(10px,2vw,12px)] sm:px-2 sm:py-2 sm:tracking-[0.15em]",
                    isLarge &&
                      !isPack &&
                      "px-2 py-2 text-[clamp(10px,2vw,12px)] sm:px-2.5 sm:py-2.5 sm:tracking-[0.15em]",
                    isModule && "px-1.5 py-1.5 text-[9px] sm:text-[10px]",
                    isCompact && "text-[9px]"
                  )}
                >
                  {busy ? "Loading…" : actionLabel ?? offer.openLabel}
                </button>
              </div>
            </div>
          </div>
        </span>
      </div>
    </article>
  );
}
