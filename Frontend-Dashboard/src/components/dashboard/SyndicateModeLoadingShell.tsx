"use client";

/** Lightweight shell shown while the Syndicate challenge panel chunk loads. */
export function SyndicateModeLoadingShell() {
  return (
    <div
      className="syndicate-readable flex min-h-[min(52vh,520px)] flex-col items-center justify-center gap-4 py-16"
      role="status"
      aria-live="polite"
      aria-label="Loading Syndicate Mode"
    >
      <div
        className="h-11 w-11 animate-spin rounded-full border-2 border-[rgba(255,215,0,0.35)] border-t-[color:var(--gold)]"
        aria-hidden
      />
      <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-white/55">Loading Syndicate Mode…</p>
      <p className="max-w-sm px-4 text-center text-[12px] text-white/40">
        Missions, streak, and bonus tasks load in parallel.
      </p>
    </div>
  );
}
