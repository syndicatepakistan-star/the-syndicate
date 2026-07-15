"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { PlanOfferAccent, PlanOfferDef } from "@/components/programs/planOfferCatalog";
import { isPlanOfferComingSoon, isPrimaryElitePlan, KNIGHT_LAUNCHING_SOON_LABEL, KNIGHT_LAUNCHING_SOON_MESSAGE } from "@/components/programs/planOfferCatalog";
import { EliteOfferBenefitsDetail } from "@/components/programs/EliteOfferBenefitsDetail";
import { isTradingModuleSlug, isTradingSubmoduleSlug, tradingSubmodulesForModule, type TradingModuleSlug } from "@/components/programs/tradingVaultCatalog";
import { isVaultPackKey, VAULT_PACK_MODAL_COPY } from "@/components/programs/vaultPackCatalog";
import { StructuredDescriptionBody } from "@/components/programs/StructuredDescriptionBody";
import { resolveOfferStructuredDescription } from "@/components/programs/vaultStructuredDescriptions";
import { ProgramCardStatsLines } from "@/components/programs/ProgramCardStatsLines";
import { resolveOfferCardStats } from "@/components/programs/vaultProgramCardStats";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type Props = {
  offer: PlanOfferDef | null;
  onClose: () => void;
};

const DETAIL_THEMES: Record<
  PlanOfferAccent,
  {
    modal: string;
    closeBtn: string;
    title: string;
    featureBorder: string;
    check: string;
  }
> = {
  amber: {
    modal: "border-cyan-400/45 shadow-[0_0_48px_rgba(34,211,238,0.22),inset_0_0_80px_rgba(168,85,247,0.08)]",
    closeBtn: "border-cyan-400/35 text-cyan-100 hover:border-cyan-300/60",
    title: "text-cyan-300",
    featureBorder: "border-cyan-400/55",
    check: "border-cyan-400/90 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.45)]",
  },
  cyan: {
    modal: "border-lime-400/40 shadow-[0_0_48px_rgba(163,230,53,0.18)]",
    closeBtn: "border-lime-400/35 text-lime-100 hover:border-lime-300/60",
    title: "text-lime-300",
    featureBorder: "border-lime-400/55",
    check: "border-lime-400/90 text-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.45)]",
  },
  pink: {
    modal: "border-fuchsia-400/50 shadow-[0_0_56px_rgba(236,72,153,0.35),0_0_100px_rgba(217,70,239,0.2),inset_0_0_80px_rgba(236,72,153,0.1)]",
    closeBtn: "border-fuchsia-400/40 text-fuchsia-100 hover:border-fuchsia-300/65",
    title: "text-fuchsia-300",
    featureBorder: "border-fuchsia-400/60",
    check: "border-fuchsia-400/90 text-fuchsia-300 shadow-[0_0_12px_rgba(236,72,153,0.55)]",
  },
  green: {
    modal: "border-emerald-400/50 shadow-[0_0_56px_rgba(52,211,153,0.35),0_0_100px_rgba(16,185,129,0.2),inset_0_0_80px_rgba(52,211,153,0.1)]",
    closeBtn: "border-emerald-400/40 text-emerald-100 hover:border-emerald-300/65",
    title: "text-emerald-300",
    featureBorder: "border-emerald-400/60",
    check: "border-emerald-400/90 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.55)]",
  },
  purple: {
    modal: "border-violet-400/50 shadow-[0_0_56px_rgba(168,85,247,0.35),0_0_100px_rgba(139,92,246,0.2),inset_0_0_80px_rgba(168,85,247,0.1)]",
    closeBtn: "border-violet-400/40 text-violet-100 hover:border-violet-300/65",
    title: "text-violet-300",
    featureBorder: "border-violet-400/60",
    check: "border-violet-400/90 text-violet-300 shadow-[0_0_12px_rgba(168,85,247,0.55)]",
  },
  red: {
    modal: "border-red-400/50 shadow-[0_0_56px_rgba(239,68,68,0.35),0_0_100px_rgba(220,38,38,0.2),inset_0_0_80px_rgba(239,68,68,0.1)]",
    closeBtn: "border-red-400/40 text-red-100 hover:border-red-300/65",
    title: "text-red-300",
    featureBorder: "border-red-400/60",
    check: "border-red-400/90 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.55)]",
  },
  orange: {
    modal: "border-orange-400/50 shadow-[0_0_56px_rgba(249,115,22,0.35),0_0_100px_rgba(234,88,12,0.2),inset_0_0_80px_rgba(249,115,22,0.1)]",
    closeBtn: "border-orange-400/40 text-orange-100 hover:border-orange-300/65",
    title: "text-orange-300",
    featureBorder: "border-orange-400/60",
    check: "border-orange-400/90 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.55)]",
  },
  blue: {
    modal: "border-blue-400/50 shadow-[0_0_56px_rgba(59,130,246,0.35),0_0_100px_rgba(37,99,235,0.2),inset_0_0_80px_rgba(59,130,246,0.1)]",
    closeBtn: "border-blue-400/40 text-blue-100 hover:border-blue-300/65",
    title: "text-blue-300",
    featureBorder: "border-blue-400/60",
    check: "border-blue-400/90 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.55)]",
  },
};

function OfferDetailCheck({ accent }: { accent: PlanOfferAccent }) {
  const theme = DETAIL_THEMES[accent];
  return (
    <span
      className={cn(
        "plan-offer-detail__check flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
        theme.check
      )}
      aria-hidden
    >
      <Check className="h-3 w-3 stroke-[3]" />
    </span>
  );
}

export function PlanOfferDetailModal({ offer, onClose }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useModalScrollLock(!!offer);

  useEffect(() => {
    if (!offer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [offer?.plan]);

  if (!offer || typeof document === "undefined") return null;

  const theme = DETAIL_THEMES[offer.accent];
  const isPackDetail = isVaultPackKey(offer.plan);
  const isTradingLesson = isTradingSubmoduleSlug(offer.plan);
  const isTradingModule = isTradingModuleSlug(offer.plan);
  const tradingSubmodules = isTradingModule
    ? tradingSubmodulesForModule(offer.plan as TradingModuleSlug)
    : [];
  const tradingPackTitle = VAULT_PACK_MODAL_COPY.trading_technical_analysis.title;
  const comingSoon = isPlanOfferComingSoon(offer);
  const structuredDescription = resolveOfferStructuredDescription(offer);
  const primaryElitePlan = isPrimaryElitePlan(offer.plan) ? offer.plan : null;
  const detailCardStats =
    isTradingModule || isTradingLesson ? resolveOfferCardStats(offer, isTradingModule ? "module" : undefined) : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-offer-detail-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "plan-offer-detail-modal plan-offer-detail-modal--scroll relative w-full overflow-hidden rounded-2xl border-2 bg-black max-w-[min(96vw,80rem)]",
          theme.modal
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute right-3 top-3 z-10 rounded-lg border bg-black/80 p-1.5 transition",
            theme.closeBtn
          )}
          aria-label="Close offer details"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="vault-modal-scroll max-h-[min(95dvh,960px)] overflow-y-auto overscroll-contain px-6 py-8 sm:px-10 sm:py-10 [scroll-behavior:auto] [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em]",
                isPackDetail
                  ? "border-white/35 bg-white/10 text-white"
                  : cn("bg-black/60", theme.featureBorder, theme.title)
              )}
            >
              {comingSoon ? KNIGHT_LAUNCHING_SOON_LABEL : isPackDetail ? "Full pack" : isTradingLesson ? "Lesson" : "Module"}
            </span>
          </div>

          {comingSoon ? (
            <p className="mt-4 rounded-xl border border-amber-300/50 bg-amber-950/30 px-4 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-amber-100/95">
              {KNIGHT_LAUNCHING_SOON_MESSAGE}
            </p>
          ) : null}

          <h2
            id="plan-offer-detail-title"
            className={cn(
              "plan-offer-detail__title mt-4 text-[clamp(2rem,6vw,3.25rem)] font-black uppercase leading-[0.92] tracking-[0.04em]",
              theme.title
            )}
          >
            {offer.detailTitle}
          </h2>

          <div className="mt-5 flex flex-wrap items-end gap-x-2 gap-y-1">
            <span className="font-mono text-lg text-white/40 line-through decoration-white/35 sm:text-xl">
              {offer.comparePrice}
            </span>
            <span
              className="font-mono text-[clamp(2.5rem,9vw,4rem)] font-black leading-none tracking-tight text-white"
              style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
            >
              {offer.displayPrice}
            </span>
            <span className="pb-1 font-mono text-sm text-white/55 sm:text-base">
              {offer.billingLabel}
              {offer.billingLabel.includes("lifetime") ? "" : " · one-time"}
            </span>
          </div>

          {detailCardStats ? (
            <ProgramCardStatsLines stats={detailCardStats} size="large" className="mt-5" />
          ) : null}

          {isTradingModule || isTradingLesson ? (
            <p className="mt-4 text-left text-[13px] font-medium leading-relaxed text-white/78 sm:text-[14px]">
              {offer.teaser}
            </p>
          ) : null}

          <div className="mt-6 w-full font-[family-name:var(--font-body)]">
            {isTradingModule ? (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Full pack</p>
                <div
                  className={cn(
                    "mt-3 flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3",
                    theme.featureBorder
                  )}
                >
                  <OfferDetailCheck accent={offer.accent} />
                  <span className="min-w-0 font-mono text-[11px] leading-snug text-white/88 sm:text-[13px]">
                    {tradingPackTitle}
                  </span>
                </div>

                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Included lessons ({tradingSubmodules.length})
                </p>
                <ul className="mt-3 space-y-3" role="list">
                  {tradingSubmodules.map((lesson) => (
                    <li key={lesson.slug}>
                      <div
                        className={cn(
                          "plan-offer-detail__feature flex h-full items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3",
                          theme.featureBorder
                        )}
                      >
                        <OfferDetailCheck accent={offer.accent} />
                        <span className="min-w-0 font-mono text-[11px] leading-snug text-white/88 sm:text-[13px]">
                          {lesson.title}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-white/10 pt-8">
                  <StructuredDescriptionBody
                    text={structuredDescription}
                    prominent
                    omitSections={["what_you_will_learn"]}
                  />
                </div>
              </>
            ) : primaryElitePlan ? (
              <EliteOfferBenefitsDetail plan={primaryElitePlan} />
            ) : (
              <StructuredDescriptionBody text={structuredDescription} prominent />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
