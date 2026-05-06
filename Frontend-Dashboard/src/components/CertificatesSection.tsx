'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, CheckCircle2, Download, Shield } from 'lucide-react'
import Image from 'next/image'

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


function FeatureIcon({ icon }: { icon: Feature['icon'] }) {
  if (icon === 'award') return <Award className="h-7 w-7 text-cyan-300" style={{ filter: 'drop-shadow(0 0 9px rgba(34,211,238,0.95))' }} />
  if (icon === 'shield') return <Shield className="h-7 w-7 text-fuchsia-300" style={{ filter: 'drop-shadow(0 0 9px rgba(232,121,249,0.9))' }} />
  return <CheckCircle2 className="h-7 w-7 text-violet-300" style={{ filter: 'drop-shadow(0 0 9px rgba(167,139,250,0.9))' }} />
}

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
  const verifyUrl = `https://nexus.syndicate/verify?certificate=${encodeURIComponent(certificateId)}`

  const openPreview = () => {
    setCertificateId(buildCertificateId())
    setIssuedOn(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
    setIsPreviewOpen(true)
  }

  return (
    <section
      id="certificates"
      aria-label="Certificates section"
      className="relative w-full overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <Image src="/assets/c.gif" alt="" aria-hidden fill sizes="100vw" className="object-cover opacity-30" unoptimized />
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
          <h2
            className="text-3xl font-bold tracking-wider sm:text-4xl md:text-5xl lg:text-6xl"
            style={{
              color: '#eaf3ff',
              textShadow: '0 0 24px rgba(34,211,238,0.55), 0 0 54px rgba(168,85,247,0.34), 0 0 5px rgba(217,70,239,0.55), 0 2px 4px rgba(0,0,0,0.55)',
            }}
          >
            Become Syndicate Certified
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-200/80 sm:text-base" style={{ textShadow: '0 0 12px rgba(34,211,238,0.14)' }}>
            Complete our courses and earn verified credentials that elevate your profile. Join leaders who prove their expertise.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div
              className="relative border-[6px] p-6 sm:p-8 [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]"
              style={{
                borderColor: 'rgba(34,211,238,0.95)',
                background: 'linear-gradient(145deg, rgba(8,10,24,0.96) 0%, rgba(5,4,16,0.98) 52%, rgba(10,8,22,0.98) 100%)',
                boxShadow:
                  'inset 0 0 0 2px rgba(217,70,239,0.65), inset 0 0 0 6px rgba(34,211,238,0.28), 0 0 84px rgba(34,211,238,0.44), 0 0 132px rgba(168,85,247,0.32), 0 0 64px rgba(217,70,239,0.26)',
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
                className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[#050510] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]"
                style={{ border: '3px solid rgba(34,211,238,0.72)', boxShadow: 'inset 0 0 48px rgba(167,139,250,0.18), 0 0 44px rgba(34,211,238,0.24)' }}
              >
                <div className="relative z-[2] flex w-full flex-col items-center justify-center p-6 text-center">
                  <div
                    className="mb-6 flex h-44 w-44 items-center justify-center rounded-full sm:h-56 sm:w-56"
                    style={{ background: 'transparent', boxShadow: 'none' }}
                  >
                    <div className="pointer-events-none absolute h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(253,208,47,0.42)_0%,rgba(253,208,47,0.18)_42%,transparent_75%)] blur-[18px] sm:h-52 sm:w-52" />
                    <Award
                      className="h-32 w-32 text-cyan-200 sm:h-44 sm:w-44"
                      strokeWidth={2.2}
                      style={{ filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.98))' }}
                    />
                  </div>
                  <div className="w-full max-w-[420px]">
                    <div className="mt-1 flex w-full items-center justify-center gap-2 border-2 py-3 text-sm tracking-wider text-cyan-300 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                      style={{
                        borderColor: 'rgba(56,189,248,0.72)',
                        textShadow: '0 0 12px rgba(34,211,238,0.52)',
                        boxShadow: '0 0 30px rgba(34,211,238,0.24)',
                        background: 'rgba(8,20,32,0.22)',
                      }}
                    >
                      <Download className="h-4 w-4" />
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

          <div className="space-y-7 lg:col-span-6 lg:pt-2">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-[18px] p-[3px]"
                style={{
                  background: 'linear-gradient(132deg, rgba(34,211,238,0.98) 0%, rgba(168,85,247,0.95) 54%, rgba(217,70,239,0.92) 100%)',
                  boxShadow: '0 0 34px rgba(34,211,238,0.32), 0 0 72px rgba(168,85,247,0.24), inset 0 0 0 1px rgba(34,211,238,0.4)',
                }}
              >
                <div
                  className="pointer-events-none absolute inset-[8px] rounded-[14px] border-2 opacity-95"
                  style={{
                    borderColor: 'rgba(34,211,238,0.82)',
                    boxShadow: '0 0 16px rgba(34,211,238,0.35), inset 0 0 14px rgba(168,85,247,0.18)',
                  }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[18px] opacity-100 [background:linear-gradient(90deg,rgba(34,211,238,1),rgba(217,70,239,0.95),rgba(168,85,247,0.96))] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0,rgba(0,0,0,1)_3px,transparent_3px,transparent_calc(100%-3px),rgba(0,0,0,1)_calc(100%-3px),rgba(0,0,0,1)_100%)]" />
                <div className="pointer-events-none absolute left-3 top-3 h-5 w-5 rounded-tl-[8px] border-l-2 border-t-2 border-cyan-300/95" />
                <div className="pointer-events-none absolute right-3 top-3 h-5 w-5 rounded-tr-[8px] border-r-2 border-t-2 border-fuchsia-300/90" />
                <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 rounded-bl-[8px] border-b-2 border-l-2 border-violet-300/90" />
                <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 rounded-br-[8px] border-b-2 border-r-2 border-cyan-300/90" />
                <div
                  className="relative flex items-start gap-4 rounded-[15px] bg-gradient-to-br from-[#04040d]/95 via-[#08051a]/95 to-[#04040d]/95 p-6 sm:gap-6 sm:p-8"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(30,41,59,0.8), 0 12px 28px rgba(0,0,0,0.85)' }}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-[15px] opacity-72 [background:radial-gradient(125%_115%_at_8%_20%,rgba(34,211,238,0.2),transparent_46%),radial-gradient(130%_120%_at_88%_80%,rgba(168,85,247,0.16),transparent_52%)]" />
                  <div className="pointer-events-none absolute inset-0 rounded-[15px] opacity-30 [background:linear-gradient(102deg,transparent_16%,rgba(34,211,238,0.14)_40%,rgba(217,70,239,0.13)_56%,transparent_80%)]" />
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 sm:h-14 sm:w-14 [clip-path:polygon(9px_0,calc(100%-9px)_0,100%_9px,100%_calc(100%-9px),calc(100%-9px)_100%,9px_100%,0_calc(100%-9px),0_9px)]"
                    style={{ borderColor: 'rgba(34,211,238,0.9)', boxShadow: '0 0 24px rgba(167,139,250,0.42), inset 0 0 14px rgba(34,211,238,0.18)' }}
                  >
                    <FeatureIcon icon={feature.icon} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold tracking-wider text-slate-100 sm:text-xl" style={{ textShadow: '0 0 14px rgba(34,211,238,0.34), 0 0 4px rgba(0,0,0,0.9)' }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-200/80 sm:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <AnimatePresence>
        {isPreviewOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-transparent p-4 backdrop-blur-sm"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.28 }}
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
                      Ayaan Sterling
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

                  <div className="mt-4 flex flex-col items-center justify-center pb-2 sm:mt-5 sm:pb-3">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full sm:h-44 sm:w-44">
                      <div className="pointer-events-none absolute h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(253,208,47,0.42)_0%,rgba(253,208,47,0.18)_42%,transparent_75%)] blur-[16px] sm:h-44 sm:w-44" />
                      <Image
                        src="/assets/coin-gold.png"
                        alt="Gold key certificate icon"
                        width={380}
                        height={380}
                        className="h-32 w-32 object-contain sm:h-44 sm:w-44"
                      />
                    </div>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-cyan-100/80 sm:tracking-[0.24em]">Syndicate Credential Token</p>
                    <div className="mt-2 h-[2px] w-40 rounded-full bg-cyan-300/75 blur-[0.5px]" />
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
