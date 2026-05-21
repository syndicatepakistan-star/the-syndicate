import { NavApp } from '@/components/NavApp'
import { ViewportDecorVideo } from '@/components/ViewportDecorVideo'
import GlobalBottomSections from '@/components/GlobalBottomSections'
import { MethodCtaButtons } from '@/components/methods/MethodCtaButtons'
import { MethodSplitCard, type MethodSplitAccent } from '@/components/methods/MethodSplitCard'
import { CyberChamferFrame } from '@/components/cyber/CyberChamferFrames'

type MethodBlock = {
  id: string
  title: string
  summary: string
  paragraphs: [string, string]
  image?: string
  imageAlt: string
  videoSrc?: string
  keySrc?: string
  footerEmphasis?: string
  accent: MethodSplitAccent
}

const METHOD_BLOCKS: MethodBlock[] = [
  {
    id: 'greatness',
    title: 'Achieving True Greatness comes with Mastery',
    summary:
      'Greatness is engineered through discipline and strategic education, not by chance.',
    paragraphs: [
      'True greatness is not achieved by chance - it is deliberately built through knowledge, discipline, and action. The Syndicate equips its members with actionable, real-world strategies designed to help them master the systems of wealth and power.',
      'The Syndicate brings clarity to wealth systems with immediate implementation methods. Every lesson is built for practical execution from day one while preserving moral integrity and purpose.',
    ],
    imageAlt: 'Gold key symbol',
    keySrc: '/assets/Gold-Key.png',
    accent: 'cyan',
  },
  {
    id: 'break-free',
    title: 'BREAK FREE FROM THE SYSTEM',
    summary:
      'Reject passive compliance and build strategic autonomy through alliance and execution.',
    paragraphs: [
      'The Syndicate stands as an elite and exclusive organisation of individuals committed to achieving the zenith of power, wealth, and mastery. This private network is for those who yearn for true greatness and the ability to shape their destiny.',
      'This is not a shortcut scheme. It is a disciplined alliance for people willing to master themselves, build leverage, and reshape outcomes under pressure.',
    ],
    videoSrc: '/assets/bg-video.mp4',
    imageAlt: 'Break free from the system — dystopian cathedral uplink',
    footerEmphasis: 'Master yourself. Master the system.',
    accent: 'amber',
  },
  {
    id: 'money-power',
    title: 'Money and Power Mastery',
    summary:
      'Money and power are inseparable systems that demand control, ethics, and strategic awareness.',
    paragraphs: [
      'The Syndicate philosophy teaches that money and power go hand in hand. They are like two sides of the same coin. Money and power, if not correctly wielded, has the potential to completely corrupt you, leading you down a dark path of corrupt, degenerate and hedonistic behaviour.',
      'The mission goes beyond accumulation. Members are trained to navigate influence structures without moral collapse, turning power into disciplined, constructive force.',
    ],
    image: '/assets/money-power-mastery.png',
    imageAlt: 'Money and power mastery — dystopian throne and neon doctrine',
    accent: 'violet',
  },
]

const METHOD_TIMELINE = [
  {
    step: '01',
    title: 'Decode The System',
    detail:
      'Map the hidden incentive structures controlling outcomes in money, influence, and status.',
    border: 'border-rose-500/90',
    glow: 'shadow-[0_0_0_2px_rgba(244,63,94,0.82),0_0_48px_rgba(225,29,72,0.74),0_0_92px_rgba(136,19,55,0.58)]',
    bg: 'bg-[linear-gradient(132deg,rgba(244,63,94,0.72),rgba(190,24,93,0.66),rgba(136,19,55,0.62))]',
    aura: 'bg-[radial-gradient(90%_80%_at_50%_40%,rgba(244,63,94,0.64),rgba(136,19,55,0.5)_48%,transparent_74%)]',
    stepBorder: 'border-rose-700/90',
    stepText: 'text-rose-200',
    titleText: 'text-rose-200',
  },
  {
    step: '02',
    title: 'Build Strategic Clarity',
    detail:
      'Convert chaos into executable frameworks with clear priorities, leverage points, and constraints.Cut vanity metrics: track commitments, lead times, and failure modes. Run red-team reviews on your own plan weekly so blind spots surface before the market charges you tuition.',
    border: 'border-fuchsia-500/90',
    glow: 'shadow-[0_0_0_2px_rgba(217,70,239,0.82),0_0_48px_rgba(192,38,211,0.74),0_0_92px_rgba(134,25,143,0.58)]',
    bg: 'bg-[linear-gradient(132deg,rgba(217,70,239,0.74),rgba(162,28,175,0.68),rgba(126,34,206,0.64))]',
    aura: 'bg-[radial-gradient(90%_80%_at_50%_40%,rgba(217,70,239,0.64),rgba(126,34,206,0.5)_48%,transparent_74%)]',
    stepBorder: 'border-fuchsia-700/90',
    stepText: 'text-fuchsia-200',
    titleText: 'text-fuchsia-200',
  },
  {
    step: '03',
    title: 'Execute Relentlessly',
    detail:
      'Deploy disciplined daily actions, track feedback loops, and adapt faster than competitors.Protect deep-work blocks like assets; treat interruptions as debt. When variance spikes, isolate variables instead of narrating panic',
    border: 'border-cyan-500/90',
    glow: 'shadow-[0_0_0_2px_rgba(34,211,238,0.82),0_0_48px_rgba(6,182,212,0.74),0_0_92px_rgba(14,116,144,0.58)]',
    bg: 'bg-[linear-gradient(132deg,rgba(34,211,238,0.74),rgba(8,145,178,0.68),rgba(14,116,144,0.64))]',
    aura: 'bg-[radial-gradient(90%_80%_at_50%_40%,rgba(34,211,238,0.66),rgba(14,116,144,0.5)_48%,transparent_74%)]',
    stepBorder: 'border-cyan-700/90',
    stepText: 'text-cyan-200',
    titleText: 'text-cyan-200',
  },
  {
    step: '04',
    title: 'Compound Power',
    detail:
      'Scale from isolated wins to durable systems that produce authority, capital, and autonomy.',
    border: 'border-blue-500/90',
    glow: 'shadow-[0_0_0_2px_rgba(59,130,246,0.82),0_0_48px_rgba(37,99,235,0.74),0_0_92px_rgba(30,64,175,0.58)]',
    bg: 'bg-[linear-gradient(132deg,rgba(59,130,246,0.74),rgba(37,99,235,0.68),rgba(30,64,175,0.64))]',
    aura: 'bg-[radial-gradient(90%_80%_at_50%_40%,rgba(59,130,246,0.64),rgba(30,64,175,0.5)_48%,transparent_74%)]',
    stepBorder: 'border-blue-700/90',
    stepText: 'text-blue-200',
    titleText: 'text-blue-200',
  },
] as const

export default function OurMethodsPage() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-clip bg-[#04060c]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <ViewportDecorVideo
          src="/assets/video.mp4"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute left-[-10%] top-[8%] h-[280px] w-[280px] rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute right-[-12%] top-[14%] h-[300px] w-[300px] rounded-full bg-violet-500/14 blur-3xl" />
        <div className="absolute left-[36%] top-[54%] h-[320px] w-[320px] rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(34,211,238,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.2)_1px,transparent_1px),linear-gradient(rgba(167,139,250,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.14)_1px,transparent_1px)] [background-size:74px_74px,74px_74px,18px_18px,18px_18px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(56,189,248,0.1),transparent_58%),radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(244,63,94,0.11),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040816]/74 via-[#05040c]/88 to-[#020208]/96" />
      </div>

      <NavApp />

      <section className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-10 pt-[88px] sm:pb-12 sm:pt-[106px]">
        <div className="mx-auto max-w-[96rem]">
          <CyberChamferFrame accent="hero" chamfer={24} className="min-h-[72vh]" innerClassName="p-7 sm:p-10 lg:p-14">
            <div className="grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-200/80">Our Methods // Dystopian Doctrine</p>
                <h1 className="mt-4 text-[clamp(2.2rem,5.4vw,5.2rem)] font-black uppercase leading-[0.9] tracking-[0.1em] text-cyan-100 drop-shadow-[0_0_18px_rgba(34,211,238,0.52)]">
                  Control The
                  <br />
                  Operating System
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-100/88 sm:text-xl">
                  In a broken world, average behavior gets average outcomes. Our methods are engineered for operators who want structure, leverage, and execution inside high-pressure systems.
                </p>
                <MethodCtaButtons className="mt-8" />
              </div>
              <div className="grid gap-4">
                <CyberChamferFrame accent="video" chamfer={18} decorSize="compact" innerClassName="p-2">
                  <ViewportDecorVideo
                    src="/assets/video.mp4"
                    className="relative z-10 h-[360px] w-full object-cover sm:h-[440px] lg:h-[500px]"
                  />
                </CyberChamferFrame>
              </div>
            </div>
          </CyberChamferFrame>
        </div>
      </section>

      <div className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-8 sm:pb-10">
        <div className="mx-auto max-w-[96rem]">
          <CyberChamferFrame accent="separator" chamfer={14} decorSize="compact" innerClassName="py-2.5 px-3">
            <svg viewBox="0 0 1200 26" className="h-5 w-full" preserveAspectRatio="none" aria-hidden>
              <defs>
                <pattern id="ornate-sep" width="54" height="26" patternUnits="userSpaceOnUse">
                  <path d="M2 13h50" stroke="rgba(251,191,36,0.95)" strokeWidth="1.4" />
                  <path d="M14 6l12 7-12 7-12-7z" fill="none" stroke="rgba(245,158,11,0.95)" strokeWidth="1.2" />
                  <circle cx="26" cy="13" r="2.1" fill="rgba(250,204,21,0.96)" />
                  <path d="M8 13c5-6 11-6 16 0-5 6-11 6-16 0z" fill="none" stroke="rgba(245,158,11,0.7)" strokeWidth="1" />
                  <path d="M44 13c-5-6-11-6-16 0 5 6 11 6 16 0z" fill="none" stroke="rgba(245,158,11,0.7)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="1200" height="26" fill="url(#ornate-sep)" />
            </svg>
          </CyberChamferFrame>
        </div>
      </div>

      <section className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-10 sm:pb-12">
        <div className="mx-auto max-w-[96rem]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/85">Method Timeline</p>
            <h2 className="mt-2 text-[clamp(2.2rem,5.4vw,5.2rem)] font-black uppercase leading-[0.9] tracking-[0.1em] text-amber-100 drop-shadow-[0_0_18px_rgba(251,191,36,0.52)]">
              Operational Sequence
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            {METHOD_TIMELINE.map((item, idx) => (
              <article
                key={item.step}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 transition-transform duration-300 hover:-translate-y-0.5 ${
                  idx === 1
                    ? 'xl:col-span-4'
                    : idx === 2
                      ? 'xl:col-span-3'
                      : 'xl:col-span-2'
                } ${
                  idx % 2 === 0
                    ? '[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]'
                    : '[clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]'
                } ${item.border} ${item.glow}`}
              >
                <span className={`pointer-events-none absolute -inset-3 rounded-[1.2rem] opacity-85 blur-2xl ${item.aura}`} />
                <span className={`pointer-events-none absolute inset-0 ${item.bg}`} />
                <span className="pointer-events-none absolute inset-0 opacity-[0.17] [background-image:repeating-linear-gradient(180deg,rgba(0,0,0,0.28)_0px,rgba(0,0,0,0.28)_1px,transparent_1px,transparent_3px)]" />
                <span className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] [background-size:16px_16px]" />
                <span className="pointer-events-none absolute inset-[6px] rounded-[12px] border-2 border-black/45" />
                <span className={`pointer-events-none absolute left-3 top-3 h-7 w-7 border-l-[3px] border-t-[3px] ${item.stepBorder} opacity-90`} />
                <span className={`pointer-events-none absolute bottom-3 right-3 h-7 w-7 border-b-[3px] border-r-[3px] ${item.stepBorder} opacity-90`} />
                <span className={`pointer-events-none absolute right-3 top-3 h-2 w-10 rounded-full ${item.stepBorder} border bg-[rgba(4,4,12,0.65)]`} />
                <span className={`pointer-events-none absolute bottom-3 left-3 h-2 w-10 rounded-full ${item.stepBorder} border bg-[rgba(4,4,12,0.65)]`} />
                <div className="relative z-10 rounded-lg bg-[linear-gradient(165deg,rgba(10,8,18,0.82),rgba(4,6,14,0.9))] p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_0_32px_rgba(0,0,0,0.25)] backdrop-blur-[1px] sm:p-3">
                  <p className={`inline-flex rounded-md border-2 bg-[linear-gradient(180deg,rgba(6,4,12,0.88),rgba(2,2,8,0.92))] px-3 py-1 text-[11px] font-bold tracking-[0.24em] shadow-[0_0_16px_rgba(0,0,0,0.45)] ${item.stepBorder} text-zinc-100`}>
                    STEP {item.step}
                  </p>
                  <h3 className={`mt-3 text-2xl font-black uppercase leading-tight tracking-[0.04em] text-zinc-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)] ${item.titleText}`}>{item.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.68)]">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 w-full px-[clamp(0.75rem,2.5vw,2.5rem)] pb-14 sm:pb-20">
        <div className="mx-auto w-full max-w-[110rem] space-y-8 sm:space-y-10">
          {METHOD_BLOCKS.map((block) => (
            <MethodSplitCard
              key={block.id}
              accent={block.accent}
              title={block.title}
              summary={block.summary}
              paragraphs={block.paragraphs}
              image={block.image}
              imageAlt={block.imageAlt}
              videoSrc={block.videoSrc}
              keySrc={block.keySrc}
              footerEmphasis={block.footerEmphasis}
              moneyPowerTitle={block.id === 'money-power'}
            />
          ))}
        </div>
      </section>

      <GlobalBottomSections />
    </div>
  )
}

