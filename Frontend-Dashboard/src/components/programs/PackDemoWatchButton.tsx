"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  MODULE_DEMO_LABEL,
  resolvePackDemoUrl,
  VIMEO_PACK_DEMO_LABEL,
} from "@/components/programs/packDemoLinks";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type HlsConstructor = typeof import("hls.js").default;
type HlsInstance = InstanceType<HlsConstructor>;
type HlsModule = { default: HlsConstructor };

let hlsModulePromise: Promise<HlsModule> | null = null;

function loadHlsModule(): Promise<HlsModule> {
  if (!hlsModulePromise) {
    hlsModulePromise = import("hls.js") as Promise<HlsModule>;
  }
  return hlsModulePromise;
}

function isHlsDemoUrl(url: string): boolean {
  const clean = url.split("?")[0]?.toLowerCase() || "";
  return clean.endsWith(".m3u8");
}

type Props = {
  /** Pack or module plan slug (e.g. agentic_ai, agentic_ai_c14). */
  plan: string;
  className?: string;
  borderClassName?: string;
  /** Shorter label + sizing for module cards. */
  compact?: boolean;
  /** Hide entirely when no CDN URL (default true for less clutter). */
  hideWhenMissing?: boolean;
};

/**
 * Opens a lightweight player only after click.
 * Video src is set on open — never downloads on Programs first paint.
 * Supports public MP4 and HLS (.m3u8) demos on the CDN.
 */
export function PackDemoWatchButton({
  plan,
  className,
  borderClassName,
  compact = false,
  hideWhenMissing = true,
}: Props) {
  const titleId = useId();
  const demoUrl = resolvePackDemoUrl(plan);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const label = compact ? MODULE_DEMO_LABEL : VIMEO_PACK_DEMO_LABEL;

  useEffect(() => setMounted(true), []);
  useModalScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !demoUrl) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const destroyHls = () => {
      const hls = hlsRef.current;
      hlsRef.current = null;
      if (hls) {
        try {
          hls.destroy();
        } catch {
          // ignore
        }
      }
    };

    destroyHls();

    if (!isHlsDemoUrl(demoUrl)) {
      video.src = demoUrl;
      video.load();
      return () => {
        cancelled = true;
        video.removeAttribute("src");
        video.load();
      };
    }

    // Safari / iOS: native HLS
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = demoUrl;
      video.load();
      return () => {
        cancelled = true;
        video.removeAttribute("src");
        video.load();
      };
    }

    void loadHlsModule().then((mod) => {
      if (cancelled || !videoRef.current) return;
      const Hls = mod.default;
      if (!Hls.isSupported()) {
        videoRef.current.src = demoUrl;
        videoRef.current.load();
        return;
      }
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(demoUrl);
      hls.attachMedia(videoRef.current);
    });

    return () => {
      cancelled = true;
      destroyHls();
      if (videoRef.current) {
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, [open, demoUrl]);

  const onOpen = useCallback(() => {
    if (!demoUrl) return;
    setOpen(true);
  }, [demoUrl]);

  if (!demoUrl && hideWhenMissing) return null;

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        disabled={!demoUrl}
        title={demoUrl ? label : "Demo video coming soon"}
        aria-label={demoUrl ? label : "Demo video coming soon"}
        className={cn(
          "inline-flex w-full max-w-full items-center justify-center gap-2 rounded-xl border-2",
          "font-mono font-black uppercase text-white",
          compact
            ? "gap-1.5 px-1.5 py-1.5 text-[9px] tracking-[0.09em] sm:text-[10px]"
            : "w-fit gap-2 px-4 py-2.5 text-[11px] tracking-[0.14em] sm:text-[12px]",
          "border-white/35 bg-white/5",
          demoUrl
            ? "cursor-pointer transition hover:border-white/55 hover:bg-white/10"
            : "cursor-default opacity-70",
          borderClassName,
          className,
        )}
      >
        {label}
        <ExternalLink
          className={cn("shrink-0 opacity-80", compact ? "h-3 w-3" : "h-3.5 w-3.5")}
          aria-hidden
        />
      </button>

      {mounted && open && demoUrl
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-[2px]"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={() => setOpen(false)}
            >
              <div
                className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-black shadow-[0_0_48px_rgba(0,0,0,0.65)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <p
                    id={titleId}
                    className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-white/85"
                  >
                    {label}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 text-white/80 hover:border-white/45 hover:text-white"
                    aria-label="Close demo video"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="aspect-video w-full bg-black">
                  <video
                    ref={videoRef}
                    key={demoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full"
                  >
                    <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                      Open demo video
                    </a>
                  </video>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
