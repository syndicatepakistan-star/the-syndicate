"use client";

import { useEffect, type RefObject } from "react";

type DockAxis = "x" | "y";

function applyDockScale(
  items: HTMLElement[],
  pointer: number,
  axis: DockAxis,
  distance: number,
  magnification: number,
) {
  const base = 1;
  const mag = magnification;
  for (const item of items) {
    const rect = item.getBoundingClientRect();
    const center = axis === "y" ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
    const delta = Math.min(distance, Math.abs(pointer - center));
    const t = 1 - delta / distance;
    const scale = base + (mag - base) * t;
    item.style.transform = `scale(${scale.toFixed(3)})`;
    item.style.transformOrigin = "50% 50%";
  }
}

function resetDockScale(items: HTMLElement[]) {
  for (const item of items) {
    item.style.transform = "";
    item.style.transformOrigin = "";
  }
}

/**
 * Pointer-driven dock magnification (replaces per-frame GSAP ticker — much lighter on CPU).
 */
export function useDockMagnification({
  rootRef,
  sidebarRef,
  topDockRef,
  sidebarOpen,
}: {
  rootRef: RefObject<HTMLElement | null>;
  sidebarRef: RefObject<HTMLElement | null>;
  topDockRef: RefObject<HTMLElement | null>;
  sidebarOpen: boolean;
}) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    let rafId = 0;
    let sidebarPointerY = Number.POSITIVE_INFINITY;
    let topPointerX = Number.POSITIVE_INFINITY;

    const update = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;

        const sidebar = sidebarRef.current;
        const topDock = topDockRef.current;
        const sidebarItems = sidebar
          ? Array.from(sidebar.querySelectorAll<HTMLElement>("[data-dock-item='sidebar']"))
          : [];
        const topItems = topDock
          ? Array.from(topDock.querySelectorAll<HTMLElement>("[data-dock-item='top']"))
          : [];

        const compactSidebar = window.matchMedia("(max-width: 820px)").matches;
        if (sidebarOpen && sidebarItems.length > 0 && !compactSidebar && Number.isFinite(sidebarPointerY)) {
          applyDockScale(sidebarItems, sidebarPointerY, "y", 140, 1.18);
        } else if (sidebarItems.length > 0) {
          resetDockScale(sidebarItems);
        }

        if (topItems.length > 0 && Number.isFinite(topPointerX)) {
          applyDockScale(topItems, topPointerX, "x", 220, 1.12);
        } else if (topItems.length > 0) {
          resetDockScale(topItems);
        }
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      const sidebar = sidebarRef.current;
      const topDock = topDockRef.current;
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (sidebar?.contains(target)) {
        sidebarPointerY = event.clientY;
      }
      if (topDock?.contains(target)) {
        topPointerX = event.clientX;
      }
      update();
    };

    const onPointerLeave = (event: PointerEvent) => {
      const related = event.relatedTarget;
      const sidebar = sidebarRef.current;
      const topDock = topDockRef.current;

      if (sidebar && (!(related instanceof Node) || !sidebar.contains(related))) {
        sidebarPointerY = Number.POSITIVE_INFINITY;
      }
      if (topDock && (!(related instanceof Node) || !topDock.contains(related))) {
        topPointerX = Number.POSITIVE_INFINITY;
      }
      update();
    };

    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", onPointerLeave, { passive: true });

    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
      sidebarPointerY = Number.POSITIVE_INFINITY;
      topPointerX = Number.POSITIVE_INFINITY;
      root.querySelectorAll<HTMLElement>("[data-dock-item='sidebar'], [data-dock-item='top']").forEach((el) => {
        el.style.transform = "";
        el.style.transformOrigin = "";
      });
    };
  }, [rootRef, sidebarRef, topDockRef, sidebarOpen]);
}
