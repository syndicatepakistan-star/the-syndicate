import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

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
        <p className={`${publicHeadingLightning("amber")} brand-kicker`}>THE SYNDICATE</p>
        <h1 className={`${publicHeadingLightning("amber")} brand-title`}>THE SOVEREIGN ENTITY AUDIT</h1>
        {subtitle ? (
          <p className={`${publicHeadingLightning("amber")} brand-subtitle ${subtitleClassName}`.trim()}>{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
