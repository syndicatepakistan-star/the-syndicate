"use client";

import Link from "next/link";

const POLICY_BLOCKS: { title: string; body: string }[] = [
  {
    title: "Privacy Policy",
    body:
      "We collect account details (such as email), purchase records, and technical data needed to run login, checkout, and course access. We use this to deliver The Syndicate services, prevent abuse, and improve the product. We do not sell your personal data.",
  },
  {
    title: "Terms of Use",
    body:
      "Programs, vaults, and memberships are digital education products for personal use. Access depends on a valid purchase or membership. Content is for educational purposes; results depend on your own application. Misuse, sharing credentials, or reselling content may end access.",
  },
  {
    title: "Subscription Conditions",
    body:
      "The Knight membership bills monthly while active. Cancel anytime from your account/billing flow; access continues until the paid period ends. Lifetime vault purchases (including Money Mastery) are one-time and are not monthly subscriptions.",
  },
  {
    title: "Refund Policy",
    body:
      "Refund eligibility follows the Refund Policy and Syndicate Guarantee rules shown at checkout and on the Guarantee page. Where a refund applies, it is processed under those documents — not informal promises.",
  },
  {
    title: "Cookies",
    body:
      "Essential cookies keep you signed in, remember currency, and protect checkout/OTP. Optional analytics cookies run only after you Accept all on the cookie bar. Change your choice anytime by clearing site data in your browser.",
  },
];

/**
 * Home hash target: `/#policy` — single Privacy / Policy / Cookies URL for Klaviyo & legal.
 * `/#cookies` aliases to the same section (rewritten to `#policy`).
 */
export default function PolicySection() {
  return (
    <section
      id="policy"
      className="relative w-full overflow-hidden bg-[#020208] px-[clamp(1rem,3.2vw,1.75rem)] py-[clamp(2.5rem,6vw,4rem)]"
      style={{ scrollMarginTop: "5.5rem" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(560px_240px_at_12%_0%,rgba(34,211,238,0.12),transparent_60%),radial-gradient(480px_220px_at_90%_100%,rgba(251,191,36,0.1),transparent_65%)]" />
      <div className="relative z-[1] mx-auto w-full max-w-[min(52rem,96vw)]">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200/80">
          Legal
        </p>
        <h2 className="public-heading-lightning public-heading-lightning--amber mt-2 text-[clamp(1.35rem,2vw+0.9rem,1.85rem)] font-black uppercase tracking-[0.08em]">
          Privacy &amp; Policy
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-200/88 sm:text-[16px]">
          How The Syndicate handles your data, memberships, refunds, and cookies. Full checkout
          documents still govern purchases.
        </p>

        <div className="mt-8 space-y-5">
          {POLICY_BLOCKS.map((block) => (
            <article
              key={block.title}
              className="rounded-xl border border-white/10 bg-black/45 px-4 py-4 sm:px-5 sm:py-5"
            >
              <h3 className="text-[14px] font-black uppercase tracking-[0.12em] text-amber-100 sm:text-[15px]">
                {block.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-300/90 sm:text-[15px]">
                {block.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/syndicate-guarantee"
            prefetch={false}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-amber-300/55 bg-amber-400/15 px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.1em] text-amber-50 transition hover:bg-amber-400/25"
          >
            Syndicate Guarantee
          </Link>
        </div>
      </div>
    </section>
  );
}
