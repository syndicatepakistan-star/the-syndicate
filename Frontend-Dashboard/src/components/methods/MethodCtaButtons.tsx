"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cx } from "@/components/cyber/CyberChamferFrames";

const METHOD_CTA_LINKS = [
  { href: "/membership", label: "Join Now", variant: "join" },
  { href: "/programs", label: "View Programs", variant: "programs" },
  { href: "/quiz", label: "Syn Diagnosis", variant: "quiz" },
] as const;

export function MethodCtaButtons({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className={cx("method-cta-row flex flex-wrap gap-3 sm:gap-4", className)}>
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
  );
}
