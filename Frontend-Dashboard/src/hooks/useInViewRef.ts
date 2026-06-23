"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  rootMargin?: string;
  threshold?: number | number[];
};

/** Observes an element; returns host ref + boolean inView (re-renders on change). */
export function useInViewRef<T extends Element>(options: Options = {}) {
  const { rootMargin = "0px", threshold = 0.01 } = options;
  const hostRef = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(Boolean(entry?.isIntersecting));
      },
      { rootMargin, threshold },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { hostRef, inView };
}
