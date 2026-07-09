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
};

/** Mount a dashboard section on first visit; hide inactive panes instead of unmounting. */
export function DashboardSectionKeepAlive({
  sectionKey,
  activeKey,
  className,
  children,
}: DashboardSectionKeepAliveProps) {
  const active = activeKey === sectionKey;
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);

  if (!mounted) return null;

  return (
    <div
      className={cn(className, !active && "hidden")}
      data-dashboard-section={sectionKey}
      data-dashboard-section-active={active ? "true" : "false"}
      aria-hidden={!active}
      style={
        active
          ? undefined
          : {
              contentVisibility: "hidden",
              containIntrinsicSize: "0 720px",
            }
      }
    >
      {children}
    </div>
  );
}
