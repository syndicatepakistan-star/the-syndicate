"use client";

import dynamic from "next/dynamic";
import { LazyWhenVisible } from "@/components/LazyWhenVisible";
import type { ComponentProps } from "react";

const DomeGallery = dynamic(() => import("@/components/DomeGallery"), { ssr: false });
const PricingPage = dynamic(
  () => import("@/components/AnimatedPricingPage").then((mod) => ({ default: mod.PricingPage })),
  { ssr: false },
);
const PaywallSnapshotsSection = dynamic(() => import("@/components/PaywallSnapshotsSection"), { ssr: false });
const CertificatesSection = dynamic(() => import("@/components/CertificatesSection"), { ssr: false });
const FAQSection = dynamic(() => import("@/components/FAQSection"), { ssr: false });
const GlobalBottomSections = dynamic(() => import("@/components/GlobalBottomSections"), { ssr: false });

type DomeGalleryProps = ComponentProps<typeof DomeGallery>;

export function HomeDomeGallerySection(props: DomeGalleryProps) {
  return (
    <LazyWhenVisible
      className="h-[clamp(300px,52dvh,420px)] w-full min-w-0 overflow-hidden rounded-none bg-transparent sm:h-[calc(100dvh-9rem)] sm:min-h-[520px]"
      minHeight="clamp(300px, 52dvh, 420px)"
    >
      <DomeGallery {...props} />
    </LazyWhenVisible>
  );
}

export function HomePricingSection() {
  return (
    <LazyWhenVisible minHeight="100dvh">
      <PricingPage />
    </LazyWhenVisible>
  );
}

export function HomePaywallSection() {
  return (
    <LazyWhenVisible minHeight="80dvh">
      <PaywallSnapshotsSection />
    </LazyWhenVisible>
  );
}

export function HomeCertificatesSection() {
  return (
    <LazyWhenVisible minHeight="70dvh">
      <CertificatesSection />
    </LazyWhenVisible>
  );
}

export function HomeFaqSection() {
  return (
    <LazyWhenVisible minHeight="60dvh">
      <FAQSection />
    </LazyWhenVisible>
  );
}

export function HomeBottomSections() {
  return (
    <LazyWhenVisible minHeight="100dvh">
      <GlobalBottomSections />
    </LazyWhenVisible>
  );
}
