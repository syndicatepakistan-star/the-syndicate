import { Suspense } from 'react'
import type { Metadata } from 'next'
import { NavApp } from '@/components/NavApp'
import SiteFooter from '@/components/SiteFooter'
import { ProgramsLibrarySection } from '@/components/programs/ProgramsLibrarySection'
import { ProgramsUnlockShell } from '@/components/programs/ProgramsUnlockShell'
import { PublicGoalPathSection } from '@/components/programs/PublicGoalPathSection'
import { ProgramsOfferSection } from '@/components/programs/ProgramsOfferSection'
import { ProgramsGoldPillHeading } from '@/components/programs/ProgramsGoldPillHeading'
import { normalizeLevel1ProgramPlaylists } from '@/lib/programPlaylistCatalog'
import { fetchPublicPlaylistsServer } from '@/lib/fetchPublicPlaylistsServer'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Programs — Syndicate Vaults, Trading, Business Models & AI Packs',
  description:
    'Syndicate Elite Offers: Money Mastery vault, Syndicate Trading, Agentic AI, Syndicate faceless YouTube / AI Content Automation, Syndicate business models and behaviour psychology — buy packs or single courses.',
  path: '/programs',
})

export default async function ProgramsPage() {
  const playlists = normalizeLevel1ProgramPlaylists(await fetchPublicPlaylistsServer())
  return (
    <div className="mobile-viewport-contain relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[10%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-[120px] sm:h-[520px] sm:w-[520px]" />
        <div className="absolute right-[-8%] top-[38%] h-[300px] w-[300px] rounded-full bg-amber-400/20 blur-[110px] sm:h-[460px] sm:w-[460px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[130px] sm:h-[560px] sm:w-[560px]" />
      </div>
      <NavApp />
      <main>
      <ProgramsUnlockShell>
      <section
        id="syndicate-elite-offers"
        className="mobile-viewport-contain relative z-[2] scroll-mt-24 space-y-4 overflow-visible px-[clamp(0.5rem,2.5vw,1rem)] pt-6 sm:space-y-8 sm:px-[clamp(1rem,3.2vw,1.5rem)] sm:pt-10"
      >
        <ProgramsGoldPillHeading as="h1" title="Syndicate Elite Offers" size="compact" />
        <p className="mx-auto max-w-3xl px-1 text-center font-mono text-xs leading-relaxed text-zinc-300/90 sm:text-sm">
          This is The Syndicate vault floor — Money Mastery, Syndicate Trading, Agentic AI, and the Syndicate
          faceless YouTube pack under AI Content Automation, plus Level 1 Syndicate business models and
          Syndicate behaviour psychology. Unlock a full pack or strike one course. Not campus theory. Operator
          curriculum.
        </p>
        <ProgramsOfferSection size="large" shellHosted />
      </section>
      <section
        id="programs-library"
        className="mobile-viewport-contain scroll-mt-24 space-y-4 overflow-x-clip px-[clamp(0.5rem,2.5vw,1rem)] py-8 max-lg:px-0 sm:space-y-8 sm:px-6 sm:py-14"
      >
        <ProgramsGoldPillHeading as="h2" title="Programs" />
        <div className="mx-auto w-full max-w-[1400px] overflow-x-clip">
          <Suspense fallback={null}>
            <ProgramsLibrarySection
              title="Programs Library"
              subtitle="Explore all admin-published playlists here. Playlist videos stay inside member dashboard."
            />
          </Suspense>
        </div>
      </section>
      </ProgramsUnlockShell>
      <PublicGoalPathSection playlists={playlists} alwaysVisible />
      </main>
      <SiteFooter />
    </div>
  )
}
