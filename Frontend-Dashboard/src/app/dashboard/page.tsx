"use client";

import { createPortal } from "react-dom";
import type { ReactPortal } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ChromaGrid, { type ChromaItem } from "@/components/ChromaGrid";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardControlCenter from "@/components/dashboard/DashboardControlCenter";
import { DashboardShellBackground } from "@/components/dashboard/DashboardShellBackground";
import KingProgramUnlockOverlay from "@/components/dashboard/KingProgramUnlockOverlay";
import { NavbarNotificationBell } from "@/components/dashboard/NotificationBell";
import NeonTypingBadge from "@/components/NeonTypingBadge";
import LetterGlitch from "@/components/LetterGlitch";
import type { DashboardNavKey } from "@/components/dashboard/types";
import { useActivityTimeline } from "@/contexts/ActivityTimelineContext";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { GoalsPanel } from "@/components/ui/GoalsPanel";
import { QuickAccessPanel } from "@/components/ui/QuickAccessPanel";
import { SyndicateAiChallengePanel } from "@/components/SyndicateAiChallengePanel";
import { MembershipContentHub } from "@/components/membership/MembershipContentHub";
import { MembershipOfferLanding } from "@/components/membership/MembershipOfferLanding";
import { ProgramsCourseSection } from "@/components/programs/ProgramsCourseSection";
import { SupportSection } from "@/components/dashboard/SupportSection";
import { PlaylistCheckoutSync } from "@/components/programs/PlaylistCheckoutSync";
import { fetchMyCertificates } from "@/lib/certificates-api";
import { fetchBillingPurchaseHistory, type StreamPlaylistPurchaseHistoryItem } from "@/lib/streaming-api";
import { AFFILIATE_REFERRAL_IDS_STORAGE_KEY } from "@/lib/affiliateReferralIds";
import {
  DEFAULT_DASHBOARD_PROFILE_AVATAR,
  notifyDashboardProfileUpdated,
  PROFILE_AVATAR_STORAGE_KEY,
  PROFILE_DISPLAY_NAME_KEY,
  readDashboardProfileAvatarStorageRaw,
  readDashboardProfileDisplayName,
  resolveDashboardAvatarDisplayUrl,
  writeDashboardProfileAvatarRaw,
  writeDashboardProfileDisplayName
} from "@/lib/dashboardProfileStorage";
import { DASHBOARD_SHELL_NAV_EVENT, type DashboardShellNavEventDetail } from "@/lib/dashboardShellNavEvent";
import {
  fetchKingProgramSelection,
  fetchPortalIdentity,
  getAuthorizationHeader,
  hasSimpleAuthSessionClient,
  resolveClientApiUrl,
  submitKingProgramSelection,
  STORAGE_SIMPLE_AUTH,
  type KingProgramSelectionState,
  type PortalUser
} from "@/lib/portal-api";
import { logoutSyndicateSession } from "@/lib/syndicateAuth";
import toast, { Toaster } from "react-hot-toast";
import { SynCertificateCard } from "@/components/SynCertificateCard";
import { buildCertificateVerifyUrl } from "@/lib/certificate-public-url";
import {
  buildCertificateFilenameStem,
  downloadSynCertificate,
  formatCertificateIssuedOn,
} from "@/lib/download-certificate";
import { INSTRUCTOR_SLIDES } from "@/data/instructorSlides";

type NavItem = { label: string; key: string; active?: boolean };
type Course = {
  id: string;
  title: string;
  subtitle: string;
  statusText: string;
  progress: number; // 0..100
  accent?: "gold" | "ice";
  imageSrc?: string;
  meta?: string;
  detail?: string;
};
type MonkDifficulty = "Easy" | "Medium" | "Hard";
type MonkChallenge = {
  id: string;
  key: "mind" | "body" | "freedom" | "money";
  title: string;
  description: string;
  difficulty: MonkDifficulty;
  duration: string;
};
type ThemeMode = "default" | "danger" | "cyberpunk";

type FeatureMenuEntry = { section: string; label: string; navKey: string };

const FEATURE_MENU_ENTRIES: FeatureMenuEntry[] = [
  { section: "Website features", label: "Dashboard overview", navKey: "dashboard" },
  { section: "Website features", label: "Programs & courses", navKey: "programs" },
  { section: "Website features", label: "Syndicate Mode", navKey: "monk" },
  { section: "Website features", label: "Membership section", navKey: "resources" },
  { section: "More options", label: "Support", navKey: "support" },
  { section: "More options", label: "Quick Access", navKey: "quickaccess" },
  { section: "More options", label: "Affiliate", navKey: "affiliate" },
  { section: "More options", label: "Settings", navKey: "settings" }
];

const PROFILE_AVATAR_MAX_BYTES = Math.floor(1.5 * 1024 * 1024);

const menuMotion = {
  initial: { opacity: 0, y: -10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }
};

const sidebarMotion = {
  initial: { opacity: 0, x: -28 },
  animate: { opacity: 1, x: 0 },
  /** Match initial x so open/close are mirrored (was -32 on exit, which felt asymmetric). */
  exit: { opacity: 0, x: -28 },
  transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const }
};

function QuickAccessGridFallback() {
  return (
    <div
      className="flex min-h-[min(52vh,640px)] w-full flex-col justify-center gap-4 rounded-xl border border-white/10 bg-black/25 px-4 py-8"
      aria-hidden
    >
      <div className="mx-auto h-1.5 w-48 max-w-[80%] animate-pulse rounded-full bg-[rgba(255,215,0,0.2)]" />
      <div className="mx-auto h-1.5 w-32 max-w-[60%] animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

const QuickAccessGrid = dynamic(
  () => import("@/features/productivity/control-center/QuickAccessGrid").then((mod) => mod.QuickAccessGrid),
  { ssr: false, loading: () => <QuickAccessGridFallback /> }
);

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function IconToggle({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true">
      {open ? (
        <>
          <path d="M6 7h12M6 12h9M6 17h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18.5 12l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M6 7h12M6 12h9M6 17h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M15.5 12l2-2m-2 2l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function DashboardChromeLetterGlitch() {
  return (
    <div
      className={cn(
        "dashboard-chrome-letter-glitch pointer-events-none absolute inset-0 z-0 min-h-0 min-w-0 overflow-hidden",
        /* Abs-pos children of a CSS grid default to the first cell — span the full shell. */
        "[grid-column:1/-1] [grid-row:1/-1]"
      )}
      aria-hidden
    >
      <div className="absolute inset-0 min-h-0 min-w-0">
        <LetterGlitch
          glitchSpeed={70}
          centerVignette
          outerVignette
          smooth
          glitchColors={["#4a2b72", "#61dca3", "#61b3dc"]}
          layerOpacity={0.022}
          className="absolute inset-0 box-border min-h-0 min-w-0 max-w-none bg-transparent"
        />
      </div>
    </div>
  );
}

function GoldButton({
  children,
  compact,
  icon
}: {
  children: React.ReactNode;
  compact?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "cut-frame-sm cyber-frame gold-stroke hud-hover-glow glass-dark premium-gold-border premium-button relative inline-flex items-center gap-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]",
        "border border-[rgba(255,215,0,0.3)] hover:border-[rgba(255,215,0,0.65)]",
        "transition will-change-transform active:translate-y-0",
        compact && "px-3"
      )}
      type="button"
    >
      <span className="absolute inset-0 -z-10 opacity-70 [background:linear-gradient(135deg,rgba(255,215,0,0.12),rgba(0,0,0,0)_55%)]" />
      {icon ? <span className="grid h-4 w-4 place-items-center text-[color:var(--gold)]">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

/** Word-level lines for nav (narrow sidebar stacks via @container; no mid-word breaks). */
function SidebarNavLabel({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  return (
    <span className="nav-label-text break-normal [overflow-wrap:normal] [word-break:normal]">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="nav-word-group">
          {i > 0 ? <span className="nav-label-space"> </span> : null}
          <span className="nav-word">{word}</span>
        </span>
      ))}
    </span>
  );
}

function CheckboxSlot({ active }: { active?: boolean }) {
  return (
    <div
      className={cn(
        "sidebar-nav-checkbox relative shrink-0 border",
        active ? "border-[rgba(255,90,90,0.82)]" : "border-white/10"
      )}
    >
      <span
        className={cn(
          "sidebar-nav-checkbox-dot absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition",
          active &&
            "opacity-100 [background:linear-gradient(135deg,rgba(255,215,0,0.95),rgba(255,59,59,0.9))] [box-shadow:0_0_18px_rgba(255,59,59,0.28)]"
        )}
      />
      <span
        className={cn(
          "sidebar-nav-checkbox-ring absolute inset-0 opacity-0 transition",
          active && "opacity-100 [box-shadow:0_0_0_1px_rgba(255,59,59,0.52),0_0_22px_rgba(255,59,59,0.22)]"
        )}
      />
    </div>
  );
}

function SidebarNavKeyDecor() {
  return (
    <div className="sidebar-nav-key-slot" aria-hidden>
      <div className="sidebar-nav-key-decor pointer-events-none select-none">
        <img
          src="/assets/Gold-Key.png"
          alt=""
          width={120}
          height={120}
          className="sidebar-nav-key-spin"
          draggable={false}
        />
      </div>
    </div>
  );
}

function SidebarNavRailList({
  nav,
  selectedNavKey,
  setSelectedNavKey,
  onItemActivate,
  isNavLocked
}: {
  nav: NavItem[];
  selectedNavKey: string;
  setSelectedNavKey: (key: string) => void;
  onItemActivate?: () => void;
  isNavLocked: (key: string) => boolean;
}) {
  return (
    <div className="sidebar-nav-list">
      {nav.map((item) => {
        const locked = isNavLocked(item.key);
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setSelectedNavKey(item.key);
              onItemActivate?.();
            }}
            data-dock-item="sidebar"
            title={
              locked
                ? "The King — full access. Money Mastery: open to read what is included."
                : undefined
            }
            className={cn(
              "sidebar-nav-item nav-item group relative flex w-full items-center text-left",
              "cut-frame-sm hud-hover-glow glass-dark premium-gold-border gold-glow-hover transition",
              "hover:bg-black/45",
              locked && "ring-1 ring-amber-500/30 ring-inset opacity-[0.88]",
              selectedNavKey === item.key &&
                "is-selected glow-edge-strong hud-selected-glow border-[color:var(--gold-neon-border)] bg-[rgba(250,204,21,0.08)]"
            )}
          >
            <CheckboxSlot active={selectedNavKey === item.key} />
            <span className="sidebar-nav-icon-frame relative grid shrink-0 place-items-center border border-[color:var(--gold-neon-border-soft)] bg-black/25 text-[color:var(--gold-neon)]/90 group-hover:text-[color:var(--gold-neon)]">
              <NavIcon k={item.key} />
              {locked ? (
                <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded border border-amber-500/55 bg-black/90 text-amber-200">
                  <Lock className="h-2 w-2" strokeWidth={2.8} aria-hidden />
                </span>
              ) : null}
            </span>
            <span className="sidebar-nav-label nav-label flex min-w-0 flex-1 items-center gap-1.5 font-extrabold uppercase text-[color:var(--gold-neon)]/92 group-hover:text-[color:var(--gold-neon)]">
              <span className="min-w-0 flex-1">
                <SidebarNavLabel text={item.label} />
                <span className="nav-glitch" aria-hidden="true" />
              </span>
              {locked ? (
                <span className="sr-only">Tier locked — opens overview page for this section.</span>
              ) : null}
            </span>
            <span className="sidebar-nav-accent-line ml-auto hidden h-px shrink-0 bg-[linear-gradient(90deg,rgba(250,204,21,0),rgba(250,204,21,0.45))] opacity-0 transition group-hover:opacity-100 md:block" />
          </button>
        );
      })}
    </div>
  );
}

function NavIcon({ k }: { k: string }) {
  const base = "sidebar-nav-icon-svg";
  switch (k) {
    case "dashboard":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12L12 4l8 8v8H4v-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.5 20v-6h5v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "programs":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 4.75h10A2.25 2.25 0 0 1 19.25 7v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M8.2 9.2h7.6M8.2 12h5.5M8.2 14.8h8.4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "monk":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4.2c4.2 0 7.3 3.1 7.3 6.8 0 4-2.8 7-7.3 7s-7.3-3-7.3-7c0-3.7 3.1-6.8 7.3-6.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M9.2 11.2h5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 8.9c.6-.5 1.3-.8 2-.8.7 0 1.4.3 2 .8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "resources":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4.8h12v14.4H6V4.8Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 8h6M9 11h6M9 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "affiliate":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 8.5a4 4 0 1 0 8 0a4 4 0 1 0-8 0Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.8 20c1.1-3.4 3.9-5.6 7.2-5.6S18.1 16.6 19.2 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "power":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4.2a7.8 7.8 0 1 1 0 15.6A7.8 7.8 0 0 1 12 4.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M12 8.2v4.2l3.2 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "council":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 11.2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 7.6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 14.8h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6.6 19h10.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "support":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4.8c3.9 0 7 3.2 7 7.2 0 4.1-3.1 7.2-7 7.2-3.9 0-7-3.1-7-7.2 0-4 3.1-7.2 7-7.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M9.2 12.5h5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 16.2h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "quickaccess":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4.8 4.8h6.2v6.2H4.8V4.8Zm8.2 0h6.2v6.2H13V4.8Zm-8.2 8.2h6.2v6.2H4.8V13Zm8.2 0h6.2v6.2H13V13Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "settings":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 14.9a2.9 2.9 0 1 0 0-5.8a2.9 2.9 0 0 0 0 5.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M19.6 12a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8.6 8.6 0 0 0-1.7-1l-.4-2.6H9.9l-.4 2.6a8.6 8.6 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8.6 8.6 0 0 0 1.7 1l.4 2.6h4.2l.4-2.6a8.6 8.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"
            stroke="currentColor"
            strokeWidth="1.4"
            opacity="0.9"
          />
        </svg>
      );
    default:
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

function CircuitSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 640" fill="none" aria-hidden="true">
      <g stroke="rgba(197,179,88,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
        <path d="M320 96v132m0 56v76m0 64v120" opacity="0.55" />
        <path d="M180 170h110m60 0h110" opacity="0.5" />
        <path d="M150 260h150m40 0h150" opacity="0.55" />
        <path d="M210 410h90m80 0h90" opacity="0.52" />
        <path d="M160 500h170m-30 0 30-30m160 30H450" opacity="0.5" />
        <path d="M470 220v90m0 70v140" opacity="0.45" />
        <circle cx="320" cy="228" r="7" fill="rgba(197,179,88,0.45)" />
        <circle cx="470" cy="310" r="7" fill="rgba(197,179,88,0.35)" />
        <circle cx="210" cy="410" r="7" fill="rgba(197,179,88,0.35)" />
        <circle cx="290" cy="470" r="6" fill="rgba(197,179,88,0.28)" />
        <path d="M290 470h40l22-22h70" opacity="0.45" />
        <path d="M228 220v80m0 60v160" opacity="0.35" />
        <path d="M228 300h72l20-20h72" opacity="0.38" />
      </g>
      <g opacity="0.55">
        <circle cx="320" cy="320" r="250" stroke="rgba(197,179,88,0.18)" strokeWidth="2" />
        <circle cx="320" cy="320" r="214" stroke="rgba(197,179,88,0.12)" strokeWidth="2" />
        <path
          d="M320 92a228 228 0 0 1 161 67"
          stroke="rgba(197,179,88,0.22)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M546 320a226 226 0 0 1-66 160"
          stroke="rgba(197,179,88,0.18)"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function HudRingTicks({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="84" stroke="rgba(197,179,88,0.14)" strokeWidth="2" />
      <circle cx="100" cy="100" r="70" stroke="rgba(197,179,88,0.10)" strokeWidth="2" />
      <g stroke="rgba(197,179,88,0.35)" strokeWidth="2" strokeLinecap="round" opacity="0.85">
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const x1 = 100 + Math.cos(a) * 86;
          const y1 = 100 + Math.sin(a) * 86;
          const x2 = 100 + Math.cos(a) * (i % 3 === 0 ? 96 : 92);
          const y2 = 100 + Math.sin(a) * (i % 3 === 0 ? 96 : 92);
          return <path key={i} d={`M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`} />;
        })}
      </g>
      <path
        d="M100 16a84 84 0 0 1 64 30"
        stroke="rgba(197,179,88,0.25)"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function Metric({
  label,
  value,
  strong
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/55">{label}</div>
      <div
        className={cn(
          "font-extrabold tracking-[0.06em] text-[color:var(--gold)]",
          strong ? "text-[32px]" : "text-[28px]"
        )}
      >
        {value}
      </div>
      <div className="h-px w-full bg-[linear-gradient(90deg,rgba(197,179,88,0),rgba(197,179,88,0.35),rgba(197,179,88,0))]" />
    </div>
  );
}

function CourseCard({
  course,
  selected,
  onSelect
}: {
  course: Course;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-course-card
      className={cn(
        "cut-frame-sm cyber-frame gold-stroke hud-hover-glow relative overflow-hidden border bg-black/60 p-6 text-left transition",
        "border-[rgba(255,255,255,0.10)] hover:border-[rgba(197,179,88,0.62)] hover:bg-black/70",
        selected &&
          "is-glitching glow-edge-strong border-[rgba(197,179,88,0.80)] bg-[rgba(197,179,88,0.08)]"
      )}
    >
      <span className="absolute inset-0 opacity-70 [background:radial-gradient(520px_240px_at_25%_10%,rgba(197,179,88,0.12),rgba(0,0,0,0)_60%)]" />
      <span className="beep-line" aria-hidden="true" />

      <div className="relative">
        {/* Visual (auto-shows if you provide an image) */}
        <div className="cut-frame-sm relative mb-5 aspect-[16/7] overflow-hidden border border-[rgba(255,255,255,0.10)] bg-black/70">
          <div className="absolute inset-0 opacity-60 [background:radial-gradient(420px_140px_at_20%_0%,rgba(197,179,88,0.10),rgba(0,0,0,0)_62%)]" />
          {course.imageSrc ? (
            <img
              src={course.imageSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
          <div className="absolute inset-0 opacity-90 [background:linear-gradient(90deg,rgba(0,0,0,0.72),rgba(0,0,0,0.18),rgba(0,0,0,0.72))]" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-white/55">
              {course.subtitle}
            </div>
            <div
              className={cn(
                "mt-3 text-[18px] font-black uppercase tracking-[0.10em] text-[color:var(--gold)]/90",
                course.accent === "ice" && "text-white/90"
              )}
            >
              <span className="glitch-text" data-glitch={course.title}>
                {course.title}
              </span>
            </div>
            {course.meta ? <div className="mt-2 text-[12px] font-semibold text-white/55">{course.meta}</div> : null}
          </div>
          <div className="mt-1 grid place-items-center rounded-md border border-[rgba(197,179,88,0.22)] bg-black/35 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/65">
            {course.progress > 0 ? `${course.progress}%` : "--"}
          </div>
        </div>

        <div className="mt-4 text-[12px] font-semibold text-white/60">{course.statusText}</div>

        <div className="mt-3 h-[10px] w-full rounded-md border border-white/10 bg-black/35">
          <div
            className={cn(
              "h-full rounded-md bg-[rgba(197,179,88,0.55)]",
              course.progress === 0 && "bg-white/10",
              course.accent === "ice" && "bg-white/55"
            )}
            style={{ width: `${course.progress}%` }}
          />
        </div>

        {/* Inline details (expands under the selected card) */}
        {selected ? (
          <div className="mt-5 cut-frame-sm cyber-frame border border-[rgba(197,179,88,0.18)] bg-black/70 p-4">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/55">Details</div>
            <div className="mt-3 text-[13px] font-semibold leading-relaxed text-white/65">
              {course.detail ?? "Details will appear here."}
            </div>
          </div>
        ) : null}
      </div>
    </button>
  );
}

function ActiveCoursePanel({ course, onContinue }: { course: Course; onContinue: () => void }) {
  return (
    <div
      data-active-panel
      className="cut-frame cyber-frame gold-stroke relative overflow-hidden border border-[rgba(197,179,88,0.22)] bg-[#060606]/70 p-5"
    >
      <div className="absolute inset-0 opacity-70 [background:radial-gradient(920px_360px_at_40%_0%,rgba(197,179,88,0.12),rgba(0,0,0,0)_62%)]" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/55">Active Course</div>
          <div className="mt-2 text-[18px] font-black uppercase tracking-[0.12em] text-[color:var(--gold)]/90">
            <span className="glitch-text" data-glitch={course.title}>
              {course.title}
            </span>
          </div>
          {course.meta ? <div className="mt-2 text-[12px] font-semibold text-white/55">{course.meta}</div> : null}
          <div className="mt-2 text-[12px] font-semibold text-white/60">{course.statusText}</div>
          {course.detail ? <div className="mt-3 text-[12px] font-semibold text-white/55">{course.detail}</div> : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onContinue}
              className="cut-frame-sm cyber-frame gold-stroke premium-button relative inline-flex items-center gap-2 border border-[rgba(255,215,0,0.35)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)] hover:border-[rgba(255,215,0,0.75)]"
            >
              Continue
            </button>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              Progress saves automatically
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="grid place-items-center rounded-md border border-[rgba(197,179,88,0.26)] bg-black/35 px-3 py-2 text-[12px] font-extrabold uppercase tracking-[0.22em] text-[color:var(--gold)]">
            {course.progress}%
          </div>
          <div className="w-[220px]">
            <div className="h-[10px] w-full rounded-md border border-white/10 bg-black/35">
              <div className="h-full rounded-md bg-[rgba(197,179,88,0.60)]" style={{ width: `${course.progress}%` }} />
            </div>
            <div className="mt-2 h-px w-full bg-[linear-gradient(90deg,rgba(197,179,88,0),rgba(197,179,88,0.35),rgba(197,179,88,0))]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MonkIcon({ kind }: { kind: MonkChallenge["key"] }) {
  const base = "h-6 w-6";
  if (kind === "mind") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8.4 6.6A4.3 4.3 0 0 1 12 4.8a4.3 4.3 0 0 1 3.6 1.8A4.7 4.7 0 0 1 19 11c0 2.5-1.6 4.2-3.2 5.8-.9.9-1.4 1.8-1.4 3H9.6c0-1.2-.5-2.1-1.4-3C6.6 15.2 5 13.5 5 11a4.7 4.7 0 0 1 3.4-4.4Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.6 19.8h4.8M10.2 16.8h3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "body") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.8 10.2h4.4v3.6H3.8zM15.8 10.2h4.4v3.6h-4.4z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.2 12h7.6M11 9.2v5.6M13 9.2v5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "freedom") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.8 16.8c2.4-3.3 5.1-4.8 8.1-4.8 2.5 0 4.6 1.1 6.3 3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M5 8.8c2.8 1.4 5.4 1.5 7.8.2M12.8 9c2.1-1 4.1-2.4 6.2-4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18.5h14M6.8 15.2h10.4M8 11.8h8M9.3 8.5h5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 4.8v3.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SyndicateModeSection() {
  return (
    <section
      data-anim="in"
      className={cn(
        "syndicate-mode-section mt-0 flex min-h-0 w-full min-w-0 flex-col",
        "data-[mission-detail-open]:min-h-0 data-[mission-detail-open]:h-full data-[mission-detail-open]:flex-1"
      )}
    >
      <div
        className={cn(
          "syndicate-dystopia-enclosure syndicate-missions-shell cyber-frame relative flex min-h-0 w-full flex-col overflow-x-hidden bg-[#060606]/88 px-0 pb-0 pt-0 sm:pb-0 sm:pt-0.5",
          "data-[mission-detail-open]:h-full data-[mission-detail-open]:min-h-0 data-[mission-detail-open]:flex-1 data-[mission-detail-open]:overflow-hidden",
          "[&:not([data-mission-detail-open])]:overflow-y-visible"
        )}
      >
        <div className="pointer-events-none absolute inset-0 opacity-62 [background:radial-gradient(760px_220px_at_20%_0%,rgba(255,215,0,0.15),rgba(0,0,0,0)_65%)] syndicate-missions-shell-wash" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.015)_0px,rgba(255,255,255,0.015)_1px,transparent_8px,transparent_14px)]" />
        <div
          className={cn(
            "relative flex min-h-0 w-full flex-col pt-2 sm:pt-2.5",
            "data-[mission-detail-open]:h-full data-[mission-detail-open]:min-h-0 data-[mission-detail-open]:flex-1 data-[mission-detail-open]:overflow-hidden"
          )}
        >
          <SyndicateAiChallengePanel />
        </div>
      </div>
    </section>
  );
}

function AdminReviewPanel({ themeMode }: { themeMode: ThemeMode }) {
  const themed = themeMode !== "default";
  const accent =
    themeMode === "danger"
      ? "border-[rgba(255,92,92,0.42)]"
      : themeMode === "cyberpunk"
        ? "border-[rgba(196,126,255,0.44)]"
        : "border-[rgba(255,215,0,0.28)]";
  return (
    <div className={cn("cut-frame-sm border bg-black/45 p-4 backdrop-blur-sm", accent)}>
      <div className="mb-3 text-[14px] font-extrabold uppercase tracking-[0.18em] text-white/82">Admin Panel Overview</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Users", "1,284"],
          ["Total Referrals", "146"],
          ["Total Earnings", "$10,500"],
          ["Active Users", "318"]
        ].map(([k, v]) => (
          <div key={k} className={cn("rounded-md border bg-black/40 px-3 py-2", accent)}>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/62">{k}</div>
            <div className="mt-1 text-[22px] font-black text-[color:var(--gold)]">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className={cn("rounded-md border bg-black/40 p-2", accent)}><div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/62">User Activity</div><div className="flex h-20 items-end gap-1">{[40, 62, 50, 76, 68].map((v, i) => <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${v}%`, background: themeMode === "danger" ? "rgba(255,90,90,0.85)" : themeMode === "cyberpunk" ? "rgba(196,126,255,0.9)" : "rgba(255,215,0,0.85)" }} />)}</div></div>
        <div className={cn("rounded-md border bg-black/40 p-2", accent)}><div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/62">Growth Trend</div><svg viewBox="0 0 160 60" className="h-20 w-full"><polyline fill="none" stroke={themeMode === "danger" ? "rgba(255,150,90,0.9)" : themeMode === "cyberpunk" ? "rgba(0,255,255,0.9)" : "rgba(255,215,0,0.9)"} strokeWidth="3" points="8,46 36,34 64,30 92,22 122,16 152,10" /></svg></div>
        <div className={cn("rounded-md border bg-black/40 p-2", accent)}><div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/62">Earnings Split</div><div className="grid h-20 place-items-center"><div className="h-16 w-16 rounded-full border-8 border-t-[rgba(0,191,255,0.82)] border-r-[rgba(0,191,255,0.82)] border-b-[rgba(255,215,0,0.85)] border-l-[rgba(255,215,0,0.85)]" /></div></div>
      </div>
      <div className="mt-3 overflow-x-auto rounded-md border border-white/15 bg-black/35">
        <table className="w-full min-w-[420px] text-left text-[12px]">
          <thead className="text-[10px] uppercase tracking-[0.14em] text-white/62"><tr><th className="px-3 py-2">User</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Time</th></tr></thead>
          <tbody>
            {[
              ["Aariz", "signup", "2m ago"],
              ["Maya", "purchase", "7m ago"],
              ["Nora", "referral", "11m ago"]
            ].map((r) => (<tr key={r.join("-")} className="border-t border-white/10 text-white/82"><td className="px-3 py-2">{r[0]}</td><td className="px-3 py-2 uppercase">{r[1]}</td><td className="px-3 py-2">{r[2]}</td></tr>))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 text-[11px] font-bold text-white/82">
        <div className={cn("rounded-md border bg-black/40 px-3 py-2", accent)}><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#00ff7a]" />System Status: Active</div>
        <div className={cn("rounded-md border bg-black/40 px-3 py-2", accent)}><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#00bfff]" />Referral System: Operational</div>
        <div className={cn("rounded-md border bg-black/40 px-3 py-2", accent)}><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[color:var(--gold)]" />Payout System: Stable</div>
      </div>
      {themed ? <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Theme-adaptive review mode active</div> : null}
    </div>
  );
}

type SyndicateCategoryKey = "money" | "power" | "freedom" | "fitness" | "skills";

const syndicateCategoryLabel: Record<SyndicateCategoryKey, string> = {
  money: "Money Mastery",
  power: "Power",
  freedom: "Freedom",
  fitness: "Body & Mind Fitness",
  skills: "Skills"
};

const missionTitleById: Record<string, string> = {
  // money
  "m-a": "Cashflow Lockdown",
  "m-b": "Income Sprint",
  "m-c": "Asset Accumulation",
  "m-d": "Wealth Firewall",
  // power
  "p-a": "Command Presence",
  "p-b": "Dominance Protocol",
  "p-c": "Authority Buildout",
  "p-d": "Pressure Immunity",
  // freedom
  "f-a": "No-Feed Purge",
  "f-b": "Time Liberation",
  "f-c": "Autonomy System",
  "f-d": "Minimal Signal",
  // fitness
  "b-a": "Baseline Reset",
  "b-b": "Combat Conditioning",
  "b-c": "Iron Discipline",
  "b-d": "Cold Resolve",
  // skills
  "s-a": "Skill Lock-In",
  "s-b": "Execution Stack",
  "s-c": "Mastery Pipeline",
  "s-d": "Precision Craft"
};

const lackingCategoryByStrength: Record<SyndicateCategoryKey, SyndicateCategoryKey> = {
  money: "freedom",
  power: "skills",
  freedom: "power",
  fitness: "money",
  skills: "fitness"
};

const recommendedMissionByCategory: Record<SyndicateCategoryKey, string> = {
  money: "m-d",
  power: "p-b",
  freedom: "f-b",
  fitness: "b-b",
  skills: "s-b"
};

function getThemeToastStyle(themeMode: ThemeMode) {
  if (themeMode === "danger") {
    return {
      border: "rgba(255,92,92,0.55)",
      glow: "rgba(255,92,92,0.22)",
      accent: "#ffd4d4"
    };
  }
  if (themeMode === "cyberpunk") {
    return {
      border: "rgba(196,126,255,0.55)",
      glow: "rgba(196,126,255,0.20)",
      accent: "#e7d0ff"
    };
  }
  return {
    border: "rgba(255,215,0,0.50)",
    glow: "rgba(255,215,0,0.20)",
    accent: "#ffe79d"
  };
}

type ToastTone = "info" | "success" | "warning";
type ToastItem = {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
  durationMs: number;
};

function ToastQueueCenter({
  themeMode,
  toast,
  onDismiss
}: {
  themeMode: ThemeMode;
  toast: ToastItem | null;
  onDismiss: (id: string) => void;
}) {
  const t = getThemeToastStyle(themeMode);
  const toneColor = (tone: ToastTone) => {
    if (tone === "success") return { dot: "rgba(0,255,122,0.9)", text: "#b4ffd8" };
    if (tone === "warning") return { dot: "rgba(255,215,0,0.95)", text: "#ffe39f" };
    return { dot: t.border, text: t.accent };
  };

  return (
    <div className="pointer-events-none fixed right-3 top-[90px] z-[100] flex w-[min(360px,92vw)] flex-col gap-2">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-auto cut-frame-sm border bg-black/75 backdrop-blur-sm px-3 py-3"
            style={{
              borderColor: t.border,
              boxShadow: `0 0 0 1px ${t.glow}, 0 0 18px ${t.glow}`
            }}
            role="status"
          >
            {(() => {
              const c = toneColor(toast.tone);
              return (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ background: c.dot, boxShadow: `0 0 14px ${c.dot}` }} />
                      <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-white/78">{toast.title}</div>
                    </div>
                    {toast.message ? (
                      <div className="mt-2 text-[12px] leading-relaxed text-white/65">{toast.message}</div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/60 hover:text-white/90"
                    aria-label="Dismiss notification"
                  >
                    X
                  </button>
                </div>
              );
            })()}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function UserDashboardPanel({
  themeMode,
  userName,
  courses,
  onResumeCourse,
  onGoSyndicate
}: {
  themeMode: ThemeMode;
  userName: string;
  courses: Course[];
  onResumeCourse: (courseId: string) => void;
  onGoSyndicate: (category: SyndicateCategoryKey, missionId: string) => void;
}) {
  const [resumeCourseId, setResumeCourseId] = useState<string | null>(null);
  const [resumeProgress, setResumeProgress] = useState<number>(0);

  const [syndicateCategory, setSyndicateCategory] = useState<SyndicateCategoryKey>("power");
  const [syndicateDuration, setSyndicateDuration] = useState<7 | 14 | 30>(14);
  const [syndicateLevel, setSyndicateLevel] = useState<number | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [syndicateCycleProgress, setSyndicateCycleProgress] = useState<number>(0);

  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastGapTimerRef = useRef<number | null>(null);

  const enqueueToast = (toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item: ToastItem = { id, ...toast };
    setToastQueue((prev) => [...prev, item]);
  };

  const dismissToast = (id: string) => {
    setActiveToast((t) => (t?.id === id ? null : t));
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // Single-toast queue behavior: show one message, wait duration, wait 3s gap, then show next.
    if (activeToast) return;
    if (toastQueue.length === 0) return;

    const next = toastQueue[0];
    setActiveToast(next);

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (toastGapTimerRef.current) window.clearTimeout(toastGapTimerRef.current);

    toastTimerRef.current = window.setTimeout(() => {
      setActiveToast(null);
      toastGapTimerRef.current = window.setTimeout(() => {
        setToastQueue((prev) => prev.slice(1));
      }, 3000);
    }, next.durationMs);

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (toastGapTimerRef.current) window.clearTimeout(toastGapTimerRef.current);
    };
  }, [toastQueue, activeToast]);

  useEffect(() => {
    // Hydrate resume + syndicate snapshot from localStorage (demo persistence).
    const lastCourseId = window.localStorage.getItem("dashboarded:lastCourseId");
    setResumeCourseId(lastCourseId);
    const progressRaw = window.localStorage.getItem("dashboarded:course-progress");
    if (lastCourseId && progressRaw) {
      try {
        const parsed = JSON.parse(progressRaw) as Record<string, number>;
        setResumeProgress(typeof parsed[lastCourseId] === "number" ? parsed[lastCourseId] : 0);
      } catch {
        setResumeProgress(0);
      }
    } else {
      setResumeProgress(0);
    }

    const cat = window.localStorage.getItem("dashboarded:syndicate-category") as SyndicateCategoryKey | null;
    if (cat && cat in syndicateCategoryLabel) setSyndicateCategory(cat);

    const durRaw = window.localStorage.getItem("dashboarded:syndicate-duration");
    const durNum = durRaw ? Number(durRaw) : NaN;
    if (durNum === 7 || durNum === 14 || durNum === 30) setSyndicateDuration(durNum);

    const levelRaw = window.localStorage.getItem("dashboarded:syndicate-level");
    const levelNum = levelRaw ? Number(levelRaw) : NaN;
    if (Number.isFinite(levelNum)) setSyndicateLevel(Math.max(1, Math.floor(levelNum)));

    const missionId = window.localStorage.getItem("dashboarded:syndicate-missionId");
    setActiveMissionId(missionId || null);

    const cycRaw = window.localStorage.getItem("dashboarded:syndicate-cycle-progress");
    const cycNum = cycRaw ? Number(cycRaw) : NaN;
    if (Number.isFinite(cycNum)) {
      setSyndicateCycleProgress(Math.max(0, Math.min(100, cycNum)));
    } else {
      // Deterministic fallback so the UI doesn't look "stuck" on first load.
      const seedSource = missionId || lastCourseId || "seed";
      const seed = seedSource.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const computed = Math.max(0, Math.min(100, (seed % 61) + 20)); // 20..80
      window.localStorage.setItem("dashboarded:syndicate-cycle-progress", String(computed));
      setSyndicateCycleProgress(computed);
    }
  }, []);

  const resumeCourse = resumeCourseId ? courses.find((c) => c.id === resumeCourseId) ?? null : null;

  const strengthKey = syndicateCategory;
  const lackingKey = lackingCategoryByStrength[strengthKey];
  const recommendedMissionId = recommendedMissionByCategory[lackingKey];
  const activeMissionTitle = activeMissionId ? missionTitleById[activeMissionId] ?? activeMissionId : "No mission selected";
  const recommendedMissionTitle = missionTitleById[recommendedMissionId] ?? recommendedMissionId;

  const badgeLabel =
    syndicateDuration === 7 ? "Gold Badge" : syndicateDuration === 14 ? "Diamond Badge" : "Danger Zone";
  const fallbackBadgeLevel = syndicateDuration === 7 ? 6 : syndicateDuration === 14 ? 11 : 17;
  const badgeLevel = syndicateLevel ?? fallbackBadgeLevel;

  const unlockPercent = Math.max(0, Math.min(100, syndicateCycleProgress));

  useEffect(() => {
    // Push engaging “returning user” messages.
    enqueueToast({
      tone: "info",
      title: `Welcome back, ${userName}!`,
      message: "Your dashboard is synced. Check your next recommended actions.",
      durationMs: 2300
    });

    if (resumeCourse) {
      enqueueToast({
        tone: "warning",
        title: "Resume available",
        message: `Continue “${resumeCourse.title}” from ${resumeProgress}% progress.`,
        durationMs: 2400
      });
    }

    enqueueToast({
      tone: "success",
      title: "Syndicate mission ongoing",
      message: `Active mission: ${activeMissionTitle}. Level ${badgeLevel} • ${badgeLabel}.`,
      durationMs: 2500
    });

    enqueueToast({
      tone: "warning",
      title: "What you need next",
      message: `You’re strongest in ${syndicateCategoryLabel[strengthKey]}, but your next upgrade needs ${syndicateCategoryLabel[lackingKey]}.`,
      durationMs: 2600
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeCourseId, syndicateDuration, syndicateCategory, activeMissionId]);

  const themeAccent =
    themeMode === "danger"
      ? "rgba(255,92,92,0.45)"
      : themeMode === "cyberpunk"
        ? "rgba(196,126,255,0.42)"
        : "rgba(255,215,0,0.35)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <ToastQueueCenter
        themeMode={themeMode}
        toast={activeToast}
        onDismiss={dismissToast}
      />

      <div className={cn("cut-frame-sm border bg-black/45 p-4 backdrop-blur-sm", themeMode === "danger" ? "border-[rgba(255,92,92,0.42)]" : themeMode === "cyberpunk" ? "border-[rgba(196,126,255,0.44)]" : "border-[rgba(255,215,0,0.28)]")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[14px] font-extrabold uppercase tracking-[0.18em] text-white/82">User Dashboard</div>
            <div className="mt-2 text-[12px] font-semibold text-white/60">
              Resume, syndicate progress, and personalized focus.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="rounded-md border bg-black/35 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em]"
              style={{ borderColor: themeAccent, color: "rgba(255,255,255,0.85)" }}
            >
              {badgeLabel}
            </span>
            <span
              className="rounded-md border bg-black/35 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em]"
              style={{ borderColor: themeAccent, color: "rgba(255,255,255,0.85)" }}
            >
              Level {badgeLevel}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-black/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-white/72">Continue Program</div>
              {resumeCourse ? (
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--gold)]/90">{resumeProgress}%</div>
              ) : (
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">None yet</div>
              )}
            </div>

            {resumeCourse ? (
              <>
                <div className="mt-2 text-[22px] font-black uppercase tracking-[0.08em] text-white/80">
                  {resumeCourse.title}
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/45">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${unlockPercent}%`,
                      background: themeMode === "danger" ? "rgba(255,92,92,0.75)" : themeMode === "cyberpunk" ? "rgba(196,126,255,0.78)" : "rgba(255,215,0,0.75)"
                    }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onResumeCourse(resumeCourse.id)}
                    className="cut-frame-sm cyber-frame gold-stroke premium-button relative inline-flex items-center gap-2 border border-[rgba(255,215,0,0.3)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)] hover:border-[rgba(255,215,0,0.65)]"
                  >
                    Resume & Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 text-[12px] leading-relaxed text-white/65">
                  You haven’t started a program yet. Hit resume when you pick one from the Courses section.
                </div>
              </>
            )}
          </div>

          <div className="rounded-md border border-white/10 bg-black/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-white/72">Syndicate Snapshot</div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Ongoing</div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
                Active: {activeMissionTitle}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/60">Cycle Progress</div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/45">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${unlockPercent}%`,
                    background: themeMode === "danger" ? "rgba(255,92,92,0.75)" : themeMode === "cyberpunk" ? "rgba(0,255,255,0.58)" : "rgba(255,215,0,0.75)"
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-white/60">
                <span>{unlockPercent}% toward next reward</span>
                <span>{100 - unlockPercent}% remaining</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-black/35 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/62">Your Strength</div>
                <div className="mt-1 text-[13px] font-black uppercase tracking-[0.08em] text-[color:var(--gold)]/90">
                  {syndicateCategoryLabel[strengthKey]}
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-black/35 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/62">Need Focus</div>
                <div className="mt-1 text-[13px] font-black uppercase tracking-[0.08em] text-[#bbffd0]">
                  {syndicateCategoryLabel[lackingKey]}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md border bg-black/30 p-3">
              <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/80">
                Next Recommended Mission
              </div>
              <div className="mt-2 text-[16px] font-black uppercase tracking-[0.08em] text-[color:var(--gold)]/92">
                {recommendedMissionTitle}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onGoSyndicate(lackingKey, recommendedMissionId)}
                  className="rounded-md border border-[rgba(255,215,0,0.35)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)] hover:border-[rgba(255,215,0,0.7)]"
                >
                  Start Focus Mission
                </button>
                <button
                  type="button"
                  onClick={() => onGoSyndicate(strengthKey, activeMissionId ?? recommendedMissionId)}
                  className="rounded-md border border-white/15 bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70 hover:border-white/30"
                >
                  Open Syndicate Mode
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-white/10 bg-black/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-white/72">Quick Alerts</div>
              <div className="mt-2 text-[12px] leading-relaxed text-white/65">
                Tap any action to trigger a toast and keep the loop moving.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  enqueueToast({
                    tone: "success",
                    title: "Reward check",
                    message: "You’re progressing. Keep focus on your next mission to unlock the next step.",
                    durationMs: 2200
                  });
                }}
                className="rounded-md border border-[rgba(0,255,122,0.35)] bg-[rgba(0,255,122,0.08)] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#b4ffd8] hover:border-[rgba(0,255,122,0.65)]"
              >
                Claim Reward Hint
              </button>
              <button
                type="button"
                onClick={() => {
                  enqueueToast({
                    tone: "info",
                    title: "Micro-task queued",
                    message: "2-minute setup: open Syndicate Mode and pick your focus mission.",
                    durationMs: 2200
                  });
                }}
                className="rounded-md border border-[rgba(255,215,0,0.28)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/90 hover:border-[rgba(255,215,0,0.65)]"
              >
                Queue Micro-task
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UserDashboardGate({
  themeMode,
  userName,
  courses,
  onResumeCourse,
  onGoSyndicate
}: {
  themeMode: ThemeMode;
  userName: string;
  courses: Course[];
  onResumeCourse: (courseId: string) => void;
  onGoSyndicate: (category: SyndicateCategoryKey, missionId: string) => void;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");

  const requiredCode = (process.env.NEXT_PUBLIC_ADMIN_OVERVIEW_UNLOCK_CODE ?? "").trim();

  const accent =
    themeMode === "danger"
      ? "border-[rgba(255,92,92,0.42)]"
      : themeMode === "cyberpunk"
        ? "border-[rgba(196,126,255,0.44)]"
        : "border-[rgba(255,215,0,0.28)]";

  if (unlocked) {
    return (
      <UserDashboardPanel
        themeMode={themeMode}
        userName={userName}
        courses={courses}
        onResumeCourse={onResumeCourse}
        onGoSyndicate={onGoSyndicate}
      />
    );
  }

  const revealWithButton = requiredCode.length === 0;
  const revealWithCode = requiredCode.length > 0 && code === requiredCode;

  return (
    <div className={cn("cut-frame-sm border bg-black/45 p-4 backdrop-blur-sm", accent)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14px] font-extrabold uppercase tracking-[0.18em] text-white/82">User Dashboard</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
          {requiredCode.length > 0 ? "Locked" : "Hidden"}
        </div>
      </div>

      <div className="mt-2 rounded-md border border-white/10 bg-black/35 p-3 text-[12px] text-white/72">
        Click the button below to view your user dashboard.
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (revealWithButton) setUnlocked(true);
            else setShowCode(true);
          }}
          className="cut-frame-sm cyber-frame gold-stroke premium-button relative inline-flex items-center gap-2 border border-[rgba(255,215,0,0.3)] bg-black/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)] hover:border-[rgba(255,215,0,0.65)]"
        >
          View User Dashboard
        </button>

        {showCode ? (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter unlock code"
              className="w-[220px] rounded-md border border-white/15 bg-black/30 px-3 py-2 text-[12px] text-white/85 placeholder:text-white/35 outline-none focus:border-[rgba(255,215,0,0.55)]"
            />
            <button
              type="button"
              onClick={() => {
                if (revealWithCode) setUnlocked(true);
              }}
              disabled={!revealWithCode}
              className={cn(
                "rounded-md border px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em]",
                revealWithCode
                  ? "border-[rgba(0,255,122,0.55)] bg-[rgba(0,255,122,0.12)] text-[#b4ffd8]"
                  : "border-white/15 bg-black/20 text-white/45"
              )}
            >
              Unlock
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function InstructorSlideshow() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);
  const prevIdxRef = useRef(0);
  const slides = INSTRUCTOR_SLIDES;

  const active = slides[idx] ?? slides[0];

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const slideEls = Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));
    if (slideEls.length === 0) return;

    slideEls.forEach((s, i) => {
      gsap.set(s, {
        opacity: i === idx ? 1 : 0,
        x: i === idx ? 0 : 16,
        scale: i === idx ? 1 : 1.02,
        filter: i === idx ? "brightness(1)" : "brightness(0.9)"
      });
    });
  }, [idx]);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const slideEls = Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));
    if (slideEls.length < 2) return;

    const prev = prevIdxRef.current;
    if (prev === idx) return;
    prevIdxRef.current = idx;

    const outEl = slideEls[prev];
    const inEl = slideEls[idx];
    if (!outEl || !inEl) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.set(inEl, { opacity: 0, x: 22, scale: 1.035, filter: "brightness(0.90)" }, 0)
      .to(outEl, { opacity: 0, x: -22, scale: 1.02, duration: 1.05 }, 0)
      .to(inEl, { opacity: 1, x: 0, scale: 1, filter: "brightness(1)", duration: 1.2 }, 0.18);
  }, [idx]);

  useLayoutEffect(() => {
    const t = window.setInterval(() => setIdx((v) => (v + 1) % slides.length), 4200);
    return () => window.clearInterval(t);
  }, [slides.length]);

  return (
    <div
      ref={wrapRef}
      data-anim="in"
      className="cut-frame cyber-frame gold-stroke glass-dark hero-gold-frame hero-pulse-soft relative overflow-hidden p-[var(--fluid-deck-p)]"
    >
      <div className="hero-gold-overlay absolute inset-0 opacity-70" />
      <div className="relative grid grid-cols-1 gap-[clamp(1rem,2.5vw+0.5rem,2rem)] lg:grid-cols-2 lg:items-center">
        <div className="flex min-w-0 flex-col gap-[clamp(0.85rem,2vw+0.25rem,1.35rem)]">
          <div className="space-y-[clamp(0.65rem,1.5vw+0.2rem,1rem)]" aria-live="polite" aria-atomic="true">
            <div>
              <div className="fluid-text-ui-xs font-black uppercase tracking-[0.2em] text-white/45">Program</div>
              <div className="mt-1.5 text-[clamp(1rem,1.8vw+0.55rem,1.35rem)] font-black uppercase leading-snug tracking-[0.08em] text-[color:var(--gold)]/95">
                {active.programName}
              </div>
              <p className="mt-3 text-[clamp(0.68rem,0.45vw+0.55rem,0.88rem)] leading-relaxed text-white/68 line-clamp-4">
                {active.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1" role="tablist" aria-label="Instructor slides">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === idx}
                aria-label={slides[i]?.programName ?? `Slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={cn(
                  "h-[10px] w-[10px] rounded-[3px] border transition hover:border-white/25",
                  i === idx
                    ? "border-[rgba(197,179,88,0.55)] bg-[rgba(197,179,88,0.18)] glow-edge"
                    : "border-white/10 bg-black/30"
                )}
              />
            ))}
          </div>
        </div>

        <div className="relative min-h-[var(--fluid-instructor-media-minh)] w-full overflow-hidden rounded-lg border border-white/10 bg-black/80">
          <div className="absolute inset-0 opacity-85 [background:linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.55))]" />
          {slides.map((slide, i) => (
            <div
              key={slide.src}
              data-slide
              className="absolute inset-0 will-change-transform"
              style={{ opacity: i === idx ? 1 : 0 }}
            >
              <img
                src={slide.src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30 blur-[10px] scale-[1.08]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <img
                src={slide.src}
                alt={`${slide.instructorName} — ${slide.programName}`}
                className="absolute inset-0 h-full w-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatBillingDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function SettingsProfileSection({
  profileName,
  onProfileNameChange,
  onProfileNameSave,
  profileAvatar,
  onProfileAvatarFile,
  onResetProfile,
  onLogout,
}: {
  profileName: string;
  onProfileNameChange: (next: string) => void;
  onProfileNameSave: (next: string) => void;
  profileAvatar: string;
  onProfileAvatarFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onResetProfile: () => void;
  onLogout: () => void;
}) {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-xl border border-cyan-300/35 bg-[#05070d]/86 p-[clamp(0.85rem,1.8vw,1.4rem)] shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_0_26px_rgba(34,211,238,0.14),inset_0_0_18px_rgba(168,85,247,0.08)]">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(500px_220px_at_8%_0%,rgba(34,211,238,0.12),transparent_65%),radial-gradient(560px_260px_at_100%_100%,rgba(244,63,94,0.08),transparent_70%)]" />
        <div className="relative z-[1]">
          <div className="mb-4 border-b border-cyan-300/20 pb-3">
            <h2 className="text-[clamp(1.2rem,1.35vw+0.8rem,1.6rem)] font-black uppercase tracking-[0.12em] text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.35)]">
              Profile Settings
            </h2>
            <p className="mt-1 text-[14px] text-slate-200/80 sm:text-[15px]">
              Update your profile identity. Changes are reflected in dashboard sections.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative overflow-hidden rounded-lg border border-cyan-300/45 bg-[#040a12]/80 p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_18px_rgba(34,211,238,0.18),inset_0_0_16px_rgba(34,211,238,0.08)] [clip-path:polygon(0_0,96%_0,100%_14%,100%_100%,4%_100%,0_86%)]">
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(320px_140px_at_0%_0%,rgba(34,211,238,0.18),transparent_65%)]" />
              <label className="text-[13px] font-black uppercase tracking-[0.12em] text-cyan-100/90">Profile Name</label>
              <input
                value={profileName}
                onChange={(e) => onProfileNameChange(e.target.value)}
                onBlur={() => onProfileNameSave(profileName)}
                placeholder="Enter display name"
                className="mt-2 w-full rounded-md border border-cyan-200/30 bg-[#040710] px-3 py-2 text-[16px] text-slate-100 outline-none transition focus:border-cyan-300/70 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_0_12px_rgba(34,211,238,0.22)]"
              />
              <button
                type="button"
                onClick={() => onProfileNameSave(profileName)}
                className="mt-3 inline-flex items-center justify-center rounded-md border border-cyan-300/45 bg-cyan-400/10 px-3 py-2 text-[14px] font-black uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Save Name
              </button>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-fuchsia-300/45 bg-[#0a0412]/80 p-3 shadow-[0_0_0_1px_rgba(217,70,239,0.2),0_0_18px_rgba(217,70,239,0.16),inset_0_0_16px_rgba(217,70,239,0.08)] [clip-path:polygon(4%_0,100%_0,100%_86%,96%_100%,0_100%,0_14%)]">
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(300px_150px_at_100%_0%,rgba(217,70,239,0.16),transparent_65%)]" />
              <label className="text-[13px] font-black uppercase tracking-[0.12em] text-fuchsia-100/90">Profile Avatar</label>
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={profileAvatar}
                  alt="Profile avatar preview"
                  className="h-14 w-14 rounded-full border border-fuchsia-200/35 object-cover shadow-[0_0_12px_rgba(236,72,153,0.25)]"
                />
                <span className="text-[13px] text-slate-200/75">Upload your operator image for profile visibility across dashboard modules.</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-amber-300/45 bg-amber-400/10 px-3 py-2 text-[14px] font-black uppercase tracking-[0.08em] text-amber-100 transition hover:bg-amber-400/20">
                  Upload Image
                  <input type="file" accept="image/*" onChange={onProfileAvatarFile} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative overflow-hidden rounded-lg border border-amber-300/45 bg-[#110904]/78 p-3 shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_0_18px_rgba(251,191,36,0.14),inset_0_0_16px_rgba(249,115,22,0.08)] [clip-path:polygon(0_0,100%_0,100%_82%,92%_100%,8%_100%,0_82%)]">
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(460px_180px_at_50%_-10%,rgba(251,191,36,0.14),transparent_65%)]" />
              <label className="text-[13px] font-black uppercase tracking-[0.12em] text-rose-100/90">Account Actions</label>
              <p className="mt-1 text-[13px] text-slate-200/70">Use quick operations for profile cleanup and session control.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onResetProfile}
                  className="rounded-md border border-violet-300/45 bg-violet-400/10 px-3 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-violet-100 transition hover:bg-violet-400/20"
                >
                  Reset Profile
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md border border-rose-300/45 bg-rose-400/10 px-3 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-rose-100 transition hover:bg-rose-400/20"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingsBillingSection() {
  const [rows, setRows] = useState<StreamPlaylistPurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchBillingPurchaseHistory();
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setError(e instanceof Error ? e.message : "Could not load billing history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-xl border border-lime-300/40 bg-[#04100a]/82 p-[clamp(0.8rem,1.6vw,1.25rem)] shadow-[0_0_0_1px_rgba(163,230,53,0.16),0_0_22px_rgba(163,230,53,0.12),inset_0_0_18px_rgba(20,184,166,0.08)] [clip-path:polygon(0_0,98%_0,100%_10%,100%_100%,2%_100%,0_90%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_220px_at_0%_0%,rgba(163,230,53,0.14),transparent_65%),radial-gradient(420px_200px_at_100%_100%,rgba(20,184,166,0.1),transparent_70%)]" />
        <div className="mb-3 border-b border-[color:var(--gold-neon-border-mid)]/35 pb-3">
          <h2 className="text-[clamp(1.2rem,1.35vw+0.8rem,1.6rem)] font-black uppercase tracking-[0.12em] text-lime-200 drop-shadow-[0_0_8px_rgba(163,230,53,0.28)]">
            Billing History
          </h2>
          <p className="mt-1 text-[14px] text-white/72 sm:text-[15px]">
            Courses, stream playlists, and plan bundles (e.g. Money Mastery) with amount, status, and paid date.
          </p>
        </div>

        {loading ? <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-[14px] text-white/70">Loading billing history...</div> : null}
        {error ? <div className="rounded-lg border border-rose-500/35 bg-rose-950/30 px-3 py-3 text-[14px] text-rose-100/90">{error}</div> : null}
        {!loading && !error && rows.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-[14px] text-white/70">No purchases yet.</div>
        ) : null}

        {!loading && !error && rows.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-[760px] w-full border-collapse text-left text-[14px] sm:text-[15px]">
              <thead className="bg-[#111111] text-[color:var(--gold)]/92">
                <tr>
                  <th className="px-3 py-2 font-black uppercase tracking-[0.1em]">Item</th>
                  <th className="px-3 py-2 font-black uppercase tracking-[0.1em]">Amount</th>
                  <th className="px-3 py-2 font-black uppercase tracking-[0.1em]">Currency</th>
                  <th className="px-3 py-2 font-black uppercase tracking-[0.1em]">Status</th>
                  <th className="px-3 py-2 font-black uppercase tracking-[0.1em]">Paid At</th>
                  <th className="px-3 py-2 font-black uppercase tracking-[0.1em]">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 bg-black/35 text-white/88">
                    <td className="px-3 py-2 font-semibold">
                      {row.playlist_title ||
                        (row.playlist_id ? `Playlist #${row.playlist_id}` : "Purchase")}
                    </td>
                    <td className="px-3 py-2">{row.amount_paid}</td>
                    <td className="px-3 py-2 uppercase">{row.currency || "usd"}</td>
                    <td className="px-3 py-2 uppercase">{row.status}</td>
                    <td className="px-3 py-2">{formatBillingDate(row.paid_at)}</td>
                    <td className="px-3 py-2">{formatBillingDate(row.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type IssuedCertificate = {
  key: string;
  certificateId: string;
  playlistTitle: string;
  name: string;
  issuedAt: string;
};

const SETTINGS_CERTIFICATE_PREFIX = "syn_playlist_certificate_v1:";

function SettingsCertificatesSection() {
  const [certs, setCerts] = useState<IssuedCertificate[]>([]);
  const [downloadTarget, setDownloadTarget] = useState<IssuedCertificate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const exportCardRef = useRef<HTMLDivElement | null>(null);
  const downloadSessionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const readLocalCertificates = (): IssuedCertificate[] => {
      if (typeof window === "undefined") return [];
      const rows: IssuedCertificate[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(SETTINGS_CERTIFICATE_PREFIX)) continue;
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as Omit<IssuedCertificate, "key">;
          rows.push({
            key,
            certificateId: String(parsed.certificateId || "").trim(),
            playlistTitle: String(parsed.playlistTitle || "").trim(),
            name: String(parsed.name || "").trim(),
            issuedAt: String(parsed.issuedAt || ""),
          });
        } catch {
          // ignore bad rows
        }
      }
      return rows;
    };

    const loadCertificates = async () => {
      const localRows = readLocalCertificates();
      const apiRows = await fetchMyCertificates().catch(() => []);
      if (cancelled) return;
      const merged = new Map<string, IssuedCertificate>();
      for (const row of apiRows) {
        const certificateId = String(row.certificate_id || row.token_id || "").trim();
        if (!certificateId) continue;
        merged.set(certificateId, {
          key: `api:${certificateId}`,
          certificateId,
          playlistTitle: String(row.title || "").trim(),
          name: String(row.name || "").trim(),
          issuedAt: String(row.issued_at || ""),
        });
      }
      for (const row of localRows) {
        if (!merged.has(row.certificateId)) merged.set(row.certificateId, row);
      }
      const rows = Array.from(merged.values());
      rows.sort((a, b) => +new Date(b.issuedAt) - +new Date(a.issuedAt));
      setCerts(rows);
    };

    void loadCertificates();
    const onUpdated = () => void loadCertificates();
    window.addEventListener("syn-certificates-updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("syn-certificates-updated", onUpdated);
    };
  }, []);

  useEffect(() => {
    if (!downloadTarget) return;

    const session = ++downloadSessionRef.current;
    const target = downloadTarget;
    const filenameStem = buildCertificateFilenameStem(target.playlistTitle, target.certificateId);
    const cardInput = {
      ownerName: target.name || "Member",
      courseTitle: target.playlistTitle || "Syndicate Program",
      certificateId: target.certificateId,
      issuedOn: formatCertificateIssuedOn(target.issuedAt),
      verifyUrl: buildCertificateVerifyUrl(target.certificateId),
      filenameStem,
    };

    const runDownload = async () => {
      let card: HTMLDivElement | null = null;
      for (let attempt = 0; attempt < 30 && !card; attempt += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (session !== downloadSessionRef.current) return;
        card = exportCardRef.current;
        if (!card) await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
      }

      if (session !== downloadSessionRef.current) return;

      try {
        const format = await downloadSynCertificate(card, cardInput, window.location.origin);
        if (format === "svg") {
          toast.success("Certificate downloaded as SVG.");
        }
      } catch (err) {
        console.error("Certificate download failed:", err);
        toast.error("Could not download certificate. Please try again.");
      } finally {
        if (session === downloadSessionRef.current) {
          setDownloadingId(null);
          setDownloadTarget(null);
        }
      }
    };

    void runDownload();
  }, [downloadTarget]);

  const requestDownload = (cert: IssuedCertificate) => {
    setDownloadingId(cert.certificateId);
    setDownloadTarget(cert);
  };

  const exportPortal: ReactPortal | null =
    downloadTarget && typeof document !== "undefined"
      ? createPortal(
          <div
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[9999] w-[760px]"
            style={{ transform: 'translateX(-200vw)' }}
          >
            <SynCertificateCard
              ref={exportCardRef}
              forExport
              ownerName={downloadTarget.name || "Member"}
              courseTitle={downloadTarget.playlistTitle || "Syndicate Program"}
              certificateId={downloadTarget.certificateId}
              issuedOn={formatCertificateIssuedOn(downloadTarget.issuedAt)}
              verifyUrl={buildCertificateVerifyUrl(downloadTarget.certificateId)}
              className="w-[760px]"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <section id="settings-certificates" className="w-full scroll-mt-24">
      {exportPortal}
      <div className="rounded-xl border border-sky-300/28 bg-[#040814]/85 p-[clamp(0.8rem,1.6vw,1.2rem)] shadow-[0_0_0_1px_rgba(56,189,248,0.08),0_0_18px_rgba(56,189,248,0.1)]">
        <div className="mb-3 border-b border-sky-300/20 pb-3">
          <h2 className="text-[clamp(1.1rem,1.2vw+0.75rem,1.5rem)] font-black uppercase tracking-[0.12em] text-sky-100">
            Certificates
          </h2>
          <p className="mt-1 text-[13px] text-slate-200/78">Download issued course certificates from completed playlists.</p>
        </div>
        {certs.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-[14px] text-white/70">
            No certificates issued yet. Complete a playlist and apply for SYN token.
          </div>
        ) : (
          <div className="space-y-2.5">
            {certs.map((cert) => (
              <div key={cert.key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/12 bg-black/30 px-3 py-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-black text-white">{cert.playlistTitle || "Course"}</div>
                  <div className="mt-1 text-[12px] text-slate-200/80">Name: {cert.name || "Member"}</div>
                  <div className="text-[12px] text-amber-200/90">Certificate ID: {cert.certificateId}</div>
                </div>
                <button
                  type="button"
                  disabled={downloadingId === cert.certificateId}
                  onClick={() => requestDownload(cert)}
                  className="rounded-md border border-emerald-300/45 bg-emerald-500/12 px-3 py-2 text-[12px] font-black uppercase tracking-[0.08em] text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadingId === cert.certificateId ? "Downloading…" : "Download"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const { recordVisit, recordEvent } = useActivityTimeline();
  const { setShellSectionKey, setPanelThemeMode, closeGoalsPanel, closeQuickAccessPanel, isGoalsPanelOpen, isQuickAccessPanelOpen, setGoalsFabLocked } =
    useGoalsPanel();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const ringOuterRef = useRef<HTMLDivElement | null>(null);
  const ringInnerRef = useRef<HTMLDivElement | null>(null);
  const glowPulseRef = useRef<HTMLDivElement | null>(null);
  const glitchTimerRef = useRef<number | null>(null);
  const navGlitchTickersRef = useRef(new Map<HTMLElement, gsap.TickerCallback>());
  const navGlitchTimersRef = useRef(new Map<HTMLElement, number>());
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);
  const profilePanelRef = useRef<HTMLDivElement | null>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const logoWrapRef = useRef<HTMLButtonElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const topDockRef = useRef<HTMLDivElement | null>(null);
  const dockMouseY = useRef<number>(Infinity);
  const topMouseX = useRef<number>(Infinity);
  const topbarRef = useRef<HTMLDivElement | null>(null);
  const [overlayMount, setOverlayMount] = useState(false);
  const [profileMenuFixedStyle, setProfileMenuFixedStyle] = useState<CSSProperties | null>(null);

  const nav: NavItem[] = useMemo(
    () => [
      { key: "dashboard", label: "Dashboard", active: true },
      { key: "programs", label: "Programs" },
      { key: "monk", label: "Syndicate Mode" },
      { key: "resources", label: "Membership section" },
      { key: "support", label: "Support" },
      { key: "quickaccess", label: "Quick Access" },
      { key: "affiliate", label: "Affiliate" },
      { key: "settings", label: "Settings" }
    ],
    []
  );

  const [selectedNavKey, setNavKeyState] = useState<string>("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
  const [kingSelectionState, setKingSelectionState] = useState<KingProgramSelectionState | null>(null);
  const [kingSelectionLoading, setKingSelectionLoading] = useState(false);
  const [kingSelectionError, setKingSelectionError] = useState("");

  const isNavLocked = useCallback(
    (key: string) => {
      const L = portalUser?.dashboard_nav_locks;
      if (!L) return false;
      if (key === "monk" && L.monk) return true;
      if (key === "resources" && L.resources) return true;
      if (key === "dashboard" && L.dashboard) return true;
      return false;
    },
    [portalUser]
  );

  const applyNavKey = useCallback(
    (key: string) => {
      if (key === "affiliate") {
        router.push("/affiliate");
        return;
      }
      const valid = new Set(nav.map((n) => n.key));
      if (!valid.has(key)) return;
      if (typeof window !== "undefined") {
        const raw = new URLSearchParams(window.location.search).get("section");
        const currentKey = raw && valid.has(raw) ? raw : "dashboard";
        if (currentKey === key) {
          setNavKeyState(key);
          return;
        }
      }
      setNavKeyState(key);
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      params.set("section", key);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [nav, pathname, router]
  );

  const [themeMode, setThemeMode] = useState<ThemeMode>("default");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string>("/assets/a.webp");
  const [profileName, setProfileName] = useState(() =>
    typeof window === "undefined" ? "Member" : readDashboardProfileDisplayName()
  );

  const persistProfileName = useCallback((name: string) => {
    const trimmed = name.trim() || "Member";
    setProfileName(trimmed);
    try {
      writeDashboardProfileDisplayName(trimmed);
    } catch {
      /* ignore */
    }
    notifyDashboardProfileUpdated();
  }, []);

  const persistProfileAvatar = useCallback((src: string) => {
    setProfileAvatar(src);
    try {
      writeDashboardProfileAvatarRaw(src);
    } catch {
      if (src.startsWith("data:")) {
        window.alert("Could not save this image (browser storage may be full). It may disappear after you reload.");
      }
    }
    notifyDashboardProfileUpdated();
  }, []);

  const resetProfileSettings = useCallback(() => {
    persistProfileName("Member");
    persistProfileAvatar(DEFAULT_DASHBOARD_PROFILE_AVATAR);
    setThemeMode("default");
  }, [persistProfileAvatar, persistProfileName]);

  const onProfileAvatarFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > PROFILE_AVATAR_MAX_BYTES) {
        window.alert(`Choose an image under ${Math.round(PROFILE_AVATAR_MAX_BYTES / 1024 / 1024)} MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") return;
        persistProfileAvatar(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [persistProfileAvatar]
  );

  const handleLogout = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_SIMPLE_AUTH);
      window.localStorage.removeItem(PROFILE_DISPLAY_NAME_KEY);
      window.localStorage.removeItem(PROFILE_AVATAR_STORAGE_KEY);
      window.localStorage.removeItem(AFFILIATE_REFERRAL_IDS_STORAGE_KEY);
      logoutSyndicateSession();
    } catch {
      /* ignore */
    }
    document.cookie = "simple_auth_session=; path=/; max-age=0; samesite=lax";
    window.location.replace("/");
  }, []);

  useEffect(() => {
    try {
      const saved = readDashboardProfileAvatarStorageRaw();
      if (saved) setProfileAvatar(resolveDashboardAvatarDisplayUrl(saved));
      else setProfileAvatar(DEFAULT_DASHBOARD_PROFILE_AVATAR);
      setProfileName(readDashboardProfileDisplayName());
    } catch {
      /* ignore */
    }
  }, []);
  /** Overlay (max-lg): slide-out; lg+ grid rail (opened before paint in useLayoutEffect). */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** Below md (768px): main + sidebar sit side-by-side; nav column is 5/12 (~42% width). */
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  /** max-lg + iPad Pro portrait range: sidebar is a fixed overlay; main stays full width and only dims. */
  const [isOverlaySidebarBp, setIsOverlaySidebarBp] = useState(false);
  /** ≤820px: in-navbar menu under search + overlay rail behavior (tablet/desktop unchanged). */
  const [isMobileNavUi, setIsMobileNavUi] = useState(false);
  /** iPad Pro portrait-like viewport: pin topbar row layout and disable nav rail animation. */
  const [isIpadProPortraitUi, setIsIpadProPortraitUi] = useState(false);
  const [navQuickSearch, setNavQuickSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!hasSimpleAuthSessionClient()) {
        window.location.replace("/login");
        return;
      }
      const identity = await fetchPortalIdentity().catch(() => null);
      if (cancelled) return;
      if (!identity) {
        try {
          window.localStorage.removeItem(STORAGE_SIMPLE_AUTH);
          window.localStorage.removeItem(PROFILE_DISPLAY_NAME_KEY);
          window.localStorage.removeItem(PROFILE_AVATAR_STORAGE_KEY);
          window.localStorage.removeItem(AFFILIATE_REFERRAL_IDS_STORAGE_KEY);
          logoutSyndicateSession();
        } catch {
          /* ignore */
        }
        document.cookie = "simple_auth_session=; path=/; max-age=0; samesite=lax";
        window.location.replace("/login");
        return;
      }
      setPortalUser(identity);
      setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!portalUser?.king_program_selection_required) {
      setKingSelectionState(null);
      setKingSelectionError("");
      return;
    }
    setKingSelectionLoading(true);
    setKingSelectionError("");
    void (async () => {
      try {
        const state = await fetchKingProgramSelection();
        if (!cancelled) setKingSelectionState(state);
      } catch (e) {
        if (!cancelled) {
          setKingSelectionError(e instanceof Error ? e.message : "Could not load The King program selector.");
        }
      } finally {
        if (!cancelled) setKingSelectionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portalUser?.king_program_selection_required]);

  const handleKingSelectionSubmit = useCallback(
    async (payload: { course_ids: number[]; playlist_ids: number[] }) => {
      setKingSelectionLoading(true);
      setKingSelectionError("");
      try {
        const nextState = await submitKingProgramSelection(payload);
        setKingSelectionState(nextState);
        const identity = await fetchPortalIdentity();
        if (identity) setPortalUser(identity);
      } catch (e) {
        setKingSelectionError(e instanceof Error ? e.message : "Could not save The King selection.");
      } finally {
        setKingSelectionLoading(false);
      }
    },
    []
  );

  /** Fixed-position overlays portaled to document.body — float above main/instructor without affecting navbar size. */
  useLayoutEffect(() => {
    if (!overlayMount) return;
    const GAP = 8;
    const pad = 8;
    const z = 130;

    const update = () => {
      if (profileOpen && profileBtnRef.current) {
        const r = profileBtnRef.current.getBoundingClientRect();
        const w = Math.min(window.innerWidth * 0.92, 360);
        let left: number;
        if (window.innerWidth < 640) {
          left = r.left + r.width / 2 - w / 2;
        } else {
          left = r.right - w;
        }
        left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
        const top = r.bottom + GAP;
        const maxH = Math.max(120, window.innerHeight - top - pad);
        setProfileMenuFixedStyle({
          position: "fixed",
          top,
          left,
          width: w,
          zIndex: z,
          maxHeight: Math.min(maxH, Math.floor(window.innerHeight * 0.78)),
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transformOrigin: window.innerWidth < 640 ? "top center" : "top right"
        });
      }
    };

    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [overlayMount, profileOpen]);

  useEffect(() => {
    setShellSectionKey(selectedNavKey);
  }, [selectedNavKey, setShellSectionKey]);

  useEffect(() => {
    recordVisit(selectedNavKey);
  }, [selectedNavKey, recordVisit]);

  /** Goals panel is per-section: close when navigating so it must be reopened from the FAB. */
  useEffect(() => {
    closeGoalsPanel();
    closeQuickAccessPanel();
  }, [selectedNavKey, closeGoalsPanel, closeQuickAccessPanel]);

  useEffect(() => {
    setPanelThemeMode(themeMode);
  }, [themeMode, setPanelThemeMode]);

  useEffect(() => {
    setGoalsFabLocked(!!portalUser?.dashboard_nav_locks?.goals);
  }, [portalUser, setGoalsFabLocked]);

  /** Deep links to affiliate open the public marketing page. */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const section = new URLSearchParams(window.location.search).get("section");
    if (section === "affiliate") {
      router.replace("/affiliate");
    }
  }, [router]);

  /** Restore section from URL on load / refresh (e.g. /?section=programs). */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const section = new URLSearchParams(window.location.search).get("section");
    if (section === "affiliate") return;
    const valid = new Set(nav.map((n) => n.key));
    if (section && valid.has(section)) {
      setNavKeyState(section);
    }
  }, [nav]);

  /** Browser back/forward: keep shell in sync with ?section=. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromUrl = () => {
      const section = new URLSearchParams(window.location.search).get("section");
      if (section === "affiliate") {
        router.replace("/affiliate-portal");
        return;
      }
      const valid = new Set(nav.map((n) => n.key));
      if (section && valid.has(section)) setNavKeyState(section);
      else if (!section) setNavKeyState("dashboard");
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [nav, router]);

  /** Floating Quick Access (Goals overlay) → shell section without prop drilling. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onShellNav = (e: Event) => {
      const d = (e as CustomEvent<DashboardShellNavEventDetail>).detail;
      if (d?.key) applyNavKey(d.key);
    };
    window.addEventListener(DASHBOARD_SHELL_NAV_EVENT, onShellNav);
    return () => window.removeEventListener(DASHBOARD_SHELL_NAV_EVENT, onShellNav);
  }, [applyNavKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsNarrowViewport(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setOverlayMount(true);
  }, []);

  /** Before paint: match breakpoints + open desktop rail (avoids wrong grid + missing Dashboard until reload). */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const mq1023 = window.matchMedia("(max-width: 1023px), ((width: 1024px) and (height: 1366px))");
    const mq820 = window.matchMedia("(width: 1024px) and (height: 1366px)");
    const mq767 = window.matchMedia("(max-width: 767px)");
    const isIpadPortraitLike =
      window.innerWidth >= 980 && window.innerWidth <= 1035 && window.innerHeight >= 1290;
    setIsOverlaySidebarBp(mq1023.matches);
    setIsMobileNavUi(mq820.matches || isIpadPortraitLike);
    setIsIpadProPortraitUi(isIpadPortraitLike);
    setIsNarrowViewport(mq767.matches);
    if (!mq1023.matches) setSidebarOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px), ((width: 1024px) and (height: 1366px))");
    const apply = () => {
      const next = mq.matches;
      setIsOverlaySidebarBp(next);
      if (!next) setSidebarOpen(true);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(width: 1024px) and (height: 1366px)");
    const apply = () => {
      const isIpadPortraitLike =
        window.innerWidth >= 980 && window.innerWidth <= 1035 && window.innerHeight >= 1290;
      setIsIpadProPortraitUi(isIpadPortraitLike);
      setIsMobileNavUi(mq.matches || isIpadPortraitLike);
    };
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  /** After route change or overlay open, scroll rail to top so Dashboard is never clipped above the fold. */
  useLayoutEffect(() => {
    const el = sidebarRef.current;
    if (!el || !sidebarOpen) return;
    el.scrollTop = 0;
  }, [selectedNavKey, sidebarOpen]);


  /** lg+: collapse grid rail when not on Dashboard so missions / detail use full shell width (reopen via menu). */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 1023px), ((width: 1024px) and (height: 1366px))").matches) return;
    if (selectedNavKey !== "dashboard") setSidebarOpen(false);
  }, [selectedNavKey]);


  /** Overlay menu open: lock scroll so the page feels fixed behind the panel. */
  useEffect(() => {
    if (!isOverlaySidebarBp || !sidebarOpen) return;
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = rootRef.current;
    const prevRoot = root?.style.overflow ?? "";
    if (root) root.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      if (root) root.style.overflow = prevRoot;
    };
  }, [isOverlaySidebarBp, sidebarOpen]);

  const sidebarOccupiesGrid = useMemo(() => sidebarOpen && !isOverlaySidebarBp, [sidebarOpen, isOverlaySidebarBp]);

  /** Narrow overlay (≤820px): in-navbar dock + slide; wider tablet keeps short motion on fixed rail. */
  const useMobileOverlaySidebarMotion = isOverlaySidebarBp && isMobileNavUi;

  /** Same off-screen X for enter + exit so open mirrors close (avoids % width timing quirks). */
  const MOBILE_SIDEBAR_OFF_X = -320;
  const mobileOverlaySidebarTransition = useMemo(
    () => ({ duration: 0.38, ease: [0.22, 1, 0.36, 1] as const }),
    []
  );

  const courses: Course[] = useMemo(() => [], []);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const selectedCourse = selectedCourseId ? courses.find((c) => c.id === selectedCourseId) ?? null : null;
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const raw = window.localStorage.getItem("dashboarded:course-progress");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, number>;
      setCourseProgress(parsed ?? {});
    } catch {
      // ignore
    }
  }, []);

  const selectedCourseWithProgress = useMemo(() => {
    if (!selectedCourse) return null;
    const p = Math.max(0, Math.min(100, courseProgress[selectedCourse.id] ?? 0));
    return { ...selectedCourse, progress: p };
  }, [courseProgress, selectedCourse]);

  useEffect(() => {
    // Persist last course so the Dashboard can show a "resume where you left off" card.
    if (!selectedCourseId) return;
    window.localStorage.setItem("dashboarded:lastCourseId", selectedCourseId);

    const raw = window.localStorage.getItem("dashboarded:course-progress");
    let parsed: Record<string, number> = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw) as Record<string, number>;
      } catch {
        parsed = {};
      }
    }

    if (typeof parsed[selectedCourseId] !== "number") {
      parsed[selectedCourseId] = 0;
      window.localStorage.setItem("dashboarded:course-progress", JSON.stringify(parsed));
      setCourseProgress(parsed);
    }
  }, [selectedCourseId]);

  const chromaItems: ChromaItem[] = useMemo(
    () =>
      courses.map((c) => ({
        id: c.id,
        image: c.imageSrc ?? "",
        title: c.title,
        subtitle: c.meta ?? c.statusText,
        handle: c.subtitle,
        badge: "Premium",
        rating: 4.8,
        reviews:
          c.id === "a" ? 1284 :
          c.id === "b" ? 972 :
          c.id === "c" ? 864 :
          c.id === "d" ? 745 :
          c.id === "e" ? 1198 :
          c.id === "f" ? 1035 :
          688,
        lessons:
          c.id === "a" ? 36 :
          c.id === "b" ? 28 :
          c.id === "c" ? 32 :
          c.id === "d" ? 24 :
          c.id === "e" ? 34 :
          c.id === "f" ? 30 :
          22,
        price: 99,
        borderColor: "rgba(255,215,0,0.55)",
        gradient: "linear-gradient(165deg, rgba(255,215,0,0.16), rgba(255,195,0,0.08), rgba(0,0,0,0.93))"
      })),
    [courses]
  );

  const dashboardCoursesForSnapshots = useMemo(
    () => courses.map((c) => ({ id: c.id, title: c.title, meta: c.meta, statusText: c.statusText, imageSrc: c.imageSrc })),
    [courses]
  );

  const handleChromaCourseSelect = useCallback(
    (id: string) => {
      setSelectedCourseId(id);
      const c = courses.find((x) => x.id === id);
      recordEvent({
        category: "program",
        title: "Selected course",
        detail: c?.title ?? id,
        moreDetails: `Programs grid: focused “${c?.title ?? id}”. Continue from the panel below to advance; progress is saved locally for course id ${id}.`
      });
    },
    [courses, recordEvent]
  );

  /** Profile menu: click-outside only (kept out of GSAP context so opening/closing profile does not revert all shell tweens). */
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!profileOpen) return;
      const t = e.target as Node | null;
      const btn = profileBtnRef.current;
      const panel = profilePanelRef.current;
      if (!t || !btn || !panel) return;
      if (btn.contains(t) || panel.contains(t)) return;
      setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [profileOpen]);

  /**
   * Shell motion: dock tickers, intro tweens, course/monk reveals.
   * Depends on `selectedNavKey` (not `profileOpen`) so toggling the profile menu does not tear down tickers/tweens
   * and scramble layout during dev Fast Refresh or normal use.
   */
  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set("[data-anim='in']", { opacity: 0, y: 10 });
      gsap.set("[data-anim='left']", { opacity: 0, x: -18 });
      gsap.set("[data-anim='right']", { opacity: 0, x: 18 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });
      tl.to("[data-anim='in']", { opacity: 1, y: 0, stagger: 0.06 }, 0)
        .to("[data-anim='left']", { opacity: 1, x: 0, stagger: 0.05 }, 0.05)
        .to("[data-anim='right']", { opacity: 1, x: 0, stagger: 0.05 }, 0.12);

      if (ringOuterRef.current) {
        gsap.to(ringOuterRef.current, {
          rotate: 360,
          duration: 26,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%"
        });
      }
      if (ringInnerRef.current) {
        gsap.to(ringInnerRef.current, {
          rotate: -360,
          duration: 40,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%"
        });
      }
      if (glowPulseRef.current) {
        gsap.to(glowPulseRef.current, {
          opacity: 0.85,
          duration: 2.8,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut"
        });
      }

      // GSAP "Dock" magnification for sidebar items (vertical)
      const sidebarTick: gsap.TickerCallback = () => {
        const root = sidebarRef.current;
        if (!root) return;
        const items = Array.from(root.querySelectorAll<HTMLElement>("[data-dock-item='sidebar']"));
        if (items.length === 0) return;
        const y = dockMouseY.current;
        if (!Number.isFinite(y)) {
          items.forEach((it) => gsap.to(it, { scale: 1, duration: 0.18, ease: "power2.out", overwrite: true }));
          return;
        }
        const distance = 140;
        const base = 1;
        const mag = 1.18;
        items.forEach((it) => {
          const r = it.getBoundingClientRect();
          const cy = r.top + r.height / 2;
          const d = Math.min(distance, Math.abs(y - cy));
          const t = 1 - d / distance;
          const s = base + (mag - base) * t;
          gsap.to(it, { scale: s, duration: 0.12, ease: "power2.out", overwrite: true, transformOrigin: "50% 50%" });
        });
      };
      gsap.ticker.add(sidebarTick);

      // GSAP "Dock" magnification for top elements (horizontal)
      const topTick: gsap.TickerCallback = () => {
        const root = topDockRef.current;
        if (!root) return;
        const items = Array.from(root.querySelectorAll<HTMLElement>("[data-dock-item='top']"));
        if (items.length === 0) return;
        const x = topMouseX.current;
        if (!Number.isFinite(x)) {
          items.forEach((it) => gsap.to(it, { scale: 1, duration: 0.18, ease: "power2.out", overwrite: true }));
          return;
        }
        const distance = 220;
        const base = 1;
        const mag = 1.12;
        items.forEach((it) => {
          const r = it.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const d = Math.min(distance, Math.abs(x - cx));
          const t = 1 - d / distance;
          const s = base + (mag - base) * t;
          gsap.to(it, { scale: s, duration: 0.12, ease: "power2.out", overwrite: true, transformOrigin: "50% 50%" });
        });
      };
      gsap.ticker.add(topTick);

      // Card hover lift/glow
      const cards = gsap.utils.toArray<HTMLElement>("[data-course-card]");
      // Premium reveal: fade/slide-in with stagger when the grid enters view
      gsap.set(cards, { opacity: 0, y: 18 });
      const wrap = document.querySelector<HTMLElement>("[data-cards-wrap]");
      let revealed = false;
      const io = new IntersectionObserver(
        (entries) => {
          if (revealed) return;
          const hit = entries.some((e) => e.isIntersecting);
          if (!hit) return;
          revealed = true;
          gsap.to(cards, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 });
          io.disconnect();
        },
        { root: null, threshold: 0.18 }
      );
      if (wrap) io.observe(wrap);

      const cardDisposers: Array<() => void> = [];
      cards.forEach((card) => {
        const onEnter = () => {
          gsap.to(card, { y: -2, duration: 0.18, ease: "power2.out" });
        };
        const onLeave = () => {
          gsap.to(card, { y: 0, duration: 0.2, ease: "power2.out" });
        };
        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
        card.addEventListener("focus", onEnter);
        card.addEventListener("blur", onLeave);
        cardDisposers.push(() => {
          card.removeEventListener("mouseenter", onEnter);
          card.removeEventListener("mouseleave", onLeave);
          card.removeEventListener("focus", onEnter);
          card.removeEventListener("blur", onLeave);
        });
      });

      // Monk section cards: reveal on scroll with premium stagger
      let monkIo: IntersectionObserver | null = null;
      const monkCards = gsap.utils.toArray<HTMLElement>("[data-monk-card]");
      if (monkCards.length) {
        gsap.set(monkCards, { opacity: 0, y: 18 });
        const monkWrap = document.querySelector<HTMLElement>("[data-monk-card]")?.parentElement ?? null;
        let monkRevealed = false;
        monkIo = new IntersectionObserver(
          (entries) => {
            if (monkRevealed) return;
            const hit = entries.some((e) => e.isIntersecting);
            if (!hit) return;
            monkRevealed = true;
            gsap.to(monkCards, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out", stagger: 0.08 });
            monkIo?.disconnect();
          },
          { root: null, threshold: 0.16 }
        );
        if (monkWrap) monkIo.observe(monkWrap);

        const monkIcons = gsap.utils.toArray<HTMLElement>("[data-monk-icon]");
        monkIcons.forEach((icon, i) => {
          gsap.to(icon, {
            y: i % 2 === 0 ? -4 : -3,
            rotate: i % 2 === 0 ? 1.2 : -1.2,
            duration: 1.9 + i * 0.18,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          });
        });
      }

      return () => {
        gsap.ticker.remove(sidebarTick);
        gsap.ticker.remove(topTick);
        io.disconnect();
        monkIo?.disconnect();
        for (const d of cardDisposers) d();
      };
    }, rootRef);

    return () => ctx.revert();
  }, [selectedNavKey]);

  /** Nav glitch must attach when the rail exists (separate from main GSAP shell context). */
  useLayoutEffect(() => {
    if (!sidebarOpen) return;
    const aside = sidebarRef.current;
    if (!aside) return;

    const randToken = () => {
      const t = ["+", "-", "|", "/", "\\", "·", "--", "++", "+-", "-+", "—", "_", "¦"];
      return t[Math.floor(Math.random() * t.length)];
    };
    const buildGlitch = (targetLen: number) => {
      let out = "";
      while (out.length < targetLen) out += randToken();
      return out.slice(0, targetLen);
    };

    const navItems = Array.from(aside.querySelectorAll<HTMLElement>(".nav-item"));
    const disposers: Array<() => void> = [];

    navItems.forEach((item) => {
      const labelText = item.querySelector<HTMLElement>(".nav-label-text");
      const glitch = item.querySelector<HTMLElement>(".nav-glitch");
      if (!labelText || !glitch) return;

      let last = 0;
      const tick: gsap.TickerCallback = () => {
        const now = performance.now();
        if (now - last < 26) return;
        last = now;
        const raw = (labelText.textContent ?? "").replace(/\s+/g, " ").trim();
        const len = Math.max(14, Math.min(26, raw.length + 6));
        glitch.textContent = buildGlitch(len);
        gsap.set(glitch, { x: gsap.utils.random(-1.4, 1.4), filter: `brightness(${gsap.utils.random(1, 1.14)})` });
      };

      const stopNow = () => {
        item.classList.remove("is-hover-glitch");
        const tcb = navGlitchTickersRef.current.get(item);
        if (tcb) gsap.ticker.remove(tcb);
        navGlitchTickersRef.current.delete(item);
        const timer = navGlitchTimersRef.current.get(item);
        if (timer) window.clearTimeout(timer);
        navGlitchTimersRef.current.delete(item);
        gsap.set(glitch, { clearProps: "x,filter" });
        glitch.textContent = "";
      };

      const start = () => {
        stopNow();
        item.classList.add("is-hover-glitch");
        last = 0;
        const raw = (labelText.textContent ?? "").replace(/\s+/g, " ").trim();
        const len = Math.max(14, Math.min(26, raw.length + 6));
        glitch.textContent = buildGlitch(len);
        gsap.set(glitch, { x: gsap.utils.random(-1.4, 1.4), filter: `brightness(${gsap.utils.random(1, 1.14)})` });
        navGlitchTickersRef.current.set(item, tick);
        gsap.ticker.add(tick);
        const timer = window.setTimeout(() => stopNow(), 280);
        navGlitchTimersRef.current.set(item, timer);
      };

      const stop = () => stopNow();

      item.addEventListener("pointerenter", start);
      item.addEventListener("pointerleave", stop);
      item.addEventListener("pointercancel", stop);
      item.addEventListener("focus", start);
      item.addEventListener("blur", stop);

      disposers.push(() => {
        stopNow();
        item.removeEventListener("pointerenter", start);
        item.removeEventListener("pointerleave", stop);
        item.removeEventListener("pointercancel", stop);
        item.removeEventListener("focus", start);
        item.removeEventListener("blur", stop);
      });
    });

    return () => {
      disposers.forEach((d) => d());
    };
  }, [sidebarOpen]);

  useLayoutEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    const update = () => {
      if (!topbarRef.current) return;
      const h = topbarRef.current.getBoundingClientRect().height;
      const v = `${h}px`;
      if (rootRef.current) rootRef.current.style.setProperty("--topbarH", v);
      document.documentElement.style.setProperty("--topbarH", v);
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--topbarH");
    };
  }, []);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    if (glitchTimerRef.current) window.clearTimeout(glitchTimerRef.current);

    // After 1s, do the "beep" glitch visual on the selected card title + line.
    if (!selectedCourseId) return;

    glitchTimerRef.current = window.setTimeout(() => {
      const active = rootRef.current?.querySelector<HTMLElement>(`[data-course-card].is-glitching`) ?? null;
      if (!active) return;

      const beep = active.querySelector<HTMLElement>(".beep-line");
      const title = active.querySelector<HTMLElement>(".glitch-text");
      if (!title) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.set(active, { filter: "brightness(1.08)" })
        .to(beep, { opacity: 0.9, scaleX: 1, duration: 0.06 }, 0)
        .fromTo(beep, { scaleX: 0.2 }, { scaleX: 1.05, duration: 0.12 }, 0)
        .to(beep, { opacity: 0, duration: 0.18 }, 0.16)
        .to(title, { x: 1.2, duration: 0.04 }, 0)
        .to(title, { x: -1.4, duration: 0.05 }, 0.05)
        .to(title, { x: 0.6, duration: 0.04 }, 0.11)
        .to(title, { x: 0, duration: 0.06 }, 0.16)
        .to(active, { filter: "brightness(1)", duration: 0.2 }, 0.22);
    }, 1000);

    return () => {
      if (glitchTimerRef.current) window.clearTimeout(glitchTimerRef.current);
    };
    }, [selectedCourseId]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    gsap.fromTo(rootRef.current, { opacity: 0.9 }, { opacity: 1, duration: 0.22, ease: "power2.out" });
  }, [themeMode]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const active = selectedNavKey === "monk";
    if (active) {
      html.classList.add("syndicate-mode-active");
      body.classList.add("syndicate-mode-active");
    } else {
      html.classList.remove("syndicate-mode-active");
      body.classList.remove("syndicate-mode-active");
    }
    return () => {
      html.classList.remove("syndicate-mode-active");
      body.classList.remove("syndicate-mode-active");
    };
  }, [selectedNavKey]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "dashboard-hamburger-chrome relative min-h-screen hud-void hud-scanlines hud-noise overflow-x-hidden lg:h-screen",
        selectedNavKey === "monk"
          ? "flex w-full flex-col overflow-hidden no-scrollbar h-[100dvh] max-h-[100dvh] min-h-0 lg:h-screen lg:max-h-screen"
          : "w-screen overflow-y-auto lg:h-screen lg:overflow-hidden",
        themeMode === "danger" && "theme-danger",
        themeMode === "cyberpunk" && "theme-cyberpunk",
        !sidebarOpen && "focus-mode",
        selectedNavKey === "monk" && "syndicate-mood-context"
      )}
    >
      <DashboardShellBackground />
      <PlaylistCheckoutSync />
      {portalUser?.king_program_selection_required ? (
        <KingProgramUnlockOverlay
          state={kingSelectionState}
          loading={kingSelectionLoading}
          error={kingSelectionError}
          onSubmit={handleKingSelectionSubmit}
        />
      ) : null}
      <div className="hud-ambient-glow" aria-hidden="true" />
      <div
        className={cn(
          "relative z-[1] flex w-full max-w-[100vw] flex-col fluid-page-px",
          selectedNavKey === "monk"
            ? "min-h-0 flex-1 overflow-hidden pb-0 lg:h-full lg:min-h-0"
            : "min-h-screen fluid-page-pb lg:h-full lg:min-h-0",
        )}
      >
        {/* Sticky shell has no GSAP transform; inner bar uses data-anim (transform breaks sticky on same node). */}
        <div className="sticky top-0 z-[60] w-full max-w-full shrink-0">
          <div
            ref={topbarRef}
            data-anim="in"
            className={cn(
              "shell-neon-yellow cut-frame cyber-frame gold-stroke-strong premium-navbar dashboard-shell-surface-strong relative overflow-visible border fluid-nav-pl fluid-nav-pr fluid-nav-py max-lg:min-h-[12vh]",
              "grid max-lg:grid-cols-[auto_minmax(0,1fr)_auto] max-lg:items-center max-lg:gap-x-2 max-lg:gap-y-2",
              isMobileNavUi
                ? isIpadProPortraitUi
                  ? "max-lg:grid-rows-[auto_auto]"
                  : "max-lg:grid-rows-[auto_auto_auto]"
                : "max-lg:grid-rows-[auto_auto]",
              isIpadProPortraitUi && "max-lg:!py-2 max-lg:gap-y-1",
              "lg:flex lg:items-center lg:gap-[var(--fluid-nav-gap)] lg:overflow-visible"
            )}
          >
            <DashboardChromeLetterGlitch />
            <div className="dashboard-shell-wash pointer-events-none absolute inset-0 z-0 [background:radial-gradient(900px_280px_at_30%_0%,rgba(250,204,21,0.05),rgba(0,0,0,0)_55%)] [grid-column:1/-1] [grid-row:1/-1]" />
            <div
              ref={topDockRef}
              onMouseMove={(e) => {
                topMouseX.current = e.clientX;
              }}
              onMouseLeave={() => {
                topMouseX.current = Infinity;
              }}
              className="relative z-[1] flex min-w-0 shrink-0 items-center fluid-dock-gap max-lg:col-start-1 max-lg:row-start-1 max-lg:self-center"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="hamburger-attract navbar-chrome-btn cut-frame-sm cyber-frame grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-amber-300/70 bg-black/70 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.28)] sm:h-9 sm:w-9 md:h-10 md:w-10"
                aria-label={sidebarOpen ? "Hide sidebar menu" : "Show sidebar menu"}
              >
                <IconToggle open={sidebarOpen} />
              </button>
              <div className="relative min-w-0 max-w-[min(100%,148px)] sm:max-w-[min(100%,180px)] md:max-w-[200px] lg:max-w-[220px]">
                <button
                  ref={logoWrapRef}
                  type="button"
                  aria-label="Syndicate"
                  className={cn(
                    "logo-glow-shell relative z-[1] mx-auto grid w-full max-w-[min(100%,160px)] place-items-center overflow-visible sm:mx-0 sm:max-w-[188px] md:max-w-[200px] lg:max-w-[218px]",
                    "border-0 bg-transparent",
                    "px-[clamp(0.28rem,0.9vw+0.08rem,0.6rem)] py-[clamp(0.12rem,0.45vw+0.04rem,0.4rem)] max-lg:min-h-[2.35rem] lg:min-h-[var(--fluid-logo-min-h)]"
                  )}
                >
                  <img
                    src="/assets/logo.webp"
                    alt=""
                    className="pointer-events-none relative z-[1] h-[26px] w-auto max-w-[min(100%,100px)] object-contain opacity-[0.96] [filter:drop-shadow(0_0_14px_rgba(250,204,21,0.32))] sm:h-[34px] sm:max-w-[130px] md:h-[44px] md:max-w-[160px] lg:h-[60px] lg:max-w-[200px]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </button>
              </div>
            </div>

            <div className="relative z-[2] flex max-h-[2.75rem] min-h-0 min-w-0 flex-1 items-stretch justify-center overflow-hidden px-1 max-lg:col-start-2 max-lg:row-start-1 max-lg:max-h-[2.5rem] lg:h-[var(--fluid-logo-min-h)] lg:max-h-[var(--fluid-logo-min-h)] lg:min-w-0 lg:flex-1 lg:px-[clamp(0.2rem,1.1vw+0.1rem,0.75rem)]">
              <Toaster
                position="top-center"
                containerStyle={{
                  position: "relative",
                  top: "auto",
                  left: "auto",
                  right: "auto",
                  bottom: "auto",
                  width: "100%",
                  maxWidth: "100%",
                  height: "100%",
                  minHeight: "2rem",
                  maxHeight: "2.75rem",
                  alignSelf: "stretch",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  overflow: "hidden"
                }}
                toastOptions={{
                  duration: 8000,
                  className: "!bg-transparent !p-0 !shadow-none !m-0 !w-full !max-w-full"
                }}
              />
            </div>

            <div className="relative z-[2] min-w-0 w-full max-lg:col-span-3 max-lg:col-start-1 max-lg:row-start-2 lg:w-[min(248px,34vw)] lg:shrink-0">
              <label htmlFor="nav-quick-search" className="sr-only">
                Quick navigation search
              </label>
              <div
                className={cn(
                  "navbar-chrome-panel cut-frame-sm cyber-frame gold-stroke flex h-8 min-h-8 w-full items-center gap-1.5 border bg-black/70 px-2 sm:h-9 sm:min-h-9 sm:gap-2 sm:px-2.5 md:h-10 md:min-h-10 md:px-3",
                  "shadow-[inset_0_1px_0_rgba(197,179,88,0.08)]"
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="pointer-events-none h-3 w-3 shrink-0 text-[color:var(--gold-neon)]/85 sm:h-[14px] sm:w-[14px] md:h-4 md:w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M10.5 18.2a7.7 7.7 0 1 1 0-15.4a7.7 7.7 0 0 1 0 15.4Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path d="M16.2 16.2L20.4 20.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  id="nav-quick-search"
                  type="search"
                  value={navQuickSearch}
                  onChange={(e) => setNavQuickSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const q = navQuickSearch.trim().toLowerCase();
                    if (!q) return;
                    const hit = FEATURE_MENU_ENTRIES.find(
                      (ent) =>
                        ent.label.toLowerCase().includes(q) ||
                        ent.section.toLowerCase().includes(q) ||
                        ent.navKey.toLowerCase().includes(q)
                    );
                    if (hit) {
                      applyNavKey(hit.navKey);
                      setNavQuickSearch("");
                      recordEvent({
                        category: "system",
                        title: "Quick nav search",
                        detail: `Jumped to ${hit.label}`,
                        moreDetails: `Navbar search: matched “${q}” → ${hit.label} (section key “${hit.navKey}”).`,
                        route: typeof window !== "undefined" ? window.location.pathname : undefined
                      });
                    }
                  }}
                  placeholder="SEARCH SECTIONS"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-[color:var(--gold-neon)]/95 outline-none placeholder:text-[color:var(--gold-neon)]/38 sm:text-[9px] sm:tracking-[0.16em] md:text-[10px] md:tracking-[0.18em]"
                />
              </div>
            </div>

            <div className="relative z-[2] flex shrink-0 items-center gap-x-1.5 max-lg:col-start-3 max-lg:row-start-1 max-lg:justify-end sm:gap-x-2 lg:shrink-0">
              <NavbarNotificationBell
                themeMode={themeMode}
                userName={profileName}
                courses={dashboardCoursesForSnapshots}
                onNavigate={(nav: DashboardNavKey) => {
                  if (nav === "affiliate") router.push("/affiliate-login");
                  else applyNavKey(nav);
                }}
                onOpenChange={(open) => {
                  if (open) setProfileOpen(false);
                }}
              />

              <div className="relative shrink-0">
                <button
                  ref={profileBtnRef}
                  data-dock-item="top"
                  type="button"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                  }}
                  className={cn(
                    "navbar-chrome-panel cut-frame-sm cyber-frame gold-stroke glass-dark premium-button inline-flex max-w-[min(100%,188px)] items-center gap-[clamp(0.35rem,1vw+0.1rem,0.55rem)] rounded-md border px-[clamp(0.35rem,1vw+0.1rem,0.65rem)] py-[clamp(0.15rem,0.45vw+0.08rem,0.45rem)] sm:max-w-[200px] md:max-w-[218px]",
                    "max-lg:h-10 max-lg:min-h-10 max-lg:max-w-none max-lg:justify-center max-lg:px-2 max-lg:py-1.5",
                    "min-h-[var(--fluid-profile-btn-h)] h-[var(--fluid-profile-btn-h)] lg:w-full",
                    "origin-right transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none",
                    profileOpen && "hud-selected-glow scale-[1.02]"
                  )}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <img
                    src={profileAvatar}
                    alt="Profile avatar"
                    className={cn(
                      "h-[26px] w-[26px] shrink-0 rounded-[3px] border border-[color:var(--gold-neon-border-soft)] bg-black/30 object-cover sm:h-[34px] sm:w-[34px] md:h-[44px] md:w-[44px] lg:h-[52px] lg:w-[52px]",
                      profileOpen && "border-[color:var(--gold-neon-border)]"
                    )}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="min-w-0 flex-1 text-left leading-none max-lg:hidden">
                    <div className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-[color:var(--gold-neon)]/95 sm:text-[11px] sm:tracking-[0.1em] md:text-[12px] md:tracking-[0.11em] lg:text-[13px] lg:tracking-[0.12em]">
                      {profileName}
                    </div>
                    <div className="mt-0.5 text-[6px] font-extrabold uppercase tracking-[0.14em] text-white/45 sm:mt-0.5 sm:text-[7px] sm:tracking-[0.16em] md:text-[8px] md:tracking-[0.18em]">
                      Profile
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {isMobileNavUi ? (
              <div
                className={cn(
                  "relative z-[3] min-h-0 max-lg:col-span-3 max-lg:col-start-1 max-lg:w-full",
                  isIpadProPortraitUi ? "max-lg:row-start-2 max-lg:mt-0.5" : "max-lg:row-start-3"
                )}
              >
                <AnimatePresence initial={true} mode="sync">
                  {sidebarOpen && isOverlaySidebarBp && !isIpadProPortraitUi ? (
                    <motion.div
                      key="navbar-mobile-nav"
                      initial={{ height: 0, opacity: 1 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 1 }}
                      transition={mobileOverlaySidebarTransition}
                      className="overflow-hidden border-t border-[color:var(--gold-neon-border-mid)] bg-black/35"
                    >
                      <motion.div
                        initial={{ x: MOBILE_SIDEBAR_OFF_X, opacity: 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: MOBILE_SIDEBAR_OFF_X, opacity: 1 }}
                        transition={mobileOverlaySidebarTransition}
                        className="w-full will-change-transform"
                      >
                        <div
                          ref={sidebarRef as unknown as React.Ref<HTMLDivElement>}
                          className="sidebar-nav-dock mobile-sidebar-rail cut-frame shell-neon-yellow cyber-frame gold-stroke relative max-h-[min(52vh,440px)] overflow-y-auto border-0 dashboard-shell-surface pb-2 pt-1.5 no-scrollbar shadow-[inset_0_1px_0_rgba(197,179,88,0.08)]"
                        >
                          <DashboardChromeLetterGlitch />
                          <div className="pointer-events-none absolute inset-0 z-0 dashboard-shell-wash [background:radial-gradient(520px_220px_at_20%_0%,rgba(250,204,21,0.04),rgba(0,0,0,0)_62%)]" />
                          <div className="relative z-[1] min-w-0 px-1">
                            <SidebarNavRailList
                              nav={nav}
                              selectedNavKey={selectedNavKey}
                              setSelectedNavKey={applyNavKey}
                              onItemActivate={() => {}}
                              isNavLocked={isNavLocked}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                {sidebarOpen && isOverlaySidebarBp && isIpadProPortraitUi ? (
                  <div className="overflow-hidden border-t border-[color:var(--gold-neon-border-mid)] bg-black/35">
                    <div
                      ref={sidebarRef as unknown as React.Ref<HTMLDivElement>}
                      className="sidebar-nav-dock mobile-sidebar-rail cut-frame shell-neon-yellow cyber-frame gold-stroke relative max-h-[40vh] overflow-y-auto border-0 dashboard-shell-surface pb-2 pt-1.5 no-scrollbar shadow-[inset_0_1px_0_rgba(197,179,88,0.08)]"
                    >
                      <DashboardChromeLetterGlitch />
                      <div className="pointer-events-none absolute inset-0 z-0 dashboard-shell-wash [background:radial-gradient(520px_220px_at_20%_0%,rgba(250,204,21,0.04),rgba(0,0,0,0)_62%)]" />
                      <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col px-1">
                        <SidebarNavRailList
                          nav={nav}
                          selectedNavKey={selectedNavKey}
                          setSelectedNavKey={applyNavKey}
                          onItemActivate={() => {}}
                          isNavLocked={isNavLocked}
                        />
                        <SidebarNavKeyDecor />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {overlayMount
          ? createPortal(
              <AnimatePresence onExitComplete={() => setProfileMenuFixedStyle(null)}>
                {profileOpen && profileMenuFixedStyle ? (
                  <motion.div
                    key="profile-menu"
                    ref={profilePanelRef}
                    style={profileMenuFixedStyle}
                    initial={menuMotion.initial}
                    animate={menuMotion.animate}
                    exit={menuMotion.exit}
                    transition={menuMotion.transition}
                    className="compact-card-ui cut-frame cyber-frame gold-stroke glass-dark premium-gold-border pointer-events-auto overflow-hidden p-3 sm:p-4"
                    role="menu"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(620px_260px_at_20%_0%,rgba(0,255,255,0.10),rgba(0,0,0,0)_62%)]" />
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="shrink-0 border-b border-white/10 pb-3">
                    <label htmlFor="profile-display-name" className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/50">
                      Display name
                    </label>
                    <input
                      id="profile-display-name"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      onBlur={() => persistProfileName(profileName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      maxLength={48}
                      autoComplete="name"
                      className="mt-2 w-full rounded-md border border-white/12 bg-black/45 px-3 py-2 text-[13px] font-semibold text-white/92 outline-none placeholder:text-white/35 focus:border-[rgba(255,215,0,0.45)]"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="mt-3 flex flex-shrink-0 items-center justify-between gap-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/55">Choose Avatar</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/40">Presets · upload</div>
                  </div>

                  <input
                    ref={profileAvatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onProfileAvatarFile}
                  />

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {["a", "b", "c", "d", "e", "f"].map((k) => {
                      const src = `/assets/${k}.webp`;
                      const isOn = profileAvatar === src;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => persistProfileAvatar(src)}
                          className={cn(
                            "cut-frame-sm cyber-frame gold-stroke hud-hover-glow glass-dark premium-gold-border relative aspect-square overflow-hidden transition",
                            "hover:border-[rgba(255,215,0,0.62)]",
                            isOn && "hud-selected-glow border-[rgba(255,215,0,0.82)]"
                          )}
                          aria-label={`Select avatar ${k}`}
                        >
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover opacity-90"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                          {isOn ? (
                            <span className="absolute left-2 top-2 rounded-md border border-[rgba(0,255,255,0.35)] bg-black/60 px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[rgba(0,255,255,0.9)]">
                              On
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {profileAvatar.startsWith("data:") ? (
                    <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(0,255,255,0.55)">
                      Custom photo from your device
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => profileAvatarInputRef.current?.click()}
                      aria-label="Upload profile picture from your device"
                      className="cut-frame-sm cyber-frame gold-stroke hud-hover-glow glass-dark premium-gold-border premium-button inline-flex items-center justify-center px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[color:var(--gold)]/92 transition hover:border-[rgba(255,215,0,0.62)] hover:text-[rgba(255,215,0,0.95)]"
                    >
                      Upload from PC
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="cut-frame-sm cyber-frame gold-stroke hud-hover-glow inline-flex items-center justify-center border border-[rgba(255,255,255,0.14)] bg-black/35 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white/70 transition hover:border-[rgba(255,0,0,0.34)] hover:text-[rgba(255,0,0,0.88)] hover:[box-shadow:0_0_0_1px_rgba(255,0,0,0.20),0_0_44px_rgba(255,0,0,0.12)]"
                    >
                      Logout
                    </button>
                  </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>,
              document.body
            )
          : null}

        <AnimatePresence>
          {isOverlaySidebarBp && sidebarOpen ? (
            <motion.button
              key="overlay-sidebar-dismiss"
              type="button"
              aria-label="Close menu"
              className={cn(
                "fixed border-0 p-0 max-lg:block lg:hidden",
                isMobileNavUi
                  ? "z-[55] cursor-pointer bg-[rgba(0,0,0,0.4)]"
                  : "z-[88] bottom-0 cursor-default bg-transparent"
              )}
              style={
                isMobileNavUi
                  ? {
                      top: "var(--topbarH, 4.5rem)",
                      left: 0,
                      right: 0,
                      height: "calc(100dvh - var(--topbarH, 4.5rem))"
                    }
                  : {
                      top: "calc(var(--topbarH, 4.5rem) + var(--fluid-main-grid-pt))",
                      bottom: 0,
                      left: 0,
                      right: 0
                    }
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={
                isMobileNavUi ? mobileOverlaySidebarTransition : { duration: 0.15 }
              }
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
        </AnimatePresence>

        {/* Main frame — `relative` + popLayout: exiting sidebar leaves grid flow so main shell does not wrap to row 2 (14 cols) during close. */}
        <div className="relative mt-0 grid min-h-0 w-full max-w-none flex-1 auto-rows-[minmax(0,1fr)] grid-cols-12 fluid-main-grid max-md:items-start lg:h-full lg:min-h-0 lg:items-stretch">
          <AnimatePresence initial={true} mode="popLayout">
            {sidebarOpen && (!isOverlaySidebarBp || !isMobileNavUi) ? (
              <motion.aside
                key="main-sidebar"
                ref={sidebarRef as unknown as React.Ref<HTMLElement>}
                initial={
                  useMobileOverlaySidebarMotion
                    ? { x: MOBILE_SIDEBAR_OFF_X, opacity: 1 }
                    : sidebarMotion.initial
                }
                animate={useMobileOverlaySidebarMotion ? { x: 0, opacity: 1 } : sidebarMotion.animate}
                exit={
                  useMobileOverlaySidebarMotion
                    ? { x: MOBILE_SIDEBAR_OFF_X, opacity: 1 }
                    : sidebarMotion.exit
                }
                transition={useMobileOverlaySidebarMotion ? mobileOverlaySidebarTransition : sidebarMotion.transition}
                onMouseMove={(e) => {
                  dockMouseY.current = e.clientY;
                }}
                onMouseLeave={() => {
                  dockMouseY.current = Infinity;
                }}
                className={cn(
                  "sidebar-nav-dock shell-neon-yellow cut-frame cyber-frame gold-stroke dashboard-shell-surface overflow-y-auto border no-scrollbar",
                  isMobileNavUi && "mobile-sidebar-rail",
                  "max-lg:fixed max-lg:left-0 max-lg:z-[95] max-lg:w-[clamp(310px,46vw,460px)] max-lg:max-w-[clamp(310px,46vw,460px)] max-lg:rounded-r-lg max-lg:border-r max-lg:shadow-[0_12px_48px_rgba(0,0,0,0.55)]",
                  "max-lg:top-[calc(var(--topbarH,4.5rem)+var(--fluid-main-grid-pt))] max-lg:h-[40vh]",
                  /* Mobile: shorter rail (~52px + safe-area) above bottom chrome / FAB; tablet (max-lg) unchanged */
                  "max-[820px]:!top-[calc(var(--topbarH,4.5rem)+3px)] max-[820px]:!h-[calc(100dvh-var(--topbarH,4.5rem)-3px-3.25rem-env(safe-area-inset-bottom))] max-[820px]:box-border max-[820px]:overflow-x-hidden max-[820px]:rounded-br-lg max-[820px]:pb-2",
                  "lg:relative lg:col-span-2 lg:sticky lg:top-0 lg:z-20 lg:h-full lg:min-h-0 lg:w-auto lg:max-w-none lg:rounded-none lg:shadow-none lg:overflow-x-visible lg:overflow-y-auto"
                )}
              >
                <DashboardChromeLetterGlitch />
                <div className="dashboard-shell-wash pointer-events-none absolute inset-0 z-0 [background:radial-gradient(680px_320px_at_20%_10%,rgba(250,204,21,0.04),rgba(0,0,0,0)_62%)]" />
                <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-full">
                  <SidebarNavRailList
                    nav={nav}
                    selectedNavKey={selectedNavKey}
                    setSelectedNavKey={applyNavKey}
                    onItemActivate={() => {}}
                    isNavLocked={isNavLocked}
                  />
                  <SidebarNavKeyDecor />
                </div>
              </motion.aside>
            ) : null}
          </AnimatePresence>

          {/* Courses grid */}
          <motion.section
            layout={false}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            data-anim="in"
            className={cn(
              "shell-neon-yellow cut-frame cyber-frame gold-stroke dashboard-shell-surface relative flex min-h-0 w-full min-w-0 max-w-none flex-col self-stretch overflow-hidden border fluid-section-p",
              "col-span-12",
              sidebarOccupiesGrid ? "lg:col-span-10" : "lg:col-span-12",
              isOverlaySidebarBp &&
                sidebarOpen &&
                !isMobileNavUi &&
                "max-lg:pointer-events-none max-lg:opacity-[0.42] max-lg:transition-opacity max-lg:duration-200 max-lg:ease-out",
              "lg:h-full lg:min-h-0",
              sidebarOpen ? "col-span-7 md:col-span-10 lg:col-span-10" : "col-span-12",
              selectedNavKey === "monk" && "syndicate-main-shell min-h-0 flex-1",
              selectedNavKey === "monk"
                ? "px-0 pt-1 pb-0 sm:pt-1.5 sm:pb-0"
                : "fluid-section-p"
            )}
          >
            <DashboardChromeLetterGlitch />
            <div className="dashboard-shell-wash pointer-events-none absolute inset-0 z-0 [background:radial-gradient(820px_520px_at_40%_0%,rgba(250,204,21,0.035),rgba(0,0,0,0)_64%)]" />
            <div
              data-main-shell-scroll
              className={cn(
                "relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden no-scrollbar",
                !sidebarOccupiesGrid && "lg:pl-14",
                selectedNavKey === "monk"
                  ? "px-[clamp(0.4rem,1.1vw+0.2rem,0.85rem)] pr-0"
                  : "pr-1",
                !sidebarOpen && selectedNavKey !== "monk" && "md:pl-14",
                selectedNavKey !== "monk" && "px-[var(--fluid-section-p)]"
              )}
            >
              {selectedNavKey !== "monk" && selectedNavKey !== "programs" ? (
                <header className="mb-[clamp(0.65rem,1.5vw+0.2rem,1.1rem)] shrink-0 border-b border-[color:var(--gold-neon-border-mid)] pb-[clamp(0.45rem,1.2vw+0.15rem,0.85rem)] pr-1">
                  <div className="mx-auto flex w-[min(100%,96vw)] max-w-[min(56rem,92vw)] justify-center px-[clamp(0.35rem,2vw,1rem)]">
                    <NeonTypingBadge
                      phrases={["HONOUR · MONEY · POWER · FREEDOM"]}
                      typingSpeed={34}
                      deletingSpeed={24}
                      pauseMs={420}
                    />
                  </div>
                </header>
              ) : null}
              {selectedNavKey === "monk" ? (
                !portalUser ? (
                  <div className="flex min-h-[min(40vh,360px)] w-full items-center justify-center text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Loading access…
                  </div>
                ) : isNavLocked("monk") ? (
                  <div className="flex min-h-0 min-w-0 w-full max-w-none flex-1 flex-col overflow-y-auto no-scrollbar">
                    <MembershipOfferLanding embedded checkoutReturnPath="/dashboard?section=monk" />
                  </div>
                ) : (
                  <div className="syndicate-monk-route flex min-h-0 w-full min-w-0 max-w-none flex-col">
                    <SyndicateModeSection />
                  </div>
                )
              ) : selectedNavKey === "programs" ? (
                <ProgramsCourseSection
                  instructorHero={<InstructorSlideshow />}
                  chromaItems={chromaItems}
                  selectedCourseId={selectedCourseId}
                  onSelectCourse={handleChromaCourseSelect}
                  sidebarOccupiesGrid={sidebarOccupiesGrid}
                  isNarrowViewport={isNarrowViewport}
                  isGoalsPanelOpen={isGoalsPanelOpen}
                  isQuickAccessPanelOpen={isQuickAccessPanelOpen}
                  selectedCourseWithProgress={selectedCourseWithProgress}
                  activeCoursePanel={
                    selectedCourseWithProgress ? (
                      <ActiveCoursePanel
                        course={selectedCourseWithProgress}
                        onContinue={() => {
                          const id = selectedCourseWithProgress.id;
                          const next = Math.max(0, Math.min(100, (courseProgress[id] ?? 0) + 8));
                          const updated = { ...courseProgress, [id]: next };
                          setCourseProgress(updated);
                          window.localStorage.setItem("dashboarded:course-progress", JSON.stringify(updated));
                          window.localStorage.setItem("dashboarded:lastCourseId", id);
                          recordEvent({
                            category: "program",
                            title: "Lesson progress",
                            detail: `${selectedCourseWithProgress.title} → ${next}%`,
                            moreDetails: `You continued “${selectedCourseWithProgress.title}”. Completion is now ${next}% for this browser session; last active course id: ${id}.`
                          });
                        }}
                      />
                    ) : null
                  }
                />
              ) : selectedNavKey === "resources" ? (
                !portalUser ? (
                  <div className="flex min-h-[min(40vh,360px)] w-full items-center justify-center text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Loading access…
                  </div>
                ) : isNavLocked("resources") ? (
                  <div className="flex min-h-0 min-w-0 w-full max-w-none flex-1 flex-col overflow-y-auto">
                    <MembershipOfferLanding embedded checkoutReturnPath="/dashboard?section=resources" />
                  </div>
                ) : (
                  <div className="flex min-h-0 min-w-0 w-full max-w-none flex-1 flex-col">
                    <MembershipContentHub />
                  </div>
                )
              ) : selectedNavKey === "support" ? (
                !portalUser ? (
                  <div className="flex min-h-[min(40vh,360px)] w-full items-center justify-center text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Loading access…
                  </div>
                ) : (
                  <SupportSection />
                )
              ) : selectedNavKey === "quickaccess" ? (
                <div className="min-h-0 min-w-0 w-full max-w-none flex-1 py-1 md:py-2">
                  <section aria-label="Quick access tools" className="relative w-full min-w-0 flex-1 scroll-mt-2">
                    <div className="relative flex w-full min-h-[min(56vh,700px)] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[rgba(255,215,0,0.26)] bg-[#060606]/78 p-[var(--fluid-deck-p)] shadow-[0_0_0_1px_rgba(255,215,0,0.08),0_0_52px_rgba(255,215,0,0.08),inset_0_1px_0_rgba(255,215,0,0.08)] sm:min-h-[min(52vh,640px)]">
                      <div
                        className="pointer-events-none absolute inset-0 opacity-90 [background:radial-gradient(720px_320px_at_20%_0%,rgba(255,215,0,0.11),rgba(0,0,0,0)_60%)]"
                        aria-hidden
                      />
                      <div className="relative z-[1] flex min-h-0 w-full flex-1 flex-col">
                        <QuickAccessGrid siteName="The Syndicate" variant="fullWidth" />
                      </div>
                    </div>
                  </section>
                </div>
              ) : selectedNavKey === "settings" ? (
                <div className="min-h-0 min-w-0 w-full max-w-none flex-1 py-1 md:py-2">
                  <div className="space-y-4">
                    <SettingsProfileSection
                      profileName={profileName}
                      onProfileNameChange={setProfileName}
                      onProfileNameSave={persistProfileName}
                      profileAvatar={profileAvatar}
                      onProfileAvatarFile={onProfileAvatarFile}
                      onResetProfile={resetProfileSettings}
                      onLogout={handleLogout}
                    />
                    <SettingsCertificatesSection />
                    <SettingsBillingSection />
                  </div>
                </div>
              ) : selectedNavKey === "dashboard" ? (
                !portalUser ? (
                  <div className="flex min-h-[min(40vh,360px)] w-full items-center justify-center text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Loading access…
                  </div>
                ) : isNavLocked("dashboard") ? (
                  <div className="flex min-h-0 min-w-0 w-full max-w-none flex-1 flex-col overflow-y-auto">
                    <MembershipOfferLanding embedded checkoutReturnPath="/dashboard?section=dashboard" />
                  </div>
                ) : (
                  <>
                    <section
                      aria-label="Instructor intel feed"
                      className="mb-5 w-full shrink-0 scroll-mt-2"
                    >
                      <InstructorSlideshow />
                    </section>
                    <div className="min-h-0 min-w-0 w-full max-w-none flex-1 py-1 md:py-2">
                      <DashboardControlCenter
                        themeMode={themeMode}
                        userName={profileName}
                        userRole="Operator"
                        profileAvatar={profileAvatar}
                        courses={dashboardCoursesForSnapshots}
                        dashboardNavLocks={portalUser?.dashboard_nav_locks}
                        onNavigate={(nav) => {
                          if (nav === "affiliate") router.push("/affiliate-login");
                          else applyNavKey(nav);
                        }}
                      />
                    </div>
                  </>
                )
              ) : (
                <div className="rounded-md border border-white/15 bg-black/35 p-4 text-[12px] text-white/72">Section available soon.</div>
              )}
            </div>
            <GoalsPanel />
            <QuickAccessPanel />
          </motion.section>

          {/* Details now live inside the courses panel (scrollable). */}
        </div>
      </div>
    </div>
  );
}

