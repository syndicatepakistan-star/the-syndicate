"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cx } from "@/components/cyber/CyberChamferFrames";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

const METHOD_CTA_LINKS = [
  { href: "/membership", label: "Join Now", variant: "join" },
  { href: "/programs", label: "View Programs", variant: "programs" },
  { href: "/quiz", label: "Syn Diagnosis", variant: "quiz" },
] as const;

export function MethodCtaButtons({
  className,
  size = "default",
  showHeading = false,
}: {
  className?: string;
  size?: "default" | "large";
  showHeading?: boolean;
}) {
  const router = useRouter();
  const large = size === "large";

  return (
    <div
      className={cx(
        "method-cta-block",
        large && "method-cta-block--large",
        className
      )}
    >
      {showHeading ? (
        <p
          className={cx(
            publicHeadingLightning("amber"),
            "method-cta-heading font-mono font-bold uppercase tracking-[0.32em]",
            large ? "text-base sm:text-lg" : "text-sm sm:text-base"
          )}
        >
          Next move
        </p>
      ) : null}
      <div
        className={cx(
          "method-cta-row flex flex-wrap gap-3 sm:gap-4",
          large && "method-cta-row--large"
        )}
      >
      {METHOD_CTA_LINKS.map((item, index) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch
          onMouseEnter={() => router.prefetch(item.href)}
          onFocus={() => router.prefetch(item.href)}
          className={cx("method-cta-btn", `method-cta-btn--${item.variant}`)}
          style={{ animationDelay: `${index * 0.18}s` }}
        >
          {item.label}
        </Link>
      ))}
      </div>
    </div>
  );
}
