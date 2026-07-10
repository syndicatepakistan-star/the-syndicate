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
      className="relative z-[2] w-full border-y border-amber-400/15 bg-gradient-to-b from-[#08060c] via-black to-black px-4 py-8 sm:px-6 sm:py-10"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-base font-bold uppercase tracking-[0.22em] text-amber-300/90 sm:text-lg md:text-xl">
          The Syndicate
        </p>
        <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-200/95 sm:mt-5 sm:text-lg sm:leading-relaxed md:text-xl md:leading-relaxed">
          The Syndicate is an online business education platform for operators — Money Mastery, Syndicate
          Trading, AI automation, Syndicate business models, and Syndicate behaviour psychology — built at{" "}
          <span className="text-amber-100">The Syndicate</span>. Not a university. Not an exam board. A
          private vault for people who want leverage, not lectures.
        </p>
        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-400 sm:mt-6 sm:text-sm">
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
            faqs
          </Link>
        </p>
      </div>
    </section>
  );
}
