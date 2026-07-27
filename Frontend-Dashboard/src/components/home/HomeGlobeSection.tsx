"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { HomeDomeGallerySection } from "@/components/home/HomeBelowFoldSections";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";
import { LoopBgVideo } from "@/components/marketing/LoopBgVideo";
import { warmProgramsSectionAssets } from "@/lib/mediaWarmCache";
import {
  filterCuratedGlobeTilesForMobile,
  GLOBE_GALLERY_IMAGE_URLS,
  lightenGlobeTilesForMobile,
  MOBILE_GLOBE_GALLERY_IMAGE_URLS,
  warmGlobeTileUrls,
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
    const curated = filterCuratedGlobeTilesForMobile().map((tile) => ({
      src: tile.src,
      alt: tile.alt,
      href: tile.href,
    }));
    // Prefer filtered props when they cover ≥10 tiles; otherwise use the curated mobile set.
    const base = filtered.length >= 10 ? filtered : curated;
    return lightenGlobeTilesForMobile(
      base.map((item) =>
        typeof item === "string"
          ? { src: item }
          : { src: item.src, alt: item.alt, href: item.href },
      ),
    );
  }, [images, isMobile]);

  const warmUrls = useMemo(() => {
    if (!isMobile) return GLOBE_GALLERY_IMAGE_URLS;
    return warmGlobeTileUrls(filterCuratedGlobeTilesForMobile());
  }, [isMobile]);

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

    // Below-fold pricing/paywall load via LazyWhenVisible — do not force their JS while globe warms.
    const ric = window.requestIdleCallback;
    let idleHandle: number | undefined;
    let usedIdle = false;
    if (ric) {
      usedIdle = true;
      idleHandle = ric(
        () => {
          void warmProgramsSectionAssets(GLOBE_GALLERY_IMAGE_URLS.slice(12));
        },
        { timeout: 4000 },
      );
    } else {
      idleHandle = window.setTimeout(() => {
        void warmProgramsSectionAssets(GLOBE_GALLERY_IMAGE_URLS.slice(12));
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
      className="home-globe-section home-lazy-section relative flex w-full min-w-0 flex-col items-stretch overflow-hidden bg-black px-0 py-1 sm:items-center sm:py-0"
    >
      {active ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <LoopBgVideo className="absolute inset-0 h-full w-full" scrimOpacity={0.58} videoOpacity={0.55} />
        </div>
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 42%, rgba(250,204,21,0.07), transparent 62%), linear-gradient(180deg, rgba(5,5,8,0.72) 0%, rgba(3,3,6,0.88) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden opacity-[0.08] sm:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
        }}
      />

      <div className="relative z-10 flex min-h-0 w-full max-w-full flex-1 flex-col px-0 pt-1 sm:pt-8 md:pt-10">
        <h2 className="mb-1 shrink-0 text-center text-xl font-black uppercase sm:mb-8 sm:mt-0 sm:text-3xl md:text-4xl lg:text-5xl">
          <span className={publicHeadingLightning("amber")}>SYNDICATE ELITE PROGRAMS</span>
        </h2>
        <div className="relative min-h-0 w-full max-w-full flex-1 overflow-hidden">
          {active ? (
            <HomeDomeGallerySection
              images={globeImages}
              fit={isMobile ? 0.44 : 0.58}
              minRadius={isMobile ? 128 : 260}
              maxRadius={isMobile ? 210 : Number.POSITIVE_INFINITY}
              segments={isMobile ? 12 : 18}
              dragSensitivity={isMobile ? 12 : 14}
              dragDampening={isMobile ? 4.2 : 3.6}
              maxVerticalRotationDeg={isMobile ? 26 : 32}
              grayscale={false}
              autoRotateSpeedDeg={isMobile ? 1.25 : 2.4}
              tileInsetPx={isMobile ? 6 : 12}
              navigateOnClick
              eagerImages={!isMobile}
            />
          ) : (
            <GlobeSkeleton />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end px-2 pb-2 sm:px-6 sm:pb-5 md:px-8 md:pb-6">
            <div className="pointer-events-auto group relative bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 p-[1px] shadow-[0_0_24px_rgba(251,191,36,0.35)] [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)] transition duration-300 hover:shadow-[0_0_32px_rgba(251,191,36,0.55)]">
              <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[8px]" aria-hidden />
              <Link
                href="/programs"
                prefetch
                className="relative inline-flex min-h-[40px] items-center justify-center bg-[#05070c]/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-50 [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)] transition duration-300 hover:bg-[#070b14]/95 sm:min-h-[48px] sm:px-6 sm:py-2.5 sm:text-[13px] sm:tracking-[0.14em]"
              >
                View All Programs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
