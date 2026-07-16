"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { loadOperatorBrief, type StoredOperatorBrief } from "@/lib/operator-brief-storage";

const ARTICLES_HREF = "/dashboard/resources";

/** Improve readability when the dataset seed is mostly uppercase. */
function displaySeedText(s: string): string {
  const t = (s || "").trim();
  if (t.length < 20) return t;
  const letters = t.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 8) return t;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (upper / letters.length < 0.65) return t;
  return t
    .split(/(\s+)/)
    .map((part) => {
      if (!/[A-Za-z]/.test(part)) return part;
      const lower = part.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

export default function OperatorBriefDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [brief, setBrief] = useState<StoredOperatorBrief | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setBrief(null);
      return;
    }
    setBrief(loadOperatorBrief(id));
  }, [id]);

  if (brief === undefined) {
    return (
      <div className="min-h-screen bg-[#080808] p-6 text-neutral-200">
        <div className="mx-auto max-w-4xl text-[17px] text-neutral-400">Loading…</div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen bg-[#080808] p-6 text-neutral-100">
        <div className="shell-neon-yellow cut-frame cyber-frame gold-stroke relative mx-auto max-w-4xl border border-white/15 bg-[#0c0c0c] p-8 sm:p-10">
          <h1 className="text-xl font-bold text-neutral-50 sm:text-2xl">Brief not found</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-neutral-400 sm:text-[17px]">
            This brief is only kept for your current browser session. Generate a new one from Member Intelligence →
            Operator briefs.
          </p>
          <Link
            href={ARTICLES_HREF}
            className="mt-6 inline-flex rounded-lg border border-[rgba(250,204,21,0.45)] px-5 py-3 text-[13px] font-black uppercase tracking-[0.16em] text-[color:var(--gold-neon)]"
          >
            Back to articles
          </Link>
        </div>
      </div>
    );
  }

  const seedDisplay = displaySeedText(
    [brief.keyword_used, brief.category_used].filter(Boolean).join(" · ") || ""
  );

  return (
    <div className="min-h-screen bg-[#080808] p-6 text-neutral-100">
      <div className="shell-neon-yellow cut-frame cyber-frame gold-stroke relative mx-auto max-w-4xl border border-white/15 bg-[#0c0c0c] p-8 sm:p-10">
        <div className="absolute inset-0 opacity-70 [background:radial-gradient(820px_520px_at_40%_0%,rgba(250,204,21,0.09),rgba(0,0,0,0)_64%)]" />
        <div className="relative space-y-10">
          <div>
            <Link
              href={ARTICLES_HREF}
              className="text-[13px] font-bold uppercase tracking-[0.14em] text-amber-300 hover:text-amber-200"
            >
              ← Back to articles
            </Link>
            <h1 className="mt-5 text-[clamp(1.65rem,4vw+0.6rem,2.35rem)] font-bold leading-[1.15] tracking-tight text-neutral-50">
              {brief.title}
            </h1>
            {brief.article_slug ? (
              <Link
                href={`/membership/articles/${encodeURIComponent(brief.article_slug)}`}
                className="mt-4 inline-flex text-[15px] font-semibold text-amber-300 underline decoration-amber-500/60 underline-offset-[5px] hover:text-amber-200"
              >
                Open saved library article →
              </Link>
            ) : null}
            {seedDisplay ? (
              <div className="mt-6 rounded-xl border border-white/18 bg-black/55 p-5 sm:p-6">
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-amber-300">Seed</p>
                <p className="mt-3 text-[17px] font-medium leading-[1.7] text-neutral-50 sm:text-[18px]">{seedDisplay}</p>
              </div>
            ) : null}
          </div>

          <section>
            <h2 className="mb-4 text-[13px] font-black uppercase tracking-[0.18em] text-amber-300">Key points</h2>
            <ul className="list-disc space-y-4 pl-6 marker:text-amber-400 sm:pl-7">
              {(brief.key_points || [])
                .filter((p) => p && p.trim())
                .map((point, i) => (
                  <li key={i} className="text-[17px] leading-[1.65] text-neutral-50 sm:text-[18px]">
                    {point}
                  </li>
                ))}
            </ul>
          </section>

          <section className="space-y-6 sm:space-y-7">
            {(brief.paragraphs || [])
              .filter((p) => p && p.trim())
              .map((para, i) => (
                <p key={i} className="text-[17px] leading-[1.85] text-neutral-50 sm:text-[18px]">
                  {para}
                </p>
              ))}
          </section>
        </div>
      </div>
    </div>
  );
}
