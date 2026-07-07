"use client";

import Image from "next/image";
import { FramedImage } from "@/components/founder/FramedImage";
import { TIKTOK_MOST_INFORMATIVE } from "@/data/tiktok-most-informative";
import { TIKTOK_MOST_VIEWED } from "@/data/tiktok-most-viewed";
import { founderFrameCycleAt, type FounderFrameName } from "@/lib/founderFrameAssets";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

const FOUNDER_COIN_SRC = "/assets/coin-gold.png";

const FOUNDER_PORTRAIT_SAMPLES = [
  {
    label: "Amber city",
    src: "/assets/founder-samples/founder-portrait-amber.png",
    alt: "Founder portrait sample with warm amber city lighting",
  },
  {
    label: "Red city",
    src: "/assets/founder-samples/founder-portrait-red.png",
    alt: "Founder portrait sample with red neon city backdrop",
  },
  {
    label: "Fire gold",
    src: "/assets/founder-samples/sample-fire-gold-portrait.png",
    alt: "Founder portrait sample with gold fire border and Gucci shirt",
  },
  {
    label: "Red jacket",
    src: "/assets/founder-samples/sample-red-jacket-neon.png",
    alt: "Founder portrait sample in red jacket with neon backdrop",
  },
  {
    label: "Orange HUD",
    src: "/assets/founder-samples/sample-orange-hud-frame.png",
    alt: "Founder portrait sample with orange HUD frame and city bokeh",
  },
  {
    label: "White smoke",
    src: "/assets/founder-samples/sample-smoke-white-frame.png",
    alt: "Founder portrait sample with white smoke frame",
  },
  {
    label: "Blue smoke + views",
    src: "/assets/founder-samples/sample-smoke-blue-views.png",
    alt: "Founder portrait sample with blue smoke frame and view count",
  },
  {
    label: "Orange smoke",
    src: "/assets/founder-samples/sample-orange-smoke-frame.png",
    alt: "Founder portrait sample with orange smoke frame",
  },
] as const;

function FounderSectionHeading({ title }: { title: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[min(100%,1200px)] items-center justify-center px-[25px]">
      <Image
        src={FOUNDER_COIN_SRC}
        alt=""
        aria-hidden
        width={80}
        height={80}
        className="founder-section-coin h-[80px] w-[80px] shrink-0 object-contain drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]"
      />
      <h2
        className={`${publicHeadingLightning("amber")} min-w-0 flex-1 px-3 text-center text-2xl font-black uppercase tracking-[0.16em] sm:px-4 sm:text-3xl md:text-4xl`}
      >
        {title}
      </h2>
      <Image
        src={FOUNDER_COIN_SRC}
        alt=""
        aria-hidden
        width={80}
        height={80}
        className="founder-section-coin h-[80px] w-[80px] shrink-0 object-contain drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]"
      />
    </div>
  );
}

type ClipCard = {
  videoId: string;
  src: string;
  alt: string;
  href: string;
  frame: FounderFrameName;
  inset?: string;
  objectPosition?: string;
  approxViewsLabel?: string;
};

function FounderClipCard({ image, eager }: { image: ClipCard; eager?: boolean }) {
  return (
    <article className="flex w-full min-w-0 flex-col items-center">
      <a
        href={image.href}
        target="_blank"
        rel="noreferrer"
        aria-label={
          image.approxViewsLabel
            ? `Open TikTok video (${image.approxViewsLabel}): ${image.alt}`
            : `Open TikTok video: ${image.alt}`
        }
        className="group relative block w-full transition-[filter,transform] duration-300 hover:brightness-105"
      >
        <FramedImage
          src={image.src}
          alt={image.alt}
          frame={image.frame}
          inset={image.inset}
          objectPosition={image.objectPosition}
          priority={eager}
        />
        {image.approxViewsLabel ? (
          <span className="absolute bottom-[10%] left-1/2 z-[3] max-w-[calc(100%-1.5rem)] -translate-x-1/2 truncate rounded-full border border-white/25 bg-black/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white/90 backdrop-blur-[2px] sm:text-[10px]">
            {image.approxViewsLabel}
          </span>
        ) : null}
      </a>
    </article>
  );
}

function FounderPortraitSamples() {
  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <FounderSectionHeading title="Sample Preview" />
      <p className="mx-auto max-w-[min(100%,720px)] text-center font-mono text-[11px] uppercase tracking-[0.14em] text-white/50 sm:text-xs">
        Compare portrait styles below — no page borders applied
      </p>
      <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-4">
        {FOUNDER_PORTRAIT_SAMPLES.map((sample) => (
          <figure key={sample.src} className="flex w-full max-w-[280px] flex-col items-center gap-2">
            <Image
              src={sample.src}
              alt={sample.alt}
              width={571}
              height={1024}
              className="h-auto w-full object-contain"
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 280px"
            />
            <figcaption className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200/75 sm:text-[11px]">
              {sample.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function FounderClipGrid({
  items,
  title,
  eagerCount = 4,
}: {
  items: ClipCard[];
  title: string;
  eagerCount?: number;
}) {
  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <FounderSectionHeading title={title} />
      <div className="grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((image, index) => (
          <FounderClipCard key={image.videoId} image={image} eager={index < eagerCount} />
        ))}
      </div>
    </div>
  );
}

export function OurFounderClipsSection() {
  const mostViewedItems: ClipCard[] = TIKTOK_MOST_VIEWED.map((card, index) => ({
    videoId: card.videoId,
    src: card.posterSrc,
    alt: card.alt,
    href: card.href,
    approxViewsLabel: card.approxViewsLabel,
    frame: card.frame ?? founderFrameCycleAt(index),
    inset: card.inset,
    objectPosition: card.objectPosition,
  }));

  const informativeItems: ClipCard[] = TIKTOK_MOST_INFORMATIVE.map((card, index) => ({
    videoId: card.videoId,
    src: card.posterSrc,
    alt: card.alt,
    href: card.href,
    frame: card.frame ?? founderFrameCycleAt(index + 2),
    inset: card.inset,
    objectPosition: card.objectPosition,
  }));

  return (
    <section className="relative w-full min-w-0 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-[min(100%,1400px)] flex-col gap-8 px-3 sm:gap-12 sm:px-6 md:px-8">
        <FounderClipGrid items={mostViewedItems} title="Most Viewed" eagerCount={5} />
        <FounderClipGrid items={informativeItems} title="Most Informative" eagerCount={4} />
        <FounderPortraitSamples />
      </div>
    </section>
  );
}
