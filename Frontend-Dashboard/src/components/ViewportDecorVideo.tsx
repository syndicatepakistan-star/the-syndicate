"use client";

import { useEffect, useRef } from "react";

type ViewportDecorVideoProps = {
  src: string;
  className?: string;
  /** 0–1 opacity when playing */
  opacityClassName?: string;
};

/** Decorative MP4: no decode until near viewport; pauses when off-screen to keep scroll smooth. */
export function ViewportDecorVideo({ src, className, opacityClassName }: ViewportDecorVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = (playing: boolean) => {
      if (playing) {
        void el.play().catch(() => {});
      } else {
        el.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        sync(entry.isIntersecting);
      },
      { rootMargin: "120px 0px", threshold: 0.06 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={[className, opacityClassName].filter(Boolean).join(" ")}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-hidden
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
