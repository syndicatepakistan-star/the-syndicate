"use client";

import { memo, useCallback, useState, type KeyboardEvent } from "react";

export type DashboardNavSearchEntry = {
  label: string;
  section: string;
  navKey: string;
};

type DashboardNavQuickSearchProps = {
  entries: readonly DashboardNavSearchEntry[];
  onNavigate: (navKey: string) => void;
  onMatched?: (entry: DashboardNavSearchEntry, query: string) => void;
};

/**
 * Isolated search field so keystrokes don't re-render the full dashboard shell (INP).
 */
export const DashboardNavQuickSearch = memo(function DashboardNavQuickSearch({
  entries,
  onNavigate,
  onMatched,
}: DashboardNavQuickSearchProps) {
  const [value, setValue] = useState("");

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const q = value.trim().toLowerCase();
      if (!q) return;
      const hit = entries.find(
        (ent) =>
          ent.label.toLowerCase().includes(q) ||
          ent.section.toLowerCase().includes(q) ||
          ent.navKey.toLowerCase().includes(q),
      );
      if (!hit) return;
      onNavigate(hit.navKey);
      setValue("");
      onMatched?.(hit, q);
    },
    [entries, onMatched, onNavigate, value],
  );

  return (
    <input
      id="nav-quick-search"
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="SEARCH SECTIONS"
      autoComplete="off"
      className="min-w-0 flex-1 bg-transparent py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-[color:var(--neon-accent-bright)]/95 outline-none placeholder:text-[color:var(--neon-accent-bright)]/38 sm:text-[9px] sm:tracking-[0.16em] md:text-[10px] md:tracking-[0.18em]"
    />
  );
});
