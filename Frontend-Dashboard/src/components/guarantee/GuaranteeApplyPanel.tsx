"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

const TITLE_32PT: CSSProperties = {
  fontSize: "32pt",
  lineHeight: 1.45,
  letterSpacing: "0.06em",
};

export function GuaranteeApplyPanel() {
  return (
    <section id="guarantee-apply" className="scroll-mt-28">
      <CyberChamferFrame accent="pink" chamfer={18} className="w-full" innerClassName="px-6 py-9 text-center sm:px-10 sm:py-12">
        <h2
          className={`guarantee-page-title ${publicHeadingLightning("fuchsia")} font-black uppercase`}
          style={TITLE_32PT}
        >
          Apply for Refund
        </h2>
        <p className="mx-auto mt-6 max-w-4xl text-lg leading-[1.75] text-zinc-50 sm:mt-7 sm:text-xl sm:leading-[1.8] md:text-[1.4rem] md:leading-[1.85]">
          Verify the email you purchased with, then tell us what went wrong. No account login required — only email OTP
          verification. Requests go to{" "}
          <span className="font-semibold text-cyan-200">intelligence@the-syndicate.com</span>.
        </p>
        <div className="mt-9">
          <Link
            href="/syndicate-guarantee/apply"
            className="hamburger-attract inline-flex min-h-[58px] min-w-[min(260px,86vw)] items-center justify-center rounded-xl border border-fuchsia-300/80 bg-black/80 px-10 py-4 text-lg font-bold uppercase tracking-[0.08em] text-fuchsia-100 shadow-[0_0_24px_rgba(232,121,249,0.45)] transition hover:scale-[1.04] hover:bg-black/95 hover:shadow-[0_0_36px_rgba(232,121,249,0.68)] sm:min-h-[62px] sm:text-xl"
          >
            Apply
          </Link>
        </div>
      </CyberChamferFrame>
    </section>
  );
}
