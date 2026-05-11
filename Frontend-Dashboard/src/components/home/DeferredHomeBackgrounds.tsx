"use client";

import { useEffect, useState } from "react";

const VIMEO_SRC =
  "https://player.vimeo.com/video/988922121?autoplay=1&muted=1&loop=1&background=1";

function scheduleWhenIdle(run: () => void, timeoutMs: number) {
  if (typeof window === "undefined") return () => {};
  const ric = window.requestIdleCallback;
  if (typeof ric === "function") {
    const id = ric(run, { timeout: timeoutMs });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(run, Math.min(320, timeoutMs));
  return () => window.clearTimeout(id);
}

/** Defers heavy Vimeo embed until the main thread is idle so hero/LCP wins first. */
export function DeferredVimeoProgramsBackground() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    return scheduleWhenIdle(() => setShow(true), 900);
  }, []);

  if (!show) {
    return <div className="h-full w-full bg-[#050508]" aria-hidden />;
  }

  return (
    <iframe
      src={VIMEO_SRC}
      className="h-full w-full scale-[1.22] opacity-60 grayscale saturate-0"
      allow="autoplay; fullscreen; picture-in-picture"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      title="Featured programs background video"
    />
  );
}

type DeferredMp4Props = {
  src: string;
  className?: string;
};

/** Starts the decorative MP4 only after idle so referral + first paint stay light. */
export function DeferredMp4Background({ src, className }: DeferredMp4Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    return scheduleWhenIdle(() => setShow(true), 1100);
  }, []);

  if (!show) {
    return <div className={`h-full w-full bg-black ${className ?? ""}`} aria-hidden />;
  }

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
