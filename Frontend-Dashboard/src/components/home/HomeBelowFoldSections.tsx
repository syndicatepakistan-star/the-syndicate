"use client";

import dynamic from "next/dynamic";
import { LazyWhenVisible } from "@/components/LazyWhenVisible";
import { HomeSectionPlaceholder } from "@/components/home/HomeSectionPlaceholder";
import type { ComponentProps } from "react";

function PricingPageSkeleton() {
  return <HomeSectionPlaceholder minHeight="60dvh" titleWidth="18rem" className="bg-black" />;
}

const PricingPage = dynamic(
  () => import("@/components/AnimatedPricingPage").then((mod) => ({ default: mod.PricingPage })),
  { ssr: false, loading: PricingPageSkeleton },
);
const PaywallSnapshotsSection = dynamic(() => import("@/components/PaywallSnapshotsSection"), {
  ssr: false,
  loading: () => <HomeSectionPlaceholder minHeight="80dvh" titleWidth="16rem" />,
});
const CertificatesSection = dynamic(() => import("@/components/CertificatesSection"), {
  ssr: false,
  loading: () => <HomeSectionPlaceholder minHeight="70dvh" titleWidth="12rem" />,
});
const FAQSection = dynamic(() => import("@/components/FAQSection"), {
  ssr: false,
  loading: () => <HomeSectionPlaceholder minHeight="60dvh" titleWidth="10rem" />,
});
const GlobalBottomSections = dynamic(() => import("@/components/GlobalBottomSections"), {
  ssr: false,
  loading: () => <HomeSectionPlaceholder minHeight="100dvh" titleWidth="12rem" />,
});
const DomeGallery = dynamic(() => import("@/components/DomeGallery"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-transparent" aria-hidden>
      <div className="h-3 w-40 animate-pulse rounded-full bg-amber-400/20" />
    </div>
  ),
});

type DomeGalleryProps = ComponentProps<typeof DomeGallery>;

export function HomeDomeGallerySection(props: DomeGalleryProps) {
  return (
    <div className="h-full min-h-0 w-full max-w-full overflow-hidden rounded-none bg-transparent">
      <DomeGallery {...props} />
    </div>
  );
}

export function HomePricingSection() {
  return (
    <LazyWhenVisible
      className="home-lazy-section bg-black"
      rootMargin="200px 0px"
      minHeight="60dvh"
      placeholder={<PricingPageSkeleton />}
    >
      <PricingPage />
    </LazyWhenVisible>
  );
}

export function HomePaywallSection() {
  return (
    <LazyWhenVisible
      className="home-lazy-section"
      minHeight="80dvh"
      rootMargin="320px 0px"
      placeholder={<HomeSectionPlaceholder minHeight="80dvh" titleWidth="16rem" />}
    >
      <PaywallSnapshotsSection />
    </LazyWhenVisible>
  );
}

export function HomeCertificatesSection() {
  return (
    <LazyWhenVisible
      minHeight="70dvh"
      rootMargin="180px 0px"
      placeholder={<HomeSectionPlaceholder minHeight="70dvh" titleWidth="12rem" />}
    >
      <CertificatesSection />
    </LazyWhenVisible>
  );
}

export function HomeFaqSection() {
  return (
    <LazyWhenVisible
      minHeight="60dvh"
      rootMargin="160px 0px"
      eagerOnHash="faq"
      placeholder={<HomeSectionPlaceholder minHeight="60dvh" titleWidth="10rem" />}
    >
      <FAQSection />
    </LazyWhenVisible>
  );
}

export function HomeBottomSections() {
  return (
    <LazyWhenVisible
      minHeight="100dvh"
      rootMargin="160px 0px"
      placeholder={<HomeSectionPlaceholder minHeight="100dvh" titleWidth="12rem" />}
    >
      <GlobalBottomSections />
    </LazyWhenVisible>
  );
}
