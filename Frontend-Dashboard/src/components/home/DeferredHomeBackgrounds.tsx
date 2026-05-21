"use client";

import { useEffect, useRef, useState } from "react";
import { ViewportDecorVideo } from "@/components/ViewportDecorVideo";

const VIMEO_SRC =
  "https://player.vimeo.com/video/988922121?autoplay=1&muted=1&loop=1&background=1";

/** Defers Vimeo until the block is near the viewport. */
export function DeferredVimeoProgramsBackground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShow(true);
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="h-full w-full bg-[#050508]" aria-hidden>
      {show ? (
        <iframe
          src={VIMEO_SRC}
          className="h-full w-full scale-[1.22] opacity-60 grayscale saturate-0"
          allow="autoplay; fullscreen; picture-in-picture"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title="Featured programs background video"
        />
      ) : null}
    </div>
  );
}

type DeferredMp4Props = {
  src: string;
  className?: string;
};

export function DeferredMp4Background({ src, className }: DeferredMp4Props) {
  return (
    <ViewportDecorVideo
      src={src}
      className={className ?? "h-full w-full object-cover"}
    />
  );
}
