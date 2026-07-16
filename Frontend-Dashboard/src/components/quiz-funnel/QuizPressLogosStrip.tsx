"use client";

import dynamic from "next/dynamic";
import { PRESS_FEATURED_LOGOS } from "@/lib/heroFeaturedLogos";

const FeaturedLogosStrip = dynamic(() => import("@/components/FeaturedLogosStrip"), {
  ssr: false,
  loading: () => <div className="quiz-press-logo-strip-slot" aria-hidden />,
});

/** Client-only wrapper — `ssr: false` is illegal in Server Components. */
export function QuizPressLogosStrip() {
  return (
    <div className="quiz-press-logo-strip-slot">
      <FeaturedLogosStrip
        logos={[...PRESS_FEATURED_LOGOS]}
        speedSeconds={40}
        compact
        className="quiz-press-logo-strip"
      />
    </div>
  );
}
