"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { ActivityCategory, ActivityItem } from "@/components/dashboard/types";

const LS_KEY = "dashboarded:activity-timeline-v1";
const MAX_ITEMS = 100;

type ActivityTimelineContextValue = {
  items: ActivityItem[];
  recordVisit: (navKey: string) => void;
  recordEvent: (e: {
    category: ActivityCategory;
    title: string;
    detail?: string;
    moreDetails?: string;
    route?: string;
  }) => void;
};

const ActivityTimelineContext = createContext<ActivityTimelineContextValue | null>(null);

function readStored(): ActivityItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ActivityItem[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.id === "string" && typeof x.ts === "number" && x.title)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeStored(items: ActivityItem[]) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* quota / private mode */
  }
}

const NAV_VISIT_META: Record<
  string,
  { title: string; detail: string; category: ActivityCategory; moreDetails: string }
> = {
  dashboard: {
    title: "Opened dashboard",
    detail: "Command center & mission deck",
    category: "system",
    moreDetails:
      "You opened the main dashboard: hero status, missions, learning path, and your live activity timeline."
  },
  programs: {
    title: "Visited programs",
    detail: "Course catalog & tracks",
    category: "program",
    moreDetails:
      "Programs is where you browse courses, pick a track, and continue lessons. Progress is saved in this browser."
  },
  monk: {
    title: "Visited Syndicate",
    detail: "Challenges & operations",
    category: "syndicate",
    moreDetails:
      "The Syndicate area hosts challenge panels, streaks, and mission-style flows tied to your account when signed in."
  },
  affiliate: {
    title: "Visited affiliate",
    detail: "Referrals & performance",
    category: "affiliate",
    moreDetails:
      "Track referral links, clicks, and conversions. Share CTAs from here to grow your pipeline."
  },
  resources: {
    title: "Visited resources",
    detail: "Membership & library",
    category: "system",
    moreDetails:
      "Resources and membership content: guides, threads, and gated material depending on your access."
  },
  support: {
    title: "Visited support",
    detail: "Help area",
    category: "system",
    moreDetails: "Support and help content (expanded as the product ships more routes)."
  },
  settings: {
    title: "Visited settings",
    detail: "Preferences",
    category: "system",
    moreDetails: "Settings and preferences for your operator profile (expanded over time)."
  }
};

export function ActivityTimelineProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const lastNavRef = useRef<{ key: string; t: number }>({ key: "", t: 0 });

  useLayoutEffect(() => {
    setItems(readStored());
  }, []);

  const recordEvent = useCallback(
    (e: {
      category: ActivityCategory;
      title: string;
      detail?: string;
      moreDetails?: string;
      route?: string;
    }) => {
      const route =
        e.route ?? (typeof window !== "undefined" ? window.location.pathname : undefined);
      const row: ActivityItem = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        ts: Date.now(),
        category: e.category,
        title: e.title,
        detail: e.detail,
        moreDetails: e.moreDetails,
        route
      };
      setItems((prev) => {
        const next = [row, ...prev].slice(0, MAX_ITEMS);
        writeStored(next);
        return next;
      });
    },
    []
  );

  const recordVisit = useCallback(
    (navKey: string) => {
      const now = Date.now();
      if (lastNavRef.current.key === navKey && now - lastNavRef.current.t < 1200) return;
      lastNavRef.current = { key: navKey, t: now };

      const meta = NAV_VISIT_META[navKey] ?? {
        title: "Opened section",
        detail: navKey,
        category: "system" as const,
        moreDetails: `You switched to the “${navKey}” area of the shell.`
      };

      const path = typeof window !== "undefined" ? window.location.pathname : "";
      recordEvent({
        category: meta.category,
        title: meta.title,
        detail: meta.detail,
        moreDetails: meta.moreDetails,
        route: path ? path : undefined
      });
    },
    [recordEvent]
  );

  const value = useMemo(
    () => ({
      items,
      recordVisit,
      recordEvent
    }),
    [items, recordVisit, recordEvent]
  );

  return <ActivityTimelineContext.Provider value={value}>{children}</ActivityTimelineContext.Provider>;
}

export function useActivityTimeline(): ActivityTimelineContextValue {
  const ctx = useContext(ActivityTimelineContext);
  if (!ctx) {
    throw new Error("useActivityTimeline must be used within ActivityTimelineProvider");
  }
  return ctx;
}
