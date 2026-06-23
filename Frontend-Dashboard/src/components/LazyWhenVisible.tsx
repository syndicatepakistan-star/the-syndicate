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
};

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
}: LazyWhenVisibleProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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
