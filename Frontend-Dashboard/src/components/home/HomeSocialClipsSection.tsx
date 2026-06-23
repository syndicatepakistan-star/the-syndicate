"use client";

import Image from "next/image";
import { type CSSProperties } from "react";
import { LazyWhenVisible } from "@/components/LazyWhenVisible";
import { HomeSectionPlaceholder } from "@/components/home/HomeSectionPlaceholder";
import { IntersectionDeferredMp4 } from "@/components/home/DeferredHomeBackgrounds";
import { useInViewRef } from "@/hooks/useInViewRef";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import { TIKTOK_MOST_INFORMATIVE } from "@/data/tiktok-most-informative";
import { TIKTOK_MOST_VIEWED } from "@/data/tiktok-most-viewed";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

const SOCIAL_CARD_BORDER_THEMES = [
  {
    frame: "border-[6px] border-red-400 hover:border-red-300",
    glow: "shadow-[0_0_0_1px_rgba(248,113,113,0.9),0_0_22px_rgba(248,113,113,0.86),0_0_56px_rgba(248,113,113,0.72),0_0_108px_rgba(248,113,113,0.56),inset_0_0_20px_rgba(248,113,113,0.27)] hover:shadow-[0_0_0_1px_rgba(252,165,165,0.95),0_0_26px_rgba(252,165,165,0.9),0_0_64px_rgba(252,165,165,0.75),0_0_116px_rgba(252,165,165,0.62),inset_0_0_22px_rgba(252,165,165,0.34)]",
    inner: "border-red-500/75",
    chip: "border-red-500 bg-red-900/75 shadow-[0_0_18px_rgba(127,29,29,0.95)]",
    bgGlow:
      "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(127,29,29,0.55),rgba(127,29,29,0.18)_44%,rgba(12,4,4,0.72)_72%,transparent_86%)]",
    lightningColor: "rgba(248,113,113,0.96)",
    lightningSoft: "rgba(248,113,113,0.62)",
  },
  {
    frame: "border-[6px] border-cyan-300 hover:border-cyan-200",
    glow: "shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)] hover:shadow-[0_0_0_1px_rgba(103,232,249,0.95),0_0_26px_rgba(103,232,249,0.9),0_0_64px_rgba(103,232,249,0.75),0_0_116px_rgba(103,232,249,0.62),inset_0_0_22px_rgba(103,232,249,0.34)]",
    inner: "border-cyan-500/75",
    chip: "border-cyan-500 bg-cyan-900/75 shadow-[0_0_18px_rgba(14,116,144,0.95)]",
    bgGlow:
      "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(14,116,144,0.55),rgba(14,116,144,0.18)_44%,rgba(3,14,18,0.72)_72%,transparent_86%)]",
    lightningColor: "rgba(56,189,248,0.96)",
    lightningSoft: "rgba(56,189,248,0.62)",
  },
  {
    frame: "border-[6px] border-fuchsia-400 hover:border-fuchsia-300",
    glow: "shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_22px_rgba(232,121,249,0.86),0_0_56px_rgba(232,121,249,0.72),0_0_108px_rgba(232,121,249,0.56),inset_0_0_20px_rgba(232,121,249,0.27)] hover:shadow-[0_0_0_1px_rgba(244,114,182,0.95),0_0_26px_rgba(244,114,182,0.9),0_0_64px_rgba(244,114,182,0.75),0_0_116px_rgba(244,114,182,0.62),inset_0_0_22px_rgba(244,114,182,0.34)]",
    inner: "border-violet-500/75",
    chip: "border-violet-500 bg-violet-900/75 shadow-[0_0_18px_rgba(91,33,182,0.95)]",
    bgGlow:
      "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(91,33,182,0.55),rgba(91,33,182,0.18)_44%,rgba(10,5,18,0.72)_72%,transparent_86%)]",
    lightningColor: "rgba(192,132,252,0.96)",
    lightningSoft: "rgba(192,132,252,0.62)",
  },
  {
    frame: "border-[6px] border-amber-300 hover:border-amber-200",
    glow: "shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_22px_rgba(252,211,77,0.86),0_0_56px_rgba(252,211,77,0.72),0_0_108px_rgba(252,211,77,0.56),inset_0_0_20px_rgba(252,211,77,0.27)] hover:shadow-[0_0_0_1px_rgba(253,224,71,0.95),0_0_26px_rgba(253,224,71,0.9),0_0_64px_rgba(253,224,71,0.75),0_0_116px_rgba(253,224,71,0.62),inset_0_0_22px_rgba(253,224,71,0.34)]",
    inner: "border-amber-500/75",
    chip: "border-amber-500 bg-amber-900/75 shadow-[0_0_18px_rgba(146,64,14,0.95)]",
    bgGlow:
      "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(146,64,14,0.55),rgba(146,64,14,0.18)_44%,rgba(18,10,4,0.72)_72%,transparent_86%)]",
    lightningColor: "rgba(251,191,36,0.96)",
    lightningSoft: "rgba(251,191,36,0.62)",
  },
  {
    frame: "border-[6px] border-lime-300 hover:border-lime-200",
    glow: "shadow-[0_0_0_1px_rgba(163,230,53,0.9),0_0_22px_rgba(163,230,53,0.86),0_0_56px_rgba(163,230,53,0.72),0_0_108px_rgba(163,230,53,0.56),inset_0_0_20px_rgba(163,230,53,0.27)] hover:shadow-[0_0_0_1px_rgba(190,242,100,0.95),0_0_26px_rgba(190,242,100,0.9),0_0_64px_rgba(190,242,100,0.75),0_0_116px_rgba(190,242,100,0.62),inset_0_0_22px_rgba(190,242,100,0.34)]",
    inner: "border-lime-500/75",
    chip: "border-lime-500 bg-lime-900/75 shadow-[0_0_18px_rgba(63,98,18,0.95)]",
    bgGlow:
      "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(63,98,18,0.55),rgba(63,98,18,0.18)_44%,rgba(8,14,3,0.72)_72%,transparent_86%)]",
    lightningColor: "rgba(163,230,53,0.96)",
    lightningSoft: "rgba(163,230,53,0.62)",
  },
] as const;

type MarqueeItem = {
  videoId: string;
  src: string;
  alt: string;
  href: string;
  approxViewsLabel?: string;
};

type Theme = (typeof SOCIAL_CARD_BORDER_THEMES)[number];

function SocialClipCard({
  image,
  theme,
  eager,
  informativeZoom,
  liteMobile,
}: {
  image: MarqueeItem;
  theme: Theme;
  index: number;
  eager: boolean;
  informativeZoom?: boolean;
  liteMobile?: boolean;
}) {
  return (
    <a
      href={image.href}
      target="_blank"
      rel="noreferrer"
      aria-label={
        image.approxViewsLabel
          ? `Open TikTok video (${image.approxViewsLabel}): ${image.alt}`
          : `Open TikTok video: ${image.alt}`
      }
      className={`lightning-glow-card group relative block h-[clamp(150px,43vw,240px)] w-[clamp(98px,30.5vw,180px)] overflow-hidden rounded-xl border bg-transparent [clip-path:polygon(0%_8%,8%_0%,100%_0%,100%_92%,92%_100%,0%_100%)] transition-all duration-300 hover:-translate-y-1 lg:h-[290px] lg:w-[220px] xl:h-[330px] xl:w-[250px] ${theme.frame} ${theme.glow}`}
      style={
        {
          ["--lightning-color"]: theme.lightningColor,
          ["--lightning-color-soft"]: theme.lightningSoft,
        } as CSSProperties
      }
    >
      <span
        className={
          liteMobile
            ? `pointer-events-none absolute -inset-4 z-0 opacity-60 ${theme.bgGlow}`
            : `pointer-events-none absolute -inset-7 z-0 blur-3xl opacity-85 transition-opacity duration-300 group-hover:opacity-100 ${theme.bgGlow}`
        }
      />
      <span className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(10,12,22,0.2),rgba(2,4,12,0.62))]" />
      <span
        className={`pointer-events-none absolute inset-[2px] z-[3] rounded-[10px] border opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${theme.inner}`}
      />
      <span className={`pointer-events-none absolute left-2 top-2 z-[4] h-3 w-3 rounded-sm border ${theme.chip}`} />
      <span className={`pointer-events-none absolute bottom-2 right-2 z-[4] h-3 w-3 rounded-sm border ${theme.chip}`} />
      <span className="pointer-events-none absolute inset-0 z-[2] overflow-hidden bg-[#0a0c16]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          quality={72}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "low"}
          decoding="async"
          sizes="(max-width: 768px) 31vw, (max-width: 1280px) 220px, 250px"
          className={
            informativeZoom
              ? "origin-top scale-[1.14] object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.2]"
              : "object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          }
        />
      </span>
    </a>
  );
}

function MarqueeRow({
  items,
  reverse,
  duration,
  eagerCount,
  informativeZoom,
  animate,
  liteMobile,
}: {
  items: MarqueeItem[];
  reverse?: boolean;
  duration: string;
  eagerCount: number;
  informativeZoom?: boolean;
  animate: boolean;
  liteMobile?: boolean;
}) {
  const track = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black via-black/55 to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black via-black/55 to-transparent sm:w-16" />
      <div
        className={`${reverse ? "animate-marquee-reverse" : "animate-marquee"} flex w-max items-center gap-2 sm:gap-3`}
        style={{
          ["--duration" as string]: duration,
          ["--gap" as string]: "1rem",
          animationPlayState: animate ? "running" : "paused",
        }}
      >
        {track.map((image, index) => {
          const theme = SOCIAL_CARD_BORDER_THEMES[index % SOCIAL_CARD_BORDER_THEMES.length];
          const eager = index < eagerCount;
          return (
            <SocialClipCard
              key={`${image.videoId}-${index}`}
              image={image}
              theme={theme}
              index={index}
              eager={eager}
              informativeZoom={informativeZoom}
              liteMobile={liteMobile}
            />
          );
        })}
      </div>
    </div>
  );
}

function HomeSocialClipsContent() {
  const isMobile = useMatchMedia("(max-width: 767px)");
  const { hostRef, inView: sectionInView } = useInViewRef<HTMLElement>({ rootMargin: "80px 0px", threshold: 0.05 });
  const mostViewedItems: MarqueeItem[] = TIKTOK_MOST_VIEWED.map((card) => ({
    videoId: card.videoId,
    src: card.posterSrc,
    alt: card.alt,
    href: card.href,
    approxViewsLabel: card.approxViewsLabel,
  }));

  const informativeItems: MarqueeItem[] = TIKTOK_MOST_INFORMATIVE.map((card) => ({
    videoId: card.videoId,
    src: card.posterSrc,
    alt: card.alt,
    href: card.href,
  }));

  return (
    <section
      ref={hostRef}
      className="home-social-clips-section relative flex w-full min-w-0 flex-col overflow-hidden bg-black py-3 sm:py-8"
    >
      <div className="pointer-events-none absolute inset-0">
        {isMobile ? (
          <div
            className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(30,20,50,0.45),#000_72%)]"
            aria-hidden
          />
        ) : (
          <IntersectionDeferredMp4 src="/assets/video.mp4" className="h-full w-full object-cover opacity-24" />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-black/68" />
      <div className="relative z-10 mx-auto flex w-full max-w-full flex-col justify-start overflow-x-clip px-3 py-0 sm:px-6 md:px-8">
        <div className="w-full max-w-full space-y-3 sm:space-y-4">
          <h3
            className={`${publicHeadingLightning("amber")} mb-3 px-1 text-center text-2xl font-black uppercase tracking-[0.16em] sm:mb-4 sm:text-3xl md:text-4xl`}
          >
            MOST VIEWED
          </h3>
          <MarqueeRow
            items={mostViewedItems}
            duration={isMobile ? "110s" : "92s"}
            eagerCount={isMobile ? 2 : 4}
            animate={sectionInView}
            liteMobile={isMobile}
          />

          <h3
            className={`${publicHeadingLightning("amber")} mb-2 mt-3 px-1 text-center text-2xl font-black uppercase tracking-[0.16em] sm:mb-3 sm:mt-5 sm:text-3xl md:text-4xl`}
          >
            MOST INFORMATIVE
          </h3>
          <MarqueeRow
            items={informativeItems}
            reverse
            duration={isMobile ? "120s" : "100s"}
            eagerCount={isMobile ? 2 : 3}
            informativeZoom
            animate={sectionInView}
            liteMobile={isMobile}
          />
        </div>
      </div>
    </section>
  );
}

/** Social clips: lazy mount with visible shell; both rows render together (no staged layout shift). */
export function HomeSocialClipsSection() {
  return (
    <LazyWhenVisible
      className="w-full min-w-0 bg-black home-lazy-section"
      minHeight="min(520px, 72vh)"
      rootMargin="240px 0px"
      placeholder={<HomeSectionPlaceholder minHeight="min(520px, 72vh)" titleWidth="11rem" />}
    >
      <HomeSocialClipsContent />
    </LazyWhenVisible>
  );
}
