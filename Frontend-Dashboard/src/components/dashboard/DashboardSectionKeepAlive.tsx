"use client";

import { useEffect, useState, type ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type DashboardSectionKeepAliveProps = {
  sectionKey: string;
  activeKey: string;
  className?: string;
  children: ReactNode;
  /**
   * When true (default for heavy sections), inactive panes unmount instead of staying hidden.
   * Cuts memory/CPU after leaving Programs / Syndicate Mode / Membership.
   */
  unmountWhenInactive?: boolean;
};

/** Unmount when left so slideshow / control center / programs don't stay warm off-route. */
const HEAVY_SECTIONS = new Set(["programs", "monk", "resources", "quickaccess", "dashboard"]);

/** Mount a dashboard section on first visit; heavy sections unmount when left. */
export function DashboardSectionKeepAlive({
  sectionKey,
  activeKey,
  className,
  children,
  unmountWhenInactive,
}: DashboardSectionKeepAliveProps) {
  const active = activeKey === sectionKey;
  const shouldUnmount = unmountWhenInactive ?? HEAVY_SECTIONS.has(sectionKey);
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (active) {
      setMounted(true);
      return;
    }
    if (shouldUnmount) {
      setMounted(false);
    }
  }, [active, shouldUnmount]);

  if (!mounted) return null;

  return (
    <div
      className={cn(className, !active && "pointer-events-none hidden")}
      data-dashboard-section={sectionKey}
      data-dashboard-section-active={active ? "true" : "false"}
      aria-hidden={!active}
      {...(!active ? { inert: true as const } : {})}
      style={
        active
          ? undefined
          : {
              contentVisibility: "hidden",
              containIntrinsicSize: "0 720px",
              contain: "strict",
            }
      }
    >
      {children}
    </div>
  );
}
