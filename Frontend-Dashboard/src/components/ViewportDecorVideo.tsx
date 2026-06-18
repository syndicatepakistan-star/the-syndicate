"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isVideoWarm, warmVideo } from "@/lib/mediaWarmCache";

type ViewportDecorVideoProps = {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  /** Classes on the `<video>` element (e.g. opacity utilities). */
  videoClassName?: string;
  /** @deprecated use videoClassName */
  opacityClassName?: string;
  /** Above-fold: load + play immediately; still pauses when scrolled away unless alwaysOn. */
  priority?: boolean;
  /** Keep playing even when off-screen (rare — full-page ambient backgrounds). */
  alwaysOn?: boolean;
  /** On phones, skip MP4 decode and render a lightweight static backdrop instead. */
  preferStaticOnMobile?: boolean;
  /** Hero/section backdrop: fill parent with absolute inset-0 video (no extra wrapper opacity). */
  fill?: boolean;
  /** Skip the static gradient layer behind the video (lighter mobile programs band). */
  plainBackdrop?: boolean;
};

const DECOR_VIDEO_BACKDROP =
  "radial-gradient(ellipse 90% 70% at 50% 18%, rgba(34,211,238,0.14), transparent 58%), radial-gradient(ellipse 80% 55% at 82% 72%, rgba(168,85,247,0.12), transparent 52%), linear-gradient(180deg, #060a14 0%, #030508 45%, #000000 100%)";

function usePreferStaticBackdrop(enabled: boolean): boolean {
  const [preferStatic, setPreferStatic] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPreferStatic(false);
      return;
    }
    const narrow = window.matchMedia("(max-width: 479px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPreferStatic(narrow.matches || reduced.matches);
    sync();
    narrow.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [enabled]);

  return preferStatic;
}

/** Decorative MP4 — warmed pool + browser cache; replays instantly on repeat visits. */
export function ViewportDecorVideo({
  src,
  className,
  style,
  videoClassName,
  opacityClassName,
  priority = false,
  alwaysOn = false,
  preferStaticOnMobile = false,
  fill = false,
  plainBackdrop = false,
}: ViewportDecorVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const cachedOnMount = useRef(isVideoWarm(src));
  const useStaticBackdrop = usePreferStaticBackdrop(preferStaticOnMobile);
  const resolvedVideoClass = [videoClassName, opacityClassName].filter(Boolean).join(" ");
  const showImmediately = cachedOnMount.current || priority || alwaysOn;
  const [videoReady, setVideoReady] = useState(showImmediately);

  useLayoutEffect(() => {
    if (useStaticBackdrop) return;
    void warmVideo(src).then(() => {
      const el = ref.current;
      if (!el) return;
      if (priority || alwaysOn || cachedOnMount.current) {
        void el.play().catch(() => {});
      }
    });
  }, [src, priority, alwaysOn, useStaticBackdrop]);

  useLayoutEffect(() => {
    if (useStaticBackdrop) return;
    const el = ref.current;
    if (!el || !(priority || alwaysOn || cachedOnMount.current)) return;
    void el.play().catch(() => {});
  }, [src, priority, alwaysOn, useStaticBackdrop]);

  useEffect(() => {
    if (useStaticBackdrop) return;
    const el = ref.current;
    if (!el) return;

    const markReady = () => setVideoReady(true);
    el.addEventListener("loadeddata", markReady);
    el.addEventListener("canplay", markReady);
    if (el.readyState >= 2) markReady();

    void warmVideo(src).then(() => {
      if (priority || alwaysOn) {
        void el.play().catch(() => {});
      }
    });

    if (alwaysOn) {
      void el.play().catch(() => {});
    } else {
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
      return () => {
        el.removeEventListener("loadeddata", markReady);
        el.removeEventListener("canplay", markReady);
        observer.disconnect();
      };
    }

    return () => {
      el.removeEventListener("loadeddata", markReady);
      el.removeEventListener("canplay", markReady);
    };
  }, [src, priority, alwaysOn, useStaticBackdrop]);

  if (useStaticBackdrop) {
    return (
      <div
        className={[className, resolvedVideoClass].filter(Boolean).join(" ")}
        style={{
          ...style,
          background: DECOR_VIDEO_BACKDROP,
        }}
        aria-hidden
      />
    );
  }

  const videoNode = (
    <video
      ref={ref}
      className={[
        alwaysOn ? "absolute inset-0 h-full w-full object-cover" : "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
        resolvedVideoClass,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transform: "translateZ(0)",
        opacity: showImmediately || videoReady ? undefined : 0,
      }}
      muted
      loop
      playsInline
      autoPlay={priority || alwaysOn}
      preload={priority || alwaysOn ? "auto" : "metadata"}
      disablePictureInPicture
    >
      <source src={src} type="video/mp4" />
    </video>
  );

  if (fill) {
    return (
      <div
        className={["absolute inset-0 overflow-hidden", className].filter(Boolean).join(" ")}
        style={style}
        aria-hidden
      >
        {!plainBackdrop ? (
          <div className="absolute inset-0 h-full w-full" style={{ background: DECOR_VIDEO_BACKDROP }} />
        ) : null}
        {videoNode}
      </div>
    );
  }

  return (
    <div
      className={["relative overflow-hidden", className, resolvedVideoClass].filter(Boolean).join(" ")}
      style={style}
      aria-hidden
    >
      {!plainBackdrop ? (
        <div className="absolute inset-0 h-full w-full" style={{ background: DECOR_VIDEO_BACKDROP }} />
      ) : null}
      {videoNode}
    </div>
  );
}
