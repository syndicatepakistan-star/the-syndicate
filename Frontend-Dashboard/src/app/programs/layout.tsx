import Script from "next/script";
import type { ReactNode } from "react";
import { DeferredPublicMarketingStyles } from "@/components/DeferredPublicMarketingStyles";
import { DeferredProgramsPageCss } from "@/components/programs/DeferredProgramsPageCss";
import { ProgramsDeferredFxCss } from "@/components/programs/ProgramsDeferredFxCss";

/**
 * Hash boot only runs when URL already has #businessprograms / #programs-library.
 * afterInteractive — avoids beforeInteractive TBT hit on plain /programs Lighthouse runs.
 */
const PROGRAMS_HASH_BOOT = `(function(){try{var h=(location.hash||"").replace(/^#/,"").toLowerCase();if(h!=="businessprograms"&&h!=="programs-library")return;if("scrollRestoration"in history)history.scrollRestoration="manual";try{window.__PROGRAMS_EAGER_LIBRARY=1;}catch(e){}var MARGIN=112;function go(){var el=document.getElementById("businessprograms");if(!el)return false;var y=Math.max(0,Math.round(el.getBoundingClientRect().top+(window.scrollY||window.pageYOffset||0)-MARGIN));window.scrollTo(0,y);return true;}function tick(){go();requestAnimationFrame(function(){go();});}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",tick);}else{tick();}}catch(e){}})();`;

/**
 * Expanded critical CSS for Elite Offers LCP (Money Mastery) before deferred sheets.
 */
const PROGRAMS_LCP_CRITICAL_CSS = `
.programs-page-root{background:#000;min-height:100dvh;min-width:0;overflow-x:clip;color:#fff}
.programs-page-main{position:relative;z-index:2;width:100%;min-width:0;overflow-x:clip}
#syndicate-elite-offers{position:relative;z-index:2;min-height:min(70vh,36rem)}
@media (min-width:640px){#syndicate-elite-offers{min-height:40rem}}
.programs-lcp-shell{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:1.5rem;border:2px solid rgba(252,211,77,.75);background:#000;box-shadow:0 14px 38px rgba(0,0,0,.58)}
@media (min-width:640px){.programs-lcp-shell{min-height:34rem}}
.programs-lcp-media{position:relative;aspect-ratio:4/3;max-height:13.5rem;min-height:0;flex-shrink:0;overflow:hidden;border-radius:1rem;border:2px solid rgba(255,255,255,.2);background:#050508}
@media (min-width:640px){.programs-lcp-media{max-height:15rem}}
.programs-lcp-media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 38%}
.programs-offers-shell{position:relative;z-index:1;margin:0 auto;width:100%;max-width:min(100%,calc(80rem + 300px));overflow:visible}
`;

export default function ProgramsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROGRAMS_LCP_CRITICAL_CSS }} />
      <Script id="programs-hash-boot" strategy="afterInteractive">
        {PROGRAMS_HASH_BOOT}
      </Script>
      <DeferredPublicMarketingStyles />
      <DeferredProgramsPageCss />
      <ProgramsDeferredFxCss />
      {children}
    </>
  );
}
