"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { PlanOfferDef } from "@/components/programs/planOfferCatalog";
import { MoneyMasteryCardInclusions } from "@/components/programs/MoneyMasteryCardInclusions";
import { StructuredDescriptionBody } from "@/components/programs/StructuredDescriptionBody";
import { resolveOfferStructuredDescription } from "@/components/programs/vaultStructuredDescriptions";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type Props = {
  offer: PlanOfferDef | null;
  onClose: () => void;
};

/** Readable body copy + 20pt section headings with distinct neon colors. */
const DESCRIPTION_TYPOGRAPHY = cn(
  "[&_p]:text-[16px]! [&_p]:leading-[1.8]! sm:[&_p]:text-[18px]!",
  "[&_li]:text-[16px]! [&_li]:leading-[1.7]! sm:[&_li]:text-[18px]!",
  "[&_h3]:text-[20pt]! [&_h3]:leading-snug!",
);

/** Full offer description popup opened from card "Read more" links. */
export function OfferDescriptionModal({ offer, onClose }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useModalScrollLock(!!offer);

  useEffect(() => {
    if (!offer || typeof document === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [offer?.plan]);

  const description = useMemo(
    () => (offer ? resolveOfferStructuredDescription(offer) : ""),
    [offer],
  );

  if (!offer || typeof document === "undefined") return null;

  const tree = (
    <div
      className="fixed inset-0 isolate flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#020307] p-2 font-[family-name:var(--font-body)] sm:p-6"
      style={{ zIndex: 2147483647 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-desc-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_42%),rgba(0,0,0,0.97)]"
        onClick={onClose}
        aria-label="Close description"
      />
      <div
        className={cn(
          "relative z-[1] flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-[80rem] flex-col overflow-hidden rounded-2xl border-2 border-[#f5c814]/60 sm:h-[calc(100dvh-3rem)]",
          "bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(6,6,8,0.99))] shadow-[0_0_40px_rgba(245,200,20,0.25),0_24px_80px_rgba(0,0,0,0.85)]",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-black/70 px-4 py-4 sm:px-8 sm:py-5">
          <h2
            id="offer-desc-modal-title"
            className="min-w-0 flex-1 text-left text-[20pt] font-bold uppercase leading-tight tracking-[0.04em] text-[#f5c814]"
          >
            {offer.detailTitle || offer.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/20 bg-black/50 p-2 text-white/80 transition hover:border-[#f5c814]/60 hover:text-[#f5c814]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div
          className="vault-modal-scroll min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-scroll overscroll-contain px-4 py-6 sm:px-8 sm:py-9 [-webkit-overflow-scrolling:touch] [scroll-behavior:auto]"
          tabIndex={0}
        >
          {offer.plan === "bundle" ? (
            <MoneyMasteryCardInclusions className="mx-auto max-w-xl" />
          ) : (
            <StructuredDescriptionBody
              text={description || offer.detailDescription || offer.teaser}
              prominent
              className={cn("w-full max-w-none pb-2", DESCRIPTION_TYPOGRAPHY)}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(tree, document.body);
}
