import { NavApp } from '@/components/NavApp'
import SiteFooter from '@/components/SiteFooter'
import { PlaylistCardsSection } from '@/components/programs/PlaylistCardsSection'
import { PublicPlanOfferCards } from '@/components/programs/PublicPlanOfferCards'

function ProgramsGoldPillHeading({
  title,
  as: Tag = 'h2',
  size = 'default',
}: {
  title: string
  as?: 'h1' | 'h2'
  size?: 'default' | 'compact'
}) {
  const shellPad =
    size === 'compact' ? 'px-5 py-3 sm:px-10 sm:py-4' : 'px-10 py-4 sm:px-14 sm:py-5'
  const titleSize =
    size === 'compact'
      ? 'text-[clamp(0.72rem,2.4vw+0.35rem,1.35rem)] sm:text-[clamp(0.95rem,1.2vw+0.55rem,2.15rem)]'
      : 'text-[2rem] sm:text-[3.35rem]'

  return (
    <div className="mx-auto flex w-full max-w-[1400px] justify-center px-[clamp(1rem,3.2vw,1.5rem)] sm:px-6">
      <div
        className={`relative max-w-full overflow-hidden rounded-[999px] border border-[#f5c814]/45 bg-[linear-gradient(180deg,rgba(18,18,18,0.94),rgba(4,4,4,0.98))] shadow-[0_0_18px_rgba(245,200,20,0.15),inset_0_0_18px_rgba(245,200,20,0.08)] ${shellPad}`}
      >
        <span className="programs-heading-bg-shine pointer-events-none absolute inset-0 rounded-[999px]" />
        <span className="pointer-events-none absolute inset-[4px] rounded-[999px] border border-[#f5c814]/35" />
        <span className="pointer-events-none absolute left-[5%] top-1/2 h-[62%] w-[2px] -translate-y-1/2 bg-[linear-gradient(180deg,transparent,rgba(245,200,20,0.8),transparent)] opacity-70" />
        <span className="pointer-events-none absolute right-[5%] top-1/2 h-[62%] w-[2px] -translate-y-1/2 bg-[linear-gradient(180deg,transparent,rgba(245,200,20,0.8),transparent)] opacity-70" />
        <span className="pointer-events-none absolute inset-0 rounded-[999px] bg-[radial-gradient(120%_130%_at_50%_-25%,rgba(255,220,120,0.2),transparent_55%)] opacity-60" />
        <span
          className="programs-heading-shine pointer-events-none absolute inset-y-[-20%] left-[-35%] w-[20%] bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.65)_50%,transparent_100%)] opacity-70 blur-[2px]"
          aria-hidden
        />
        <Tag
          className={`relative text-center font-black uppercase tracking-[0.14em] text-[#f5c814] drop-shadow-[0_0_10px_rgba(245,200,20,0.5)] ${titleSize}`}
        >
          {title}
        </Tag>
      </div>
    </div>
  )
}

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
