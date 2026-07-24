import { NavApp } from "@/components/NavApp";
import GlobalBottomSections from "@/components/GlobalBottomSections";
import { FounderPressFeatures } from "@/components/founder/FounderPressFeatures";
import { OurFounderClipsSection } from "@/components/founder/OurFounderClipsSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";
import { buildFounderPageJsonLd } from "@/lib/structuredData";

export default function OurFounderPage() {
  return (
    <div className="public-page-shell relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black">
      <JsonLd data={buildFounderPageJsonLd()} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[18%] h-[min(420px,55vw)] w-[min(420px,70vw)] -translate-x-1/2 rounded-full bg-amber-400/14 blur-[90px]" />
      </div>

      <NavApp />

      <main className="relative z-[2] scroll-mt-24 pt-[clamp(5.5rem,14vw,7rem)]">
        <header className="mx-auto mt-[clamp(2.5rem,8vw,5rem)] w-full max-w-[min(100%,1200px)] px-3 pb-4 text-center sm:px-6 sm:pb-6">
          <h1
            className={`${publicHeadingLightning("lime")} text-[clamp(2.15rem,10vw,2.75rem)] font-black uppercase leading-[0.92] tracking-[0.1em] sm:text-[clamp(2.75rem,8vw,3.5rem)] sm:tracking-[0.12em] md:text-[clamp(3.25rem,6vw,4.5rem)] lg:text-[clamp(3.75rem,5vw,100pt)]`}
          >
            Our Founder
          </h1>
        </header>

        <FounderPressFeatures />
        <OurFounderClipsSection />
      </main>

      <GlobalBottomSections />
    </div>
  );
}
