"use client";

import { useEffect, useRef, useState } from "react";
import { ViewportDecorVideo } from "@/components/ViewportDecorVideo";
import { LoopBgVideo } from "@/components/marketing/LoopBgVideo";
import { PROGRAMS_SECTION_VIDEO } from "@/lib/mediaWarmCache";

function useMobileProgramsBand(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return mobile;
}

/** Programs band — same-origin MP4; gradient always visible under video on mobile. */
export function ProgramsSectionBackground() {
  const isMobile = useMobileProgramsBand();
  return (
    <ViewportDecorVideo
      src={PROGRAMS_SECTION_VIDEO}
      priority
      alwaysOn
      fill
      videoClassName={
        isMobile
          ? "scale-[1.08] opacity-80 saturate-95"
          : "scale-[1.22] opacity-60 grayscale saturate-0"
      }
    />
  );
}

/** Local loop instead of third-party Vimeo. */
export function DeferredVimeoProgramsBackground() {
  return (
    <div className="h-full w-full bg-[#050508]" aria-hidden>
      <LoopBgVideo className="h-full w-full" scrimOpacity={0.45} videoOpacity={0.55} />
    </div>
  );
}

type DeferredMp4Props = {
  src: string;
  className?: string;
  priority?: boolean;
};

export function DeferredMp4Background({ src, className, priority = false }: DeferredMp4Props) {
  return (
    <ViewportDecorVideo
      src={src}
      className={className ?? "h-full w-full object-cover"}
      priority={priority}
    />
  );
}

/** MP4 backdrop only when the host enters (or nears) the viewport. */
export function IntersectionDeferredMp4({ src, className }: { src: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || show) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px 0px", threshold: 0.01 },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [show]);

  return (
    <div ref={hostRef} className="absolute inset-0" aria-hidden>
      {show ? (
        <ViewportDecorVideo src={src} className={className ?? "h-full w-full object-cover"} fill />
      ) : null}
    </div>
  );
}
