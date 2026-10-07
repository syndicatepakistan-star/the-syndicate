import Image from "next/image";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

export const QUIZ_FUNNEL_TITLE = "THE SYNDICATE DIAGNOSIS";

export type BrandHeaderProps = {
  subtitle?: string;
  subtitleClassName?: string;
};

export default function BrandHeader({ subtitle, subtitleClassName = "" }: BrandHeaderProps) {
  return (
    <header className="brand-header">
      <div className="brand-logo-wrap">
        <Image
          src="/quiz-funnel-logo-sm.webp"
          alt="The Syndicate logo"
          className="brand-logo"
          width={176}
          height={70}
          // Heading is quiz LCP — don't steal high priority from brand-title text.
          loading="eager"
          fetchPriority="auto"
          quality={60}
          sizes="(max-width: 380px) 120px, (max-width: 640px) 140px, 160px"
        />
      </div>
      <div>
        <h1 className={`${publicHeadingLightning("violet")} brand-title`}>{QUIZ_FUNNEL_TITLE}</h1>
        {subtitle ? (
          <p className={`${publicHeadingLightning("violet")} brand-subtitle ${subtitleClassName}`.trim()}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}
