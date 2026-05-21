"use client";

import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { PlanOfferDef } from "@/components/programs/planOfferCatalog";

type Props = {
  offer: PlanOfferDef;
  size?: "large" | "compact";
  busy?: boolean;
  onDetails: () => void;
  onOpen: () => void;
};

export function PlanOfferCard({ offer, size = "large", busy = false, onDetails, onOpen }: Props) {
  const isLarge = size === "large";
  const accent = offer.accent;

  return (
    <article
      className={cn(
        "plan-offer-card group/offer relative flex flex-col outline-none",
        `plan-offer-card--${accent}`,
        isLarge
          ? "mx-auto w-full max-w-[420px] sm:max-w-none"
          : "w-[min(90vw,272px)] shrink-0 sm:w-[260px] lg:w-[276px]"
      )}
    >
      <span className="plan-offer-card__shell relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <div
          className={cn(
            "plan-offer-card__media relative w-full shrink-0 overflow-hidden border-b",
            isLarge ? "aspect-[5/4] sm:aspect-[4/3]" : "aspect-[4/3]"
          )}
        >
          <img
            src={offer.imageSrc}
            alt={offer.title}
            loading={offer.plan === "bundle" ? "eager" : "lazy"}
            fetchPriority={offer.plan === "bundle" ? "high" : undefined}
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            className="h-full w-full object-cover object-center [image-rendering:high-quality]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/35 to-black/25" />
        </div>

        <div className={cn("plan-offer-card__panel flex flex-col", isLarge ? "gap-2 p-3 sm:p-4" : "gap-1.5 p-2")}>
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "min-w-0 flex-1 font-mono font-black uppercase leading-tight tracking-[0.08em] text-white",
                isLarge ? "text-[12px] sm:text-[14px]" : "text-[10px]"
              )}
            >
              {offer.title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded border px-2 py-0.5 font-mono font-black tabular-nums",
                accent === "amber"
                  ? "border-amber-300/60 bg-amber-950/70 text-amber-100"
                  : "border-cyan-300/60 bg-cyan-950/70 text-cyan-100",
                isLarge ? "text-[11px] sm:text-[12px]" : "text-[9px]"
              )}
            >
              {offer.displayPrice}
            </span>
          </div>

          <p
            className={cn(
              "plan-offer-card__teaser font-mono leading-snug text-white/72",
              isLarge ? "text-[11px] sm:text-[12px] sm:leading-relaxed" : "line-clamp-3 text-[9px]"
            )}
          >
            {offer.teaser}
            <span className="text-cyan-300/90">_</span>
          </p>

          <div className={cn("grid grid-cols-2", isLarge ? "mt-1 gap-1.5 sm:gap-2" : "mt-0.5 gap-1")}>
            <button
              type="button"
              onClick={onDetails}
              className={cn(
                "min-w-0 rounded-lg border border-white/40 bg-black/55 font-mono font-black uppercase tracking-[0.1em] text-white/95 transition",
                "hover:border-cyan-300/55 hover:text-cyan-100",
                isLarge ? "px-2 py-2 text-[9px] sm:py-2.5 sm:text-[10px] sm:tracking-[0.12em]" : "px-1.5 py-1.5 text-[9px]"
              )}
            >
              Details
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onOpen}
              className={cn(
                "plan-offer-card__open min-w-0 rounded-lg border font-mono font-black uppercase tracking-[0.1em] transition",
                "disabled:cursor-wait disabled:opacity-65",
                isLarge ? "px-2 py-2 text-[9px] sm:py-2.5 sm:text-[10px] sm:tracking-[0.12em]" : "px-1.5 py-1.5 text-[9px]"
              )}
            >
              {busy ? "Loading…" : offer.openLabel}
            </button>
          </div>
        </div>
      </span>
    </article>
  );
}
