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
  // Boot may still be hiding the page for this deep link.
  if (
    document.documentElement.classList.contains("programs-hash-pending") &&
    (targets.includes("businessprograms") || targets.includes("programs-library"))
  ) {
    return "businessprograms";
  }
  return null;
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
}: LazyWhenVisibleProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const targets = useMemo(() => normalizeHashTargets(eagerOnHash), [eagerOnHash]);
  const targetsKey = targets.join("|");
  const [visible, setVisible] = useState(false);

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
