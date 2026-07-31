import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { NavApp } from '@/components/NavApp'
import { ProgramsUnlockShell } from '@/components/programs/ProgramsUnlockShell'
import { ProgramsGoldPillHeading } from '@/components/programs/ProgramsGoldPillHeading'
import { LazyWhenVisible } from '@/components/LazyWhenVisible'
import { ProgramsBusinessHashLand } from '@/components/programs/ProgramsBusinessHashLand'
import { ProgramsBackStepGuard } from '@/app/programs/ProgramsBackStepGuard'
import { ProgramsPageAmbient } from '@/components/programs/ProgramsPageAmbient'
import { OFFER_PLAN_THUMB_MONEY_MASTERY } from '@/components/programs/offerPlanThumbnails'
import { normalizeLevel1ProgramPlaylists } from '@/lib/programPlaylistCatalog'
import { fetchPublicPlaylistsServer } from '@/lib/fetchPublicPlaylistsServer'
import { nextOptimizedImageSrcSet, nextOptimizedImageUrl } from '@/lib/optimizeImageUrl'
import {
  programsLibraryDesktopLast3Preloads,
  programsLibraryMobileFirst3Preloads,
} from '@/lib/programsLibraryLcpImages'
import { buildPageMetadata } from '@/lib/seo'

const ProgramsOfferSection = dynamic(
  () => import('@/components/programs/ProgramsOfferSection').then((m) => m.ProgramsOfferSection),
  {
    loading: () => (
      /* Tall reserve so #businessprograms scroll doesn’t slide onto mid-tickets when offers hydrate. */
      <div
        className="mx-auto min-h-[min(92vh,48rem)] w-full max-w-[1400px] animate-pulse rounded-xl bg-white/5 sm:min-h-[min(85vh,52rem)]"
        aria-hidden
      />
    ),
  },
)

const ProgramsLibrarySection = dynamic(
  () =>
    import('@/components/programs/ProgramsLibrarySection').then((m) => m.ProgramsLibrarySection),
  {
    loading: () => (
      <div className="mx-auto min-h-[24rem] w-full max-w-[1400px] animate-pulse rounded-xl bg-white/5" aria-hidden />
    ),
  },
)

const PublicGoalPathSection = dynamic(
  () => import('@/components/programs/PublicGoalPathSection').then((m) => m.PublicGoalPathSection),
  {
    loading: () => (
      <div className="mx-auto my-8 min-h-[18rem] w-full max-w-5xl animate-pulse rounded-xl bg-white/5" aria-hidden />
    ),
  },
)

const SiteFooter = dynamic(() => import('@/components/SiteFooter'), {
  loading: () => <div className="min-h-[260px] w-full bg-[#02050b]" aria-hidden />,
})

const LCP_IMAGE_SIZES = '(max-width: 640px) 92vw, (max-width: 1024px) 480px, 512px'
const LCP_IMAGE_HREF = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 640, 62)
const LCP_IMAGE_SRCSET = nextOptimizedImageSrcSet(OFFER_PLAN_THUMB_MONEY_MASTERY, 62, 828)
const LIBRARY_MOBILE_LCP_PRELOADS = programsLibraryMobileFirst3Preloads()
const LIBRARY_DESKTOP_LCP_PRELOADS = programsLibraryDesktopLast3Preloads()

export const metadata: Metadata = buildPageMetadata({
  title: 'Programs — Syndicate Vaults, Trading, Business Models & AI Packs',
  description:
    'Syndicate Elite Offers: Money Mastery vault, Syndicate Trading, Agentic AI, Syndicate faceless YouTube / AI Content Automation, Syndicate business models and behaviour psychology — buy packs or single courses.',
  path: '/programs',
})

export default async function ProgramsPage() {
  const playlists = normalizeLevel1ProgramPlaylists(await fetchPublicPlaylistsServer())
  return (
    <div className="programs-page-root mobile-viewport-contain public-page-shell relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black">
      {/* Money Mastery — LCP preload on plain /programs. */}
      <link
        rel="preload"
        as="image"
        href={LCP_IMAGE_HREF}
        imageSrcSet={LCP_IMAGE_SRCSET}
        imageSizes={LCP_IMAGE_SIZES}
        fetchPriority="high"
      />
      {/* First 3 mobile library covers — #businessprograms filmstrip / LCP. */}
      {LIBRARY_MOBILE_LCP_PRELOADS.map((p) => (
        <link
          key={`lib-m-${p.href}`}
          rel="preload"
          as="image"
          href={p.href}
          imageSrcSet={p.imageSrcSet}
          imageSizes={p.imageSizes}
          media={p.media}
          fetchPriority={p.fetchPriority ?? "high"}
        />
      ))}
      {/* Last 3 desktop business-model covers — late filmstrip / SI on xl+. */}
      {LIBRARY_DESKTOP_LCP_PRELOADS.map((p) => (
        <link
          key={`lib-d-${p.href}`}
          rel="preload"
          as="image"
          href={p.href}
          imageSrcSet={p.imageSrcSet}
          imageSizes={p.imageSizes}
          media={p.media}
          fetchPriority={p.fetchPriority ?? "low"}
        />
      ))}
      <ProgramsPageAmbient />
      <NavApp />
      <ProgramsBackStepGuard />
      <ProgramsBusinessHashLand />
      <main className="programs-page-main relative z-[2] w-full min-w-0 overflow-x-clip">
      <ProgramsUnlockShell>
      <section
        id="syndicate-elite-offers"
        className="programs-page-band mobile-viewport-contain relative z-[2] scroll-mt-24 space-y-4 overflow-visible px-[clamp(0.5rem,2.5vw,1rem)] pt-6 sm:space-y-8 sm:px-[clamp(1rem,3.2vw,1.5rem)] sm:pt-10 2xl:px-[clamp(1.5rem,2vw,2.5rem)]"
      >
        <ProgramsGoldPillHeading as="h1" title="Syndicate Elite Offers" size="compact" />
        <p className="mx-auto max-w-3xl px-1 text-center font-mono text-[clamp(0.7rem,2.8vw,0.875rem)] leading-relaxed text-zinc-300/90 sm:text-sm xl:max-w-4xl">
          This is The Syndicate vault floor — Money Mastery, Syndicate Trading, Agentic AI, and the Syndicate
          faceless YouTube pack under AI Content Automation, plus Level 1 Syndicate business models and
          Syndicate behaviour psychology. Unlock a full pack or strike one course. Not campus theory. Operator
          curriculum.
        </p>
        <ProgramsOfferSection size="large" shellHosted omitKnight />
      </section>
      {/*
        Anchor + PROGRAMS heading stay in SSR HTML (not behind LazyWhenVisible) so
        /programs#businessprograms can scroll before the library grid mounts — no mid-ticket flash.
      */}
      <section
        id="programs-library"
        className="programs-page-band mobile-viewport-contain space-y-4 overflow-x-clip px-[clamp(0.5rem,2.5vw,1rem)] py-8 max-lg:px-[0.55rem] sm:space-y-8 sm:px-6 sm:py-14 2xl:px-[clamp(1.25rem,2vw,2rem)]"
      >
        <div id="businessprograms" className="businessprograms-anchor scroll-mt-28" tabIndex={-1}>
          <ProgramsGoldPillHeading as="h2" title="Programs" />
        </div>
        {/*
          Library is SSR + always mounted (not LazyWhenVisible) so #businessprograms
          paints cards on first frame — critical for mobile LCP / filmstrip.
        */}
        <div className="programs-library-max mx-auto w-full max-w-[1400px] overflow-x-clip 2xl:max-w-[min(1680px,94vw)]">
          <Suspense
            fallback={
              <div className="min-h-[24rem] w-full animate-pulse rounded-xl bg-white/5" aria-hidden />
            }
          >
            <ProgramsLibrarySection
              title="Programs Library"
              subtitle="Explore all admin-published playlists here. Playlist videos stay inside member dashboard."
              initialPlaylists={playlists}
            />
          </Suspense>
        </div>
      </section>
      <LazyWhenVisible
        minHeight="18rem"
        rootMargin="320px 0px"
        className="programs-page-band"
        placeholder={
          <div className="mx-auto my-8 min-h-[18rem] w-full max-w-5xl animate-pulse rounded-xl bg-white/5" aria-hidden />
        }
      >
        <PublicGoalPathSection playlists={playlists} alwaysVisible />
      </LazyWhenVisible>
      <LazyWhenVisible
        minHeight="32rem"
        rootMargin="360px 0px"
        className="programs-page-band"
        placeholder={
          <div className="mx-auto min-h-[32rem] w-full max-w-[1400px] animate-pulse rounded-xl bg-white/5" aria-hidden />
        }
      >
        <section
          id="the-knight-offer"
          className="mobile-viewport-contain relative z-[2] scroll-mt-24 space-y-4 overflow-visible px-[clamp(0.5rem,2.5vw,1rem)] pb-8 pt-4 sm:space-y-6 sm:px-[clamp(1rem,3.2vw,1.5rem)] sm:pb-12 sm:pt-6 2xl:px-[clamp(1.5rem,2vw,2.5rem)]"
        >
          <ProgramsGoldPillHeading as="h2" title="The Knight" size="compact" />
          <ProgramsOfferSection size="large" shellHosted knightOnly />
        </section>
      </LazyWhenVisible>
      </ProgramsUnlockShell>
      </main>
      <SiteFooter />
    </div>
  )
}
