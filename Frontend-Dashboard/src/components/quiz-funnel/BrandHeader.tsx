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
        <img
          src="/quiz-funnel-logo.webp"
          alt="The Syndicate logo"
          className="brand-logo"
          width={220}
          height={140}
        />
      </div>
      <div>
        <p className={`${publicHeadingLightning("violet")} brand-kicker`}>THE SYNDICATE</p>
        <h1 className={`${publicHeadingLightning("violet")} brand-title`}>{QUIZ_FUNNEL_TITLE}</h1>
        {subtitle ? (
          <p className={`${publicHeadingLightning("violet")} brand-subtitle ${subtitleClassName}`.trim()}>{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
