"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";

/**
 * Bold + highlight stats in Money Mastery / pack copy:
 * dollar amounts, durations, video/project counts, pack sizes.
 */
export function highlightOfferStatFigures(text: string, className?: string): ReactNode {
  const pattern =
    /(\$\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+\s*hrs?\s+\d+\s*min|\d+\s+AI\s+projects?|\d+\s+videos?|\d+\s+different\s+(?:business\s+models|behavioural\s+programmes)|\d+\s+lessons?)/gi;

  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  const source = text;
  while ((match = pattern.exec(source)) !== null) {
    if (match.index > last) {
      parts.push(<Fragment key={`t-${key++}`}>{source.slice(last, match.index)}</Fragment>);
    }
    parts.push(
      <strong
        key={`h-${key++}`}
        className={cn("font-black tabular-nums", className ?? "text-[#f5c814]")}
      >
        {match[0]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < source.length) {
    parts.push(<Fragment key={`t-${key++}`}>{source.slice(last)}</Fragment>);
  }
  return parts.length > 0 ? parts : text;
}
