"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { HomeDomeGallerySection } from "@/components/home/HomeBelowFoldSections";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";
import { warmProgramsSectionAssets } from "@/lib/mediaWarmCache";
import {
  filterCuratedGlobeTilesForMobile,
  GLOBE_GALLERY_IMAGE_URLS,
  MOBILE_GLOBE_GALLERY_IMAGE_URLS,
  MOBILE_GLOBE_TILE_COUNT,
} from "@/lib/programPlaylistThumbnails";

type DomeProps = ComponentProps<typeof HomeDomeGallerySection>;

type HomeGlobeSectionProps = {
  images: DomeProps["images"];
};

function GlobeSkeleton() {
  return (
    <div
      className="home-globe-skeleton flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-4 sm:min-h-[360px]"
      aria-hidden
    >
      <div className="h-3 w-40 animate-pulse rounded-full bg-amber-400/20 sm:w-56" />
      <div className="relative h-[min(52vh,420px)] w-[min(92vw,520px)] max-w-full">
        <div className="absolute inset-0 rounded-full border border-amber-400/15 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.08),transparent_68%)]" />
        <div className="absolute inset-[12%] animate-pulse rounded-full border border-cyan-400/10 bg-black/40" />
      </div>
    </div>
  );
}

/** Globe band: mounts + warms only when near viewport — keeps hero LCP uncontested. */
export function HomeGlobeSection({ images }: HomeGlobeSectionProps) {
  const hostRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const isMobile = useMatchMedia("(max-width: 767px)");

  const globeImages = useMemo(() => {
    if (!isMobile) return images;
    const pool = images ?? [];
    const mobileSrc = new Set(MOBILE_GLOBE_GALLERY_IMAGE_URLS);
    const filtered = pool.filter((item) => {
      const src = typeof item === "string" ? item : item.src;
      return mobileSrc.has(src);
    });
    return filtered.length > 0 ? filtered : filterCuratedGlobeTilesForMobile();
  }, [images, isMobile]);

  const warmUrls = isMobile ? MOBILE_GLOBE_GALLERY_IMAGE_URLS : GLOBE_GALLERY_IMAGE_URLS;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || active) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setActive(true);
        observer.disconnect();
      },
      { rootMargin: isMobile ? "180px 0px" : "240px 0px", threshold: 0.01 },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [active, isMobile]);

  useEffect(() => {
    if (!active) return;
    void warmProgramsSectionAssets(warmUrls);
    if (isMobile) return;

    // Prefetch below-fold bundles while globe warms so pricing/paywall load in parallel.
    void import("@/components/AnimatedPricingPage");
    void import("@/components/PaywallSnapshotsSection");
    const ric = window.requestIdleCallback;
    let idleHandle: number | undefined;
    let usedIdle = false;
    if (ric) {
      usedIdle = true;
      idleHandle = ric(
        () => {
          void warmProgramsSectionAssets(GLOBE_GALLERY_IMAGE_URLS.slice(MOBILE_GLOBE_TILE_COUNT));
        },
        { timeout: 4000 },
      );
    } else {
      idleHandle = window.setTimeout(() => {
        void warmProgramsSectionAssets(GLOBE_GALLERY_IMAGE_URLS.slice(MOBILE_GLOBE_TILE_COUNT));
      }, 1200);
    }
    return () => {
      if (idleHandle === undefined) return;
      if (usedIdle) window.cancelIdleCallback(idleHandle);
      else window.clearTimeout(idleHandle);
    };
  }, [active, isMobile, warmUrls]);

  return (
    <section
      ref={hostRef}
      id="programsGlobeSection"
      className="home-globe-section home-lazy-section relative flex w-full min-w-0 flex-col items-stretch overflow-hidden bg-[#050508] px-0 py-1 sm:items-center sm:py-0"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 42%, rgba(250,204,21,0.07), transparent 62%), linear-gradient(180deg, #050508 0%, #030306 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden opacity-[0.08] sm:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
        }}
      />

      <div className="relative z-10 flex min-h-0 w-full max-w-full flex-1 flex-col px-0 pt-1 sm:pt-8 md:pt-10">
        <h2 className="mb-1 shrink-0 text-center text-xl font-black uppercase sm:mb-8 sm:mt-0 sm:text-3xl md:text-4xl lg:text-5xl">
          <span className={publicHeadingLightning("amber")}>SYNDICATE ELITE PROGRAMS</span>
        </h2>
        <div className="min-h-0 w-full max-w-full flex-1 overflow-hidden">
          {active ? (
            <HomeDomeGallerySection
              images={globeImages}
              fit={isMobile ? 0.54 : 0.58}
              minRadius={isMobile ? 220 : 260}
              segments={isMobile ? MOBILE_GLOBE_TILE_COUNT : 18}
              dragSensitivity={isMobile ? 12 : 14}
              dragDampening={isMobile ? 4.2 : 3.6}
              maxVerticalRotationDeg={isMobile ? 28 : 32}
              grayscale={false}
              autoRotateSpeedDeg={isMobile ? 1.1 : 2.4}
              tileInsetPx={isMobile ? 10 : 12}
              navigateOnClick
              eagerImages={!isMobile}
            />
          ) : (
            <GlobeSkeleton />
          )}
        </div>
      </div>
    </section>
  );
}
