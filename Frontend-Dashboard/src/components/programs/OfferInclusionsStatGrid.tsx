"use client";

import type { ReactNode } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { GamingBenefitTone } from "@/components/GamingBenefitCards";
import {
  MONEY_MASTERY_PLUS_YOU_GET_TITLE,
  MONEY_MASTERY_WHAT_YOU_GET_TITLE,
  type MoneyMasteryStatBlock,
} from "@/components/programs/planOfferCatalog";

type Props = {
  whatYouGet: readonly MoneyMasteryStatBlock[];
  plusYouGet?: readonly MoneyMasteryStatBlock[];
  /** Custom Plus You Get body (mid-ticket founder audit). Overrides plusYouGet cells. */
  plusYouGetContent?: ReactNode;
  className?: string;
  compact?: boolean;
  headingTone?: "orange" | "white";
  whatYouGetTitle?: string;
  plusYouGetTitle?: string;
};

const TONE_NEON: Record<GamingBenefitTone, { figure: string; glow: string }> = {
  amber: {
    figure: "text-yellow-300",
    glow: "drop-shadow-[0_0_12px_rgba(253,224,71,0.65)]",
  },
  green: {
    figure: "text-emerald-400",
    glow: "drop-shadow-[0_0_12px_rgba(52,211,153,0.65)]",
  },
  gold: {
    figure: "text-yellow-300",
    glow: "drop-shadow-[0_0_12px_rgba(253,224,71,0.65)]",
  },
  pink: {
    figure: "text-pink-400",
    glow: "drop-shadow-[0_0_12px_rgba(244,114,182,0.65)]",
  },
  cyan: {
    figure: "text-sky-400",
    glow: "drop-shadow-[0_0_12px_rgba(56,189,248,0.65)]",
  },
  violet: {
    figure: "text-purple-400",
    glow: "drop-shadow-[0_0_12px_rgba(192,132,252,0.65)]",
  },
};

function StatCell({
  block,
  compact,
  className,
}: {
  block: MoneyMasteryStatBlock;
  compact?: boolean;
  className?: string;
}) {
  const neon = TONE_NEON[block.tone as GamingBenefitTone] ?? TONE_NEON.gold;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-1.5 py-2 text-center sm:px-2 sm:py-2.5",
        className,
      )}
    >
      <div
        className={cn(
          "font-black tabular-nums leading-none tracking-tight",
          neon.figure,
          neon.glow,
          compact ? "text-[1.55rem]" : "text-[1.85rem] sm:text-[2.15rem]",
        )}
      >
        {block.value}
      </div>
      {block.unit ? (
        <div
          className={cn(
            "mt-0.5 font-extrabold uppercase leading-none tracking-[0.08em]",
            neon.figure,
            compact ? "text-[9px]" : "text-[10px] sm:text-[11px]",
          )}
        >
          {block.unit}
        </div>
      ) : null}
      <div
        className={cn(
          "mt-1 max-w-[11rem] font-medium leading-snug text-white/90",
          compact ? "text-[9px]" : "text-[10px] sm:text-[11px]",
        )}
      >
        {block.label}
      </div>
    </div>
  );
}

function SectionHeading({
  children,
  compact,
  headingTone = "white",
}: {
  children: string;
  compact?: boolean;
  headingTone?: "orange" | "white";
}) {
  const isWhite = headingTone === "white";
  return (
    <h3
      className={cn(
        "mx-auto block w-full text-center font-black uppercase tracking-[0.14em]",
        isWhite
          ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
          : "text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.55)]",
        compact
          ? isWhite
            ? "text-[15px] sm:text-[16px]"
            : "text-[12px]"
          : isWhite
            ? "text-[18px] sm:text-[22px]"
            : "text-[13px] sm:text-[15px]",
      )}
    >
      {children}
    </h3>
  );
}

/** Shared “What You Get” / “Plus You Get” neon stats grid (Money Mastery + mid-ticket packs). */
export function OfferInclusionsStatGrid({
  whatYouGet,
  plusYouGet = [],
  plusYouGetContent,
  className,
  compact = false,
  headingTone = "white",
  whatYouGetTitle = MONEY_MASTERY_WHAT_YOU_GET_TITLE,
  plusYouGetTitle = MONEY_MASTERY_PLUS_YOU_GET_TITLE,
}: Props) {
  return (
    <div className={cn("mx-auto mt-1 w-full max-w-full text-center", className)}>
      <SectionHeading compact={compact} headingTone={headingTone}>
        {whatYouGetTitle}
      </SectionHeading>

      <div
        className={cn(
          "mx-auto mt-2 grid w-full grid-cols-2 overflow-hidden rounded-lg border border-white/10",
          "divide-x divide-y divide-white/10",
        )}
      >
        {whatYouGet.map((block) => (
          <StatCell key={`${block.value}-${block.label}`} block={block} compact={compact} />
        ))}
      </div>

      <div className="mt-3 w-full">
        <SectionHeading compact={compact} headingTone={headingTone}>
          {plusYouGetTitle}
        </SectionHeading>
      </div>

      <div className="mx-auto mt-2 flex w-full justify-center overflow-hidden rounded-lg border border-white/10">
        {plusYouGetContent ? (
          plusYouGetContent
        ) : (
          plusYouGet.map((block) => (
            <StatCell
              key={`${block.value}-${block.label}`}
              block={block}
              compact={compact}
              className="w-full"
            />
          ))
        )}
      </div>
    </div>
  );
}
