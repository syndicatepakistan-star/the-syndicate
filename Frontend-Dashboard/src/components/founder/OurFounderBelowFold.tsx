"use client";

import dynamic from "next/dynamic";
import { LazyWhenVisible } from "@/components/LazyWhenVisible";

const OurFounderClipsSection = dynamic(
  () => import("@/components/founder/OurFounderClipsSection").then((m) => m.OurFounderClipsSection),
  {
    ssr: false,
    loading: () => <div className="min-h-[40vh] w-full" aria-hidden />,
  },
);

const GlobalBottomSections = dynamic(() => import("@/components/GlobalBottomSections"), {
  ssr: false,
  loading: () => <div className="min-h-[40vh] w-full bg-black" aria-hidden />,
});

/** Below-fold founder clips + footer — client-only so `ssr: false` is legal. */
export function OurFounderBelowFold() {
  return (
    <>
      <LazyWhenVisible
        minHeight="40vh"
        rootMargin="140px 0px"
        placeholder={<div className="min-h-[40vh] w-full" aria-hidden />}
      >
        <OurFounderClipsSection />
      </LazyWhenVisible>
      <LazyWhenVisible
        minHeight="40vh"
        rootMargin="220px 0px"
        placeholder={<div className="min-h-[40vh] w-full bg-black" aria-hidden />}
      >
        <GlobalBottomSections />
      </LazyWhenVisible>
    </>
  );
}
