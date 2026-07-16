import dynamic from "next/dynamic";
import { NavApp } from "@/components/NavApp";
import { FounderPressFeatures } from "@/components/founder/FounderPressFeatures";
import { JsonLd } from "@/components/seo/JsonLd";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";
import { buildFounderPageJsonLd } from "@/lib/structuredData";

/** Below-fold TikTok grids — keep out of initial JS/image budget for mobile LCP. */
const OurFounderClipsSection = dynamic(
  () =>
    import("@/components/founder/OurFounderClipsSection").then((m) => m.OurFounderClipsSection),
  {
    ssr: true,
    loading: () => <div className="min-h-[40vh] w-full" aria-hidden />,
  },
);

const GlobalBottomSections = dynamic(() => import("@/components/GlobalBottomSections"), {
  ssr: true,
  loading: () => <div className="min-h-[50vh] w-full bg-black" aria-hidden />,
});

export default function OurFounderPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black">
      <JsonLd data={buildFounderPageJsonLd()} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[8%] h-[280px] w-[280px] rounded-full bg-amber-400/18 blur-[110px] sm:h-[420px] sm:w-[420px]" />
        <div className="absolute right-[-8%] top-[32%] h-[260px] w-[260px] rounded-full bg-fuchsia-500/16 blur-[100px] sm:h-[400px] sm:w-[400px]" />
        <div className="absolute bottom-[-8%] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-[120px] sm:h-[460px] sm:w-[460px]" />
      </div>

      <NavApp />

      <main className="relative z-[2] scroll-mt-24 pt-[clamp(5.5rem,14vw,7rem)]">
        <header className="mx-auto mt-[clamp(2.5rem,8vw,5rem)] w-full max-w-[min(100%,1200px)] px-3 pb-4 text-center sm:px-6 sm:pb-6">
          <h1
            className={`${publicHeadingLightning("lime")} text-[clamp(2.75rem,11vw,100pt)] font-black uppercase leading-[0.92] tracking-[0.12em]`}
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
