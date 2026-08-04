import Script from "next/script";
import type { ReactNode } from "react";
import "@/styles/public-marketing-responsive.css";
import "@/styles/programs-page.css";

/**
 * Before paint for #businessprograms: scrollRestoration + early scroll +
 * flag library for eager mount (no Elite Offers hide/collapse).
 */
const PROGRAMS_HASH_BOOT = `(function(){try{var h=(location.hash||"").replace(/^#/,"").toLowerCase();if(h!=="businessprograms"&&h!=="programs-library")return;if("scrollRestoration"in history)history.scrollRestoration="manual";try{window.__PROGRAMS_EAGER_LIBRARY=1;}catch(e){}function go(){var el=document.getElementById("businessprograms");if(!el)return false;var raw=window.getComputedStyle(el).scrollMarginTop||"0";var margin=parseFloat(raw);if(!isFinite(margin))margin=112;var y=Math.max(0,Math.round(el.getBoundingClientRect().top+(window.scrollY||window.pageYOffset||0)-margin));window.scrollTo(0,y);return true;}function tick(){go();requestAnimationFrame(function(){go();});}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",tick);}else{tick();}}catch(e){}})();`;

/** Critical display fonts — discover before globals.css parses @font-face (cuts LCP render delay). */
const PROGRAMS_FONT_PRELOADS = (
  <>
    <link
      rel="preload"
      href="/fonts/Thryon.woff2"
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />
    <link
      rel="preload"
      href="/fonts/CS%20Daine%20Mono/CSDaineMono-Regular.woff2"
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />
  </>
);

export default function ProgramsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {PROGRAMS_FONT_PRELOADS}
      <Script id="programs-hash-boot" strategy="beforeInteractive">
        {PROGRAMS_HASH_BOOT}
      </Script>
      {children}
    </>
  );
}
