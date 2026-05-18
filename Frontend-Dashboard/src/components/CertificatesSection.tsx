'use client'

import { useId, useState } from 'react'
import { Download } from 'lucide-react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'

type Feature = {
  title: string
  description: string
  icon: 'award' | 'shield' | 'check'
}

type CertificatesSectionProps = {
  features?: Feature[]
}

const DEFAULT_FEATURES: Feature[] = [
  {
    icon: 'award',
    title: 'Verified Credentials',
    description: 'Blockchain-verified certificates recognized across the syndicate network and industry partners.',
  },
  {
    icon: 'shield',
    title: 'Secure & Tamper-Proof',
    description: 'Each certificate is cryptographically signed and permanently stored. No forgeries, no doubts.',
  },
  {
    icon: 'check',
    title: 'Industry Recognition',
    description: 'Our certifications are valued by employers and partners. Stand out with credentials that matter.',
  },
]


/** HUD icons with orbital ring + core (SMIL motion; `motion-reduce` friendly). */
function GamingFeatureIcon({ icon }: { icon: Feature['icon'] }) {
  const uid = useId().replace(/:/g, '')
  const orbitDur = icon === 'award' ? '9s' : icon === 'shield' ? '11s' : '13s'
  const orbitFrom = '0 16 16'
  const orbitTo = icon === 'shield' ? '-360 16 16' : '360 16 16'
  const ringStroke =
    icon === 'award' ? 'rgba(34,211,238,0.55)' : icon === 'shield' ? 'rgba(251,113,133,0.55)' : 'rgba(167,139,250,0.55)'
  const pulseDur = icon === 'shield' ? '1.6s' : icon === 'check' ? '2.2s' : '2.6s'
  const g = 'drop-shadow(0 0 6px rgba(251,113,133,0.9))'
  const c = 'drop-shadow(0 0 6px rgba(34,211,238,0.95))'
  const v = 'drop-shadow(0 0 6px rgba(167,139,250,0.95))'
  const filter = icon === 'award' ? c : icon === 'shield' ? g : v

  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden>
      <defs>
        <linearGradient id={`gf-grad-a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <g className="motion-reduce:hidden">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={orbitFrom}
          to={orbitTo}
          dur={orbitDur}
          repeatCount="indefinite"
        />
        <circle cx="16" cy="16" r="12.5" fill="none" stroke={ringStroke} strokeWidth="1.25" strokeDasharray="3.5 5.5" />
        <circle cx="16" cy="16" r="10" fill="none" stroke={ringStroke} strokeWidth="0.9" strokeDasharray="1.5 8" opacity="0.45" />
      </g>
      <g style={{ filter }}>
        <animate attributeName="opacity" values="1;0.7;1" dur={pulseDur} repeatCount="indefinite" />
        {icon === 'award' ? (
          <>
            <path
              fill="none"
              stroke={`url(#gf-grad-a-${uid})`}
              strokeWidth="2"
              d="M16 3L20 9h6l-4 5 1 7-7-3-7 3 1-7-4-5h6z"
            />
            <path fill="#22d3ee" fillOpacity="0.35" d="M12 14h8l-1 8-3-2-3 2z" />
            <path fill="none" stroke="#67e8f9" strokeWidth="1.2" d="M10 22h12M16 18v6" />
          </>
        ) : icon === 'shield' ? (
          <>
            <path fill="none" stroke="#fb7185" strokeWidth="2" d="M16 4l9 4v9c0 5-4 9-9 11-5-2-9-6-9-11V8z" />
            <path fill="none" stroke="#fda4af" strokeWidth="1.2" d="M16 9v11M11 14h10M11 19h10" />
            <circle cx="16" cy="22" r="2" fill="#f472b6" />
          </>
        ) : (
          <>
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="16s" repeatCount="indefinite" />
              <path fill="none" stroke="#c4b5fd" strokeWidth="1.2" strokeOpacity="0.5" d="M6 16l10-10 10 10-10 10z" />
            </g>
            <path fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="square" d="M11 16l4 4 7-8" />
            <path fill="#7c3aed" fillOpacity="0.35" d="M14 14h4v4h-4z" />
          </>
        )}
      </g>
    </svg>
  )
}

/** Per-card neon so the stack reads like different HUD channels, not one corporate skin. */
const FEATURE_NEON = [
  {
    ring: 'linear-gradient(128deg, #22d3ee 0%, #67e8f9 38%, #06b6d4 72%, #0891b2 100%)',
    outerShadow:
      '0 0 2px rgba(34,211,238,0.9), 0 0 48px rgba(34,211,238,0.55), 0 0 96px rgba(6,182,212,0.28), inset 0 0 0 1px rgba(103,232,249,0.35)',
    innerStroke: 'rgba(34,211,238,0.72)',
    innerStrokeShadow: '0 0 22px rgba(34,211,238,0.45), inset 0 0 20px rgba(6,182,212,0.12)',
    rail: 'linear-gradient(90deg, rgba(34,211,238,1), rgba(103,232,249,0.95), rgba(34,211,238,1))',
    corners: ['rgba(103,232,249,0.95)', 'rgba(34,211,238,0.85)', 'rgba(6,182,212,0.9)', 'rgba(165,243,252,0.88)'] as const,
    hexBorder: 'rgba(56,189,248,0.98)',
    hexShadow: '0 0 26px rgba(34,211,238,0.7), inset 0 0 18px rgba(34,211,238,0.22)',
    hexBg: 'linear-gradient(155deg, rgba(2,12,22,0.98), rgba(4,8,18,0.99))',
    titleShadow: '0 0 22px rgba(34,211,238,0.55), 0 0 6px rgba(0,0,0,1)',
    panelBg: 'linear-gradient(145deg, rgba(2,8,18,0.97) 0%, rgba(4,12,24,0.96) 48%, rgba(2,6,14,0.98) 100%)',
    panelInset: 'inset 0 0 0 1px rgba(34,211,238,0.28), 0 18px 40px rgba(0,0,0,0.88)',
    wash1: 'radial-gradient(125% 115% at 10% 18%, rgba(34,211,238,0.28), transparent 46%)',
    wash2: 'radial-gradient(130% 120% at 90% 82%, rgba(6,182,212,0.18), transparent 52%)',
    sweep: 'linear-gradient(102deg, transparent 14%, rgba(34,211,238,0.16) 42%, rgba(103,232,249,0.12) 58%, transparent 82%)',
    desc: 'text-cyan-100/75',
  },
  {
    ring: 'linear-gradient(132deg, #fb7185 0%, #f472b6 40%, #db2777 70%, #9d174d 100%)',
    outerShadow:
      '0 0 2px rgba(244,114,182,0.95), 0 0 52px rgba(244,114,182,0.5), 0 0 100px rgba(219,39,119,0.32), inset 0 0 0 1px rgba(251,113,133,0.4)',
    innerStroke: 'rgba(244,114,182,0.78)',
    innerStrokeShadow: '0 0 26px rgba(244,114,182,0.5), inset 0 0 22px rgba(157,23,77,0.14)',
    rail: 'linear-gradient(90deg, rgba(251,113,133,1), rgba(244,114,182,0.95), rgba(219,39,119,0.98))',
    corners: ['rgba(251,113,133,0.95)', 'rgba(244,63,94,0.88)', 'rgba(219,39,119,0.9)', 'rgba(251,182,206,0.85)'] as const,
    hexBorder: 'rgba(251,113,133,0.98)',
    hexShadow: '0 0 28px rgba(251,113,133,0.65), inset 0 0 18px rgba(219,39,119,0.25)',
    hexBg: 'linear-gradient(155deg, rgba(24,4,14,0.98), rgba(8,4,16,0.99))',
    titleShadow: '0 0 22px rgba(251,113,133,0.5), 0 0 6px rgba(0,0,0,1)',
    panelBg: 'linear-gradient(145deg, rgba(18,4,12,0.97) 0%, rgba(12,4,18,0.96) 50%, rgba(10,2,14,0.98) 100%)',
    panelInset: 'inset 0 0 0 1px rgba(244,114,182,0.26), 0 18px 40px rgba(0,0,0,0.88)',
    wash1: 'radial-gradient(125% 115% at 12% 20%, rgba(251,113,133,0.26), transparent 46%)',
    wash2: 'radial-gradient(130% 120% at 88% 80%, rgba(219,39,119,0.2), transparent 52%)',
    sweep: 'linear-gradient(102deg, transparent 14%, rgba(251,113,133,0.14) 42%, rgba(244,63,94,0.12) 58%, transparent 82%)',
    desc: 'text-rose-100/78',
  },
  {
    ring: 'linear-gradient(135deg, #a78bfa 0%, #c026d3 42%, #84cc16 78%, #22d3ee 100%)',
    outerShadow:
      '0 0 2px rgba(192,38,211,0.85), 0 0 48px rgba(163,230,53,0.35), 0 0 96px rgba(168,85,247,0.38), inset 0 0 0 1px rgba(167,139,250,0.35)',
    innerStroke: 'rgba(192,38,211,0.65)',
    innerStrokeShadow: '0 0 28px rgba(132,204,22,0.35), 0 0 20px rgba(168,85,247,0.35), inset 0 0 24px rgba(88,28,135,0.18)',
    rail: 'linear-gradient(90deg, rgba(163,230,53,0.95), rgba(192,38,211,0.95), rgba(167,139,250,0.95))',
    corners: ['rgba(192,38,211,0.92)', 'rgba(163,230,53,0.88)', 'rgba(167,139,250,0.9)', 'rgba(34,211,238,0.75)'] as const,
    hexBorder: 'rgba(192,38,211,0.95)',
    hexShadow: '0 0 28px rgba(163,230,53,0.45), 0 0 20px rgba(192,38,211,0.45), inset 0 0 16px rgba(88,28,135,0.2)',
    hexBg: 'linear-gradient(155deg, rgba(12,6,24,0.98), rgba(4,10,8,0.99))',
    titleShadow: '0 0 20px rgba(192,38,211,0.45), 0 0 14px rgba(163,230,53,0.35), 0 0 6px rgba(0,0,0,1)',
    panelBg: 'linear-gradient(145deg, rgba(10,6,22,0.97) 0%, rgba(6,14,10,0.96) 52%, rgba(8,4,18,0.98) 100%)',
    panelInset: 'inset 0 0 0 1px rgba(163,230,53,0.2), 0 18px 40px rgba(0,0,0,0.88)',
    wash1: 'radial-gradient(125% 115% at 10% 22%, rgba(163,230,53,0.18), transparent 48%)',
    wash2: 'radial-gradient(130% 120% at 88% 78%, rgba(192,38,211,0.2), transparent 52%)',
    sweep: 'linear-gradient(102deg, transparent 12%, rgba(192,38,211,0.12) 44%, rgba(163,230,53,0.1) 56%, transparent 84%)',
    desc: 'text-violet-100/78',
  },
] as const

const buildCertificateId = () =>
  `SYN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

export default function CertificatesSection({
  features = DEFAULT_FEATURES,
}: CertificatesSectionProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [certificateId, setCertificateId] = useState(() => buildCertificateId())
  const [issuedOn, setIssuedOn] = useState(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  )
  const [verifyTokenId, setVerifyTokenId] = useState('')
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const verifyUrl = `https://nexus.syndicate/verify?certificate=${encodeURIComponent(certificateId)}`

  const openPreview = () => {
    setCertificateId(buildCertificateId())
    setIssuedOn(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
    setIsPreviewOpen(true)
  }

  const submitVerifyToken = async () => {
    const token = verifyTokenId.trim().toUpperCase()
    if (!token) {
      setVerifyOk(false)
      setVerifyMessage('Please enter your token ID.')
      return
    }
    setVerifyLoading(true)
    setVerifyMessage(null)
    setVerifyOk(null)
    try {
      const res = await fetch('/api/courses/certificates/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: token }),
      })
      const payload = (await res.json().catch(() => ({}))) as {
        verified?: boolean
        message?: string
      }
      const verified = Boolean(payload.verified)
      setVerifyOk(verified)
      setVerifyMessage(payload.message || (verified ? 'You are Syndicate Certified' : 'You are not Syndicate Certified'))
    } catch {
      setVerifyOk(false)
      setVerifyMessage('Verification service is unavailable. Try again.')
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <section
      id="certificates"
      aria-label="Certificates section"
      className="relative w-full overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/assets/c.gif"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover opacity-30"
          unoptimized
          loading="eager"
          fetchPriority="low"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[540px] w-[960px] -translate-x-1/2 -translate-y-1/2 blur-[140px] opacity-75"
        style={{
          background: 'radial-gradient(ellipse 80% 70%, rgba(34,211,238,0.22) 0%, rgba(168,85,247,0.2) 46%, rgba(0,0,0,0) 78%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.2) 1px, transparent 1px), linear-gradient(rgba(168,85,247,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.15) 1px, transparent 1px)',
          backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.74) 100%), linear-gradient(180deg, rgba(34,211,238,0.08) 0%, transparent 20%, transparent 78%, rgba(168,85,247,0.1) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <header className="mb-16 text-center">
          <h2 className="font-heading programs-heading-glow text-3xl font-bold uppercase tracking-[0.12em] text-white sm:text-4xl md:text-5xl md:tracking-[0.14em] lg:text-6xl">
            Become Syndicate Certified
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-xs font-semibold uppercase leading-relaxed tracking-[0.08em] text-cyan-100/85 sm:text-sm">
            Proof you ran the material — cryptographically signed credentials, not a participation sticker. Stack the
            courses, claim the seal, verify it in the open. Operators only.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="relative lg:col-span-6">
            <div
              className="pointer-events-none absolute -inset-4 opacity-90 blur-3xl sm:-inset-6"
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(34,211,238,0.45) 0%, transparent 55%), radial-gradient(ellipse 65% 55% at 78% 85%, rgba(217,70,239,0.42) 0%, transparent 52%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(251,191,36,0.12) 0%, transparent 60%)',
              }}
            />
            <div
              className="relative border-[6px] p-6 sm:p-8 [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]"
              style={{
                borderColor: 'rgba(34,211,238,0.95)',
                background: 'linear-gradient(145deg, rgba(8,10,24,0.96) 0%, rgba(5,4,16,0.98) 52%, rgba(10,8,22,0.98) 100%)',
                boxShadow:
                  'inset 0 0 0 2px rgba(217,70,239,0.72), inset 0 0 0 6px rgba(34,211,238,0.32), 0 0 4px rgba(34,211,238,0.95), 0 0 100px rgba(34,211,238,0.52), 0 0 160px rgba(168,85,247,0.38), 0 0 88px rgba(217,70,239,0.35), 0 0 48px rgba(251,191,36,0.12)',
              }}
            >
              <div
                className="pointer-events-none absolute inset-[8px] border-[3px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                style={{
                  borderColor: 'rgba(217,70,239,0.92)',
                  boxShadow: '0 0 20px rgba(34,211,238,0.52), inset 0 0 16px rgba(168,85,247,0.34)',
                }}
              />
              <div className="pointer-events-none absolute inset-0 opacity-100 [background:linear-gradient(90deg,rgba(34,211,238,0.98),rgba(217,70,239,0.92),rgba(168,85,247,0.95))] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0,rgba(0,0,0,1)_6px,transparent_6px,transparent_calc(100%-6px),rgba(0,0,0,1)_calc(100%-6px),rgba(0,0,0,1)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[6px] opacity-100 [background:linear-gradient(90deg,transparent_0%,rgba(34,211,238,1)_20%,rgba(217,70,239,1)_52%,rgba(168,85,247,1)_80%,transparent_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px] opacity-95 [background:linear-gradient(90deg,transparent_0%,rgba(168,85,247,1)_22%,rgba(217,70,239,1)_52%,rgba(34,211,238,1)_78%,transparent_100%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(140%_120%_at_15%_15%,rgba(34,211,238,0.22),transparent_48%),radial-gradient(140%_120%_at_86%_84%,rgba(217,70,239,0.16),transparent_52%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-28 [background:linear-gradient(110deg,transparent_20%,rgba(168,85,247,0.16)_42%,rgba(34,211,238,0.14)_58%,transparent_78%)]" />
              <button
                type="button"
                onClick={openPreview}
                aria-label="Open Syndicate certificate preview"
                className="relative flex min-h-[320px] w-full flex-col items-center justify-center overflow-hidden bg-[#050510] sm:min-h-[420px] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]"
                style={{
                  border: '3px solid rgba(34,211,238,0.82)',
                  boxShadow:
                    'inset 0 0 60px rgba(167,139,250,0.22), inset 0 0 120px rgba(6,182,212,0.08), 0 0 3px rgba(34,211,238,0.9), 0 0 56px rgba(34,211,238,0.42), 0 0 100px rgba(217,70,239,0.18)',
                }}
              >
                <div className="relative z-[2] flex w-full flex-col items-center justify-center px-6 py-8 text-center sm:px-8 sm:py-10">
                  <div
                    className="relative mb-8 flex h-52 w-52 items-center justify-center sm:mb-10 sm:h-60 sm:w-60"
                    style={{ background: 'transparent', boxShadow: 'none' }}
                  >
                    <div className="pointer-events-none absolute h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(253,208,47,0.42)_0%,rgba(253,208,47,0.18)_42%,transparent_75%)] blur-[18px] sm:h-56 sm:w-56" />
                    <Image
                      src="/assets/coin-gold.png"
                      alt=""
                      width={220}
                      height={220}
                      sizes="(max-width: 640px) 176px, 224px"
                      className="relative z-[1] h-[78%] w-[78%] object-contain drop-shadow-[0_0_22px_rgba(251,191,36,0.75)] sm:h-[80%] sm:w-[80%]"
                      loading="eager"
                      fetchPriority="low"
                      decoding="async"
                    />
                  </div>
                  <div className="w-full max-w-[420px]">
                    <div className="mt-1 flex w-full items-center justify-center gap-2 border-2 py-3 font-mono text-sm tracking-[0.12em] text-cyan-200 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                      style={{
                        borderColor: 'rgba(56,189,248,0.85)',
                        textShadow: '0 0 16px rgba(34,211,238,0.65), 0 0 32px rgba(34,211,238,0.25)',
                        boxShadow: '0 0 40px rgba(34,211,238,0.35), inset 0 0 20px rgba(34,211,238,0.08)',
                        background: 'linear-gradient(180deg, rgba(8,24,36,0.5), rgba(4,8,20,0.65))',
                      }}
                    >
                      <Download className="h-4 w-4 shrink-0 motion-safe:animate-hud-bob motion-reduce:animate-none" />
                      Preview Sample
                    </div>
                  </div>
                </div>
                <div
                  className="pointer-events-none absolute inset-0 z-[1] opacity-30"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, transparent 50%, rgba(167,139,250,0.1) 100%)' }}
                />
              </button>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-6 lg:pt-2">
            <div
              className="relative overflow-hidden p-[3px] [clip-path:polygon(0_0,calc(100%-20px)_0,100%_20px,100%_100%,20px_100%,0_calc(100%-20px))]"
              style={{
                background: 'linear-gradient(145deg, rgba(251,191,36,0.95) 0%, rgba(234,88,12,0.9) 45%, rgba(185,28,28,0.85) 100%)',
                boxShadow:
                  '0 0 3px rgba(251,191,36,0.95), 0 0 48px rgba(245,158,11,0.45), 0 0 96px rgba(234,88,12,0.22), inset 0 0 0 1px rgba(254,243,199,0.25)',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.14]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(-12deg, transparent 0px, transparent 6px, rgba(0,0,0,0.55) 6px, rgba(0,0,0,0.55) 8px)',
                }}
              />
              <div
                className="relative overflow-hidden px-4 py-3 sm:px-5 sm:py-4 [clip-path:polygon(0_0,calc(100%-19px)_0,100%_19px,100%_100%,19px_100%,0_calc(100%-19px))]"
                style={{
                  background: 'linear-gradient(168deg, rgba(14,6,2,0.98) 0%, rgba(8,4,12,0.97) 42%, rgba(12,4,8,0.98) 100%)',
                  boxShadow: 'inset 0 0 48px rgba(245,158,11,0.06), inset 0 0 0 1px rgba(251,191,36,0.15)',
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-50"
                  style={{
                    background:
                      'radial-gradient(ellipse 90% 70% at 10% 0%, rgba(251,191,36,0.12), transparent 50%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(220,38,38,0.12), transparent 45%)',
                  }}
                />
                <div className="relative">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-200/90 sm:text-[10px]" style={{ textShadow: '0 0 12px rgba(251,191,36,0.55)' }}>
                    // breach_gate · live
                  </p>
                  <h3 className="mt-1 text-base font-bold uppercase tracking-[0.08em] text-amber-50 sm:text-lg" style={{ textShadow: '0 0 20px rgba(251,191,36,0.45), 0 0 40px rgba(234,88,12,0.2)' }}>
                    Verify your token ID
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] leading-snug text-amber-100/65 sm:text-xs">
                    Enter your certificate token to confirm certification status.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      type="text"
                      value={verifyTokenId}
                      onChange={(e) => setVerifyTokenId(e.target.value.toUpperCase())}
                      placeholder="SYN-XXXX-XXXX-XXXX"
                      className="w-full border-2 border-amber-500/45 bg-black/55 px-3 py-2 font-mono text-xs tracking-[0.1em] text-amber-100 outline-none transition [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)] focus:border-amber-400/90 focus:shadow-[0_0_24px_rgba(251,191,36,0.35)] sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={submitVerifyToken}
                      disabled={verifyLoading}
                      className="shrink-0 border-2 border-red-500/70 bg-red-950/40 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-red-100 transition [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)] hover:bg-red-900/50 hover:shadow-[0_0_28px_rgba(239,68,68,0.45)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                      style={{ textShadow: '0 0 14px rgba(248,113,113,0.55)' }}
                    >
                      {verifyLoading ? 'Checking...' : 'Submit'}
                    </button>
                  </div>
                  {verifyMessage ? (
                    <p className={`mt-2 font-mono text-xs sm:text-sm ${verifyOk ? 'text-lime-300 drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]' : 'text-red-300 drop-shadow-[0_0_10px_rgba(248,113,113,0.45)]'}`}>{verifyMessage}</p>
                  ) : null}
                </div>
              </div>
            </div>
            {features.map((feature, i) => {
              const neon = FEATURE_NEON[i % FEATURE_NEON.length]
              return (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-[4px] p-[3px]"
                style={{
                  background: neon.ring,
                  boxShadow: neon.outerShadow,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-[8px] rounded-[2px] border-2 opacity-95"
                  style={{
                    borderColor: neon.innerStroke,
                    boxShadow: neon.innerStrokeShadow,
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-[4px] opacity-100 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0,rgba(0,0,0,1)_4px,transparent_4px,transparent_calc(100%-4px),rgba(0,0,0,1)_calc(100%-4px),rgba(0,0,0,1)_100%)]"
                  style={{ background: neon.rail }}
                />
                <div className="pointer-events-none absolute left-3 top-3 h-5 w-5 rounded-tl-[2px] border-l-2 border-t-2" style={{ borderColor: neon.corners[0] }} />
                <div className="pointer-events-none absolute right-3 top-3 h-5 w-5 rounded-tr-[2px] border-r-2 border-t-2" style={{ borderColor: neon.corners[1] }} />
                <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 rounded-bl-[2px] border-b-2 border-l-2" style={{ borderColor: neon.corners[2] }} />
                <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 rounded-br-[2px] border-b-2 border-r-2" style={{ borderColor: neon.corners[3] }} />
                <div
                  className="relative flex items-start gap-4 p-5 sm:gap-5 sm:p-6 [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]"
                  style={{ background: neon.panelBg, boxShadow: neon.panelInset }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-80 [clip-path:inherit]" style={{ background: `${neon.wash1}, ${neon.wash2}` }} />
                  <div className="pointer-events-none absolute inset-0 opacity-35 [clip-path:inherit]" style={{ background: neon.sweep }} />
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 sm:h-14 sm:w-14 [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]"
                    style={{
                      borderColor: neon.hexBorder,
                      boxShadow: neon.hexShadow,
                      background: neon.hexBg,
                    }}
                  >
                    <GamingFeatureIcon icon={feature.icon} />
                  </div>
                  <div className="relative min-w-0">
                    <h3 className="mb-1.5 text-base font-bold uppercase tracking-[0.06em] text-slate-50 sm:text-lg" style={{ textShadow: neon.titleShadow }}>
                      {feature.title}
                    </h3>
                    <p className={`font-mono text-sm leading-snug sm:text-[15px] ${neon.desc}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>

      </div>
      {isPreviewOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-transparent p-4 backdrop-blur-sm"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[95vh] w-full max-w-[980px] overflow-y-auto bg-transparent p-1 sm:p-2"
            style={{
              boxShadow: '0 0 90px rgba(217,70,239,0.25), 0 0 130px rgba(56,189,248,0.18)',
            }}
          >
              <div className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'linear-gradient(rgba(217,70,239,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.24) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
              <div className="pointer-events-none absolute inset-0 opacity-[0.22]" style={{ background: 'radial-gradient(circle at 24% 12%, rgba(217,70,239,0.26), transparent 42%), radial-gradient(circle at 80% 86%, rgba(56,189,248,0.18), transparent 46%)' }} />

              <div className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[22px] border border-cyan-200/90 bg-[#070a1a] p-3 sm:p-5 shadow-[0_0_0_1px_rgba(56,189,248,0.9),0_0_22px_rgba(56,189,248,0.86),0_0_56px_rgba(56,189,248,0.72),0_0_108px_rgba(56,189,248,0.56),inset_0_0_20px_rgba(56,189,248,0.27)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(59,130,246,0.45),transparent_34%),radial-gradient(circle_at_80%_22%,rgba(249,115,22,0.22),transparent_35%),radial-gradient(circle_at_20%_78%,rgba(236,72,153,0.2),transparent_38%),linear-gradient(180deg,#070a1a_0%,#0c1130_45%,#111735_100%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.32)_1px,transparent_1px)] [background-size:4px_4px]" />
                <div className="pointer-events-none absolute inset-[8px] rounded-[18px] border border-cyan-200/95 shadow-[0_0_0_1px_rgba(56,189,248,0.9),0_0_22px_rgba(56,189,248,0.86),0_0_56px_rgba(56,189,248,0.72),0_0_108px_rgba(56,189,248,0.56),inset_0_0_20px_rgba(56,189,248,0.27)]" />
                <div className="pointer-events-none absolute inset-[18px] rounded-[12px] border border-cyan-300/75 shadow-[inset_0_0_16px_rgba(56,189,248,0.25)]" />
                <div className="pointer-events-none absolute left-[20px] top-[20px] h-12 w-12 border-l-2 border-t-2 border-red-400/90" />
                <div className="pointer-events-none absolute right-[20px] top-[20px] h-12 w-12 border-r-2 border-t-2 border-red-400/90" />
                <div className="pointer-events-none absolute bottom-[20px] left-[20px] h-12 w-12 border-b-2 border-l-2 border-red-400/90" />
                <div className="pointer-events-none absolute bottom-[20px] right-[20px] h-12 w-12 border-b-2 border-r-2 border-red-400/90" />

                <div className="relative z-10 flex flex-col px-2 pb-2 pt-3 text-cyan-100 sm:px-3 sm:pb-3 sm:pt-4">
                  <div className="mt-2 ml-2 flex flex-wrap items-center gap-4 sm:mt-3 sm:ml-8 sm:gap-6">
                    <Image
                      src="/assets/logo.webp"
                      alt="Syndicate logo"
                      width={150}
                      height={75}
                      className="h-auto w-[88px] object-contain brightness-125 contrast-125 sm:w-[130px]"
                      priority={false}
                    />
                    <div className="pl-1 sm:pl-2">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#fdd02f] sm:text-[13px] sm:tracking-[0.2em]">Money · Power · Honour · Freedom</p>
                    </div>
                  </div>

                  <div className="mt-2 text-center sm:mt-3">
                    <h2 className="mt-1 text-[28px] font-semibold uppercase leading-[0.95] tracking-[0.04em] text-cyan-100 sm:text-[42px] sm:tracking-[0.06em]" style={{ textShadow: '0 0 18px rgba(56,189,248,0.95), 0 0 30px rgba(249,115,22,0.45)' }}>
                      SYN TOKEN
                    </h2>
                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-cyan-100/85 sm:mt-1 sm:text-[11px] sm:tracking-[0.3em]">of Achievement</p>
                  </div>

                  <div className="mt-3 rounded-xl border border-fuchsia-300/55 bg-cyan-400/5 p-2.5 shadow-[0_0_18px_rgba(56,189,248,0.24)] sm:mt-4 sm:p-4 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/80">Token Owner</p>
                    <h3 className="mt-1 text-[36px] font-semibold uppercase tracking-[0.04em] text-[#fdd02f] sm:text-4xl sm:tracking-[0.08em]" style={{ textShadow: '0 0 16px rgba(253,208,47,0.45)' }}>
                      Rick Ross
                    </h3>
                    <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-cyan-100/75 sm:mt-2 sm:text-[13px] sm:tracking-[0.18em]">AI Automations & Digital Mastery</p>
                  </div>

                  <div className="mt-3 rounded-lg border border-fuchsia-300/45 bg-black/20 px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/75 sm:text-[12px]">Credential Overview</p>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-cyan-50/95 sm:mt-2 sm:text-[16px]">
                      Awarded for high-performance completion of the AI Automations & Digital Mastery track with verified execution milestones,
                      strategic delivery consistency, and secure credential validation through the Syndicate token registry.
                      This token confirms advanced operational readiness in automation systems, precision execution, and performance accountability.
                      Holder authorization is recognized across Syndicate partner ecosystems for verified digital capability.
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:mt-4 sm:text-[11px]">
                    <div className="rounded-lg border border-fuchsia-300/45 bg-black/25 p-2 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                      <p className="uppercase tracking-[0.15em] text-cyan-100/70">Issued</p>
                      <p className="mt-1 text-cyan-100">{issuedOn}</p>
                    </div>
                    <div className="rounded-lg border border-fuchsia-300/45 bg-black/25 p-2 shadow-[0_0_10px_rgba(132,204,22,0.18)]">
                      <p className="uppercase tracking-[0.15em] text-cyan-100/70">Status</p>
                      <p className="mt-1 font-semibold text-lime-300 drop-shadow-[0_0_8px_rgba(132,204,22,0.6)]">Verified</p>
                    </div>
                    <div className="col-span-2 rounded-lg border border-fuchsia-300/55 bg-black/35 p-2 font-mono shadow-[0_0_12px_rgba(56,189,248,0.28)]">
                      <p className="uppercase tracking-[0.15em] text-cyan-100/70">Token ID</p>
                      <p className="mt-1 text-[13px] font-semibold tracking-[0.06em] text-cyan-50 sm:text-[15px]">{certificateId}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col items-stretch gap-4 pb-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-center sm:gap-8 sm:pb-3">
                    <div className="relative flex flex-1 flex-col items-center justify-center sm:flex-initial">
                      <div className="relative flex h-28 w-28 items-center justify-center sm:h-44 sm:w-44">
                        <div className="pointer-events-none absolute h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(253,208,47,0.42)_0%,rgba(253,208,47,0.18)_42%,transparent_75%)] blur-[16px] sm:h-44 sm:w-44" />
                        <Image
                          src="/assets/coin-gold.png"
                          alt="Gold key certificate icon"
                          width={380}
                          height={380}
                          className="h-32 w-32 object-contain sm:h-44 sm:w-44"
                        />
                      </div>
                      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-cyan-100/80 sm:tracking-[0.24em]">Syndicate Credential Token</p>
                      <div className="mt-2 h-[2px] w-40 self-center rounded-full bg-cyan-300/75 blur-[0.5px]" />
                    </div>
                    <div className="flex flex-col items-center sm:items-start">
                      <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-cyan-200/90 sm:text-[10px]">Scan · verify on-chain</p>
                      <div
                        className="rounded-lg border-2 border-cyan-400/70 bg-[#0a1628] p-2 shadow-[0_0_24px_rgba(34,211,238,0.45),inset_0_0_12px_rgba(168,85,247,0.12)]"
                        style={{ boxShadow: '0 0 24px rgba(34,211,238,0.45), inset 0 0 0 1px rgba(56,189,248,0.35)' }}
                      >
                        <QRCodeSVG value={verifyUrl} size={120} level="M" marginSize={1} fgColor="#67e8f9" bgColor="#050a14" />
                      </div>
                      <p className="mt-2 max-w-[140px] text-center font-mono text-[8px] leading-tight text-cyan-200/55 sm:max-w-[160px] sm:text-[9px]">Registry link encoded for demo preview.</p>
                    </div>
                  </div>

                </div>
              </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
