import Link from "next/link";

/**
 * Crawlable entity line for Google / AI Overviews — sits under the hero, before the globe.
 * Keeps Syndicate tone without competing with the logo as the hero brand signal.
 */
export function HomeEntityStatement() {
  return (
    <section
      id="syndicate-entity"
      aria-label="What The Syndicate is"
      className="relative z-[2] w-full border-y border-amber-400/15 bg-gradient-to-b from-[#08060c] via-black to-black px-4 py-6 sm:px-6 sm:py-8"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300/80 sm:text-xs">
          The Syndicate
        </p>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-200/90 sm:text-base sm:leading-relaxed">
          The Syndicate is an online business education platform for operators — Money Mastery, Syndicate
          Trading, AI automation, Syndicate business models, and Syndicate behaviour psychology — built at{" "}
          <span className="text-amber-100/95">the-syndicate.com</span>. Not a university. Not an exam board.
          A private vault for people who want leverage, not lectures.
        </p>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 sm:text-[11px]">
          <Link href="/programs" className="text-amber-200/90 transition hover:text-amber-100">
            Programs &amp; vaults
          </Link>
          <span className="text-zinc-600" aria-hidden>
            ·
          </span>
          <Link href="/membership" className="text-amber-200/90 transition hover:text-amber-100">
            The Knight
          </Link>
          <span className="text-zinc-600" aria-hidden>
            ·
          </span>
          <Link href="/#faq" className="text-amber-200/90 transition hover:text-amber-100">
            FAQ
          </Link>
        </p>
      </div>
    </section>
  );
}
