import Image from 'next/image'
import { NavApp } from '@/components/NavApp'
import { ViewportDecorVideo } from '@/components/ViewportDecorVideo'
import GlobalBottomSections from '@/components/GlobalBottomSections'
import { MethodCtaButtons } from '@/components/methods/MethodCtaButtons'
import { MethodSplitCard } from '@/components/methods/MethodSplitCard'
import { CyberChamferFrame } from '@/components/cyber/CyberChamferFrames'
import { OurMethodsDoctrineIntro } from '@/components/our-methods/OurMethodsDoctrineIntro'
import { OUR_METHODS_BLOCKS } from '@/lib/ourMethodsCopy'
import { publicHeadingLightning } from '@/lib/publicHeadingLightning'

export default function OurMethodsPage() {
  return (
    <div className="our-methods-page public-page-shell relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#04060c]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <ViewportDecorVideo
          src="/assets/video.mp4"
          alwaysOn
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
          <CyberChamferFrame accent="hero" chamfer={24} className="min-h-[72vh]" innerClassName="cyber-frame-mobile-pad p-7 sm:p-10 lg:p-14">
            <div className="grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <h1
                  className={`our-methods-hero-title ${publicHeadingLightning('cyan')} marketing-card-title-oneline text-[clamp(2.2rem,5.4vw,5.2rem)] font-black uppercase leading-[0.9] tracking-[0.1em]`}
                >
                  Control The Operating System
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-100/88 sm:text-xl">
                  In a broken world, average behavior gets average outcomes. Our methods are engineered for operators who want structure, leverage, and execution inside high-pressure systems.
                </p>
                <MethodCtaButtons className="mt-8" size="large" showHeading />
              </div>
              <div className="grid gap-4">
                <CyberChamferFrame accent="video" chamfer={18} decorSize="compact" innerClassName="p-2">
                  <div className="our-methods-hero-media relative z-10 h-[clamp(14rem,48vw,22.5rem)] w-full sm:h-[clamp(18rem,42vw,27.5rem)] lg:h-[clamp(22rem,32vw,31.25rem)] xl:h-[500px]">
                    <Image
                      src="/assets/refund.jpg"
                      alt="Control the operating system — Syndicate doctrine"
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 42vw"
                      className="object-cover object-center"
                    />
                  </div>
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

      <section className="relative z-10 w-full px-[clamp(0.75rem,2.5vw,2.5rem)] pb-14 sm:pb-20">
        <div className="mx-auto w-full max-w-[min(100%,1920px)] space-y-8 sm:space-y-10 lg:space-y-12">
          <OurMethodsDoctrineIntro />
          {OUR_METHODS_BLOCKS.map((block) => (
            <MethodSplitCard
              key={block.id}
              accent={block.accent}
              title={block.title}
              summary={block.summary}
              paragraphs={block.paragraphs}
              copyLayout={block.copyLayout}
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

