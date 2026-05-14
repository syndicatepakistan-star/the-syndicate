"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import { faviconUrlFromHref } from "@/lib/socialBranding";

/** Same-tab navigation (no target="_blank"). */
function openSameTab(href: string) {
  window.location.assign(href);
}

function resolveIframeSrc(href: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  try {
    const u = new URL(href);
    if ((u.hostname === "www.youtube.com" || u.hostname === "youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
  } catch {
    /* ignore */
  }
  return href;
}

export type QuickAccessTool = {
  id: string;
  label: string;
  href: string;
  iframeSrc?: string;
  embedInApp: boolean;
};

export type QuickAccessTileAccent = {
  tileBorder: string;
  tileShadow: string;
  tileHoverBorder: string;
  tileHoverGlow: string;
  tileFocusRing: string;
  iconBorder: string;
  iconShadow?: string;
  iconHoverGlow: string;
  fallbackLetterClass: string;
  labelClass: string;
  footerClass: string;
  headerBorderClass: string;
  hudChipClass: string;
};

/** @deprecated Single-deck layout — kept for typing only. */
export type QuickAccessCategory = {
  id: string;
  deckLabel: string;
  title: string;
  hudLabel?: string;
  deckClassName: string;
  topGlowClass: string;
  tileAccent: QuickAccessTileAccent;
  tools: QuickAccessTool[];
};

export type QuickAccessAccentKey =
  | "cyan"
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "fuchsia"
  | "indigo"
  | "blue"
  | "zinc"
  | "rose"
  | "red"
  | "lime"
  | "orange"
  | "teal";

/** Octagonal tile silhouette — matches home “most viewed” / pricing notch language. */
const TILE_OCT_CLIP =
  "[clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]";

type TileNeon = {
  lightningMain: string;
  lightningSoft: string;
  baseGlow: string;
  bloom: string;
};

function quickAccessTileNeon(key: QuickAccessAccentKey): TileNeon {
  switch (key) {
    case "cyan":
    case "sky":
    case "teal":
      return {
        lightningMain: "rgba(34,211,238,0.92)",
        lightningSoft: "rgba(125,211,252,0.48)",
        baseGlow:
          "shadow-[0_0_0_1px_rgba(34,211,238,0.62),0_0_24px_rgba(34,211,238,0.5),0_0_52px_rgba(6,182,212,0.26),0_14px_44px_rgba(0,0,0,0.78)]",
        bloom: "radial-gradient(ellipse 95% 85% at 50% 0%, rgba(34,211,238,0.38), transparent 58%)",
      };
    case "emerald":
    case "lime":
      return {
        lightningMain: "rgba(52,211,153,0.92)",
        lightningSoft: "rgba(16,185,129,0.45)",
        baseGlow:
          "shadow-[0_0_0_1px_rgba(52,211,153,0.58),0_0_24px_rgba(16,185,129,0.48),0_0_52px_rgba(5,150,105,0.24),0_14px_44px_rgba(0,0,0,0.78)]",
        bloom: "radial-gradient(ellipse 95% 85% at 50% 0%, rgba(52,211,153,0.34), transparent 58%)",
      };
    case "amber":
    case "orange":
      return {
        lightningMain: "rgba(251,191,36,0.92)",
        lightningSoft: "rgba(245,158,11,0.48)",
        baseGlow:
          "shadow-[0_0_0_1px_rgba(251,191,36,0.62),0_0_26px_rgba(245,158,11,0.48),0_0_56px_rgba(234,88,12,0.24),0_14px_44px_rgba(0,0,0,0.78)]",
        bloom: "radial-gradient(ellipse 95% 85% at 50% 0%, rgba(251,191,36,0.34), transparent 58%)",
      };
    case "violet":
    case "fuchsia":
    case "indigo":
      return {
        lightningMain: "rgba(192,132,252,0.92)",
        lightningSoft: "rgba(217,70,239,0.45)",
        baseGlow:
          "shadow-[0_0_0_1px_rgba(167,139,250,0.62),0_0_26px_rgba(139,92,246,0.48),0_0_56px_rgba(124,58,237,0.26),0_14px_44px_rgba(0,0,0,0.78)]",
        bloom: "radial-gradient(ellipse 95% 85% at 50% 0%, rgba(192,132,252,0.34), transparent 58%)",
      };
    case "blue":
      return {
        lightningMain: "rgba(96,165,250,0.92)",
        lightningSoft: "rgba(59,130,246,0.48)",
        baseGlow:
          "shadow-[0_0_0_1px_rgba(59,130,246,0.62),0_0_24px_rgba(37,99,235,0.48),0_0_52px_rgba(29,78,216,0.24),0_14px_44px_rgba(0,0,0,0.78)]",
        bloom: "radial-gradient(ellipse 95% 85% at 50% 0%, rgba(96,165,250,0.34), transparent 58%)",
      };
    case "zinc":
      return {
        lightningMain: "rgba(228,228,231,0.88)",
        lightningSoft: "rgba(161,161,170,0.42)",
        baseGlow:
          "shadow-[0_0_0_1px_rgba(212,212,216,0.52),0_0_22px_rgba(244,244,245,0.38),0_0_48px_rgba(113,113,122,0.2),0_14px_44px_rgba(0,0,0,0.78)]",
        bloom: "radial-gradient(ellipse 95% 85% at 50% 0%, rgba(228,228,231,0.22), transparent 58%)",
      };
    case "rose":
    case "red":
      return {
        lightningMain: "rgba(251,113,133,0.92)",
        lightningSoft: "rgba(244,63,94,0.45)",
        baseGlow:
          "shadow-[0_0_0_1px_rgba(251,113,133,0.58),0_0_26px_rgba(244,63,94,0.46),0_0_54px_rgba(225,29,72,0.22),0_14px_44px_rgba(0,0,0,0.78)]",
        bloom: "radial-gradient(ellipse 95% 85% at 50% 0%, rgba(251,113,133,0.32), transparent 58%)",
      };
  }
}

function accentPreset(key: QuickAccessAccentKey): QuickAccessTileAccent {
  const map: Record<string, QuickAccessTileAccent> = {
    cyan: {
      headerBorderClass: "border-cyan-400/22",
      tileBorder: "border-cyan-400/35",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(34,211,238,0.08)]",
      tileHoverBorder: "hover:border-cyan-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(34,211,238,0.75),0_0_36px_rgba(34,211,238,0.55),0_0_72px_rgba(6,182,212,0.28),inset_0_1px_0_rgba(165,243,252,0.2)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-cyan-400/45",
      iconBorder: "border-cyan-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(34,211,238,0.18)]",
      iconHoverGlow:
        "group-hover:border-cyan-200/8 group-hover:shadow-[0_0_24px_rgba(34,211,238,0.72),0_0_48px_rgba(103,232,249,0.35)]",
      fallbackLetterClass: "text-cyan-200/75",
      labelClass: "text-cyan-50/95",
      footerClass: "text-cyan-200/55",
      hudChipClass: "border-cyan-400/35 text-cyan-100/85 bg-black/55",
    },
    sky: {
      headerBorderClass: "border-sky-400/22",
      tileBorder: "border-sky-400/35",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(56,189,248,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(56,189,248,0.08)]",
      tileHoverBorder: "hover:border-sky-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(56,189,248,0.75),0_0_36px_rgba(14,165,233,0.52),0_0_72px_rgba(2,132,199,0.26),inset_0_1px_0_rgba(224,242,254,0.18)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-sky-400/45",
      iconBorder: "border-sky-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(56,189,248,0.18)]",
      iconHoverGlow:
        "group-hover:border-sky-200/8 group-hover:shadow-[0_0_24px_rgba(56,189,248,0.68),0_0_48px_rgba(125,211,252,0.32)]",
      fallbackLetterClass: "text-sky-200/75",
      labelClass: "text-sky-50/95",
      footerClass: "text-sky-200/55",
      hudChipClass: "border-sky-400/35 text-sky-100/85 bg-black/55",
    },
    emerald: {
      headerBorderClass: "border-emerald-400/22",
      tileBorder: "border-emerald-400/35",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(52,211,153,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(52,211,153,0.08)]",
      tileHoverBorder: "hover:border-emerald-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(52,211,153,0.72),0_0_36px_rgba(16,185,129,0.52),0_0_72px_rgba(5,150,105,0.28),inset_0_1px_0_rgba(167,243,208,0.18)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-emerald-400/45",
      iconBorder: "border-emerald-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(52,211,153,0.18)]",
      iconHoverGlow:
        "group-hover:border-emerald-200/8 group-hover:shadow-[0_0_24px_rgba(52,211,153,0.65),0_0_48px_rgba(16,185,129,0.32)]",
      fallbackLetterClass: "text-emerald-200/75",
      labelClass: "text-emerald-50/95",
      footerClass: "text-emerald-200/55",
      hudChipClass: "border-emerald-400/35 text-emerald-100/85 bg-black/55",
    },
    amber: {
      headerBorderClass: "border-amber-400/22",
      tileBorder: "border-amber-400/38",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(251,191,36,0.16),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(251,191,36,0.08)]",
      tileHoverBorder: "hover:border-amber-200/88",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(251,191,36,0.78),0_0_36px_rgba(245,158,11,0.5),0_0_72px_rgba(234,88,12,0.28),inset_0_1px_0_rgba(254,243,199,0.18)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-amber-400/45",
      iconBorder: "border-amber-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(251,191,36,0.16)]",
      iconHoverGlow:
        "group-hover:border-amber-200/8 group-hover:shadow-[0_0_24px_rgba(251,191,36,0.62),0_0_48px_rgba(252,211,77,0.3)]",
      fallbackLetterClass: "text-amber-200/75",
      labelClass: "text-amber-50/95",
      footerClass: "text-amber-200/55",
      hudChipClass: "border-amber-400/35 text-amber-100/85 bg-black/55",
    },
    violet: {
      headerBorderClass: "border-violet-400/22",
      tileBorder: "border-violet-400/35",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(167,139,250,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(167,139,250,0.08)]",
      tileHoverBorder: "hover:border-violet-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(167,139,250,0.75),0_0_36px_rgba(139,92,246,0.52),0_0_72px_rgba(124,58,237,0.28),inset_0_1px_0_rgba(237,233,254,0.16)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-violet-400/45",
      iconBorder: "border-violet-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(167,139,250,0.18)]",
      iconHoverGlow:
        "group-hover:border-violet-200/8 group-hover:shadow-[0_0_24px_rgba(167,139,250,0.65),0_0_48px_rgba(196,181,253,0.32)]",
      fallbackLetterClass: "text-violet-200/75",
      labelClass: "text-violet-50/95",
      footerClass: "text-violet-200/55",
      hudChipClass: "border-violet-400/35 text-violet-100/85 bg-black/55",
    },
    fuchsia: {
      headerBorderClass: "border-fuchsia-400/22",
      tileBorder: "border-fuchsia-400/35",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(232,121,249,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(232,121,249,0.08)]",
      tileHoverBorder: "hover:border-fuchsia-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(217,70,239,0.72),0_0_36px_rgba(192,132,252,0.52),0_0_72px_rgba(168,85,247,0.28),inset_0_1px_0_rgba(250,232,255,0.16)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-fuchsia-400/45",
      iconBorder: "border-fuchsia-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(232,121,249,0.18)]",
      iconHoverGlow:
        "group-hover:border-fuchsia-200/8 group-hover:shadow-[0_0_24px_rgba(217,70,239,0.62),0_0_48px_rgba(232,121,249,0.32)]",
      fallbackLetterClass: "text-fuchsia-200/75",
      labelClass: "text-fuchsia-50/95",
      footerClass: "text-fuchsia-200/55",
      hudChipClass: "border-fuchsia-400/35 text-fuchsia-100/85 bg-black/55",
    },
    indigo: {
      headerBorderClass: "border-indigo-400/22",
      tileBorder: "border-indigo-400/35",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(129,140,248,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(129,140,248,0.08)]",
      tileHoverBorder: "hover:border-indigo-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(129,140,248,0.75),0_0_36px_rgba(99,102,241,0.52),0_0_72px_rgba(79,70,229,0.28),inset_0_1px_0_rgba(224,231,255,0.16)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-indigo-400/45",
      iconBorder: "border-indigo-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(129,140,248,0.18)]",
      iconHoverGlow:
        "group-hover:border-indigo-200/8 group-hover:shadow-[0_0_24px_rgba(129,140,248,0.65),0_0_48px_rgba(165,180,252,0.32)]",
      fallbackLetterClass: "text-indigo-200/75",
      labelClass: "text-indigo-50/95",
      footerClass: "text-indigo-200/55",
      hudChipClass: "border-indigo-400/35 text-indigo-100/85 bg-black/55",
    },
    blue: {
      headerBorderClass: "border-blue-400/22",
      tileBorder: "border-blue-400/35",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(96,165,250,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(96,165,250,0.08)]",
      tileHoverBorder: "hover:border-blue-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(59,130,246,0.75),0_0_36px_rgba(37,99,235,0.52),0_0_72px_rgba(29,78,216,0.26),inset_0_1px_0_rgba(219,234,254,0.16)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-blue-400/45",
      iconBorder: "border-blue-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(96,165,250,0.18)]",
      iconHoverGlow:
        "group-hover:border-blue-200/8 group-hover:shadow-[0_0_24px_rgba(59,130,246,0.62),0_0_48px_rgba(147,197,253,0.3)]",
      fallbackLetterClass: "text-blue-200/75",
      labelClass: "text-blue-50/95",
      footerClass: "text-blue-200/55",
      hudChipClass: "border-blue-400/35 text-blue-100/85 bg-black/55",
    },
    zinc: {
      headerBorderClass: "border-zinc-400/22",
      tileBorder: "border-zinc-400/38",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(212,212,216,0.12),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]",
      tileHoverBorder: "hover:border-zinc-100/75",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(244,244,245,0.55),0_0_36px_rgba(228,228,231,0.35),0_0_72px_rgba(161,161,170,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-zinc-400/45",
      iconBorder: "border-zinc-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(228,228,231,0.12)]",
      iconHoverGlow:
        "group-hover:border-zinc-100/8 group-hover:shadow-[0_0_24px_rgba(244,244,245,0.45),0_0_48px_rgba(212,212,216,0.22)]",
      fallbackLetterClass: "text-zinc-200/75",
      labelClass: "text-zinc-50/95",
      footerClass: "text-zinc-300/55",
      hudChipClass: "border-zinc-400/35 text-zinc-100/85 bg-black/55",
    },
    rose: {
      headerBorderClass: "border-rose-400/22",
      tileBorder: "border-rose-400/35",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(251,113,133,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(251,113,133,0.08)]",
      tileHoverBorder: "hover:border-rose-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(251,113,133,0.72),0_0_36px_rgba(244,63,94,0.5),0_0_72px_rgba(225,29,72,0.26),inset_0_1px_0_rgba(255,228,230,0.16)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-rose-400/45",
      iconBorder: "border-rose-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(251,113,133,0.16)]",
      iconHoverGlow:
        "group-hover:border-rose-200/8 group-hover:shadow-[0_0_24px_rgba(251,113,133,0.62),0_0_48px_rgba(253,164,175,0.3)]",
      fallbackLetterClass: "text-rose-200/75",
      labelClass: "text-rose-50/95",
      footerClass: "text-rose-200/55",
      hudChipClass: "border-rose-400/35 text-rose-100/85 bg-black/55",
    },
    red: {
      headerBorderClass: "border-red-400/22",
      tileBorder: "border-red-400/38",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(248,113,113,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(248,113,113,0.08)]",
      tileHoverBorder: "hover:border-red-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(248,113,113,0.72),0_0_36px_rgba(239,68,68,0.48),0_0_72px_rgba(185,28,28,0.26),inset_0_1px_0_rgba(254,226,226,0.16)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-red-400/45",
      iconBorder: "border-red-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(248,113,113,0.16)]",
      iconHoverGlow:
        "group-hover:border-red-200/8 group-hover:shadow-[0_0_24px_rgba(248,113,113,0.58),0_0_48px_rgba(252,165,165,0.28)]",
      fallbackLetterClass: "text-red-200/75",
      labelClass: "text-red-50/95",
      footerClass: "text-red-200/55",
      hudChipClass: "border-red-400/35 text-red-100/85 bg-black/55",
    },
    lime: {
      headerBorderClass: "border-lime-400/22",
      tileBorder: "border-lime-400/38",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(163,230,53,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(163,230,53,0.08)]",
      tileHoverBorder: "hover:border-lime-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(163,230,53,0.72),0_0_36px_rgba(132,204,22,0.48),0_0_72px_rgba(101,163,13,0.24),inset_0_1px_0_rgba(247,254,231,0.14)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-lime-400/45",
      iconBorder: "border-lime-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(163,230,53,0.16)]",
      iconHoverGlow:
        "group-hover:border-lime-200/8 group-hover:shadow-[0_0_24px_rgba(163,230,53,0.58),0_0_48px_rgba(190,242,100,0.28)]",
      fallbackLetterClass: "text-lime-200/75",
      labelClass: "text-lime-50/95",
      footerClass: "text-lime-200/55",
      hudChipClass: "border-lime-400/35 text-lime-100/85 bg-black/55",
    },
    orange: {
      headerBorderClass: "border-orange-400/22",
      tileBorder: "border-orange-400/38",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(251,146,60,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(251,146,60,0.08)]",
      tileHoverBorder: "hover:border-orange-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(251,146,60,0.72),0_0_36px_rgba(249,115,22,0.48),0_0_72px_rgba(234,88,12,0.24),inset_0_1px_0_rgba(255,237,213,0.14)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-orange-400/45",
      iconBorder: "border-orange-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(251,146,60,0.16)]",
      iconHoverGlow:
        "group-hover:border-orange-200/8 group-hover:shadow-[0_0_24px_rgba(251,146,60,0.55),0_0_48px_rgba(253,186,116,0.26)]",
      fallbackLetterClass: "text-orange-200/75",
      labelClass: "text-orange-50/95",
      footerClass: "text-orange-200/55",
      hudChipClass: "border-orange-400/35 text-orange-100/85 bg-black/55",
    },
    teal: {
      headerBorderClass: "border-teal-400/22",
      tileBorder: "border-teal-400/38",
      tileShadow:
        "shadow-[0_0_0_1px_rgba(45,212,191,0.14),0_8px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(45,212,191,0.08)]",
      tileHoverBorder: "hover:border-teal-200/85",
      tileHoverGlow:
        "hover:shadow-[0_0_0_1px_rgba(45,212,191,0.72),0_0_36px_rgba(20,184,166,0.48),0_0_72px_rgba(15,118,110,0.24),inset_0_1px_0_rgba(204,251,241,0.14)]",
      tileFocusRing: "focus-visible:ring-2 focus-visible:ring-teal-400/45",
      iconBorder: "border-teal-400/5",
      iconShadow: "shadow-[0_0_12px_rgba(45,212,191,0.16)]",
      iconHoverGlow:
        "group-hover:border-teal-200/8 group-hover:shadow-[0_0_24px_rgba(45,212,191,0.55),0_0_48px_rgba(153,246,228,0.28)]",
      fallbackLetterClass: "text-teal-200/75",
      labelClass: "text-teal-50/95",
      footerClass: "text-teal-200/55",
      hudChipClass: "border-teal-400/35 text-teal-100/85 bg-black/55",
    },
  };
  return map[key]!;
}

/** Google apps first (requested), then comms + social. Each tile has its own neon channel. */
export const QUICK_ACCESS_TOOLS: { tool: QuickAccessTool; accentKey: QuickAccessAccentKey }[] = [
  { tool: { id: "gmail", label: "Gmail", href: "https://mail.google.com", embedInApp: false }, accentKey: "orange" },
  { tool: { id: "gdocs", label: "Google Docs", href: "https://docs.google.com", embedInApp: false }, accentKey: "blue" },
  { tool: { id: "gdrive", label: "Google Drive", href: "https://drive.google.com", embedInApp: false }, accentKey: "emerald" },
  { tool: { id: "gcal", label: "Google Calendar", href: "https://calendar.google.com", embedInApp: false }, accentKey: "amber" },
  { tool: { id: "gsheets", label: "Google Sheets", href: "https://sheets.google.com", embedInApp: false }, accentKey: "lime" },
  { tool: { id: "meet", label: "Google Meet", href: "https://meet.google.com", embedInApp: false }, accentKey: "teal" },
  { tool: { id: "slack", label: "Slack", href: "https://slack.com", embedInApp: false }, accentKey: "violet" },
  { tool: { id: "discord", label: "Discord", href: "https://discord.com", embedInApp: false }, accentKey: "indigo" },
  { tool: { id: "teams", label: "Teams", href: "https://teams.microsoft.com", embedInApp: false }, accentKey: "sky" },
  { tool: { id: "zoom", label: "Zoom", href: "https://zoom.us", embedInApp: false }, accentKey: "cyan" },
  { tool: { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com", embedInApp: false }, accentKey: "fuchsia" },
  { tool: { id: "x", label: "X", href: "https://x.com", embedInApp: false }, accentKey: "zinc" },
  { tool: { id: "instagram", label: "Instagram", href: "https://www.instagram.com", embedInApp: false }, accentKey: "rose" },
  { tool: { id: "youtube", label: "YouTube", href: "https://www.youtube.com", embedInApp: false }, accentKey: "red" },
];

/** @deprecated Legacy multi-deck export — use `QUICK_ACCESS_TOOLS`. */
export const QUICK_ACCESS_CATEGORIES: QuickAccessCategory[] = [];

const IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads";

export type QuickAccessGridProps = {
  siteName?: string;
  viewerTitle?: string;
  helpText?: string;
  className?: string;
  /** Legacy: ignored in unified layout. */
  categories?: QuickAccessCategory[];
  variant?: "default" | "fullWidth";
};

function QuickAccessTile({
  tool,
  accent,
  accentKey,
  onActivate,
}: {
  tool: QuickAccessTool;
  accent: QuickAccessTileAccent;
  accentKey: QuickAccessAccentKey;
  onActivate: (tool: QuickAccessTool) => void;
}) {
  const [iconOk, setIconOk] = useState(true);
  const fav = faviconUrlFromHref(tool.href);
  const footer = tool.embedInApp ? "Viewer · same tab fallback" : "Same tab · direct";
  const neon = quickAccessTileNeon(accentKey);

  return (
    <motion.button
      type="button"
      whileHover={{ y: -5, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onActivate(tool)}
      aria-label={`Open ${tool.label} in this tab`}
      style={
        {
          ["--lightning-color" as string]: neon.lightningMain,
          ["--lightning-color-soft" as string]: neon.lightningSoft,
        } as CSSProperties
      }
      className={cn(
        "lightning-glow-card compact-card-ui group relative flex min-h-[6.5rem] w-full max-w-full flex-col items-center justify-between overflow-hidden border-2 bg-gradient-to-b from-[#0e1018]/98 to-[#050508]/98 px-2 py-2.5 text-center outline-none sm:min-h-[7rem] sm:px-2 sm:py-3",
        TILE_OCT_CLIP,
        "touch-manipulation select-none",
        "motion-safe:transition-[box-shadow,border-color,filter,transform] motion-safe:duration-300 motion-safe:ease-out",
        accent.tileBorder,
        neon.baseGlow,
        accent.tileHoverBorder,
        accent.tileHoverGlow,
        "hover:brightness-[1.1] motion-reduce:hover:brightness-100",
        accent.tileFocusRing,
      )}
    >
      <span
        className="pointer-events-none absolute inset-[-3px] z-0 opacity-80 blur-[18px] motion-safe:transition-opacity motion-safe:duration-300 group-hover:opacity-100"
        style={{ background: neon.bloom }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-[4px] z-[2] border border-white/[0.07]"
        style={{ clipPath: "polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)" }}
        aria-hidden
      />
      <span className="pointer-events-none absolute left-2 top-2 z-[3] h-2.5 w-2.5 border-l border-t border-white/25" aria-hidden />
      <span className="pointer-events-none absolute bottom-2 right-2 z-[3] h-2.5 w-2.5 border-b border-r border-white/18" aria-hidden />
      <span
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.09), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.05), transparent 42%)",
        }}
      />
      <div
        className={cn(
          "relative z-[4] grid h-10 w-10 shrink-0 place-items-center rounded-md border bg-black/80 motion-safe:transition-[box-shadow,border-color] motion-safe:duration-300 motion-safe:ease-out sm:h-12 sm:w-12",
          accent.iconBorder,
          accent.iconShadow,
          accent.iconHoverGlow,
        )}
      >
        {fav && iconOk ? (
          <img
            src={fav}
            alt=""
            width={26}
            height={26}
            className="relative z-[1] h-[22px] w-[22px] object-contain opacity-95 motion-safe:transition-opacity sm:h-[26px] sm:w-[26px] group-hover:opacity-100"
            loading="lazy"
            onError={() => setIconOk(false)}
          />
        ) : (
          <span className={cn("text-base font-black", accent.fallbackLetterClass)} aria-hidden>
            {tool.label.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="relative z-[4] mt-2 min-h-[2.25rem] w-full px-0.5">
        <span
          className={cn(
            "block text-[9px] font-black uppercase leading-snug tracking-[0.14em] sm:text-[11px] sm:tracking-[0.16em]",
            accent.labelClass,
          )}
        >
          {tool.label}
        </span>
      </div>
      <div
        className={cn(
          "relative z-[4] mt-1 text-[6.5px] font-mono font-semibold uppercase leading-tight tracking-[0.12em] opacity-90 sm:text-[8px] sm:tracking-[0.14em]",
          accent.footerClass,
          "motion-safe:transition-opacity motion-safe:duration-300 group-hover:opacity-100",
        )}
      >
        {footer}
      </div>
    </motion.button>
  );
}

function InAppViewerModal({
  open,
  onClose,
  src,
  pageHref,
  title,
  viewerDialogLabel,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  pageHref: string;
  title: string;
  viewerDialogLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const openFull = useCallback(() => {
    openSameTab(pageHref);
  }, [pageHref]);

  return (
    <AnimatePresence mode="sync">
      {open ? (
        <motion.div
          key="quick-access-viewer-root"
          className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            aria-label="Close viewer backdrop"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            key="quick-access-viewer-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={viewerDialogLabel}
            className={cn(
              "relative z-[221] flex h-[min(92vh,820px)] w-[min(96vw,1120px)] flex-col overflow-hidden",
              "cut-frame cyber-frame gold-stroke border border-[rgba(255,215,0,0.35)] bg-[#050505]/96 shadow-[0_0_60px_rgba(0,0,0,0.75)]",
            )}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/50 px-3 py-2.5 sm:px-4">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--gold)]/90">
                  {title}
                </div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-white/45">{pageHref}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openFull}
                  className="rounded-md border border-[rgba(255,215,0,0.4)] bg-[rgba(255,215,0,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)] hover:bg-[rgba(255,215,0,0.14)]"
                >
                  Open full page
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/75 hover:border-white/25 hover:text-white"
                >
                  Close
                </motion.button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 bg-black">
              <iframe
                title={title}
                src={src}
                className="h-full w-full border-0"
                sandbox={IFRAME_SANDBOX}
                referrerPolicy="strict-origin-when-cross-origin"
                allow="fullscreen; clipboard-write"
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function QuickAccessGrid({
  siteName = "The Syndicate",
  viewerTitle,
  helpText,
  className,
  variant = "default",
}: QuickAccessGridProps) {
  const resolvedViewerTitle = viewerTitle ?? `${siteName} · viewer`;
  const resolvedHelp =
    helpText ??
    `Launch tools in this tab. When in-app preview is available, ${siteName} opens the viewer first; otherwise the destination loads directly. No new tabs.`;

  const [viewer, setViewer] = useState<{ src: string; href: string; label: string } | null>(null);

  const onActivate = useCallback((tool: QuickAccessTool) => {
    if (!tool.embedInApp) {
      openSameTab(tool.href);
      return;
    }
    const src = resolveIframeSrc(tool.href, tool.iframeSrc);
    setViewer({ src, href: tool.href, label: tool.label });
  }, []);

  const closeViewer = useCallback(() => setViewer(null), []);

  const isFull = variant === "fullWidth";

  return (
    <>
      <div className={cn("flex w-full max-w-none min-w-0 flex-col", isFull && "h-full min-h-0 flex-1", className)}>
        <CyberChamferFrame
          accent="hero"
          chamfer={18}
          className="w-full shadow-[0_0_48px_rgba(34,211,238,0.22),0_0_96px_rgba(168,85,247,0.16),0_0_140px_rgba(251,191,36,0.1)]"
          innerClassName="overflow-hidden p-0"
        >
          <div className="border-b border-white/[0.1] bg-[linear-gradient(180deg,rgba(10,14,24,0.55),transparent)] px-[clamp(0.85rem,2.2vw,1.25rem)] py-[clamp(0.85rem,2vw+0.25rem,1.2rem)] sm:px-5">
            <h2 className="text-[clamp(0.95rem,2.2vw,1.2rem)] font-black uppercase italic tracking-[0.18em] text-[color:var(--gold)] drop-shadow-[0_0_22px_rgba(255,215,0,0.28)] sm:tracking-[0.22em]">
              Quick access
            </h2>
            <p className="mt-2 max-w-4xl text-[clamp(0.68rem,0.45vw+0.55rem,0.9rem)] leading-relaxed text-zinc-200/75 md:leading-relaxed">
              {resolvedHelp}
            </p>
          </div>

          <div
            className={cn(
              "px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.85rem,2vw+0.35rem,1.25rem)] sm:px-4",
              isFull && "max-h-[min(72vh,720px)] overflow-y-auto overflow-x-hidden [scrollbar-color:rgba(167,139,250,0.45)_rgba(0,0,0,0.35)]",
            )}
          >
            <div className="relative m-[clamp(0.35rem,1.2vw,0.65rem)] overflow-hidden border border-cyan-400/28 bg-gradient-to-b from-black/75 to-[#070712]/96 p-[clamp(0.65rem,1.6vw,1rem)] shadow-[inset_0_0_56px_rgba(0,0,0,0.55),0_0_40px_rgba(34,211,238,0.14),0_0_80px_rgba(168,85,247,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] sm:m-3 sm:p-4 [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]">
              <span
                className="pointer-events-none absolute -inset-6 z-0 opacity-50 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.35), transparent 45%), radial-gradient(circle at 85% 70%, rgba(192,132,252,0.28), transparent 42%), radial-gradient(circle at 50% 100%, rgba(251,191,36,0.22), transparent 48%)",
                }}
                aria-hidden
              />
              <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px,22px_22px]" />
              <div className="relative z-[2] grid grid-cols-2 gap-[clamp(0.45rem,1.2vw+0.2rem,0.85rem)] sm:grid-cols-3 lg:grid-cols-4">
                {QUICK_ACCESS_TOOLS.map(({ tool, accentKey }) => (
                  <QuickAccessTile
                    key={tool.id}
                    tool={tool}
                    accentKey={accentKey}
                    accent={accentPreset(accentKey)}
                    onActivate={onActivate}
                  />
                ))}
              </div>
            </div>
          </div>
        </CyberChamferFrame>
      </div>

      <InAppViewerModal
        open={viewer != null}
        onClose={closeViewer}
        src={viewer?.src ?? "about:blank"}
        pageHref={viewer?.href ?? ""}
        title={viewer ? `${resolvedViewerTitle} — ${viewer.label}` : resolvedViewerTitle}
        viewerDialogLabel={resolvedViewerTitle}
      />
    </>
  );
}
