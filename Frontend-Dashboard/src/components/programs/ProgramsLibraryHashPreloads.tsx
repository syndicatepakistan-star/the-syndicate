"use client";

import { useEffect } from "react";
import {
  programsLibraryDesktopLast3Preloads,
  programsLibraryMobileFirst3Preloads,
} from "@/lib/programsLibraryLcpImages";

/**
 * Only for /programs#businessprograms — inject library cover preloads after
 * plain /programs LCP (Money Mastery) is not competing for bandwidth.
 */
export function ProgramsLibraryHashPreloads() {
  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "").toLowerCase();
    if (h !== "businessprograms" && h !== "programs-library") return;

    const head = document.head;
    const links: HTMLLinkElement[] = [];
    const add = (p: {
      href: string;
      imageSrcSet?: string;
      imageSizes: string;
      media?: string;
      fetchPriority?: "high" | "low" | "auto";
    }) => {
      const el = document.createElement("link");
      el.rel = "preload";
      el.as = "image";
      el.href = p.href;
      if (p.imageSrcSet) el.setAttribute("imagesrcset", p.imageSrcSet);
      el.setAttribute("imagesizes", p.imageSizes);
      if (p.media) el.media = p.media;
      if (p.fetchPriority) el.fetchPriority = p.fetchPriority;
      head.appendChild(el);
      links.push(el);
    };

    programsLibraryMobileFirst3Preloads().forEach(add);
    programsLibraryDesktopLast3Preloads().forEach(add);

    return () => {
      links.forEach((el) => el.remove());
    };
  }, []);

  return null;
}
