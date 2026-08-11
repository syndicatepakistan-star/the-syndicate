"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type LazyWhenVisibleProps = {
  children: ReactNode;
  placeholder?: ReactNode;
  minHeight?: string;
  rootMargin?: string;
  className?: string;
  anchorId?: string;
  eagerOnHash?: string | readonly string[];
  scrollToId?: string;
};

function normalizeHashTargets(eagerOnHash?: string | readonly string[]): string[] {
  if (!eagerOnHash) return [];
  return (typeof eagerOnHash === "string" ? [eagerOnHash] : [...eagerOnHash])
    .map((h) => h.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
}

function matchedEagerHash(targets: string[]): string | null {
  if (typeof window === "undefined" || targets.length === 0) return null;
  const h = window.location.hash.replace(/^#/, "").trim().toLowerCase();
  if (h && targets.includes(h)) return h;
  return null;
}

function scrollHashTargetIntoView(hashId: string) {
  const el = document.getElementById(hashId);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/**
 * Mount children when near the viewport (or immediately for matching URL hashes).
 */
export function LazyWhenVisible({
  children,
  placeholder = null,
  minHeight,
  rootMargin = "200px 0px",
  className,
  anchorId,
  eagerOnHash,
  scrollToId,
}: LazyWhenVisibleProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const targets = useMemo(() => normalizeHashTargets(eagerOnHash), [eagerOnHash]);
  const targetsKey = targets.join("|");
  /** Sync with beforeInteractive hash boot so #businessprograms does not flash a placeholder (CLS). */
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (matchedEagerHash(targets)) return true;
    try {
      return Boolean((window as Window & { __PROGRAMS_EAGER_LIBRARY?: number }).__PROGRAMS_EAGER_LIBRARY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (targets.length === 0) return;

    const activateFromHash = () => {
      if (matchedEagerHash(targets)) setVisible(true);
    };

    activateFromHash();
    window.addEventListener("hashchange", activateFromHash);
    return () => window.removeEventListener("hashchange", activateFromHash);
  }, [targetsKey, targets]);

  useEffect(() => {
    if (visible) return;
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  // After hash-eager mount, scroll to the section (native hash scroll often runs too early).
  useEffect(() => {
    if (!visible) return;
    const matched = matchedEagerHash(targets);
    if (!matched && !scrollToId) return;
    const targetId = (scrollToId ? scrollToId.replace(/^#/, "") : matched) || matched;
    if (!targetId) return;

    // One canonical policy URL: /#cookies|/privacy → /#policy
    if (
      scrollToId === "policy" &&
      (matched === "cookies" || matched === "cookie" || matched === "privacy")
    ) {
      try {
        const path = `${window.location.pathname}${window.location.search}#policy`;
        window.history.replaceState(null, "", path);
      } catch {
        /* ignore */
      }
    }

    let tries = 0;
    const tick = () => {
      tries += 1;
      if (scrollHashTargetIntoView(targetId) || tries > 20) return;
      window.setTimeout(tick, 50);
    };
    const t = window.setTimeout(tick, 0);
    return () => window.clearTimeout(t);
  }, [visible, targetsKey, targets, scrollToId]);

  return (
    <div
      ref={hostRef}
      id={anchorId}
      className={className}
      style={
        minHeight
          ? {
              minHeight,
              containIntrinsicSize: minHeight,
              contentVisibility: visible ? "visible" : "auto",
            }
          : undefined
      }
    >
      {visible ? children : placeholder}
    </div>
  );
}
