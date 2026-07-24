"use client";

import FeaturedLogosStrip from "@/components/FeaturedLogosStrip";

const GUARANTEE_PRESS_LOGOS = [
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

export function GuaranteeFeaturedLogos() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-amber-300/25 bg-black/40 shadow-[0_0_28px_rgba(251,191,36,0.12)]">
      <FeaturedLogosStrip logos={GUARANTEE_PRESS_LOGOS} speedSeconds={36} className="!py-6 sm:!py-8" />
    </div>
  );
}
