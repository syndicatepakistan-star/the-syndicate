import Script from "next/script";
import type { ReactNode } from "react";
import "@/styles/programs-page.css";

/**
 * Before paint for #businessprograms: scrollRestoration + early scroll.
 * No hide/collapse. React pin (ProgramsBusinessHashLand) re-anchors when
 * Elite Offers / mid-ticket packs finish loading above.
 */
const PROGRAMS_HASH_BOOT = `(function(){try{var h=(location.hash||"").replace(/^#/,"").toLowerCase();if(h!=="businessprograms"&&h!=="programs-library")return;if("scrollRestoration"in history)history.scrollRestoration="manual";function go(){var el=document.getElementById("businessprograms");if(!el)return false;var raw=window.getComputedStyle(el).scrollMarginTop||"0";var margin=parseFloat(raw);if(!isFinite(margin))margin=112;var y=Math.max(0,Math.round(el.getBoundingClientRect().top+(window.scrollY||window.pageYOffset||0)-margin));window.scrollTo(0,y);return true;}function tick(){go();requestAnimationFrame(function(){go();});}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",tick);}else{tick();}}catch(e){}})();`;

export default function ProgramsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script id="programs-hash-boot" strategy="beforeInteractive">
        {PROGRAMS_HASH_BOOT}
      </Script>
      {children}
    </>
  );
}
