import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { NavApp } from '@/components/NavApp'
import GlobalBottomSections from '@/components/GlobalBottomSections'

/** Server-safe class merge (avoid `cn` from client-only dashboard primitives on RSC pages). */
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Chamfered polygon for HUD frames (matches hero section). */
function chamferPolygon(px: number) {
  return `polygon(${px}px 0,calc(100% - ${px}px) 0,100% ${px}px,100% calc(100% - ${px}px),calc(100% - ${px}px) 100%,${px}px 100%,0 calc(100% - ${px}px),0 ${px}px)`
}

type CyberFrameAccent = 'hero' | 'video' | 'separator' | 'cyan' | 'violet' | 'amber'

const CYBER_FRAME: Record<
  CyberFrameAccent,
  {
    ring: string
    outerGlow: string
    innerVeil: string
    /** Multi-layer fill inside the chamfer (replaces flat black). */
    panelFill: string
    insetStrong: string
    insetSoft: string
    hairL: string
    hairR: string
    cornerTL: string
    cornerBR: string
  }
> = {
  hero: {
    ring: 'linear-gradient(125deg, #00ffc8, #a855f7, #22d3ee, #00ffc8)',
    outerGlow:
      '0 0 0 1px rgba(255,255,255,0.35), 0 0 0 4px rgba(34,211,238,0.12), 0 0 14px rgba(34,211,238,0.75), 0 0 56px rgba(167,139,250,0.35), 0 0 100px rgba(34,211,238,0.15)',
    innerVeil: 'radial-gradient(95% 130% at 50% -12%, rgba(34,211,238,0.2), transparent 56%)',
    panelFill:
      'linear-gradient(168deg, rgba(8,14,24,0.94) 0%, rgba(4,8,18,0.97) 42%, rgba(3,6,14,0.99) 100%), radial-gradient(ellipse 85% 70% at 15% -5%, rgba(34,211,238,0.09), transparent 52%), radial-gradient(ellipse 70% 55% at 95% 100%, rgba(139,92,246,0.08), transparent 55%)',
    insetStrong: 'border-cyan-300/55',
    insetSoft: 'border-cyan-200/18',
    hairL: 'from-transparent via-cyan-300/90 to-transparent',
    hairR: 'from-transparent via-violet-300/90 to-transparent',
    cornerTL: 'border-cyan-300/85',
    cornerBR: 'border-violet-300/85',
  },
  video: {
    ring: 'linear-gradient(135deg, #38bdf8, #c084fc, #22d3ee)',
    outerGlow:
      '0 0 0 1px rgba(125,211,252,0.5), 0 0 0 3px rgba(168,85,247,0.15), 0 0 12px rgba(56,189,248,0.85), 0 0 48px rgba(167,139,250,0.35)',
    innerVeil: 'radial-gradient(90% 100% at 50% 0%, rgba(34,211,238,0.22), transparent 55%)',
    panelFill:
      'linear-gradient(175deg, rgba(6,12,22,0.95) 0%, rgba(4,8,18,0.98) 100%), radial-gradient(ellipse 90% 65% at 50% 0%, rgba(56,189,248,0.1), transparent 50%)',
    insetStrong: 'border-sky-300/50',
    insetSoft: 'border-cyan-200/16',
    hairL: 'from-transparent via-sky-300/85 to-transparent',
    hairR: 'from-transparent via-fuchsia-400/75 to-transparent',
    cornerTL: 'border-sky-300/80',
    cornerBR: 'border-fuchsia-400/75',
  },
  separator: {
    ring: 'linear-gradient(90deg, #ff9f1c, #ff003c, #facc15, #00ffc8)',
    outerGlow:
      '0 0 0 1px rgba(250,204,21,0.55), 0 0 0 3px rgba(255,0,60,0.12), 0 0 10px rgba(255,159,28,0.65), 0 0 40px rgba(255,0,60,0.25)',
    innerVeil: 'radial-gradient(120% 200% at 50% 50%, rgba(255,159,28,0.12), transparent 60%)',
    panelFill:
      'linear-gradient(180deg, rgba(18,8,6,0.94) 0%, rgba(10,4,8,0.98) 100%), radial-gradient(ellipse 100% 120% at 50% 50%, rgba(255,90,60,0.06), transparent 55%)',
    insetStrong: 'border-amber-400/45',
    insetSoft: 'border-orange-500/14',
    hairL: 'from-transparent via-amber-300/80 to-transparent',
    hairR: 'from-transparent via-rose-500/70 to-transparent',
    cornerTL: 'border-amber-300/75',
    cornerBR: 'border-rose-500/70',
  },
  cyan: {
    ring: 'linear-gradient(125deg, #00ffc8, #0d9488, #22d3ee, #00ffc8)',
    outerGlow:
      '0 0 0 1px rgba(0,255,200,0.55), 0 0 0 3px rgba(13,148,136,0.2), 0 0 10px rgba(0,255,200,0.8), 0 0 48px rgba(45,212,191,0.35)',
    innerVeil: 'radial-gradient(95% 120% at 40% -8%, rgba(0,255,200,0.16), transparent 58%)',
    panelFill:
      'linear-gradient(168deg, rgba(4,18,20,0.95) 0%, rgba(2,10,16,0.98) 50%, rgba(3,14,18,0.99) 100%), radial-gradient(ellipse 80% 60% at 10% 0%, rgba(0,255,200,0.07), transparent 48%)',
    insetStrong: 'border-teal-300/55',
    insetSoft: 'border-cyan-200/16',
    hairL: 'from-transparent via-teal-300/88 to-transparent',
    hairR: 'from-transparent via-cyan-400/75 to-transparent',
    cornerTL: 'border-teal-300/85',
    cornerBR: 'border-cyan-400/80',
  },
  violet: {
    ring: 'linear-gradient(125deg, #4c0519, #db2777, #5b21b6, #ff003c, #4c0519)',
    outerGlow:
      '0 0 0 1px rgba(255,0,60,0.55), 0 0 0 3px rgba(88,28,135,0.28), 0 0 12px rgba(219,39,119,0.95), 0 0 52px rgba(124,58,237,0.42), 0 0 100px rgba(127,29,29,0.22)',
    innerVeil: 'radial-gradient(95% 120% at 50% -8%, rgba(190,24,93,0.14), transparent 58%)',
    panelFill:
      'linear-gradient(168deg, rgba(14,4,16,0.95) 0%, rgba(8,2,12,0.98) 45%, rgba(10,4,18,0.99) 100%), radial-gradient(ellipse 75% 55% at 85% 10%, rgba(124,58,237,0.1), transparent 50%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(190,24,93,0.07), transparent 52%)',
    insetStrong: 'border-rose-600/40',
    insetSoft: 'border-violet-950/50',
    hairL: 'from-transparent via-rose-500/75 to-transparent',
    hairR: 'from-transparent via-fuchsia-600/65 to-transparent',
    cornerTL: 'border-rose-500/70',
    cornerBR: 'border-fuchsia-600/65',
  },
  amber: {
    ring: 'linear-gradient(125deg, #facc15, #ff003c, #ea580c, #facc15)',
    outerGlow:
      '0 0 0 1px rgba(254,243,199,0.4), 0 0 0 3px rgba(234,88,12,0.15), 0 0 10px rgba(250,204,21,0.75), 0 0 48px rgba(255,0,60,0.28)',
    innerVeil: 'radial-gradient(95% 120% at 50% -8%, rgba(251,191,36,0.18), transparent 58%)',
    panelFill:
      'linear-gradient(170deg, rgba(16,10,4,0.95) 0%, rgba(10,6,4,0.98) 55%, rgba(12,6,8,0.99) 100%), radial-gradient(ellipse 85% 60% at 50% 0%, rgba(234,88,12,0.08), transparent 50%)',
    insetStrong: 'border-amber-400/52',
    insetSoft: 'border-orange-400/16',
    hairL: 'from-transparent via-amber-300/88 to-transparent',
    hairR: 'from-transparent via-rose-500/72 to-transparent',
    cornerTL: 'border-amber-300/85',
    cornerBR: 'border-orange-500/78',
  },
}

function CyberChamferFrame({
  accent,
  chamfer = 24,
  className,
  innerClassName,
  children,
  decorSize = 'default',
}: {
  accent: CyberFrameAccent
  chamfer?: number
  className?: string
  innerClassName?: string
  children: ReactNode
  decorSize?: 'default' | 'compact'
}) {
  const f = CYBER_FRAME[accent]
  const outerClip = chamferPolygon(chamfer)
  const innerClip = chamferPolygon(Math.max(6, chamfer - 2))
  const compact = decorSize === 'compact'

  return (
    <div
      className={cx('relative overflow-hidden p-[3px]', className)}
      style={{
        background: f.ring,
        backgroundSize: accent === 'separator' ? '200% 100%' : '180% 180%',
        boxShadow: f.outerGlow,
        clipPath: outerClip,
      }}
    >
      <div
        className={cx('relative overflow-hidden backdrop-blur-[2px]', innerClassName)}
        style={{
          clipPath: innerClip,
          background: f.panelFill,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 80px rgba(0,0,0,0.35)',
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.14)_2px,rgba(255,255,255,0.14)_3px)]"
          aria-hidden
        />
        <span className="pointer-events-none absolute inset-0" style={{ background: f.innerVeil }} aria-hidden />
        <span
          className={cx(
            'pointer-events-none absolute border',
            compact ? 'inset-[5px] rounded-[12px]' : 'inset-[8px] rounded-[22px]',
            f.insetStrong,
          )}
          aria-hidden
        />
        <span
          className={cx(
            'pointer-events-none absolute border',
            compact ? 'inset-[9px] rounded-[9px]' : 'inset-[16px] rounded-[16px]',
            f.insetSoft,
          )}
          aria-hidden
        />
        <span
          className={cx(
            'pointer-events-none absolute h-px bg-gradient-to-r',
            compact ? 'left-[8%] top-2 w-[22%]' : 'left-[6%] top-5 w-[24%]',
            f.hairL,
          )}
          aria-hidden
        />
        <span
          className={cx(
            'pointer-events-none absolute h-px bg-gradient-to-r',
            compact ? 'right-[8%] top-2 w-[22%]' : 'right-[6%] top-5 w-[24%]',
            f.hairR,
          )}
          aria-hidden
        />
        <span
          className={cx(
            'pointer-events-none absolute border-l-2 border-t-2',
            compact ? 'left-2 top-2 h-7 w-7' : 'left-5 top-5 h-12 w-12',
            f.cornerTL,
          )}
          aria-hidden
        />
        <span
          className={cx(
            'pointer-events-none absolute border-b-2 border-r-2',
            compact ? 'bottom-2 right-2 h-7 w-7' : 'bottom-5 right-5 h-12 w-12',
            f.cornerBR,
          )}
          aria-hidden
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}

type InsetVariant = 'cyan' | 'violet' | 'amber' | 'toxic' | 'blood' | 'void'

/** Smaller neon inset panel (paragraph / callout). */
function CyberInsetPanel({
  variant,
  className,
  plasmaBar,
  children,
}: {
  variant: InsetVariant
  className?: string
  /** Thick bottom neon rail (void / corroded column). */
  plasmaBar?: boolean
  children: ReactNode
}) {
  const presets: Record<InsetVariant, { ring: string; glow: string; inner: string }> = {
    cyan: {
      ring: 'linear-gradient(135deg, #00ffc8, #0f766e)',
      glow: '0 0 0 1px rgba(0,255,200,0.5), 0 0 12px rgba(0,255,200,0.55), 0 0 32px rgba(13,148,136,0.25)',
      inner:
        'linear-gradient(165deg, rgba(4,22,24,0.96) 0%, rgba(2,12,18,0.99) 55%, rgba(3,16,20,0.99) 100%), radial-gradient(ellipse 90% 70% at 0% 0%, rgba(0,255,200,0.07), transparent 52%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(13,148,136,0.06), transparent 50%)',
    },
    violet: {
      ring: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      glow: '0 0 0 1px rgba(192,132,252,0.42), 0 0 12px rgba(168,85,247,0.5), 0 0 32px rgba(91,33,182,0.22)',
      inner:
        'linear-gradient(165deg, rgba(14,6,22,0.96) 0%, rgba(8,4,16,0.99) 50%, rgba(10,6,24,0.99) 100%), radial-gradient(ellipse 85% 65% at 100% 0%, rgba(139,92,246,0.1), transparent 52%), radial-gradient(ellipse 60% 45% at 0% 100%, rgba(91,33,182,0.07), transparent 48%)',
    },
    amber: {
      ring: 'linear-gradient(135deg, #facc15, #c2410c)',
      glow: '0 0 0 1px rgba(250,204,21,0.48), 0 0 12px rgba(234,88,12,0.55), 0 0 32px rgba(154,52,18,0.22)',
      inner:
        'linear-gradient(165deg, rgba(18,10,4,0.96) 0%, rgba(10,6,4,0.99) 100%), radial-gradient(ellipse 80% 60% at 50% 0%, rgba(234,88,12,0.08), transparent 50%)',
    },
    toxic: {
      ring: 'linear-gradient(135deg, #00ffc8, #022c22)',
      glow: '0 0 0 1px rgba(0,255,200,0.55), 0 0 14px rgba(45,212,191,0.5), 0 0 40px rgba(0,255,200,0.18)',
      inner:
        'linear-gradient(165deg, rgba(2,18,16,0.97) 0%, rgba(0,10,14,0.99) 100%), radial-gradient(ellipse 75% 55% at 15% 15%, rgba(0,255,200,0.08), transparent 50%)',
    },
    blood: {
      ring: 'linear-gradient(135deg, #ff003c, #450a0a)',
      glow: '0 0 0 1px rgba(255,0,60,0.55), 0 0 14px rgba(225,29,72,0.55), 0 0 40px rgba(127,29,29,0.28)',
      inner:
        'linear-gradient(165deg, rgba(22,4,10,0.97) 0%, rgba(12,2,6,0.99) 100%), radial-gradient(ellipse 80% 60% at 80% 0%, rgba(225,29,72,0.1), transparent 52%), radial-gradient(ellipse 55% 40% at 0% 100%, rgba(69,10,10,0.35), transparent 55%)',
    },
    void: {
      ring: 'linear-gradient(135deg, #7c3aed, #db2777, #ea580c)',
      glow: '0 0 0 1px rgba(168,85,247,0.45), 0 0 14px rgba(236,72,153,0.5), 0 0 42px rgba(124,58,237,0.28)',
      inner:
        'linear-gradient(165deg, rgba(12,4,18,0.97) 0%, rgba(6,2,12,0.99) 100%), radial-gradient(ellipse 70% 55% at 90% 20%, rgba(124,58,237,0.11), transparent 50%), radial-gradient(ellipse 55% 50% at 0% 80%, rgba(190,24,93,0.08), transparent 50%)',
    },
  }
  const { ring, glow, inner } = presets[variant]
  const clip = chamferPolygon(12)

  return (
    <div
      className={cx('relative p-[2px]', className)}
      style={{
        background: ring,
        boxShadow: glow,
        clipPath: clip,
      }}
    >
      <div
        className={cx('relative p-5 sm:p-6', plasmaBar && 'pb-8')}
        style={{
          clipPath: chamferPolygon(10),
          background: inner,
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 36px rgba(0,0,0,0.32), inset 0 -20px 48px rgba(0,0,0,0.15)',
        }}
      >
        <span
          className="pointer-events-none absolute left-2 top-2 h-6 w-6 border-l border-t border-white/15"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-2 right-2 h-6 w-6 border-b border-r border-white/12"
          aria-hidden
        />
        {plasmaBar ? (
          <span
            className="pointer-events-none absolute bottom-0 left-[6%] right-[6%] h-2 rounded-sm bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-600"
            style={{ boxShadow: '0 0 18px rgba(168,85,247,0.65), 0 0 36px rgba(225,29,72,0.35)' }}
            aria-hidden
          />
        ) : null}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}

type MethodBlock = {
  id: string
  title: string
  summary: string
  paragraphs: [string, string]
  image: string
  imageAlt: string
  accent: 'cyan' | 'violet' | 'amber'
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
    image: '/assets/pawn2.png',
    imageAlt: 'Dystopian operator portrait',
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
    image: '/assets/pawn.png',
    imageAlt: 'Syndicate resistance figure',
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
    image: '/assets/pawn1.png',
    imageAlt: 'Neon chess warrior',
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
  const accentStyles: Record<MethodBlock['accent'], { title: string }> = {
    cyan: {
      title: 'text-cyan-100',
    },
    violet: {
      title: 'text-fuchsia-200/90',
    },
    amber: {
      title: 'text-amber-100',
    },
  }

  const frameAccent = (accent: MethodBlock['accent']): CyberFrameAccent =>
    accent === 'cyan' ? 'cyan' : accent === 'violet' ? 'violet' : 'amber'

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-clip bg-[#04060c]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assets/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute left-[-10%] top-[8%] h-[400px] w-[400px] rounded-full bg-cyan-400/18 blur-[140px]" />
        <div className="absolute right-[-12%] top-[14%] h-[440px] w-[440px] rounded-full bg-violet-500/20 blur-[150px]" />
        <div className="absolute left-[36%] top-[54%] h-[500px] w-[500px] rounded-full bg-rose-500/10 blur-[160px]" />
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
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/membership" prefetch className="cta-nav-button text-sm font-semibold">
                    Join Now
                  </Link>
                  <Link href="/programs" prefetch className="cta-nav-button text-sm font-semibold">
                    View Programs
                  </Link>
                  <Link href="/quiz" prefetch className="cta-nav-button text-sm font-semibold">
                    Syn Diagnosis
                  </Link>
                </div>
              </div>
              <div className="grid gap-4">
                <CyberChamferFrame accent="video" chamfer={18} decorSize="compact" innerClassName="p-2">
                  <video
                    className="relative z-10 h-[360px] w-full object-cover sm:h-[440px] lg:h-[500px]"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/assets/video.mp4" type="video/mp4" />
                  </video>
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
            <h2 className="mt-2 text-[clamp(2rem,4.2vw,3.4rem)] font-black uppercase tracking-[0.08em] text-amber-100">
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

      <section className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-14 sm:pb-20">
        <div className="mx-auto max-w-[96rem]">
          <div className="space-y-7">
            {METHOD_BLOCKS.map((block) => {
              const isPrimary = block.id === 'greatness'
              const isMoneyPower = block.id === 'money-power'
              const isBreakFree = block.id === 'break-free'
              const accentKey = frameAccent(block.accent)

              return isBreakFree ? (
                <CyberChamferFrame
                  key={block.id}
                  accent="amber"
                  chamfer={20}
                  className="mx-auto w-full max-w-[86rem]"
                  innerClassName="px-6 py-10 text-center sm:px-10 sm:py-12"
                >
                  <h3 className={`mt-1 text-[clamp(2.4rem,4.6vw,4.2rem)] font-black leading-[1] ${accentStyles[block.accent].title}`}>
                    {block.title}
                  </h3>
                  <p className="mx-auto mt-4 max-w-[62rem] text-xl leading-relaxed text-zinc-100/88 sm:text-2xl">
                    {block.summary}
                  </p>
                  <p className="mx-auto mt-6 max-w-[62rem] text-lg leading-relaxed text-zinc-100/90 sm:text-xl">
                    {block.paragraphs[0]}
                  </p>
                  <p className="mx-auto mt-4 max-w-[62rem] text-lg leading-relaxed text-zinc-100/90 sm:text-xl">
                    {block.paragraphs[1]}
                  </p>
                  <p className="mx-auto mt-6 max-w-[62rem] text-base font-semibold uppercase tracking-[0.14em] text-cyan-100/90 sm:text-lg">
                    Master yourself. Master the system.
                  </p>
                  <div className="mt-7">
                    <Link href="/membership" prefetch className="cta-nav-button text-sm font-semibold">
                      Enter This Track
                    </Link>
                  </div>
                </CyberChamferFrame>
              ) : (
                <div
                  key={block.id}
                  className={isPrimary ? 'grid items-start gap-4 lg:grid-cols-[1fr_240px]' : 'grid items-start'}
                >
                  <CyberChamferFrame
                    accent={accentKey}
                    chamfer={22}
                    className={cx(isMoneyPower && 'min-h-[430px]')}
                    innerClassName={cx('p-6 sm:p-8', isMoneyPower && 'text-center')}
                  >
                    <div>
                      {isMoneyPower ? (
                        <div className="mb-2">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-rose-400/85 sm:text-[11px]">
                            Vault channel // power doctrine
                          </p>
                          <h3
                            className="mx-auto mt-3 max-w-[22ch] text-balance text-[clamp(2.1rem,4vw,3.6rem)] font-black uppercase leading-[0.95] tracking-[0.06em] text-zinc-50"
                            style={{
                              textShadow:
                                '0 0 18px rgba(251,113,133,0.95), 0 0 36px rgba(244,114,182,0.75), 0 0 56px rgba(168,85,247,0.45), 0 0 2px rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.85)',
                            }}
                          >
                            {block.title}
                          </h3>
                        </div>
                      ) : (
                        <h3 className={`text-[clamp(2.4rem,4.6vw,4.2rem)] font-black leading-[1] ${accentStyles[block.accent].title}`}>
                          {block.title}
                        </h3>
                      )}
                      {isMoneyPower ? (
                        <CyberInsetPanel variant="blood" className="mt-5 text-left">
                          <p className="text-xl leading-relaxed text-zinc-100/90 sm:text-2xl">{block.summary}</p>
                        </CyberInsetPanel>
                      ) : (
                        <p className="mt-3 text-xl leading-relaxed text-zinc-100/88 sm:text-2xl">{block.summary}</p>
                      )}

                      <div
                        className={cx(
                          'mt-6',
                          isPrimary
                            ? 'space-y-3'
                            : 'grid gap-4 md:grid-cols-[1.15fr_1fr] md:items-stretch',
                        )}
                      >
                        <CyberInsetPanel
                          variant={isMoneyPower ? 'toxic' : 'cyan'}
                          className={cx(isMoneyPower && 'min-h-[170px]')}
                        >
                          <p className="text-lg leading-relaxed text-zinc-100/90 sm:text-xl">{block.paragraphs[0]}</p>
                        </CyberInsetPanel>
                        <CyberInsetPanel
                          variant={isMoneyPower ? 'void' : 'violet'}
                          plasmaBar={isMoneyPower}
                          className={cx(isMoneyPower && 'min-h-[170px]')}
                        >
                          <p className="text-lg leading-relaxed text-zinc-100/90 sm:text-xl">{block.paragraphs[1]}</p>
                        </CyberInsetPanel>
                      </div>

                      <div className="mt-6">
                        <Link href="/membership" prefetch className="cta-nav-button text-sm font-semibold">
                          Enter This Track
                        </Link>
                      </div>
                    </div>
                  </CyberChamferFrame>

                  {isPrimary ? (
                    <div className="mx-auto mt-3 w-full max-w-[150px] justify-self-center self-center sm:max-w-[185px] md:mx-0 md:mt-0 md:max-w-[220px] md:justify-self-end">
                      <Image
                        src="/assets/Gold-Key.png"
                        alt="Gold key symbol"
                        width={560}
                        height={760}
                        className="h-[210px] w-full object-contain object-center animate-bounce [animation-duration:4.5s] [animation-timing-function:ease-in-out] sm:h-[260px] md:h-[360px]"
                      />
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <GlobalBottomSections />
    </div>
  )
}

