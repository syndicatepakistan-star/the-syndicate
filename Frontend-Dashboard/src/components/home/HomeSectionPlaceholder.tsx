"use client";

type Props = {
  /** Reserved block height while heavy section JS loads */
  minHeight?: string;
  /** Optional heading shimmer (section title) */
  titleWidth?: string;
  className?: string;
};

/** Visible shell so below-fold sections do not flash as empty black while lazy-mounting. */
export function HomeSectionPlaceholder({
  minHeight = "60dvh",
  titleWidth = "14rem",
  className = "",
}: Props) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-6 bg-[#050508] px-4 py-10 ${className}`}
      style={{ minHeight, containIntrinsicSize: minHeight }}
      aria-hidden
    >
      <div
        className="h-8 animate-pulse rounded-md bg-gradient-to-r from-amber-400/20 via-white/10 to-amber-400/20"
        style={{ width: titleWidth, maxWidth: "80vw" }}
      />
      <div className="grid w-full max-w-4xl gap-3">
        <div className="h-24 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" />
        <div className="h-24 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" />
      </div>
    </div>
  );
}
