"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LazyWhenVisibleProps = {
  children: ReactNode;
  /** Shown until the section mounts (avoids empty black gaps while scrolling) */
  placeholder?: ReactNode;
  /** Reserve space before mount to limit layout shift */
  minHeight?: string;
  rootMargin?: string;
  className?: string;
  /**
   * If the URL hash matches this id (e.g. "faq" for /#faq), mount immediately
   * and scroll the target into view — even before the section enters the viewport.
   */
  eagerOnHash?: string;
};

function hashMatches(target: string): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.replace(/^#/, "") === target;
}

function scrollToHashTarget(target: string, attempts = 12) {
  const el = document.getElementById(target);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (attempts <= 0) return;
  window.setTimeout(() => scrollToHashTarget(target, attempts - 1), 80);
}

/**
 * Mount children when near the viewport.
 * Once visible, children stay mounted (fast scroll up/down does not unmount).
 */
export function LazyWhenVisible({
  children,
  placeholder = null,
  minHeight,
  rootMargin = "200px 0px",
  className,
  eagerOnHash,
}: LazyWhenVisibleProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => (eagerOnHash ? hashMatches(eagerOnHash) : false));

  useEffect(() => {
    if (!eagerOnHash) return;

    const activateFromHash = () => {
      if (!hashMatches(eagerOnHash)) return;
      setVisible(true);
      // Wait for children (and #id) to paint, then scroll.
      window.requestAnimationFrame(() => {
        window.setTimeout(() => scrollToHashTarget(eagerOnHash), 50);
      });
    };

    activateFromHash();
    window.addEventListener("hashchange", activateFromHash);
    return () => window.removeEventListener("hashchange", activateFromHash);
  }, [eagerOnHash]);

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
