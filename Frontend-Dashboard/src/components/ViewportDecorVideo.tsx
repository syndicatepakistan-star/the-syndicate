"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { isVideoWarm, warmVideo } from "@/lib/mediaWarmCache";

type ViewportDecorVideoProps = {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  /** 0–1 opacity when playing */
  opacityClassName?: string;
  /** Above-fold: load + play immediately; still pauses when scrolled away unless alwaysOn. */
  priority?: boolean;
  /** Keep playing even when off-screen (rare — full-page ambient backgrounds). */
  alwaysOn?: boolean;
};

/** Decorative MP4 — warmed pool + browser cache; replays instantly on repeat visits. */
export function ViewportDecorVideo({
  src,
  className,
  style,
  opacityClassName,
  priority = false,
  alwaysOn = false,
}: ViewportDecorVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const cachedOnMount = useRef(isVideoWarm(src));

  useLayoutEffect(() => {
    void warmVideo(src);
  }, [src]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !(priority || cachedOnMount.current)) return;
    void el.play().catch(() => {});
  }, [src, priority]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    void warmVideo(src).then(() => {
      if (priority || alwaysOn) {
        void el.play().catch(() => {});
      }
    });

    if (alwaysOn) {
      void el.play().catch(() => {});
      return;
    }

    const sync = (playing: boolean) => {
      if (playing) {
        void el.play().catch(() => {});
      } else {
        el.pause();
      }
    };

    if (priority) {
      void el.play().catch(() => {});
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        sync(entry.isIntersecting);
      },
      { rootMargin: priority ? "0px 0px" : "160px 0px", threshold: priority ? 0 : 0.04 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src, priority, alwaysOn]);

  return (
    <video
      ref={ref}
      className={[className, opacityClassName].filter(Boolean).join(" ")}
      style={style}
      muted
      loop
      playsInline
      preload={priority || alwaysOn ? "auto" : "metadata"}
      disablePictureInPicture
      aria-hidden
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
