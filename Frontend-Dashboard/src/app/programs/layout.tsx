import Script from "next/script";
import type { ReactNode } from "react";

/**
 * Before paint for #businessprograms / #programs-library:
 * - Do NOT hide main (that caused black Lighthouse filmstrip + CLS).
 * - Mark eager library mount + soft-collapse elite offers only (keeps PROGRAMS band paintable).
 * - Native/hash scroll can land on #businessprograms without a blank first paint.
 */
const PROGRAMS_HASH_BOOT = `(function(){try{var h=(location.hash||"").replace(/^#/,"").toLowerCase();if(h!=="businessprograms"&&h!=="programs-library")return;var doc=document.documentElement;if("scrollRestoration"in history)history.scrollRestoration="manual";window.__PROGRAMS_EAGER_LIBRARY=1;if(!document.getElementById("programs-hash-pending-inline")){var st=document.createElement("style");st.id="programs-hash-pending-inline";st.textContent="html.programs-hash-pending{background:#000!important}html.programs-hash-pending #syndicate-elite-offers{content-visibility:hidden!important;contain-intrinsic-size:0 0!important;min-height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}html.programs-hash-pending .programs-page-ambient{opacity:.35!important}html.programs-hash-pending .programs-page-band{content-visibility:visible!important}";(document.head||doc).appendChild(st);}doc.classList.add("programs-hash-pending");}catch(e){}})();`

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
