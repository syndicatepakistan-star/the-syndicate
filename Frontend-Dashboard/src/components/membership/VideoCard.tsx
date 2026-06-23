"use client";

import { motion } from "framer-motion";

export type VideoDto = {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  player_layout?: string;
  source_width?: number | null;
  source_height?: number | null;
};

const FALLBACK_THUMBS = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486578077620-8a022ddd481f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80"
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function aspectLabel(visual: "portrait" | "landscape" | "wide"): string {
  if (visual === "portrait") return "9:16";
  if (visual === "wide") return "21:9";
  return "16:9";
}

function formatPublished(iso: string): string {
  if (!iso?.trim()) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "";
  }
}

type VideoFrame = "gold" | "ember";

type VideoCardProps = {
  video: VideoDto;
  onPlay: (video: VideoDto) => void;
  index?: number;
  visual?: "portrait" | "landscape" | "wide";
  frame?: VideoFrame;
};

type VideoGlowTheme = {
  border: string;
  borderHover: string;
  glow: string;
  glowHover: string;
  title: string;
  titleShadow: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  playBorder: string;
  playText: string;
  playGlow: string;
  corner: string;
  thumbBorder: string;
  thumbBorderHover: string;
};

const VIDEO_GLOW_THEMES: VideoGlowTheme[] = [
  {
    border: "rgba(250,204,21,0.46)",
    borderHover: "rgba(250,204,21,0.82)",
    glow: "rgba(250,204,21,0.24)",
    glowHover: "rgba(250,204,21,0.5)",
    title: "#fde68a",
    titleShadow: "0 0 16px rgba(250,204,21,0.4)",
    badgeBorder: "rgba(250,204,21,0.55)",
    badgeBg: "rgba(0,0,0,0.72)",
    badgeText: "rgba(255,236,179,0.98)",
    playBorder: "rgba(250,204,21,0.58)",
    playText: "rgba(255,236,179,0.98)",
    playGlow: "0 0 28px rgba(250,204,21,0.38)",
    corner: "rgba(250,204,21,0.9)",
    thumbBorder: "rgba(250,204,21,0.24)",
    thumbBorderHover: "rgba(250,204,21,0.56)",
  },
  {
    border: "rgba(34,211,238,0.46)",
    borderHover: "rgba(34,211,238,0.82)",
    glow: "rgba(34,211,238,0.24)",
    glowHover: "rgba(34,211,238,0.5)",
    title: "#a5f3fc",
    titleShadow: "0 0 16px rgba(34,211,238,0.4)",
    badgeBorder: "rgba(34,211,238,0.55)",
    badgeBg: "rgba(0,0,0,0.72)",
    badgeText: "rgba(207,250,254,0.98)",
    playBorder: "rgba(34,211,238,0.58)",
    playText: "rgba(207,250,254,0.98)",
    playGlow: "0 0 28px rgba(34,211,238,0.38)",
    corner: "rgba(34,211,238,0.9)",
    thumbBorder: "rgba(34,211,238,0.24)",
    thumbBorderHover: "rgba(34,211,238,0.56)",
  },
  {
    border: "rgba(192,132,252,0.46)",
    borderHover: "rgba(192,132,252,0.82)",
    glow: "rgba(192,132,252,0.24)",
    glowHover: "rgba(192,132,252,0.5)",
    title: "#e9d5ff",
    titleShadow: "0 0 16px rgba(192,132,252,0.4)",
    badgeBorder: "rgba(192,132,252,0.55)",
    badgeBg: "rgba(0,0,0,0.72)",
    badgeText: "rgba(243,232,255,0.98)",
    playBorder: "rgba(192,132,252,0.58)",
    playText: "rgba(243,232,255,0.98)",
    playGlow: "0 0 28px rgba(192,132,252,0.38)",
    corner: "rgba(192,132,252,0.9)",
    thumbBorder: "rgba(192,132,252,0.24)",
    thumbBorderHover: "rgba(192,132,252,0.56)",
  },
  {
    border: "rgba(74,222,128,0.46)",
    borderHover: "rgba(74,222,128,0.82)",
    glow: "rgba(74,222,128,0.24)",
    glowHover: "rgba(74,222,128,0.5)",
    title: "#bbf7d0",
    titleShadow: "0 0 16px rgba(74,222,128,0.4)",
    badgeBorder: "rgba(74,222,128,0.55)",
    badgeBg: "rgba(0,0,0,0.72)",
    badgeText: "rgba(220,252,231,0.98)",
    playBorder: "rgba(74,222,128,0.58)",
    playText: "rgba(220,252,231,0.98)",
    playGlow: "0 0 28px rgba(74,222,128,0.38)",
    corner: "rgba(74,222,128,0.9)",
    thumbBorder: "rgba(74,222,128,0.24)",
    thumbBorderHover: "rgba(74,222,128,0.56)",
  },
  {
    border: "rgba(251,113,133,0.46)",
    borderHover: "rgba(251,113,133,0.82)",
    glow: "rgba(251,113,133,0.24)",
    glowHover: "rgba(251,113,133,0.5)",
    title: "#fecdd3",
    titleShadow: "0 0 16px rgba(251,113,133,0.4)",
    badgeBorder: "rgba(251,113,133,0.55)",
    badgeBg: "rgba(0,0,0,0.72)",
    badgeText: "rgba(255,228,230,0.98)",
    playBorder: "rgba(251,113,133,0.58)",
    playText: "rgba(255,228,230,0.98)",
    playGlow: "0 0 28px rgba(251,113,133,0.38)",
    corner: "rgba(251,113,133,0.9)",
    thumbBorder: "rgba(251,113,133,0.24)",
    thumbBorderHover: "rgba(251,113,133,0.56)",
  },
];

const frameShell: Record<VideoFrame, { article: string; thumbIdle: string; ring: string; cut: string }> = {
  gold: {
    article:
      "border-[rgba(197,179,88,0.28)] hover:border-[rgba(250,204,21,0.55)] hover:shadow-[0_0_36px_rgba(250,204,21,0.16)]",
    thumbIdle: "border-white/12 group-hover:border-[rgba(250,204,21,0.48)]",
    ring: "focus-visible:ring-[rgba(250,204,21,0.4)]",
    cut: "before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:shadow-[inset_0_0_0_1px_rgba(250,204,21,0.12)]"
  },
  ember: {
    article:
      "border-[rgba(185,28,28,0.42)] hover:border-[rgba(248,113,113,0.58)] hover:shadow-[0_0_32px_rgba(220,38,38,0.22)]",
    thumbIdle: "border-[rgba(127,29,29,0.5)] group-hover:border-[rgba(248,113,113,0.55)]",
    ring: "focus-visible:ring-[rgba(248,113,113,0.45)]",
    cut: "before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:shadow-[inset_0_0_0_1px_rgba(248,113,113,0.14)]"
  }
};

export function VideoCard({ video, onPlay, index = 0, visual = "landscape", frame = "gold" }: VideoCardProps) {
  const fallback = FALLBACK_THUMBS[Math.abs(Number(video.id || 0)) % FALLBACK_THUMBS.length];
  const thumb = video.thumbnail_url?.trim() || fallback;
  const shell = frameShell[frame];
  const glowTheme = VIDEO_GLOW_THEMES[Math.abs(index) % VIDEO_GLOW_THEMES.length];
  const cornerStyle = { borderColor: glowTheme.corner, boxShadow: `0 0 14px ${glowTheme.glow}` };
  const aspectClass =
    visual === "portrait"
      ? "aspect-[9/16] max-h-[min(52vh,420px)] w-full max-w-[min(100%,280px)] mx-auto"
      : visual === "wide"
        ? "aspect-[21/9] w-full min-h-[120px]"
        : "aspect-video w-full";
  const published = formatPublished(video.created_at);

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.2) }}
      className={cx(
        "group relative flex min-h-0 flex-col rounded-xl border bg-black/45 p-[clamp(0.65rem,1.2vw+0.35rem,1rem)] text-left transition duration-200",
        "hover:-translate-y-0.5",
        shell.article,
        shell.cut
      )}
      style={{
        borderColor: glowTheme.border,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 30px ${glowTheme.glow}, 0 16px 40px rgba(0,0,0,0.5)`,
      }}
      whileHover={{
        borderColor: glowTheme.borderHover,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 56px ${glowTheme.glowHover}, 0 20px 50px rgba(0,0,0,0.58)`,
      }}
    >
      <span
        className={cx(
          "pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 rounded-tl-md border-l-2 border-t-2",
        )}
        style={cornerStyle}
        aria-hidden
      />
      <span
        className={cx(
          "pointer-events-none absolute right-3 top-3 z-10 h-4 w-4 rounded-tr-md border-r-2 border-t-2",
        )}
        style={cornerStyle}
        aria-hidden
      />
      <span
        className={cx(
          "pointer-events-none absolute bottom-3 left-3 z-10 h-4 w-4 rounded-bl-md border-b-2 border-l-2",
        )}
        style={cornerStyle}
        aria-hidden
      />
      <span
        className={cx(
          "pointer-events-none absolute bottom-3 right-3 z-10 h-4 w-4 rounded-br-md border-b-2 border-r-2",
        )}
        style={cornerStyle}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => onPlay(video)}
        className={cx(
          "relative z-[1] shrink-0 overflow-hidden rounded-lg bg-black/60 text-left outline-none transition",
          aspectClass,
            shell.thumbIdle,
          "focus-visible:ring-2",
          shell.ring
        )}
          style={{ borderColor: glowTheme.thumbBorder }}
        aria-label={`Play ${video.title}`}
      >
        <span
          className="absolute left-2 top-2 z-[1] rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em]"
          style={{
            borderColor: glowTheme.badgeBorder,
            background: glowTheme.badgeBg,
            color: glowTheme.badgeText,
          }}
        >
          {aspectLabel(visual)}
        </span>
        <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <span className="absolute inset-0 bg-[linear-gradient(transparent_92%,rgba(34,211,238,0.12)_100%)] bg-[length:100%_6px] opacity-35" />
        <span
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-black/55 transition group-hover:scale-105"
          style={{
            borderColor: glowTheme.playBorder,
            color: glowTheme.playText,
            boxShadow: glowTheme.playGlow,
          }}
        >
          <svg className="ml-0.5 h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7L8 5Z" />
          </svg>
        </span>
        <span
          className={cx(
            "absolute bottom-2 right-2 rounded border px-2 py-0.5 text-[10px] font-bold uppercase",
            video.status === "ready"
              ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-100"
              : "border-amber-300/40 bg-amber-500/20 text-amber-100"
          )}
        >
          {video.status}
        </span>
      </button>

      <h3
        className="relative z-[1] mt-4 line-clamp-2 text-[15px] font-bold leading-snug"
        style={{ color: glowTheme.title, textShadow: glowTheme.titleShadow }}
      >
        {video.title}
      </h3>
      {published ? (
        <p className="relative z-[1] mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">{published}</p>
      ) : null}
      {video.description ? (
        <p className="relative z-[1] mt-2 line-clamp-2 text-[12px] leading-relaxed text-neutral-300">{video.description}</p>
      ) : null}
    </motion.article>
  );
}
