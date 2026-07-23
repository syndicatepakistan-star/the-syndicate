"use client";

import { OfferInclusionsStatGrid } from "@/components/programs/OfferInclusionsStatGrid";
import {
  MONEY_MASTERY_CARD_PLUS_YOU_GET,
  MONEY_MASTERY_CARD_WHAT_YOU_GET,
} from "@/components/programs/planOfferCatalog";

type Props = {
  className?: string;
  compact?: boolean;
  headingTone?: "orange" | "white";
};

/**
 * Money Mastery card teaser — “What You Get” / “Plus You Get” stats grid
 * (large neon figure + unit + label).
 */
export function MoneyMasteryCardInclusions({
  className,
  compact = false,
  headingTone = "white",
}: Props) {
  return (
    <OfferInclusionsStatGrid
      className={className}
      compact={compact}
      headingTone={headingTone}
      whatYouGet={MONEY_MASTERY_CARD_WHAT_YOU_GET}
      plusYouGet={MONEY_MASTERY_CARD_PLUS_YOU_GET}
    />
  );
}
