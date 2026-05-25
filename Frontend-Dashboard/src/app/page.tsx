import { readdir } from 'node:fs/promises'
import path from 'node:path'
import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import { PricingPage } from '@/components/AnimatedPricingPage'
import CertificatesSection from '@/components/CertificatesSection'
import DomeGallery from '@/components/DomeGallery'
import FAQSection from '@/components/FAQSection'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import { HeroGlitchBackground } from '@/components/home/HeroGlitchBackground'
import NeonTypingBadge from '@/components/NeonTypingBadge'
import PaywallSnapshotsSection from '@/components/PaywallSnapshotsSection'
import { NavApp } from '@/components/NavApp'
import GlobalBottomSections from '@/components/GlobalBottomSections'
import { DeferredMp4Background, DeferredVimeoProgramsBackground } from '@/components/home/DeferredHomeBackgrounds'
import { TIKTOK_MOST_INFORMATIVE } from '@/data/tiktok-most-informative'
import { TIKTOK_MOST_VIEWED } from '@/data/tiktok-most-viewed'
import { attachProgramLinksToGalleryImages } from '@/lib/programGalleryLinks'
import { GLOBE_IMAGE_ALT_OVERRIDES } from '@/lib/programPlaylistThumbnails'
import { applyGlobeGalleryOverrides } from '@/lib/programPlaylistThumbnails'
import { fetchPublicPlaylistsServer } from '@/lib/fetchPublicPlaylistsServer'

const FEATURED_LOGOS = [
  {
    src: '/assets/press-forbes.png',
    alt: 'Forbes logo',
    href: 'https://forbes.ge/en/how-the-syndicate-uses-mastery-and-empowerment-to-redefine-business/',
  },
  {
    src: '/assets/press-luxury.png',
    alt: 'LLM logo',
    href: 'https://www.luxurylifestylemag.co.uk/money/how-the-syndicate-empowers-individuals-to-master-power-money-and-influence-in-the-money-mastery-course/',
  },
  {
    src: '/assets/press-gq.png',
    alt: 'GQ logo',
    href: 'https://gq.co.za/wealth/2025-02-10-how-the-syndicate-can-disrupt-the-traditional-model-of-influence-and-education-in-the-digital-age/',
  },
]

const PROGRAM_IMAGE_BASE = '/assets/programs/cources%20imnages'
const courseImage = (fileName: string) => `${PROGRAM_IMAGE_BASE}/${encodeURIComponent(fileName)}`
const FEATURED_PROGRAM_IMAGES = [
  { src: courseImage('wordpress-blog.png'), alt: 'WordPress Blog' },
  { src: courseImage('canvics-to-canva.png'), alt: 'Graphics Design using Canva' },
  { src: courseImage('flutter-app-building.png'), alt: 'App Building using Flutter' },
  { src: courseImage('automaton-name-change.png'), alt: 'AI Automations' },
  { src: courseImage('trading with technical analysis.png'), alt: 'Trading with Technical Analysis' },
  { src: courseImage('dystopian-demand.png'), alt: 'Print on Demand Clothing' },
  { src: courseImage('make_best_thumbnails_or_cover_image_of_program_python_programming__dystopian_cyber__pds64wpqtzleuu2ucwkp_0.png'), alt: 'Python Programming' },
  { src: courseImage('new-project (12).png'), alt: 'Building Apps using React JS' },
]

const SOCIAL_CARD_BORDER_THEMES = [
  {
    frame: "border-[6px] border-red-400 hover:border-red-300",
    glow: "shadow-[0_0_0_1px_rgba(248,113,113,0.9),0_0_22px_rgba(248,113,113,0.86),0_0_56px_rgba(248,113,113,0.72),0_0_108px_rgba(248,113,113,0.56),inset_0_0_20px_rgba(248,113,113,0.27)] hover:shadow-[0_0_0_1px_rgba(252,165,165,0.95),0_0_26px_rgba(252,165,165,0.9),0_0_64px_rgba(252,165,165,0.75),0_0_116px_rgba(252,165,165,0.62),inset_0_0_22px_rgba(252,165,165,0.34)]",
    inner: "border-red-500/75",
    chip: "border-red-500 bg-red-900/75 shadow-[0_0_18px_rgba(127,29,29,0.95)]",
    bgGlow: "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(127,29,29,0.55),rgba(127,29,29,0.18)_44%,rgba(12,4,4,0.72)_72%,transparent_86%)]",
    lightningColor: 'rgba(248,113,113,0.96)',
    lightningSoft: 'rgba(248,113,113,0.62)',
  },
  {
    frame: "border-[6px] border-cyan-300 hover:border-cyan-200",
    glow: "shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)] hover:shadow-[0_0_0_1px_rgba(103,232,249,0.95),0_0_26px_rgba(103,232,249,0.9),0_0_64px_rgba(103,232,249,0.75),0_0_116px_rgba(103,232,249,0.62),inset_0_0_22px_rgba(103,232,249,0.34)]",
    inner: "border-cyan-500/75",
    chip: "border-cyan-500 bg-cyan-900/75 shadow-[0_0_18px_rgba(14,116,144,0.95)]",
    bgGlow: "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(14,116,144,0.55),rgba(14,116,144,0.18)_44%,rgba(3,14,18,0.72)_72%,transparent_86%)]",
    lightningColor: 'rgba(56,189,248,0.96)',
    lightningSoft: 'rgba(56,189,248,0.62)',
  },
  {
    frame: "border-[6px] border-fuchsia-400 hover:border-fuchsia-300",
    glow: "shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_22px_rgba(232,121,249,0.86),0_0_56px_rgba(232,121,249,0.72),0_0_108px_rgba(232,121,249,0.56),inset_0_0_20px_rgba(232,121,249,0.27)] hover:shadow-[0_0_0_1px_rgba(244,114,182,0.95),0_0_26px_rgba(244,114,182,0.9),0_0_64px_rgba(244,114,182,0.75),0_0_116px_rgba(244,114,182,0.62),inset_0_0_22px_rgba(244,114,182,0.34)]",
    inner: "border-violet-500/75",
    chip: "border-violet-500 bg-violet-900/75 shadow-[0_0_18px_rgba(91,33,182,0.95)]",
    bgGlow: "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(91,33,182,0.55),rgba(91,33,182,0.18)_44%,rgba(10,5,18,0.72)_72%,transparent_86%)]",
    lightningColor: 'rgba(192,132,252,0.96)',
    lightningSoft: 'rgba(192,132,252,0.62)',
  },
  {
    frame: "border-[6px] border-amber-300 hover:border-amber-200",
    glow: "shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_22px_rgba(252,211,77,0.86),0_0_56px_rgba(252,211,77,0.72),0_0_108px_rgba(252,211,77,0.56),inset_0_0_20px_rgba(252,211,77,0.27)] hover:shadow-[0_0_0_1px_rgba(253,224,71,0.95),0_0_26px_rgba(253,224,71,0.9),0_0_64px_rgba(253,224,71,0.75),0_0_116px_rgba(253,224,71,0.62),inset_0_0_22px_rgba(253,224,71,0.34)]",
    inner: "border-amber-500/75",
    chip: "border-amber-500 bg-amber-900/75 shadow-[0_0_18px_rgba(146,64,14,0.95)]",
    bgGlow: "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(146,64,14,0.55),rgba(146,64,14,0.18)_44%,rgba(18,10,4,0.72)_72%,transparent_86%)]",
    lightningColor: 'rgba(251,191,36,0.96)',
    lightningSoft: 'rgba(251,191,36,0.62)',
  },
  {
    frame: "border-[6px] border-lime-300 hover:border-lime-200",
    glow: "shadow-[0_0_0_1px_rgba(163,230,53,0.9),0_0_22px_rgba(163,230,53,0.86),0_0_56px_rgba(163,230,53,0.72),0_0_108px_rgba(163,230,53,0.56),inset_0_0_20px_rgba(163,230,53,0.27)] hover:shadow-[0_0_0_1px_rgba(190,242,100,0.95),0_0_26px_rgba(190,242,100,0.9),0_0_64px_rgba(190,242,100,0.75),0_0_116px_rgba(190,242,100,0.62),inset_0_0_22px_rgba(190,242,100,0.34)]",
    inner: "border-lime-500/75",
    chip: "border-lime-500 bg-lime-900/75 shadow-[0_0_18px_rgba(63,98,18,0.95)]",
    bgGlow: "bg-[radial-gradient(74%_74%_at_50%_50%,rgba(63,98,18,0.55),rgba(63,98,18,0.18)_44%,rgba(8,14,3,0.72)_72%,transparent_86%)]",
    lightningColor: 'rgba(163,230,53,0.96)',
    lightningSoft: 'rgba(163,230,53,0.62)',
  },
] as const

const PROGRAM_GALLERY_DIR = 'assets/programs/cources imnages'
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'])

const toLabel = (fileName: string) =>
  fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

async function readProgramGalleryImages() {
  const absolute = path.join(process.cwd(), 'public', ...PROGRAM_GALLERY_DIR.split('/'))
  try {
    const entries = await readdir(absolute, { withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

    if (files.length > 0) {
      return files.map((file, index) => ({
        src: courseImage(file),
        alt: GLOBE_IMAGE_ALT_OVERRIDES[file] ?? (toLabel(file) || `Program image ${index + 1}`),
        fileName: file,
      }))
    }
  } catch {
    // Use curated fallback when folder is unavailable.
  }

  return FEATURED_PROGRAM_IMAGES.map((item, index) => ({
    ...item,
    fileName: `fallback-${index + 1}.png`,
  }))
}

const getProgramGalleryImages = unstable_cache(readProgramGalleryImages, ['home-program-gallery-images-v2'], {
  revalidate: 3600,
})

const getLinkedProgramGalleryImages = unstable_cache(
  async () => {
    const images = applyGlobeGalleryOverrides(await getProgramGalleryImages())
    const playlists = await fetchPublicPlaylistsServer()
    return attachProgramLinksToGalleryImages(images, playlists)
  },
  ['home-program-gallery-linked-v2'],
  { revalidate: 3600 }
)

export default async function Home() {
  const programGalleryImages = await getLinkedProgramGalleryImages()
  const informativeMarqueeItems = TIKTOK_MOST_INFORMATIVE.map((card) => ({
    videoId: card.videoId,
    src: card.posterSrc,
    alt: card.alt,
    href: card.href,
  }))
  const mostViewedMarqueeItems = TIKTOK_MOST_VIEWED.map((card) => ({
    videoId: card.videoId,
    src: card.posterSrc,
    alt: card.alt,
    href: card.href,
    approxViewsLabel: card.approxViewsLabel,
  }))
  // Keep enough repeated cards for infinite marquee while avoiding
  // excessive duplicated image nodes that slow first paint/decode.
  const informativeRowGroup = Array.from({ length: 2 }, () => informativeMarqueeItems).flat()
  const informativeRowTrack = [...informativeRowGroup, ...informativeRowGroup]
  const mostViewedRowGroup = Array.from({ length: 2 }, () => mostViewedMarqueeItems).flat()
  const tiktokMostViewedTrack = [...mostViewedRowGroup, ...mostViewedRowGroup]

  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black">
      <NavApp />
      <section
        id="heroSection"
        className="relative h-[100dvh] min-h-[100dvh] w-full min-w-0 overflow-hidden"
      >
        <div className="hero-glitch-placeholder absolute inset-0 z-0" aria-hidden />
        <HeroGlitchBackground
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
              phrases={[
                'HONOUR · MONEY · POWER · FREEDOM',
              ]}
              typingSpeed={34}
              deletingSpeed={24}
              pauseMs={420}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[19] w-full max-w-[min(1020px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 px-3 sm:px-4">
          <Image
            src="/assets/logo.webp"
            alt="ONEM Logo"
            width={1020}
            height={720}
            priority
            className="hamburger-attract mx-auto block h-auto w-full max-w-full object-contain"
            style={{
              maxHeight: 'clamp(160px, 76dvh, 720px)',
              filter: 'drop-shadow(0 0 14px rgba(251, 191, 36, 0.35))',
            }}
          />
        </div>
        <div className="absolute bottom-4 left-1/2 z-20 w-full max-w-[1180px] -translate-x-1/2 px-3 sm:bottom-6 sm:px-4">
          <FeaturedLogosStrip logos={FEATURED_LOGOS} speedSeconds={34} compact />
        </div>
        <div className="relative z-10 h-[100dvh] min-h-[100dvh] w-full min-w-0" aria-hidden />
      </section>
      <section className="relative flex h-auto min-h-0 w-full min-w-0 items-start overflow-hidden bg-[#050508] px-0 py-4 sm:h-[100dvh] sm:min-h-[100dvh] sm:items-center sm:py-0">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <DeferredVimeoProgramsBackground />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-black/72" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }} />

        <div className="relative z-10 h-full w-full px-0">
          <h2 className="mb-3 text-center text-2xl font-black uppercase sm:mb-12 sm:text-3xl md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]">
              SYNDICATE ELITE PROGRAMS
            </span>
          </h2>
          <div className="h-[clamp(300px,52dvh,420px)] w-full min-w-0 overflow-hidden rounded-none bg-transparent sm:h-[calc(100dvh-9rem)] sm:min-h-[520px]">
            <DomeGallery
              images={programGalleryImages}
              fit={0.58}
              minRadius={260}
              segments={18}
              dragDampening={4.8}
              grayscale={false}
              autoRotateSpeedDeg={1.8}
              tileInsetPx={12}
              navigateOnClick
            />
          </div>
        </div>
      </section>

      <section className="relative h-auto min-h-0 w-full min-w-0 overflow-hidden bg-black py-8 sm:h-[100dvh] sm:min-h-[100dvh] sm:py-0">
        <div className="pointer-events-none absolute inset-0">
          <DeferredMp4Background src="/assets/video.mp4" className="h-full w-full object-cover opacity-24" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-black/68" />
        <div className="relative z-10 mx-auto flex h-auto w-full max-w-[1700px] flex-col justify-start px-4 py-0 sm:h-full sm:justify-center sm:px-6 sm:py-12 md:px-8">
          <div className="space-y-4 sm:space-y-5">
            <h3 className="mb-3 px-1 text-center text-2xl font-black uppercase tracking-[0.16em] text-amber-100 drop-shadow-[0_0_14px_rgba(251,191,36,0.35)] sm:mb-4 sm:text-3xl md:text-4xl">
              MOST VIEWED
            </h3>
            <div className="relative w-full overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black via-black/55 to-transparent sm:w-16" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black via-black/55 to-transparent sm:w-16" />
              <div
                className="animate-marquee flex w-max items-center gap-2 sm:gap-3"
                style={{ ['--duration' as string]: '92s', ['--gap' as string]: '1rem' }}
              >
                {tiktokMostViewedTrack.map((image, index) => {
                  const theme = SOCIAL_CARD_BORDER_THEMES[index % SOCIAL_CARD_BORDER_THEMES.length]
                  return (
                    <a
                      key={`tiktok-mv-${image.videoId}-${index}`}
                      href={image.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open TikTok video (${image.approxViewsLabel}): ${image.alt}`}
                      className={`lightning-glow-card group relative block h-[clamp(150px,43vw,240px)] w-[clamp(98px,30.5vw,180px)] overflow-hidden rounded-xl border bg-transparent [clip-path:polygon(0%_8%,8%_0%,100%_0%,100%_92%,92%_100%,0%_100%)] transition-all duration-300 hover:-translate-y-1 lg:h-[290px] lg:w-[220px] xl:h-[330px] xl:w-[250px] ${theme.frame} ${theme.glow}`}
                      style={
                        {
                          ['--lightning-color' as any]: theme.lightningColor,
                          ['--lightning-color-soft' as any]: theme.lightningSoft,
                        }
                      }
                    >
                      <span className={`pointer-events-none absolute -inset-7 z-0 blur-3xl opacity-85 transition-opacity duration-300 group-hover:opacity-100 ${theme.bgGlow}`} />
                      <span className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(10,12,22,0.2),rgba(2,4,12,0.62))]" />
                      <span className={`pointer-events-none absolute inset-[2px] z-[3] rounded-[10px] border opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${theme.inner}`} />
                      <span className={`pointer-events-none absolute left-2 top-2 z-[4] h-3 w-3 rounded-sm border ${theme.chip}`} />
                      <span className={`pointer-events-none absolute bottom-2 right-2 z-[4] h-3 w-3 rounded-sm border ${theme.chip}`} />
                      <span className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          quality={78}
                          fetchPriority="low"
                          decoding="async"
                          sizes="(max-width: 768px) 31vw, (max-width: 1280px) 220px, 250px"
                          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>

            <>
              <h3 className="mb-3 mt-6 px-1 text-center text-2xl font-black uppercase tracking-[0.16em] text-amber-100 drop-shadow-[0_0_14px_rgba(251,191,36,0.35)] sm:mb-4 sm:mt-8 sm:text-3xl md:text-4xl">
                MOST INFORMATIVE
              </h3>
              <div className="relative w-full overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black via-black/55 to-transparent sm:w-16" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black via-black/55 to-transparent sm:w-16" />
                <div
                  className="animate-marquee-reverse flex w-max items-center gap-2 sm:gap-3"
                  style={{ ['--duration' as string]: '100s', ['--gap' as string]: '1rem' }}
                >
                  {informativeRowTrack.map((image, index) => {
                    const theme = SOCIAL_CARD_BORDER_THEMES[index % SOCIAL_CARD_BORDER_THEMES.length]
                    return (
                      <a
                        key={`informative-${image.videoId}-${index}`}
                        href={image.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open TikTok video: ${image.alt}`}
                        className={`lightning-glow-card group relative block h-[clamp(150px,43vw,240px)] w-[clamp(98px,30.5vw,180px)] overflow-hidden rounded-xl border bg-transparent [clip-path:polygon(0%_8%,8%_0%,100%_0%,100%_92%,92%_100%,0%_100%)] transition-all duration-300 hover:-translate-y-1 lg:h-[290px] lg:w-[220px] xl:h-[330px] xl:w-[250px] ${theme.frame} ${theme.glow}`}
                        style={
                          {
                            ['--lightning-color' as any]: theme.lightningColor,
                            ['--lightning-color-soft' as any]: theme.lightningSoft,
                          }
                        }
                      >
                        <span className={`pointer-events-none absolute -inset-7 z-0 blur-3xl opacity-85 transition-opacity duration-300 group-hover:opacity-100 ${theme.bgGlow}`} />
                        <span className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(10,12,22,0.2),rgba(2,4,12,0.62))]" />
                        <span className={`pointer-events-none absolute inset-[2px] z-[3] rounded-[10px] border opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${theme.inner}`} />
                        <span className={`pointer-events-none absolute left-2 top-2 z-[4] h-3 w-3 rounded-sm border ${theme.chip}`} />
                        <span className={`pointer-events-none absolute bottom-2 right-2 z-[4] h-3 w-3 rounded-sm border ${theme.chip}`} />
                        {/* Slight top-anchored zoom clips baked-in TikTok view/play UI at the bottom of posters */}
                        <span className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            quality={78}
                            fetchPriority="low"
                            decoding="async"
                            sizes="(max-width: 768px) 31vw, (max-width: 1280px) 220px, 250px"
                            className="origin-top scale-[1.14] object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.2]"
                          />
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            </>
          </div>
        </div>
      </section>
      <PricingPage />
      <PaywallSnapshotsSection />
      <CertificatesSection />
      <FAQSection />
      <GlobalBottomSections />
    </div>
  )
}
