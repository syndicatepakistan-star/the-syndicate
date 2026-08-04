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

/**
 * Tiny critical CSS so Money Mastery LCP media can paint before the large
 * render-blocking stylesheet finishes (cuts element render delay).
 */
const PROGRAMS_LCP_CRITICAL_CSS = `
.programs-lcp-shell{position:relative;display:flex;min-height:min(92vh,48rem);flex-direction:column;overflow:hidden;border-radius:1.5rem;border:2px solid rgba(252,211,77,.75);background:#000;box-shadow:0 14px 38px rgba(0,0,0,.58)}
.programs-lcp-media{position:relative;aspect-ratio:4/5;min-height:min(52dvh,16.5rem);max-height:min(62dvh,22rem);background:#050508}
.programs-lcp-media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 38%}
@media (min-width:640px){.programs-lcp-shell{min-height:34rem}.programs-lcp-media{aspect-ratio:3/4;min-height:min(48dvh,20rem)}}
@media (min-width:1280px){.programs-lcp-media{aspect-ratio:3/4;min-height:18.5rem;max-height:22rem}}
`;

export default function ProgramsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {PROGRAMS_FONT_PRELOADS}
      <style dangerouslySetInnerHTML={{ __html: PROGRAMS_LCP_CRITICAL_CSS }} />
      <Script id="programs-hash-boot" strategy="beforeInteractive">
        {PROGRAMS_HASH_BOOT}
      </Script>
      {children}
    </>
  );
}
