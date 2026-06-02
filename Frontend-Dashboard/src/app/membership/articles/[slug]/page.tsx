"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { recordMembershipArticleRead } from "@/lib/membership-read-history";
import { fetchAuthenticatedPdfBlob, portalFetch } from "@/lib/portal-api";
import type { ArticleDto } from "@/components/membership/ArticleCard";
import { MembershipArticleReader, type ArticleReaderState } from "@/components/membership/MembershipArticleReader";

const ARTICLES_HREF = "/dashboard?section=resources";
type ArticleDetailResponse = ArticleDto & { detail?: string };
type ArticleRequestResult = { ok: boolean; status: number; data: ArticleDetailResponse };
const articleDetailCache = new Map<string, ArticleDto>();
const articleDetailInFlight = new Map<string, Promise<ArticleRequestResult>>();

function fetchArticleDetail(slug: string): Promise<ArticleRequestResult> {
  const cached = articleDetailInFlight.get(slug);
  if (cached) return cached;
  const path = `/api/portal/membership/articles/${encodeURIComponent(slug)}/`;
  const req = portalFetch<ArticleDetailResponse>(path).then((res) => ({
    ok: res.ok,
    status: res.status,
    data: res.data,
  }));
  articleDetailInFlight.set(slug, req);
  return req.finally(() => {
    articleDetailInFlight.delete(slug);
  });
}

/** Turn a single very long paragraph into two for readability (sentence boundary near the middle). */
function splitLongProseForDisplay(text: string, minChars = 520): string[] {
  const t = text.trim();
  if (t.length < minChars) return [t];
  const target = Math.floor(t.length * 0.45);
  const windowStart = Math.max(0, target - 320);
  const windowEnd = Math.min(t.length, target + 320);
  const slice = t.slice(windowStart, windowEnd);
  const idx = slice.lastIndexOf(". ");
  if (idx === -1) return [t];
  const splitAt = windowStart + idx + 1;
  const a = t.slice(0, splitAt).trim();
  const b = t.slice(splitAt).trim();
  if (!a || !b) return [t];
  return [a, b];
}

function formatPublishedDate(iso: string): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadMinutesFromText(text: string): number {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 1;
  return Math.max(1, Math.round(words / 220));
}

function stripBulletPrefix(text: string): string {
  return text.replace(/^\s*[-•*]\s*/, "").trim();
}

function toSentence(text: string): string {
  const t = (text || "").trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function buildDetailedBreakdown(article: ArticleDto, contentBlocks: string[]): string[] {
  const description = (article.description || "").trim();
  const focus = (article.generation_seed_keyword || "").trim();
  const category = (article.generation_seed_category || "").trim();
  const level = (article.generation_seed_level || "").trim();
  const tags = (article.tags || []).filter(Boolean).slice(0, 4);

  const keyPointBlock = contentBlocks.find((b, idx, arr) => {
    if (b.toLowerCase() === "key points") {
      const next = arr[idx + 1] || "";
      return /^[-•*]\s/.test(next.trim());
    }
    return false;
  });
  const bullets = keyPointBlock
    ? []
    : contentBlocks
        .flatMap((block) => block.split("\n"))
        .map(stripBulletPrefix)
        .filter((line) => line.length > 12)
        .slice(0, 4);

  const p1 = toSentence(
    description ||
      "This article outlines a practical operator standard designed to improve consistency, presentation, and long-term execution quality."
  );
  const p2 = toSentence(
    bullets.length
      ? `In practice, the key actions are: ${bullets.join(" ")}`
      : "Execution improves when the guidance is applied as a repeatable routine rather than a one-time task."
  );
  const p3 = toSentence(
    focus || category
      ? `The core focus is ${focus || category}, and this should be implemented with measurable discipline so progress is visible week over week.`
      : "The central focus should be implemented with measurable discipline so progress is visible week over week."
  );
  const p4 = toSentence(
    `At ${level || "membership"} level, treat this brief as an operating protocol: apply it daily, audit outcomes, and refine execution based on results${
      tags.length ? ` across themes like ${tags.join(", ")}` : ""
    }.`
  );

  return [p1, p2, p3, p4].filter(Boolean);
}

export default function MembershipArticleDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [article, setArticle] = useState<ArticleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  /** Slug from URL for instant title shell before fetch returns. */
  const slugDisplay = useMemo(() => slug.replace(/-/g, " "), [slug]);
  const [reader, setReader] = useState<ArticleReaderState>(null);

  const closeReader = useCallback(() => {
    setReader((prev) => {
      if (prev?.kind === "pdf") URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setErr("Missing article.");
      return;
    }
    const cachedArticle = articleDetailCache.get(slug);
    if (cachedArticle) {
      setArticle(cachedArticle);
      setLoading(false);
      setErr(null);
      recordMembershipArticleRead(slug);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const { ok, data, status } = await fetchArticleDetail(slug);
      if (cancelled) return;
      setLoading(false);
      if (!ok) {
        setArticle(null);
        setErr(
          status === 401
            ? "Unable to load this article right now."
            : typeof data === "object" && data && "detail" in data
              ? String(data.detail)
              : "Article could not be loaded."
        );
        return;
      }
      const loaded = data as ArticleDto;
      articleDetailCache.set(slug, loaded);
      setArticle(loaded);
      recordMembershipArticleRead(slug);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const openPdf = async () => {
    if (!article?.pdf_url?.trim()) return;
    try {
      const blob = await fetchAuthenticatedPdfBlob(article.pdf_url.trim());
      const blobUrl = URL.createObjectURL(blob);
      setReader({ kind: "pdf", title: article.title, blobUrl });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open PDF.");
    }
  };

  const openWeb = () => {
    if (!article?.source_url?.trim()) return;
    setReader({ kind: "web", title: article.title, url: article.source_url.trim() });
  };

  const contentBlocks = useMemo(() => {
    if (!article?.content?.trim()) return [];
    return article.content.split("\n\n").map((b) => b.trim()).filter(Boolean);
  }, [article?.content]);

  const publishedLabel = article ? formatPublishedDate(article.published_at) : null;
  const articleBodyText = useMemo(() => (contentBlocks.length ? contentBlocks.join(" ") : article?.description || ""), [contentBlocks, article?.description]);
  const readMinutes = useMemo(() => estimateReadMinutesFromText(articleBodyText), [articleBodyText]);
  const articleWordCount = useMemo(
    () => articleBodyText.trim().split(/\s+/).filter(Boolean).length,
    [articleBodyText]
  );
  const detailedBreakdown = useMemo(
    () => (article ? buildDetailedBreakdown(article, contentBlocks) : []),
    [article, contentBlocks]
  );
  const showFatal = !loading && Boolean(err || (!article && slug));

  let mainContent: ReactNode = null;
  if (showFatal) {
    mainContent = (
      <div className="fluid-page-px mx-auto max-w-lg py-12 text-neutral-100 sm:py-16">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141416] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <p className="text-[15px] leading-relaxed text-red-200/90">{err || "Not found."}</p>
          <Link
            href={ARTICLES_HREF}
            prefetch
            className="mt-6 inline-flex text-[14px] font-semibold text-[color:var(--gold-neon)] transition hover:text-amber-200"
          >
            ← Back to articles
          </Link>
        </div>
      </div>
    );
  } else if (loading) {
    mainContent = (
      <article className="fluid-page-px mx-auto w-full min-w-0 max-w-5xl pb-16 pt-8 sm:pb-20 sm:pt-12">
        <div className="membership-article-shiny-frame w-full min-w-0">
          <div className="membership-article-shiny-inner px-[clamp(0.875rem,3.5vw,1.75rem)] py-7 sm:px-6 sm:py-9 md:px-8 md:py-11">
            <div className="mb-8 aspect-[16/9] w-full max-w-3xl animate-pulse rounded-xl bg-white/[0.06] sm:mx-auto" />
            <header className="min-w-0 border-b border-white/[0.08] pb-8 sm:pb-10">
              <div className="h-9 max-w-3xl animate-pulse rounded-lg bg-white/[0.08] sm:mx-auto" />
              <p className="mx-auto mt-5 max-w-2xl text-center text-[13px] capitalize text-neutral-500 sm:mt-6">
                {slugDisplay}
              </p>
            </header>
            <div className="mt-10 space-y-3 sm:mt-12">
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
              <div className="h-3 w-[88%] animate-pulse rounded bg-white/[0.04]" />
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
              <div className="h-3 w-[72%] animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </article>
    );
  } else if (article) {
    const articleTags = (article.tags || []).filter(Boolean).slice(0, 8);
    mainContent = (
      <article className="fluid-page-px mx-auto w-full min-w-0 max-w-[96rem] pb-16 pt-8 sm:pb-20 sm:pt-12">
        <div className="membership-article-shiny-frame w-full min-w-0 border border-[color:var(--gold-neon-border-mid)]/55 bg-[linear-gradient(180deg,rgba(8,8,10,0.96),rgba(4,4,6,0.98))] shadow-[0_28px_90px_rgba(0,0,0,0.5),0_0_34px_rgba(250,204,21,0.08)]">
          <div className="membership-article-shiny-inner px-[clamp(0.875rem,3.5vw,2rem)] py-7 sm:px-8 sm:py-10 md:px-10 md:py-12">
            <div className="mb-7 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                {readMinutes} min read
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                {contentBlocks.length || 1} sections
              </span>
            </div>

            {article.thumbnail?.trim() ? (
              <figure className="mb-10 overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <img src={article.thumbnail.trim()} alt="" className="aspect-[16/9] w-full object-cover" />
              </figure>
            ) : null}

            <header className="min-w-0 border-b border-white/[0.08] pb-8 sm:pb-10">
              <h1 className="membership-article-title w-full min-w-0 text-left text-[clamp(1.65rem,3.1vw+0.8rem,2.8rem)] font-semibold leading-[1.12] tracking-tight text-cyan-300 [text-shadow:0_0_14px_rgba(34,211,238,0.62),0_0_30px_rgba(34,211,238,0.42),0_0_52px_rgba(14,165,233,0.34)] sm:text-center">
                {article.title}
              </h1>
              {article.description?.trim() ? (
                <p className="membership-article-prose mt-5 w-full min-w-0 text-left text-[15px] leading-[1.78] text-neutral-300 sm:mx-auto sm:mt-6 sm:max-w-5xl sm:text-[18px] sm:leading-[1.86]">
                  {article.description}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
                {publishedLabel ? (
                  <span className="rounded-md border border-white/15 bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-neutral-300">
                    Published: {publishedLabel}
                  </span>
                ) : null}
                {articleTags.length > 0
                  ? articleTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-cyan-100/95"
                      >
                        {tag}
                      </span>
                    ))
                  : null}
              </div>
              {article.generation_seed_keyword?.trim() ? (
                <div className="mt-5 rounded-lg border border-emerald-400/25 bg-emerald-950/20 px-4 py-3 text-left sm:mx-auto sm:max-w-5xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200/80">
                    Dataset keyword — Ctrl+F this in admin → All keywords
                  </p>
                  <p className="mt-1 font-mono text-[14px] leading-snug text-emerald-100/95 sm:text-[15px]">
                    {article.generation_seed_keyword
                      .trim()
                      .replace(/\s+-\s+(business|money|power|grooming|others)\s*$/i, "")}
                  </p>
                  {article.generation_seed_category?.trim() ? (
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-emerald-200/70">
                      Category: {article.generation_seed_category.trim()}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </header>

            <section className="mt-8 rounded-xl border border-amber-300/20 bg-[linear-gradient(180deg,rgba(250,204,21,0.09),rgba(0,0,0,0.18))] p-4 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.09)] sm:mt-10 sm:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200/90">Executive summary</p>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-100/95 sm:text-[15px]">
                {article.description?.trim()
                  ? article.description
                  : "This brief outlines key tactical insights from the membership archive. Study the sections below and apply one action immediately."}
              </p>
            </section>

            <div className="mt-8 sm:mt-10">
              {contentBlocks.length > 0 ? (
              <div className="membership-article-prose min-w-0 space-y-7 text-left text-[15px] leading-[1.84] text-neutral-200 sm:space-y-8 sm:text-[18px] sm:leading-[1.92]">
                {contentBlocks.map((block, i) => {
                  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
                  const isBulletBlock = lines.length > 0 && lines.every((line) => /^[-•*]\s/.test(line));
                  const isSeedLine = /^seed:\s/i.test(block.trim());

                  const sectionHeadingClass =
                    "w-full min-w-0 border-b border-white/[0.12] pb-3 text-left text-[13px] font-semibold uppercase leading-snug tracking-[0.16em] text-[color:var(--gold-neon)] sm:text-[15px] sm:pb-3.5 sm:tracking-[0.18em]";

                  if (block.toLowerCase() === "key points") {
                    return (
                      <h2 key={i} className={sectionHeadingClass}>
                        Key points
                      </h2>
                    );
                  }

                  if (isSeedLine) {
                    return (
                      <p key={i} className={sectionHeadingClass} role="note">
                        {block}
                      </p>
                    );
                  }

                  const isShortHeading =
                    block.length < 80 &&
                    !block.includes(".") &&
                    lines.length === 1 &&
                    /^[A-Za-z]/.test(block) &&
                    block.toLowerCase() !== "key points";

                  if (isShortHeading && !isBulletBlock) {
                    return (
                      <h2 key={i} className={sectionHeadingClass}>
                        {block}
                      </h2>
                    );
                  }

                  if (isBulletBlock) {
                    const items = block
                      .split("\n")
                      .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
                      .filter(Boolean);
                    return (
                      <ul key={i} className="list-none space-y-3.5 pl-0 sm:space-y-4">
                        {items.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-left text-neutral-200/95 sm:gap-3.5">
                            <span
                              className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--gold-neon)]/75 shadow-[0_0_10px_rgba(250,204,21,0.35)] sm:mt-[0.5em] sm:h-2 sm:w-2"
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 text-pretty">{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  const subParas = block
                    .split(/\n{2,}/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (subParas.length > 1) {
                    return (
                      <div key={i} className="space-y-5 sm:space-y-6">
                        {subParas.map((para, k) => (
                          <p key={k} className="min-w-0 text-pretty text-neutral-200/95" lang="en">
                            {para}
                          </p>
                        ))}
                      </div>
                    );
                  }

                  const longParts = splitLongProseForDisplay(block);
                  if (longParts.length > 1) {
                    return (
                      <div key={i} className="space-y-5 sm:space-y-6">
                        {longParts.map((para, k) => (
                          <p key={k} className="min-w-0 text-pretty text-neutral-200/95" lang="en">
                            {para}
                          </p>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <p key={i} className="min-w-0 text-pretty text-neutral-200/95" lang="en">
                      {block}
                    </p>
                  );
                })}

                {detailedBreakdown.length > 0 ? (
                  <section className="rounded-xl border border-amber-300/20 bg-[linear-gradient(180deg,rgba(250,204,21,0.08),rgba(0,0,0,0.2))] px-4 py-5 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.08)] sm:px-5 sm:py-6">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.16em] text-amber-200/95 sm:text-[13px]">
                      Detailed breakdown
                    </h3>
                    <div className="mt-3 space-y-4 text-[14px] leading-relaxed text-neutral-200 sm:space-y-5 sm:text-[16px] sm:leading-[1.8]">
                      {detailedBreakdown.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
              ) : null}
            </div>

            {(article.pdf_url?.trim() || article.source_url?.trim()) ? (
              <footer className="mt-12 flex w-full min-w-0 flex-col gap-3 border-t border-white/[0.08] pt-8 sm:mt-14 sm:flex-row sm:flex-wrap sm:pt-10">
                {article.pdf_url?.trim() ? (
                  <button
                    type="button"
                    onClick={() => void openPdf()}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--gold-neon-border-mid)] bg-[rgba(250,204,21,0.08)] px-6 py-3 text-[14px] font-semibold text-[color:var(--gold-neon)] transition hover:bg-[rgba(250,204,21,0.12)] sm:w-auto"
                  >
                    View PDF
                  </button>
                ) : null}
                {article.source_url?.trim() ? (
                  <button
                    type="button"
                    onClick={openWeb}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-transparent px-6 py-3 text-[14px] font-semibold text-neutral-200 transition hover:border-white/25 hover:bg-white/[0.04] sm:w-auto"
                  >
                    Read online
                  </button>
                ) : null}
              </footer>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0c] text-neutral-100">
      <div className="border-b border-white/[0.06] bg-[#0e0e10]/80">
        <div className="fluid-page-px mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-3 py-4 sm:gap-4">
          <Link
            href={ARTICLES_HREF}
            prefetch
            className="inline-flex items-center rounded-md border border-cyan-300/45 bg-cyan-950/35 px-3 py-1.5 text-[13px] font-semibold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition hover:border-[color:var(--gold-neon-border-mid)] hover:bg-[rgba(250,204,21,0.14)] hover:text-[color:var(--gold-neon)]"
          >
            ← Articles
          </Link>
          {loading ? (
            <span className="inline-flex items-center gap-2 text-[12px] tabular-nums text-cyan-200/75">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
              Loading
            </span>
          ) : publishedLabel ? (
            <time dateTime={article!.published_at} className="text-[12px] tabular-nums text-neutral-500">
              {publishedLabel}
            </time>
          ) : (
            <span className="text-[12px] text-neutral-600">Membership</span>
          )}
        </div>
      </div>

      {mainContent}

      <MembershipArticleReader state={reader} onClose={closeReader} />
    </div>
  );
}
