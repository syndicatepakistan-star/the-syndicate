"use client";

import type { ReactNode } from "react";
import { LazyWhenVisible } from "@/components/LazyWhenVisible";

type Props = {
  children: ReactNode;
  /** Reserve space before the card mounts (limits layout shift). */
  minHeight?: string;
  /** Earlier prefetch for images while scrolling the vault modal. */
  rootMargin?: string;
};

/** Defers vault module card mount + images until near the viewport. */
export function LazyVaultModuleCell({
  children,
  minHeight = "clamp(12rem,28vw,16rem)",
  rootMargin = "520px 0px",
}: Props) {
  return (
    <div className="vault-module-cell">
      <LazyWhenVisible
        minHeight={minHeight}
        rootMargin={rootMargin}
        className="flex w-full min-w-0 justify-center"
        placeholder={
          <div
            className="w-full max-w-[min(100%,22rem)] rounded-2xl border border-white/10 bg-white/[0.04]"
            style={{ minHeight }}
            aria-hidden
          />
        }
      >
        {children}
      </LazyWhenVisible>
    </div>
  );
}
