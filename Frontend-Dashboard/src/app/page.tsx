import type { Metadata } from 'next'
import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import {
  HomeBottomSections,
  HomeCertificatesSection,
  HomeFaqSection,
  HomePaywallSection,
  HomePricingSection,
} from '@/components/home/HomeBelowFoldSections'
import { HomeEntityStatement } from '@/components/home/HomeEntityStatement'
import { HeroFeaturedLogosStrip } from '@/components/home/HeroFeaturedLogosStrip'
import { HomeGlobeSection } from '@/components/home/HomeGlobeSection'
import { HeroGlitchShell } from '@/components/home/HeroGlitchShell'
import NeonTypingBadge from '@/components/NeonTypingBadge'
import { NavApp } from '@/components/NavApp'
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

const getLinkedProgramGalleryImages = unstable_cache(
  async () => getCuratedGlobeGalleryImages(),
  ['home-program-gallery-linked-v5'],
  { revalidate: 3600 }
)

export default async function Home() {
  const programGalleryImages = await getLinkedProgramGalleryImages()

  return (
    <div className="home-page-root min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black [overflow-anchor:none]">
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
        <div
          className="pointer-events-none absolute left-1/2 z-20 w-full -translate-x-1/2 px-4"
          style={{ top: 'clamp(78px, 11vw, 96px)' }}
        >
          <div className="mx-auto flex w-full max-w-[900px] justify-center">
            <NeonTypingBadge
              phrases={['HONOUR · MONEY · POWER · FREEDOM']}
              typingSpeed={34}
              deletingSpeed={24}
              pauseMs={420}
              boxed
              className="footer-typing hero-slogan-badge mx-auto"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[19] w-full max-w-[min(1020px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 px-3 sm:px-4">
          <div
            className="hero-logo-pulse mx-auto w-full max-w-full"
            style={{ maxHeight: 'clamp(160px, 76dvh, 720px)' }}
          >
            <Image
              src="/assets/logo.webp"
              alt="ONEM Logo"
              width={1020}
              height={720}
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 90vw, 720px"
              quality={75}
              className="block h-auto w-full max-w-full object-contain"
              style={{
                maxHeight: 'clamp(160px, 76dvh, 720px)',
              }}
            />
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 z-20 w-full max-w-[1180px] -translate-x-1/2 px-3 sm:bottom-6 sm:px-4">
          <HeroFeaturedLogosStrip speedSeconds={34} compact />
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
