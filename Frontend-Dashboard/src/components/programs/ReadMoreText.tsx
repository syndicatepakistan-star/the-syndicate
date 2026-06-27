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

/** Shared layout classes for vault picker modals — single inner scroll region. */
export const VAULT_MODAL_OVERLAY_CLASS =
  "fixed inset-0 z-[115] flex items-center justify-center overflow-hidden bg-black/90 p-3 backdrop-blur-sm sm:p-6";

export const VAULT_MODAL_PANEL_CLASS =
  "relative flex max-h-[min(95dvh,960px)] w-full max-w-[min(96vw,80rem)] flex-col overflow-hidden rounded-2xl border-2 bg-[#04060d]";

export const VAULT_MODAL_TOP_BAR_CLASS =
  "shrink-0 border-b border-white/10 bg-[#04060d] px-4 py-3 sm:px-6 sm:py-4";

export const VAULT_MODAL_HEADER_CLASS = VAULT_MODAL_TOP_BAR_CLASS;

export const VAULT_MODAL_BODY_CLASS =
  "vault-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-7 [scroll-behavior:auto] [-webkit-overflow-scrolling:touch]";
