"use client";

import dynamic from "next/dynamic";
import DomeGallery from "@/components/DomeGallery";
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

type DomeGalleryProps = ComponentProps<typeof DomeGallery>;

export function HomeDomeGallerySection(props: DomeGalleryProps) {
  return (
    <div className="h-full min-h-0 w-full max-w-full overflow-hidden rounded-none bg-transparent">
      <DomeGallery {...props} eagerImages />
    </div>
  );
}

export function HomePricingSection() {
  return (
    <LazyWhenVisible
      className="bg-black"
      rootMargin="480px 0px"
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
