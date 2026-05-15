import type { ReactNode } from 'react'

/** Server-safe class merge (avoid client-only `cn` on RSC pages). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function chamferPolygon(px: number) {
  return `polygon(${px}px 0,calc(100% - ${px}px) 0,100% ${px}px,100% calc(100% - ${px}px),calc(100% - ${px}px) 100%,${px}px 100%,0 calc(100% - ${px}px),0 ${px}px)`
}

export type CyberFrameAccent = 'hero' | 'video' | 'separator' | 'cyan' | 'violet' | 'amber'

const CYBER_FRAME: Record<
  CyberFrameAccent,
  {
    ring: string
    outerGlow: string
    innerVeil: string
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

export function CyberChamferFrame({
  accent,
  chamfer = 24,
  className,
  innerClassName,
  children,
  decorSize = 'default',
  /** Outer gradient ring thickness (Tailwind padding on the ring layer). Default matches legacy frames. */
  ringPaddingClass = 'p-[3px]',
  /** No gradient rail / outer glow; inner panel fills the chamfer (e.g. affiliate hero). */
  hideOuterRing = false,
}: {
  accent: CyberFrameAccent
  chamfer?: number
  className?: string
  innerClassName?: string
  children: ReactNode
  decorSize?: 'default' | 'compact'
  ringPaddingClass?: string
  hideOuterRing?: boolean
}) {
  const f = CYBER_FRAME[accent]
  const outerClip = chamferPolygon(chamfer)
  const innerClip = hideOuterRing ? outerClip : chamferPolygon(Math.max(6, chamfer - 2))
  const compact = decorSize === 'compact'
  const outerPad = hideOuterRing ? 'p-0' : ringPaddingClass

  return (
    <div
      className={cx('relative overflow-hidden', outerPad, className)}
      style={
        hideOuterRing
          ? { clipPath: outerClip, background: 'transparent', boxShadow: 'none' }
          : {
              background: f.ring,
              backgroundSize: accent === 'separator' ? '200% 100%' : '180% 180%',
              boxShadow: f.outerGlow,
              clipPath: outerClip,
            }
      }
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

export type InsetVariant = 'cyan' | 'violet' | 'amber' | 'toxic' | 'blood' | 'void'

export function CyberInsetPanel({
  variant,
  className,
  plasmaBar,
  children,
}: {
  variant: InsetVariant
  className?: string
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
