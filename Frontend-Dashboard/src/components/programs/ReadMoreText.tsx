"use client";

import { useState } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  text: string;
  /** Collapsed line count before "Read more". */
  maxLines?: 5 | 6;
  className?: string;
  textClassName?: string;
  buttonClassName?: string;
  /** Approx. character count before showing the toggle. */
  collapseThreshold?: number;
};

const LINE_CLAMP: Record<5 | 6, string> = {
  5: "line-clamp-5",
  6: "line-clamp-6",
};

export function ReadMoreText({
  text,
  maxLines = 6,
  className,
  textClassName,
  buttonClassName,
  collapseThreshold = 260,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > collapseThreshold;

  return (
    <div className={className}>
      <p
        className={cn(
          "leading-relaxed",
          !expanded && needsToggle && LINE_CLAMP[maxLines],
          textClassName
        )}
      >
        {text}
      </p>
      {needsToggle ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((value) => !value);
          }}
          className={cn(
            "mt-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300/90 transition hover:text-cyan-100 sm:text-[11px]",
            buttonClassName
          )}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

/** Shared layout classes for vault picker modals — header stays visible, body scrolls. */
export const VAULT_MODAL_OVERLAY_CLASS =
  "fixed inset-0 z-[115] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/90 px-3 pb-6 pt-5 backdrop-blur-sm sm:px-6 sm:pb-8 sm:pt-8 [scroll-behavior:auto] [-webkit-overflow-scrolling:touch]";

export const VAULT_MODAL_PANEL_CLASS =
  "relative flex max-h-[min(calc(100dvh-2.5rem),920px)] w-full max-w-[90rem] flex-col overflow-hidden rounded-2xl border-2 bg-[#04060d]";

export const VAULT_MODAL_HEADER_CLASS =
  "sticky top-0 z-20 shrink-0 border-b border-white/10 bg-[#04060d]/98 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4";

export const VAULT_MODAL_BODY_CLASS =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-7 [scroll-behavior:auto] [-webkit-overflow-scrolling:touch]";
