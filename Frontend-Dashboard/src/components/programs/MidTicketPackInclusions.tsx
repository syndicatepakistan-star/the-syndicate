"use client";

import { cn } from "@/components/dashboard/dashboardPrimitives";
import { OfferInclusionsStatGrid } from "@/components/programs/OfferInclusionsStatGrid";
import type { VaultPackKey } from "@/components/programs/planOfferCatalog";
import { midTicketWhatYouGetBlocks } from "@/components/programs/midTicketPackStats";

type Props = {
  pack: VaultPackKey;
  className?: string;
  compact?: boolean;
  headingTone?: "orange" | "white";
};

function MidTicketPlusYouGetCell({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center px-2 py-2.5 text-center sm:px-3 sm:py-3",
      )}
    >
      <div className="flex items-baseline justify-center gap-1.5">
        <span
          className={cn(
            "programs-stat-neon font-black tabular-nums leading-none tracking-tight text-sky-400",
            "drop-shadow-[0_0_12px_rgba(56,189,248,0.65)]",
            compact ? "text-[1.55rem]" : "text-[1.85rem] sm:text-[2.15rem]",
          )}
        >
          $5k
        </span>
        <span
          className={cn(
            "font-semibold tracking-[0.04em] text-sky-300/90",
            compact ? "text-[9px]" : "text-[10px] sm:text-[11px]",
          )}
        >
          (Worth)
        </span>
      </div>
      <div
        className={cn(
          "mt-1.5 font-black uppercase leading-none tracking-[0.12em] text-[#f5c814]",
          compact ? "text-[12px]" : "text-[13px] sm:text-[15px]",
        )}
      >
        FREE Audit
      </div>
      <div
        className={cn(
          "mt-1.5 max-w-[16rem] font-medium leading-snug text-white/85",
          compact ? "text-[9px]" : "text-[10px] sm:text-[11px]",
        )}
      >
        Free Founder Audit Opportunity worth $5k
      </div>
    </div>
  );
}

/** Mid-ticket vault packs — Money Mastery-style What You Get / Plus You Get grid. */
export function MidTicketPackInclusions({
  pack,
  className,
  compact = false,
  headingTone = "white",
}: Props) {
  return (
    <OfferInclusionsStatGrid
      className={className}
      compact={compact}
      headingTone={headingTone}
      whatYouGet={midTicketWhatYouGetBlocks(pack)}
      plusYouGetContent={<MidTicketPlusYouGetCell compact={compact} />}
    />
  );
}
