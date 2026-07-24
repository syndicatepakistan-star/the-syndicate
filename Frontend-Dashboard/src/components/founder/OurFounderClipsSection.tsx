"use client";

import Image from "next/image";
import { FramedImage } from "@/components/founder/FramedImage";
import { TIKTOK_MOST_INFORMATIVE } from "@/data/tiktok-most-informative";
import { TIKTOK_MOST_VIEWED } from "@/data/tiktok-most-viewed";
import { founderFrameCycleAt, type FounderFrameName } from "@/lib/founderFrameAssets";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

const FOUNDER_COIN_SRC = "/assets/coin-gold.png";

function FounderSectionHeading({ title }: { title: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[min(100%,1200px)] items-center justify-center px-3 sm:px-5 md:px-[25px]">
      <Image
        src={FOUNDER_COIN_SRC}
        alt=""
        aria-hidden
        width={80}
        height={80}
        className="founder-section-coin h-[clamp(2.25rem,12vw,3rem)] w-[clamp(2.25rem,12vw,3rem)] shrink-0 object-contain drop-shadow-[0_0_18px_rgba(251,191,36,0.45)] sm:h-14 sm:w-14 md:h-[80px] md:w-[80px]"
      />
      <h2
        className={`${publicHeadingLightning("amber")} min-w-0 flex-1 px-2 text-center text-[clamp(1.05rem,4.5vw,1.5rem)] font-black uppercase tracking-[0.1em] sm:px-4 sm:text-3xl sm:tracking-[0.16em] md:text-4xl`}
      >
        {title}
      </h2>
      <Image
        src={FOUNDER_COIN_SRC}
        alt=""
        aria-hidden
        width={80}
        height={80}
        className="founder-section-coin h-[clamp(2.25rem,12vw,3rem)] w-[clamp(2.25rem,12vw,3rem)] shrink-0 object-contain drop-shadow-[0_0_18px_rgba(251,191,36,0.45)] sm:h-14 sm:w-14 md:h-[80px] md:w-[80px]"
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
  objectPosition?: string;
  approxViewsLabel?: string;
};

function FounderClipCard({
  image,
  eager,
  cropBottomPx,
}: {
  image: ClipCard;
  eager?: boolean;
  cropBottomPx?: number;
}) {
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
        className="group relative block w-full transition-transform duration-300 hover:scale-[1.02]"
      >
        <FramedImage
          src={image.src}
          alt={image.alt}
          frame={image.frame}
          objectPosition={image.objectPosition}
          cropBottomPx={cropBottomPx}
          priority={eager}
        />
        {image.approxViewsLabel ? (
          <span className="absolute bottom-3 left-1/2 z-[3] max-w-[calc(100%-1.5rem)] -translate-x-1/2 truncate rounded-full border border-white/30 bg-black/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white/95 sm:bottom-4 sm:text-[10px]">
            {image.approxViewsLabel}
          </span>
        ) : null}
      </a>
    </article>
  );
}

function FounderClipGrid({
  items,
  title,
  eagerCount = 4,
  cropBottomPx,
}: {
  items: ClipCard[];
  title: string;
  eagerCount?: number;
  cropBottomPx?: number;
}) {
  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <FounderSectionHeading title={title} />
      <div className="grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((image, index) => (
          <FounderClipCard
            key={image.videoId}
            image={image}
            eager={index < eagerCount}
            cropBottomPx={cropBottomPx}
          />
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
    objectPosition: card.objectPosition,
  }));

  const informativeItems: ClipCard[] = TIKTOK_MOST_INFORMATIVE.map((card, index) => ({
    videoId: card.videoId,
    src: card.posterSrc,
    alt: card.alt,
    href: card.href,
    approxViewsLabel: card.approxViewsLabel,
    frame: card.frame ?? founderFrameCycleAt(index + 2),
    objectPosition: card.objectPosition,
  }));

  return (
    <section className="relative w-full min-w-0 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-[min(100%,1400px)] flex-col gap-8 px-3 sm:gap-12 sm:px-6 md:px-8">
        <FounderClipGrid items={mostViewedItems} title="Most Viewed" eagerCount={0} />
        <FounderClipGrid items={informativeItems} title="Most Informative" eagerCount={0} cropBottomPx={4} />
      </div>
    </section>
  );
}
