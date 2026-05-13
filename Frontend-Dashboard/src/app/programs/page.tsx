import { NavApp } from '@/components/NavApp'
import SiteFooter from '@/components/SiteFooter'
import { PlaylistCardsSection } from '@/components/programs/PlaylistCardsSection'
import { PublicPlanOfferCards } from '@/components/programs/PublicPlanOfferCards'
import { ProgramsGoldPillHeading } from '@/components/programs/ProgramsGoldPillHeading'

export default function ProgramsPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[10%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-[120px] sm:h-[520px] sm:w-[520px]" />
        <div className="absolute right-[-8%] top-[38%] h-[300px] w-[300px] rounded-full bg-amber-400/20 blur-[110px] sm:h-[460px] sm:w-[460px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[130px] sm:h-[560px] sm:w-[560px]" />
      </div>
      <NavApp />
      <section className="space-y-6 pt-8 sm:space-y-8 sm:pt-10">
        <ProgramsGoldPillHeading as="h1" title="Syndicate Elite Offers" size="compact" />
        <PublicPlanOfferCards />
      </section>
      <section className="space-y-6 px-[clamp(1rem,3.2vw,1.5rem)] py-10 sm:space-y-8 sm:px-6 sm:py-14">
        <ProgramsGoldPillHeading as="h2" title="Programs" />
        <div className="mx-auto w-full max-w-[1400px]">
          <PlaylistCardsSection
            title="Programs Library"
            subtitle="Explore all admin-published playlists here. Playlist videos stay inside member dashboard."
          />
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
