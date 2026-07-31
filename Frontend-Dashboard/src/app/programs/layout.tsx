import Script from "next/script";
import type { ReactNode } from "react";

/**
 * Before paint: briefly hide MAIN content only when the URL already has
 * #businessprograms — never invent that hash. Nav stays visible/usable.
 */
const PROGRAMS_HASH_BOOT = `(function(){try{var h=(location.hash||"").replace(/^#/,"").toLowerCase();if(h!=="businessprograms"&&h!=="programs-library")return;var doc=document.documentElement;if("scrollRestoration"in history)history.scrollRestoration="manual";if(!document.getElementById("programs-hash-pending-inline")){var st=document.createElement("style");st.id="programs-hash-pending-inline";st.textContent="html.programs-hash-pending{background:#000!important}html.programs-hash-pending .programs-page-main{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:none!important}html.programs-hash-pending .programs-page-band{content-visibility:visible!important}";(document.head||doc).appendChild(st);}doc.classList.add("programs-hash-pending");}catch(e){}})();`;

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
