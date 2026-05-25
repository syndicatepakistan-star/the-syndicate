"use client";

import { createPortal } from "react-dom";
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DashboardNavKey, NotificationItem } from "./types";
import {
  DASHBOARD_NAVBAR_CHROME_NEON,
  getInstructorSlideNeonTheme,
  neonAccentStyleVars
} from "@/data/instructorSlideNeonThemes";
import { cn, themeAccent, type ThemeMode } from "./dashboardPrimitives";
import { useDashboardSnapshots, type DashboardCourseLike } from "./useDashboardSnapshots";

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function NotificationPanelBody({
  notifications,
  unread,
  onNavigate,
  setPanelOpen
}: {
  notifications: NotificationItem[];
  unread: number;
  onNavigate: (nav: DashboardNavKey) => void;
  setPanelOpen: (open: boolean) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[color:var(--gold-neon)]/85">
          Notifications
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold-neon)]/55">{unread} unread</div>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 no-scrollbar">
        {notifications.slice(0, 6).map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              if (n.cta?.nav) onNavigate(n.cta.nav);
              setPanelOpen(false);
            }}
            className={cn(
              "w-full shrink-0 rounded-md border bg-black/35 px-3 py-2 text-left transition hover:bg-black/55",
              n.read ? "border-white/10" : "border-[rgba(255,215,0,0.30)]"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] font-bold text-[color:var(--gold-neon)]/90">{n.title}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">{timeAgo(n.ts)}</div>
            </div>
            {n.message ? <div className="mt-1 text-[12px] text-white/60">{n.message}</div> : null}
            {n.cta?.label ? (
              <div className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--gold)]/90">
                {n.cta.label} →
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NotificationBell({
  themeMode,
  notifications,
  onNavigate,
  variant = "hero",
  onOpenChange
}: {
  themeMode: ThemeMode;
  notifications: NotificationItem[];
  onNavigate: (nav: DashboardNavKey) => void;
  /** `navbar` matches search / chrome button sizing in the top bar. */
  variant?: "hero" | "navbar";
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [overlayMount, setOverlayMount] = useState(false);
  const [navbarPanelStyle, setNavbarPanelStyle] = useState<CSSProperties | null>(null);
  const unread = notifications.filter((n) => !n.read).length;
  const t = themeAccent(themeMode);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const setPanelOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  useLayoutEffect(() => {
    setOverlayMount(true);
  }, []);

  useLayoutEffect(() => {
    if (variant !== "navbar" || !overlayMount) {
      if (variant !== "navbar") setNavbarPanelStyle(null);
      return;
    }
    if (!open) return;

    const GAP = 10;
    const pad = 8;
    const z = 140;

    const update = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = Math.min(420, window.innerWidth * 0.92);
      let left = r.right - w;
      left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
      const top = r.bottom + GAP;
      const maxH = Math.max(160, window.innerHeight - top - pad);
      setNavbarPanelStyle({
        position: "fixed",
        top,
        left,
        width: w,
        zIndex: z,
        maxHeight: Math.min(maxH, Math.floor(window.innerHeight * 0.78)),
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transformOrigin: "top right"
      });
    };

    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [variant, open, overlayMount]);

  useLayoutEffect(() => {
    if (variant !== "navbar" || !open || !overlayMount) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setPanelOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [variant, open, overlayMount, setPanelOpen]);

  const navbarChromeNeonStyle =
    variant === "navbar"
      ? neonAccentStyleVars(getInstructorSlideNeonTheme(DASHBOARD_NAVBAR_CHROME_NEON.bell))
      : undefined;

  const btnClass =
    variant === "navbar"
      ? cn(
          "navbar-chrome-btn navbar-chrome-neon cut-frame-sm cyber-frame gold-stroke relative grid shrink-0 place-items-center border bg-black text-[color:var(--neon-accent-bright)]/95",
          "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10",
          "origin-center transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none",
          "hud-hover-glow"
        )
      : cn(
          "cut-frame-sm cyber-frame gold-stroke hud-hover-glow relative grid h-10 w-10 place-items-center border bg-black/50 text-white/80 hover:text-white"
        );

  const iconClass = variant === "navbar" ? "h-[14px] w-[14px] sm:h-[17px] sm:w-[17px] md:h-5 md:w-5" : "h-5 w-5";

  return (
    <div className="relative shrink-0">
      <motion.button
        ref={btnRef}
        type="button"
        onClick={() => setPanelOpen(!open)}
        whileHover={variant === "navbar" ? { scale: 1 } : { scale: 1.04 }}
        whileTap={variant === "navbar" ? { scale: 1 } : { scale: 0.98 }}
        className={btnClass}
        style={variant === "navbar" ? navbarChromeNeonStyle : variant === "hero" ? { borderColor: t.border } : undefined}
        aria-label={unread > 0 ? `Notifications, ${unread > 9 ? "9 plus" : unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" aria-hidden="true">
          <path
            d="M12 20.2a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 20.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M18.2 16.2H5.8l1.1-1.3V11a5.1 5.1 0 0 1 10.2 0v3.9l1.1 1.3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 ? (
          variant === "navbar" ? (
            <span
              className={cn(
                "pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[48%]",
                "min-w-[16px] px-[3px] py-[2px] text-center font-mono text-[8px] font-bold tabular-nums leading-none tracking-tight text-[rgba(255,71,71,0.98)] sm:min-w-[18px] sm:text-[9px]",
                "rounded-[2px] border border-[rgba(197,179,88,0.58)] bg-[linear-gradient(180deg,rgba(24,22,18,0.97),rgba(6,6,6,0.99))]",
                "shadow-[0_0_12px_rgba(197,179,88,0.2),inset_0_1px_0_rgba(255,255,255,0.07)]"
              )}
              aria-hidden
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : (
            <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border border-white/10 bg-[rgba(255,59,59,0.95)] px-0.5 text-[9px] font-black leading-none text-white shadow-[0_0_16px_rgba(255,59,59,0.35)] sm:h-5 sm:min-w-[20px] sm:text-[10px]">
              {unread > 9 ? "9+" : unread}
            </span>
          )
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open && variant !== "navbar" ? (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="cut-frame cyber-frame gold-stroke absolute right-0 top-[calc(100%+10px)] z-[80] flex w-[min(420px,92vw)] max-h-[min(72vh,520px)] flex-col overflow-hidden border bg-[#060606]/95 p-3 backdrop-blur-md"
            style={{ borderColor: t.border, boxShadow: `0 0 0 1px ${t.glow}, 0 0 26px ${t.glow}` }}
            role="menu"
          >
            <NotificationPanelBody notifications={notifications} unread={unread} onNavigate={onNavigate} setPanelOpen={setPanelOpen} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {variant === "navbar" && overlayMount && open && navbarPanelStyle
        ? createPortal(
            <motion.div
              ref={panelRef}
              style={{ ...navbarPanelStyle, borderColor: t.border, boxShadow: `0 0 0 1px ${t.glow}, 0 0 26px ${t.glow}` }}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="cut-frame cyber-frame gold-stroke pointer-events-auto flex flex-col overflow-hidden border bg-[#060606]/95 p-3 shadow-[0_12px_48px_rgba(0,0,0,0.55)] backdrop-blur-md"
              role="menu"
            >
              <NotificationPanelBody notifications={notifications} unread={unread} onNavigate={onNavigate} setPanelOpen={setPanelOpen} />
            </motion.div>,
            document.body
          )
        : null}
    </div>
  );
}

/** Top navbar: same notification data as the dashboard control center. */
export function NavbarNotificationBell({
  themeMode,
  userName,
  courses,
  onNavigate,
  onOpenChange
}: {
  themeMode: ThemeMode;
  userName: string;
  courses: DashboardCourseLike[];
  onNavigate: (nav: DashboardNavKey) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const { snapshots } = useDashboardSnapshots({ userName, courses });
  return (
    <NotificationBell
      variant="navbar"
      themeMode={themeMode}
      notifications={snapshots.notifications}
      onNavigate={onNavigate}
      onOpenChange={onOpenChange}
    />
  );
}
