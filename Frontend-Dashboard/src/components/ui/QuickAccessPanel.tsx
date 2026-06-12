"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";

const BACKDROP_MS = 0.12;
const SHEET_MS = 0.18;
const SHEET_EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const MAIN_SCROLL_SELECTOR = "[data-main-shell-scroll]";
const MOBILE_MQ = "(max-width: 767px)";

const QuickAccessGrid = dynamic(
  () => import("@/features/productivity/control-center/QuickAccessGrid").then((m) => m.QuickAccessGrid),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[min(40vh,360px)] w-full items-center justify-center text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
        Loading tools…
      </div>
    )
  }
);

type OverlayMode = "embedded" | "viewport";

function QuickAccessPanelOverlay({ mode, onClose }: { mode: OverlayMode; onClose: () => void }) {
  const isViewport = mode === "viewport";

  return (
    <div
      className={cn(
        "pointer-events-none min-h-0 overflow-hidden",
        isViewport
          ? "fixed inset-0 z-[200] w-[100vw] max-w-[100vw] overscroll-none"
          : "absolute inset-0 z-[130]"
      )}
    >
      <motion.button
        type="button"
        aria-label="Close Quick Access overlay"
        className="pointer-events-auto absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: BACKDROP_MS * 0.85, ease: "easeIn" } }}
        transition={{ duration: BACKDROP_MS, ease: "easeOut" }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-access-panel-title"
        className={cn(
          "pointer-events-auto absolute flex min-h-0 flex-col overflow-hidden",
          isViewport
            ? "inset-0 h-[100svh] max-h-[100svh] w-full max-w-full rounded-none"
            : "inset-0 md:h-full md:max-h-full",
          "cut-frame cyber-frame gold-stroke border border-[rgba(255,215,0,0.42)] bg-[#060606]/98 shadow-[inset_0_1px_0_rgba(255,215,0,0.12),0_0_0_1px_rgba(255,215,0,0.2),0_24px_80px_rgba(0,0,0,0.55)]",
          isViewport &&
            "box-border pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]"
        )}
        style={{
          borderColor: "rgba(255, 215, 0, 0.5)",
          boxShadow:
            "inset 0 1px 0 rgba(255, 215, 0, 0.18), 0 0 0 1px rgba(255, 215, 0, 0.22), 0 24px 80px rgba(0,0,0,0.55)"
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: SHEET_MS, ease: SHEET_EASE }}
      >
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain p-2 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:p-3 sm:pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] md:p-4",
            "[scrollbar-color:rgba(255,215,0,0.5)_rgba(0,0,0,0.35)] [touch-action:pan-y]"
          )}
        >
          <QuickAccessGrid
            siteName="The Syndicate"
            variant="fullWidth"
            floatingShellOverlay
            headerSlot={
              <button
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-lg border border-[rgba(255,215,0,0.45)] bg-black/45 text-[color:var(--goals-milestones-gold)] transition hover:border-[rgba(255,215,0,0.65)] hover:text-[color:var(--goals-milestones-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,215,0,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060606]"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            }
          />
        </div>
      </motion.div>
    </div>
  );
}

/** Same docking / portal behaviour as {@link GoalsPanel}. */
export function QuickAccessPanel() {
  const { isQuickAccessPanelOpen, closeQuickAccessPanel } = useGoalsPanel();
  const [viewportMode, setViewportMode] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => setViewportMode(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isQuickAccessPanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQuickAccessPanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isQuickAccessPanelOpen, closeQuickAccessPanel]);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(MAIN_SCROLL_SELECTOR);
    if (!el) return;
    if (!isQuickAccessPanelOpen) return;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    return () => {
      el.style.overflow = prev;
    };
  }, [isQuickAccessPanelOpen]);

  useEffect(() => {
    if (!isQuickAccessPanelOpen || !viewportMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isQuickAccessPanelOpen, viewportMode]);

  const mode: OverlayMode = viewportMode ? "viewport" : "embedded";

  const tree = (
    <AnimatePresence mode="sync">
      {isQuickAccessPanelOpen ? (
        <QuickAccessPanelOverlay key="quick-access-overlay" mode={mode} onClose={closeQuickAccessPanel} />
      ) : null}
    </AnimatePresence>
  );

  if (viewportMode && typeof document !== "undefined") {
    return createPortal(tree, document.body);
  }

  return tree;
}
