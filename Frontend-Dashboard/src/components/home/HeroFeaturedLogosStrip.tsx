"use client";

import FeaturedLogosStrip from "@/components/FeaturedLogosStrip";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import {
  HERO_MOBILE_PRESS_TRAIL_LOGOS,
  PRESS_FEATURED_LOGOS,
} from "@/lib/heroFeaturedLogos";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof FeaturedLogosStrip>, "logos">;

/** Hero press marquee — six logos on mobile, three on larger viewports. */
export function HeroFeaturedLogosStrip(props: Props) {
  const isMobile = useMatchMedia("(max-width: 767px)");
  return (
    <FeaturedLogosStrip
      logos={isMobile ? [...HERO_MOBILE_PRESS_TRAIL_LOGOS] : [...PRESS_FEATURED_LOGOS]}
      {...props}
    />
  );
}
