import type { Metadata } from 'next'
import {
  HomeBottomSections,
  HomeCertificatesSection,
  HomeFaqSection,
  HomePaywallSection,
  HomePricingSection,
} from '@/components/home/HomeBelowFoldSections'
import { HomeEntityStatement } from '@/components/home/HomeEntityStatement'
import { HomeHeroDeferredChrome } from '@/components/home/HomeHeroDeferredChrome'
import { HomeGlobeSection } from '@/components/home/HomeGlobeSection'
import { HeroGlitchShell } from '@/components/home/HeroGlitchShell'
import { NavApp } from '@/components/NavApp'
import { DeferredPublicMarketingStyles } from '@/components/DeferredPublicMarketingStyles'
import { JsonLd } from '@/components/seo/JsonLd'
import { getCuratedGlobeGalleryImages } from '@/lib/programPlaylistThumbnails'
import { buildPageMetadata } from '@/lib/seo'
import { buildFaqPageJsonLd, DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE } from '@/lib/structuredData'

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    path: '',
  }),
  title: DEFAULT_SITE_TITLE,
}

/** Dedicated small WebPs — phones never select the 640w file. */
const HERO_LOGO_320 = '/assets/logo-lcp-320.webp'
const HERO_LOGO_360 = '/assets/logo-lcp-360.webp'
const HERO_LOGO_640 = '/assets/logo-lcp-640.webp'

/** Critical hero CSS — paints before deferred Tailwind; must match final geometry (CLS). */
const HOME_LCP_CRITICAL_CSS = `
.home-page-root{background:#000;min-height:100dvh;min-width:0;overflow-x:clip;contain:paint}
#heroSection{position:relative;height:100dvh;min-height:100dvh;max-height:100dvh;width:100%;overflow:hidden;background:#000;contain:layout paint}
#heroSection>.relative.z-10{position:relative;z-index:10;height:100dvh;min-height:100dvh;width:100%;min-width:0;pointer-events:none}
.home-hero-lcp-wrap{pointer-events:none;position:absolute;left:50%;top:50%;z-index:19;width:100%;max-width:min(1020px,calc(100% - 2rem));transform:translate(-50%,-50%);padding:0 .75rem;box-sizing:border-box}
.home-hero-lcp-logo{display:block;width:100%;height:auto;max-height:min(76dvh,640px);object-fit:contain;margin:0 auto;aspect-ratio:360/144}
.home-hero-mobile-bg{background-color:#030407}
@media (max-width:767px){.home-hero-mobile-bg{background-image:url('/assets/hero-matrix-mobile.webp');background-size:cover;background-position:center;background-repeat:no-repeat;opacity:.9}}
.neon-badge{display:inline-flex;align-items:center;justify-content:center;min-height:3.25rem;border-radius:999px;box-sizing:border-box}
.neon-badge-text{white-space:nowrap;font-weight:700;letter-spacing:.12em;color:rgba(254,243,199,.92);font-size:clamp(.72rem,2.8vw,.95rem)}
.site-top-nav{position:fixed!important;left:0;right:0;top:0;z-index:50}
.home-hero-slogan-slot{position:absolute!important;left:50%;top:clamp(78px,11vw,96px);transform:translateX(-50%);z-index:20;width:100%;box-sizing:border-box;pointer-events:none}
.home-hero-logos-slot{position:absolute!important;left:50%;bottom:1rem;transform:translateX(-50%);z-index:20;display:flex;align-items:center;justify-content:center;min-height:2.5rem;height:2.5rem;width:100%;max-width:1180px;box-sizing:border-box;overflow:hidden}
`

export default function Home() {
  const programGalleryImages = getCuratedGlobeGalleryImages()

  return (
    <div className="home-page-root public-page-shell min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black [overflow-anchor:none]">
      <style dangerouslySetInnerHTML={{ __html: HOME_LCP_CRITICAL_CSS }} />
      {/* Mobile preload — 360 only (no 640 in srcset) */}
      <link
        rel="preload"
        as="image"
        href={HERO_LOGO_360}
        imageSrcSet={`${HERO_LOGO_320} 320w, ${HERO_LOGO_360} 360w`}
        imageSizes="320px"
        media="(max-width: 767px)"
        fetchPriority="high"
      />
      {/* Desktop preload */}
      <link
        rel="preload"
        as="image"
        href={HERO_LOGO_640}
        imageSrcSet={`${HERO_LOGO_360} 360w, ${HERO_LOGO_640} 640w`}
        imageSizes="640px"
        media="(min-width: 768px)"
        fetchPriority="high"
      />
      <DeferredPublicMarketingStyles />
      <JsonLd data={buildFaqPageJsonLd()} />
      <NavApp />
      <section
        id="heroSection"
        className="relative h-[100dvh] min-h-[100dvh] w-full min-w-0 overflow-hidden"
      >
        <HeroGlitchShell
          glitchSpeed={70}
          centerVignette
          outerVignette
          smooth
          glitchColors={['#4a2b72', '#61dca3', '#61b3dc']}
          layerOpacity={0.3}
        />
        <HomeHeroDeferredChrome />
        <div className="home-hero-lcp-wrap">
          <div className="hero-logo-pulse mx-auto w-full max-w-full">
            <picture>
              <source
                media="(max-width: 767px)"
                srcSet={`${HERO_LOGO_320} 320w, ${HERO_LOGO_360} 360w`}
                sizes="320px"
              />
              <source
                media="(min-width: 768px)"
                srcSet={`${HERO_LOGO_360} 360w, ${HERO_LOGO_640} 640w`}
                sizes="(max-width: 1024px) 360px, 640px"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_LOGO_360}
                width={360}
                height={144}
                alt="ONEM Logo"
                fetchPriority="high"
                decoding="sync"
                className="home-hero-lcp-logo"
              />
            </picture>
          </div>
        </div>
        <div className="relative z-10 h-[100dvh] min-h-[100dvh] w-full min-w-0" aria-hidden />
      </section>

      <HomeEntityStatement />
      <HomeGlobeSection images={programGalleryImages} />
      <HomePricingSection />
      <HomePaywallSection />
      <HomeCertificatesSection />
      <HomeFaqSection />
      <HomeBottomSections />
    </div>
  )
}
