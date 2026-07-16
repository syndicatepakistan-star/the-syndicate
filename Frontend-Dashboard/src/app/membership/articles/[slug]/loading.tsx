import Link from "next/link";

const ARTICLES_HREF = "/dashboard/resources";

/** Shown during client navigation so the route paints chrome before the page bundle runs. */
export default function MembershipArticleLoading() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0c] text-neutral-100">
      <div className="border-b border-white/[0.06] bg-[#0e0e10]/80">
        <div className="fluid-page-px mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-3 py-4 sm:gap-4">
          <Link
            href={ARTICLES_HREF}
            prefetch
            className="text-[13px] font-medium text-neutral-500 transition hover:text-[color:var(--gold-neon)]"
          >
            ← Articles
          </Link>
          <span className="inline-flex items-center gap-2 text-[12px] text-cyan-200/75">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            Opening…
          </span>
        </div>
      </div>
      <div className="fluid-page-px mx-auto max-w-5xl py-10 sm:py-14">
        <div className="h-10 max-w-2xl animate-pulse rounded-lg bg-white/[0.07]" />
        <div className="mt-6 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
          <div className="h-3 w-[92%] animate-pulse rounded bg-white/[0.04]" />
          <div className="h-3 w-[78%] animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
