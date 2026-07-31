import Script from "next/script";
import type { ReactNode } from "react";

/**
 * Before paint: hide /programs briefly when opening #businessprograms so mid-ticket
 * packs are not shown while we scroll to the PROGRAMS band. Hash is kept in the URL.
 */
const PROGRAMS_HASH_BOOT = `(function(){try{var h=(location.hash||"").replace(/^#/,"").toLowerCase();if(h!=="businessprograms"&&h!=="programs-library")return;var doc=document.documentElement;if("scrollRestoration"in history)history.scrollRestoration="manual";if(!document.getElementById("programs-hash-pending-inline")){var st=document.createElement("style");st.id="programs-hash-pending-inline";st.textContent="html.programs-hash-pending,html.programs-hash-pending body{background:#000!important}html.programs-hash-pending .programs-page-root{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:none!important}html.programs-hash-pending .programs-page-band{content-visibility:visible!important}";(document.head||doc).appendChild(st);}doc.classList.add("programs-hash-pending");}catch(e){}})();`;

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
