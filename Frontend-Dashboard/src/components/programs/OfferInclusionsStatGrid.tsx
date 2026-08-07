"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { GamingBenefitTone } from "@/components/GamingBenefitCards";
import {
  MONEY_MASTERY_PLUS_YOU_GET_TITLE,
  MONEY_MASTERY_WHAT_YOU_GET_TITLE,
  type MoneyMasteryStatBlock,
} from "@/components/programs/planOfferCatalog";
import { thryonHeadingFont } from "@/lib/thryonHeadingFont";

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
  orange: {
    figure: "text-orange-400",
    glow: "drop-shadow-[0_0_12px_rgba(251,146,60,0.65)]",
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

function highlightCorePhrases({
  text,
  neon,
  compact,
  variant,
}: {
  text: string;
  neon: { figure: string; glow: string };
  compact: boolean | undefined;
  variant: "label" | "label2";
}) {
  // Highlights only the requested parts to keep layout/design unchanged.
  // Targets (examples):
  // - "Build 30 AI Projects" => 30 + Projects
  // - "Learn 23 Advanced Trading Strategies" => 23 + Trading Strategies
  const tokenRe = /(\b30\b|\b28\b|\b23\b|\bProjects\b|Trading\s+Strategies)/gi;
  const highlightSize =
    variant === "label"
      ? compact
        ? "text-[inherit]"
        : "text-[14px] sm:text-[15px]"
      : compact
        ? "text-[inherit]"
        : "text-[13px] sm:text-[14px]";

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  // eslint-disable-next-line no-cond-assign
  while ((match = tokenRe.exec(text))) {
    const start = match.index;
    const end = start + match[0].length;

    if (start > lastIndex) parts.push(text.slice(lastIndex, start));

    parts.push(
      <span
        key={`hl-${key++}`}
        className={cn("programs-stat-neon font-black leading-snug", neon.figure, neon.glow, highlightSize)}
      >
        {text.slice(start, end)}
      </span>,
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

function StatCell({
  block,
  compact,
  className,
  unitUppercase = true,
  /** Level 1 psychology / business model cards — larger digits, tight vertical budget. */
  enlarge = false,
}: {
  block: MoneyMasteryStatBlock;
  compact?: boolean;
  className?: string;
  /** Mid-ticket packs use uppercase units; Level 1 cards keep title-case Hrs/Min. */
  unitUppercase?: boolean;
  enlarge?: boolean;
}) {
  const neon = TONE_NEON[block.tone as GamingBenefitTone] ?? TONE_NEON.gold;
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col items-center text-center",
        enlarge
          ? "justify-start gap-0 px-0.5 pb-1.5 pt-1 sm:px-1 sm:pb-2 sm:pt-1.5"
          : "justify-center px-1.5 py-2 sm:px-2 sm:py-2.5",
        className,
      )}
    >
      {/* Fixed digit band so every cell's number shares the same baseline. */}
      <div
        className={cn(
          "flex w-full shrink-0 items-end justify-center",
          enlarge ? "h-[2.05rem] sm:h-[2.15rem] md:h-[2.25rem]" : "min-h-[1.85rem]",
        )}
      >
        <div
          className={cn(
            "programs-stat-neon font-black tabular-nums leading-none tracking-tight",
            neon.figure,
            neon.glow,
            enlarge
              ? "text-[clamp(1.75rem,5.2vw,2.05rem)] sm:text-[2.05rem] md:text-[2.15rem]"
              : compact
                ? "text-[1.55rem]"
                : "text-[1.85rem] sm:text-[2.15rem]",
          )}
        >
          {block.value}
        </div>
      </div>
      {/* Always reserve unit row height so labels stay level across cells. */}
      <div
        className={cn(
          "flex w-full shrink-0 items-start justify-center",
          enlarge ? "mt-px h-[0.95rem] sm:h-[1.05rem]" : "mt-0.5 min-h-[0.75rem]",
        )}
        aria-hidden={!block.unit}
      >
        {block.unit ? (
          <div
            className={cn(
              "font-extrabold leading-none tracking-[0.06em]",
              unitUppercase && "uppercase tracking-[0.08em]",
              neon.figure,
              enlarge
                ? "text-[12px] sm:text-[13px]"
                : compact
                  ? "text-[9px]"
                  : "text-[10px] sm:text-[11px]",
            )}
          >
            {block.unit}
          </div>
        ) : (
          <span className="invisible text-[12px] leading-none sm:text-[13px]">Hrs</span>
        )}
      </div>
      <div
        className={cn(
          "w-full font-mono font-medium leading-tight text-white/90",
          enlarge
            ? "mt-0.5 line-clamp-2 min-h-[2.05rem] max-w-full text-[10px] leading-[1.2] sm:min-h-[2.2rem] sm:text-[11px]"
            : compact
              ? "mt-1 max-w-full text-[8px] sm:text-[9px]"
              : "mt-1 max-w-[11rem] text-[10px] sm:text-[11px]",
        )}
      >
        {highlightCorePhrases({
          text: block.label,
          neon,
          compact: true,
          variant: "label",
        })}
      </div>
      {block.label2 ? (
        <div
          className={cn(
            "mt-0.5 max-w-[11rem] font-mono font-medium leading-snug text-white/65",
            enlarge
              ? "text-[10px]"
              : compact
                ? "text-[8px]"
                : "text-[9px] sm:text-[10px]",
          )}
        >
          {highlightCorePhrases({
            text: block.label2,
            neon,
            compact: true,
            variant: "label2",
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Neon figure + unit + label grid only (no “What You Get” / “Plus You Get” headings). */
export function NeonStatGrid({
  stats,
  className,
  compact = false,
  columns,
}: {
  stats: readonly MoneyMasteryStatBlock[];
  className?: string;
  compact?: boolean;
  /** Column count; 3 = one row (Videos | Projects | Watch Time). */
  columns?: 2 | 3 | 4;
}) {
  if (!stats.length) return null;
  const cols = columns ?? (stats.length >= 3 ? 3 : 2);
  return (
    <div
      className={cn(
        "mx-auto grid h-full w-full items-stretch overflow-hidden rounded-lg border border-white/10",
        "divide-x divide-white/10",
        cols === 3 ? "grid-cols-3" : "grid-cols-2",
        className,
      )}
    >
      {stats.map((block) => (
        <StatCell
          key={`${block.value}-${block.unit}-${block.label}`}
          block={block}
          compact={compact || cols === 3}
          unitUppercase={false}
          enlarge
          className={cols === 3 ? "min-w-0 px-0.5" : undefined}
        />
      ))}
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
  const ref = useRef<HTMLParagraphElement>(null);

  // Beat any stale SW/CSS `font-mono !important` that was locking these labels to CS Daine.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const family = `${thryonHeadingFont.style.fontFamily}, "Thryon", "Thyron", sans-serif`;
    el.style.setProperty("font-family", family, "important");
    el.style.setProperty("font-weight", "400", "important");
    el.style.setProperty("font-synthesis", "none", "important");
  }, []);

  // <p> not <h3>: avoids h1→h3 skip under Elite Offers (Lighthouse heading-order).
  // Thryon only has one weight — “bolder” via size + glow, not font-black (destroys strokes).
  return (
    <p
      ref={ref}
      className={cn(
        thryonHeadingFont.className,
        "programs-stat-heading mx-auto block w-full text-center font-normal uppercase tracking-[0.16em]",
        isWhite
          ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.55)]"
          : "programs-stat-heading--orange text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.55)]",
        compact
          ? isWhite
            ? "text-[17px] sm:text-[19px]"
            : "text-[14px]"
          : isWhite
            ? "text-[22px] sm:text-[26px]"
            : "text-[15px] sm:text-[17px]",
      )}
    >
      {children}
    </p>
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
