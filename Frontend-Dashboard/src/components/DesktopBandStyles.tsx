"use client";

import { useEffect } from "react";

const LAPTOP_HREF = "/styles/laptop-vostro-viewport.css";
const LARGE_HREF = "/styles/large-desktop-responsive.css";
const LAPTOP_MEDIA = "(min-width: 1400px) and (max-width: 1679px)";
const LARGE_MEDIA = "(min-width: 1680px)";

function ensureStylesheet(href: string, media: string) {
  const existing = document.head.querySelector<HTMLLinkElement>(
    `link[data-desktop-band="1"][href="${href}"]`,
  );
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.media = media;
  link.dataset.desktopBand = "1";
  document.head.appendChild(link);
}

function removeStylesheet(href: string) {
  document.head
    .querySelectorAll(`link[data-desktop-band="1"][href="${href}"]`)
    .forEach((node) => node.remove());
}

/**
 * Laptop / ultra-wide CSS must not appear in mobile Network at all.
 * `<link media="…">` in HTML still downloads on phones (Lowest priority);
 * only inject when the viewport actually matches.
 */
export function DesktopBandStyles() {
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const laptopMq = window.matchMedia(LAPTOP_MEDIA);
    const largeMq = window.matchMedia(LARGE_MEDIA);

    const sync = () => {
      if (laptopMq.matches) ensureStylesheet(LAPTOP_HREF, LAPTOP_MEDIA);
      else removeStylesheet(LAPTOP_HREF);

      if (largeMq.matches) ensureStylesheet(LARGE_HREF, LARGE_MEDIA);
      else removeStylesheet(LARGE_HREF);
    };

    sync();
    laptopMq.addEventListener("change", sync);
    largeMq.addEventListener("change", sync);
    return () => {
      laptopMq.removeEventListener("change", sync);
      largeMq.removeEventListener("change", sync);
    };
  }, []);

  return null;
}
