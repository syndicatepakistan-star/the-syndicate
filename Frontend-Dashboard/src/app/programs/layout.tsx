import Script from "next/script";
import type { ReactNode } from "react";
import "@/styles/public-marketing-responsive.css";
import "@/styles/programs-page.css";
import { ProgramsDeferredFxCss } from "@/components/programs/ProgramsDeferredFxCss";

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

/**
 * Tiny critical CSS so Money Mastery LCP media can paint before the large
 * render-blocking stylesheet finishes (cuts element render delay).
 * Geometry matches PlanOfferCard elite primary (4/3, max-h 13.5rem / sm 15rem).
 */
const PROGRAMS_LCP_CRITICAL_CSS = `
.programs-lcp-shell{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:1.5rem;border:2px solid rgba(252,211,77,.75);background:#000;box-shadow:0 14px 38px rgba(0,0,0,.58)}
@media (min-width:640px){.programs-lcp-shell{min-height:34rem}}
.programs-lcp-media{position:relative;aspect-ratio:4/3;max-height:13.5rem;min-height:0;flex-shrink:0;overflow:hidden;border-radius:1rem;border:2px solid rgba(255,255,255,.2);background:#050508}
@media (min-width:640px){.programs-lcp-media{max-height:15rem}}
.programs-lcp-media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 38%}
`;

export default function ProgramsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {PROGRAMS_FONT_PRELOADS}
      <style dangerouslySetInnerHTML={{ __html: PROGRAMS_LCP_CRITICAL_CSS }} />
      <Script id="programs-hash-boot" strategy="beforeInteractive">
        {PROGRAMS_HASH_BOOT}
      </Script>
      <ProgramsDeferredFxCss />
      {children}
    </>
  );
}
