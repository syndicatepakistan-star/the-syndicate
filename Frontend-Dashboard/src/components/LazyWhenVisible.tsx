"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LazyWhenVisibleProps = {
  children: ReactNode;
  /** Reserve space before mount to limit layout shift */
  minHeight?: string;
  rootMargin?: string;
  className?: string;
};

/** Mount children only when near the viewport — defers heavy JS without changing UI once visible. */
export function LazyWhenVisible({
  children,
  minHeight,
  rootMargin = "280px 0px",
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
    <div ref={hostRef} className={className} style={minHeight ? { minHeight } : undefined}>
      {visible ? children : null}
    </div>
  );
}
