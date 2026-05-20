'use client'

import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export type SynCertificateCardProps = {
  ownerName: string
  courseTitle: string
  certificateId: string
  issuedOn: string
  verifyUrl: string
  className?: string
  /** Simpler styles for PNG export (avoids clip-path/blur/clamp capture issues). */
  forExport?: boolean
}

export function buildCredentialOverview(courseTitle: string): string {
  return `Awarded for high-performance completion of the ${courseTitle} track with verified execution milestones, strategic delivery consistency, and secure credential validation through the Syndicate token registry. This token confirms advanced operational readiness in automation systems, precision execution, and performance accountability. Holder authorization is recognized across Syndicate partner ecosystems for verified digital capability.`
}

export const SynCertificateCard = forwardRef<HTMLDivElement, SynCertificateCardProps>(function SynCertificateCard(
  { ownerName, courseTitle, certificateId, issuedOn, verifyUrl, className = '', forExport = false },
  ref,
) {
  const overview = buildCredentialOverview(courseTitle)
  const titleClass = forExport
    ? 'text-[2rem] font-semibold uppercase leading-[0.95] tracking-[0.06em] text-cyan-100'
    : 'text-[clamp(1.35rem,4.5vh,2.625rem)] font-semibold uppercase leading-[0.95] tracking-[0.04em] text-cyan-100 sm:tracking-[0.06em]'
  const ownerClass = forExport
    ? 'mt-0.5 text-[1.75rem] font-semibold uppercase tracking-[0.08em] text-[#fdd02f]'
    : 'mt-0.5 text-[clamp(1.25rem,5vh,2.25rem)] font-semibold uppercase tracking-[0.04em] text-[#fdd02f] sm:tracking-[0.08em]'
  const overviewClass = forExport
    ? 'mt-1 text-[13px] leading-relaxed text-cyan-50/95'
    : 'mt-1 text-[clamp(11px,1.55vh,15px)] leading-snug text-cyan-50/95 sm:leading-relaxed'
  const coinWrapClass = forExport
    ? 'relative flex h-[7rem] w-[7rem] items-center justify-center'
    : 'relative flex h-[clamp(4.5rem,11vh,8.5rem)] w-[clamp(4.5rem,11vh,8.5rem)] items-center justify-center'

  return (
    <div
      ref={ref}
      className={`relative flex w-full flex-col overflow-hidden rounded-[22px] border border-cyan-200/90 bg-[#070a1a] ${forExport ? '' : 'max-w-[min(760px,96vw)]'} ${className}`.trim()}
      style={{
        boxShadow: '0 0 90px rgba(217,70,239,0.25), 0 0 130px rgba(56,189,248,0.18)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(217,70,239,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.24) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          background:
            'radial-gradient(circle at 24% 12%, rgba(217,70,239,0.26), transparent 42%), radial-gradient(circle at 80% 86%, rgba(56,189,248,0.18), transparent 46%)',
        }}
      />

      <div className="relative flex flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(59,130,246,0.45),transparent_34%),radial-gradient(circle_at_80%_22%,rgba(249,115,22,0.22),transparent_35%),radial-gradient(circle_at_20%_78%,rgba(236,72,153,0.2),transparent_38%),linear-gradient(180deg,#070a1a_0%,#0c1130_45%,#111735_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.32)_1px,transparent_1px)] [background-size:4px_4px]" />
        <div className="pointer-events-none absolute inset-[8px] rounded-[18px] border border-cyan-200/95 shadow-[0_0_0_1px_rgba(56,189,248,0.9),0_0_22px_rgba(56,189,248,0.86),0_0_56px_rgba(56,189,248,0.72),0_0_108px_rgba(56,189,248,0.56),inset_0_0_20px_rgba(56,189,248,0.27)]" />
        <div className="pointer-events-none absolute inset-[18px] rounded-[12px] border border-cyan-300/75 shadow-[inset_0_0_16px_rgba(56,189,248,0.25)]" />
        <div className="pointer-events-none absolute left-[20px] top-[20px] h-12 w-12 border-l-2 border-t-2 border-red-400/90" />
        <div className="pointer-events-none absolute right-[20px] top-[20px] h-12 w-12 border-r-2 border-t-2 border-red-400/90" />
        <div className="pointer-events-none absolute bottom-[20px] left-[20px] h-12 w-12 border-b-2 border-l-2 border-red-400/90" />
        <div className="pointer-events-none absolute bottom-[20px] right-[20px] h-12 w-12 border-b-2 border-r-2 border-red-400/90" />

        <div className="relative z-10 flex flex-col gap-2 px-2 pb-2 pt-4 text-cyan-100 sm:gap-2.5 sm:px-3 sm:pb-3 sm:pt-5">
          <div className="shrink-0 ml-1 flex flex-wrap items-center gap-3 sm:ml-4 sm:gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo.webp"
              alt="Syndicate logo"
              width={150}
              height={75}
              className={forExport ? 'h-auto w-[130px] object-contain' : 'h-auto w-[88px] object-contain brightness-125 contrast-125 sm:w-[130px]'}
            />
            <div className="pl-1 sm:pl-2">
              <p className="text-[9px] uppercase tracking-[0.14em] text-[#fdd02f] sm:text-[13px] sm:tracking-[0.2em]">
                Money · Power · Honour · Freedom
              </p>
            </div>
          </div>

          <div className="shrink-0 text-center">
            <h2
              className={titleClass}
              style={{ textShadow: '0 0 18px rgba(56,189,248,0.95), 0 0 30px rgba(249,115,22,0.45)' }}
            >
              SYN TOKEN
            </h2>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-cyan-100/85 sm:text-[11px] sm:tracking-[0.3em]">of Achievement</p>
          </div>

          <div
            className={
              forExport
                ? 'shrink-0 rounded-xl border border-fuchsia-300/55 bg-cyan-400/5 p-3'
                : 'shrink-0 rounded-xl border border-fuchsia-300/55 bg-cyan-400/5 p-2 shadow-[0_0_18px_rgba(56,189,248,0.24)] sm:p-3 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]'
            }
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/80">Token Owner</p>
            <h3
              className={ownerClass}
              style={{ textShadow: '0 0 16px rgba(253,208,47,0.45)' }}
            >
              {ownerName}
            </h3>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-cyan-100/75 sm:text-[12px] sm:tracking-[0.18em]">{courseTitle}</p>
          </div>

          <div className="shrink-0 rounded-lg border border-fuchsia-300/45 bg-black/20 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/75 sm:text-[11px]">Credential Overview</p>
            <p className={overviewClass}>{overview}</p>
          </div>

          <div className="shrink-0 grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
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

          <div className="shrink-0 flex flex-col items-stretch gap-3 pb-1 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
            <div className="relative flex flex-col items-center justify-center sm:flex-initial">
              <div className={coinWrapClass}>
                {!forExport ? (
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(253,208,47,0.42)_0%,rgba(253,208,47,0.18)_42%,transparent_75%)] blur-[14px]" />
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/coin-gold.png"
                  alt="Gold key certificate icon"
                  width={380}
                  height={380}
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="mt-2 text-center text-[9px] uppercase tracking-[0.2em] text-cyan-100/80 sm:text-[10px] sm:tracking-[0.24em]">
                Syndicate Credential Token
              </p>
              <div className="mt-1.5 h-[2px] w-32 self-center rounded-full bg-cyan-300/75 blur-[0.5px] sm:w-40" />
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <p className="mb-1.5 text-[9px] uppercase tracking-[0.2em] text-cyan-200/90">Scan · verify on-chain</p>
              <div
                className="rounded-lg border-2 border-cyan-400/70 bg-[#0a1628] p-1.5 shadow-[0_0_24px_rgba(34,211,238,0.45),inset_0_0_12px_rgba(168,85,247,0.12)]"
                style={{ boxShadow: '0 0 24px rgba(34,211,238,0.45), inset 0 0 0 1px rgba(56,189,248,0.35)' }}
              >
                <QRCodeSVG value={verifyUrl} size={100} level="M" marginSize={1} fgColor="#67e8f9" bgColor="#050a14" />
              </div>
              <p className="mt-1.5 max-w-[140px] text-center font-mono text-[8px] leading-tight text-cyan-200/55 sm:max-w-[160px]">
                Registry link encoded for demo preview.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
