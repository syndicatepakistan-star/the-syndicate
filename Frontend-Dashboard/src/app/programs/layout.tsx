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
/* Reserve full elite stack (Money Mastery + 3 vault slots) so interactive hydrate does not CLS */
#syndicate-elite-offers{position:relative;z-index:2;min-height:min(160vh,72rem)}
@media (min-width:640px){#syndicate-elite-offers{min-height:56rem}}
@media (min-width:1024px){#syndicate-elite-offers{min-height:48rem}}
.programs-offers-lcp-host{position:relative;z-index:1;width:100%}
.programs-offers-interactive-layer{position:absolute;top:0;left:0;right:0;z-index:2;width:100%;min-height:100%}
/* Lighter first-paint shadow — heavy glow delays LCP paint on Slow 4G */
.programs-lcp-shell{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:1.5rem;border:2px solid rgba(252,211,77,.75);background:#000;box-shadow:0 8px 20px rgba(0,0,0,.45)}
@media (min-width:640px){.programs-lcp-shell{min-height:34rem}}
.programs-lcp-media{position:relative;aspect-ratio:4/3;max-height:13.5rem;min-height:0;flex-shrink:0;overflow:hidden;border-radius:1rem;border:2px solid rgba(255,255,255,.2);background:#050508;contain:paint}
@media (min-width:640px){.programs-lcp-media{max-height:15rem}}
.programs-lcp-media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 38%}
.programs-offers-shell{position:relative;z-index:1;margin:0 auto;width:100%;max-width:min(100%,calc(80rem + 300px));overflow:visible}
/* Match deferred programs-page.css compare badge — prevents $555/$333 balloon CLS */
.programs-lcp-media .plan-offer-card__pack-price-badge--compare{
  display:inline-flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;
  box-sizing:border-box!important;min-width:108px!important;width:auto!important;min-height:88px!important;height:auto!important;
  padding:14px 16px!important;gap:8px!important;border-radius:6px!important;contain:layout size;
  background:#000!important;border:1px solid rgba(252,211,77,.7);color:#fff5dc!important;font-weight:900;line-height:1.15!important
}
.programs-lcp-media .plan-offer-card__pack-price-badge__compare{
  display:inline-block!important;font-size:18px!important;font-weight:700!important;line-height:1.2!important;
  color:rgba(255,245,220,.55)!important;text-decoration:line-through;text-decoration-color:rgba(255,255,255,.4)
}
.programs-lcp-media .plan-offer-card__pack-price-badge__amount{
  font-size:22px!important;font-weight:900!important;line-height:1.15!important;color:#fff5dc!important
}
/* Gold pill — stable box before Tailwind/globals hydrate (avoids body CLS ~0.9) */
.programs-gold-pill{
  position:relative;display:inline-flex;max-width:100%;align-items:center;justify-content:center;
  box-sizing:border-box;overflow:hidden;border-radius:999px;
  border:1px solid rgba(212,175,57,.45);background:linear-gradient(180deg,rgba(18,18,18,.94),rgba(4,4,4,.98));
  box-shadow:0 0 8px rgba(212,175,57,.1);
  min-height:3.25rem;padding:.75rem 1.25rem
}
@media (min-width:640px){.programs-gold-pill{min-height:4.25rem;padding:1rem 2.5rem}}
.programs-gold-pill--compact{min-height:2.75rem;padding:.65rem 1.15rem}
@media (min-width:640px){.programs-gold-pill--compact{min-height:3.5rem;padding:1rem 2.5rem}}
.programs-gold-pill__title{
  position:relative;margin:0;text-align:center;font-weight:900;text-transform:uppercase;letter-spacing:.14em;
  color:#e8c96a;line-height:1.15;font-size:clamp(.72rem,2.4vw + .35rem,1.35rem)
}
@media (min-width:640px){.programs-gold-pill--compact .programs-gold-pill__title{font-size:clamp(.95rem,1.2vw + .55rem,2.15rem)}}
.programs-gold-pill:not(.programs-gold-pill--compact) .programs-gold-pill__title{font-size:2rem}
@media (min-width:640px){.programs-gold-pill:not(.programs-gold-pill--compact) .programs-gold-pill__title{font-size:3.35rem}}
#programs-library{min-height:min(200vh,80rem)}
#syndicate-elite-offers.programs-page-band{
  padding-left:clamp(.5rem,2.5vw,1rem);padding-right:clamp(.5rem,2.5vw,1rem);padding-top:1.5rem;
  box-sizing:border-box
}
@media (min-width:640px){
  #syndicate-elite-offers.programs-page-band{
    padding-left:clamp(1rem,3.2vw,1.5rem);padding-right:clamp(1rem,3.2vw,1.5rem);padding-top:2.5rem
  }
}
/* First-paint: no glow/filter/animation — cuts mobile LCP element-render-delay */
.programs-page-root:not(.programs-page-root--fx-ready) .public-heading-lightning,
.programs-page-root:not(.programs-page-root--fx-ready) .playlist-category-heading-lightning,
.programs-page-root:not(.programs-page-root--fx-ready) .hero-hamburger-pulse,
.programs-page-root:not(.programs-page-root--fx-ready) .level1-unlock-all-btn,
.programs-page-root:not(.programs-page-root--fx-ready) .hamburger-attract{
  animation:none!important;opacity:1!important;filter:none!important;text-shadow:none!important
}
.programs-page-root .public-heading-lightning{
  text-shadow:0 0 6px var(--heading-neon-glow,rgba(212,175,57,.35));
  filter:none
}
.programs-page-root.programs-page-root--fx-ready .public-heading-lightning{
  text-shadow:0 0 8px var(--heading-neon-glow,rgba(212,175,57,.4))
}
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
