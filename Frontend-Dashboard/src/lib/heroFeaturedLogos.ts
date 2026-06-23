export type FeaturedPressLogo = {
  src: string;
  alt: string;
  href?: string;
};

/** Press logos shown in the hero marquee (desktop) and elsewhere. */
export const PRESS_FEATURED_LOGOS: readonly FeaturedPressLogo[] = [
  {
    src: "/assets/press-forbes.png",
    alt: "Forbes logo",
    href: "https://forbes.ge/en/how-the-syndicate-uses-mastery-and-empowerment-to-redefine-business/",
  },
  {
    src: "/assets/press-luxury.png",
    alt: "LLM logo",
    href: "https://www.luxurylifestylemag.co.uk/money/how-the-syndicate-empowers-individuals-to-master-power-money-and-influence-in-the-money-mastery-course/",
  },
  {
    src: "/assets/press-gq.png",
    alt: "GQ logo",
    href: "https://gq.co.za/wealth/2025-02-10-how-the-syndicate-can-disrupt-the-traditional-model-of-influence-and-education-in-the-digital-age/",
  },
];

/** Mobile hero trail — six press logos (Forbes, Luxury, GQ × 2) for a tighter marquee loop. */
export const HERO_MOBILE_PRESS_TRAIL_LOGOS: readonly FeaturedPressLogo[] = [
  ...PRESS_FEATURED_LOGOS,
  ...PRESS_FEATURED_LOGOS,
];
