"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export type ArticleDto = {
  id: number;
  title: string;
  slug: string;
  description: string;
  content?: string;
  source_url: string;
  thumbnail: string;
  published_at: string;
  tags: string[];
  is_featured: boolean;
  /** Relative API path e.g. `/api/portal/membership/articles/3/pdf/` when a PDF is stored on the article. */
  pdf_url: string | null;
  generation_seed_keyword?: string;
  generation_seed_category?: string;
  generation_seed_level?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type ArticleCardProps = {
  article: ArticleDto;
  featured?: boolean;
  index?: number;
  /** Opens the PDF inside the membership reader panel (dashboard). */
  onOpenPdf?: (article: ArticleDto) => Promise<void>;
  /** Opens the original article URL inside the membership reader panel (iframe). */
  onOpenWeb?: (article: ArticleDto) => void;
};

export function ArticleCard({ article, featured, index = 0, onOpenPdf, onOpenWeb }: ArticleCardProps) {
  const [pdfOpening, setPdfOpening] = useState(false);
  const [articleOpening, setArticleOpening] = useState(false);
  const hasWeb = Boolean(article.source_url?.trim());
  const hasPdf = Boolean(article.pdf_url?.trim());
  const detailHref = `/membership/articles/${encodeURIComponent(article.slug)}`;
  const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString() : "";

  const handlePdf = async () => {
    if (!onOpenPdf) return;
    setPdfOpening(true);
    try {
      await onOpenPdf(article);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open PDF.");
    } finally {
      setPdfOpening(false);
    }
  };

  const handleWeb = () => {
    onOpenWeb?.(article);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35) }}
      className={cx(
        "group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border bg-black/70 text-left transition duration-300 sm:min-h-[310px]",
        "border-cyan-300/34 shadow-[0_0_0_1px_rgba(0,0,0,0.45),0_0_28px_rgba(34,211,238,0.14),0_18px_42px_rgba(0,0,0,0.5)] before:absolute before:inset-0 before:bg-[radial-gradient(120%_90%_at_0%_0%,rgba(34,211,238,0.2),transparent_48%),radial-gradient(120%_90%_at_100%_100%,rgba(34,211,238,0.14),transparent_52%)] before:content-['']",
        "hover:-translate-y-1 hover:border-cyan-200/78 hover:shadow-[0_0_58px_rgba(34,211,238,0.32),0_20px_50px_rgba(0,0,0,0.58)]",
        featured && "md:min-h-[350px] md:border-cyan-200/62 md:shadow-[0_0_64px_rgba(34,211,238,0.3)]"
      )}
    >
      <div className="relative z-[1] h-[3px] w-full bg-cyan-300/75" />
      <Link
        href={detailHref}
        prefetch
        onClick={() => setArticleOpening(true)}
        className="relative z-[1] flex min-h-0 flex-1 flex-col p-4 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45 sm:p-6"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
            Intel brief
          </span>
          {publishedDate ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{publishedDate}</span>
          ) : null}
        </div>

        {article.thumbnail?.trim() ? (
          <div className="mb-3 aspect-[16/9] w-full overflow-hidden rounded-lg border border-cyan-300/20 bg-black/50">
            <img
              src={article.thumbnail.trim()}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
            />
          </div>
        ) : null}

        <h3
          className={cx(
            "line-clamp-3 font-black italic leading-snug tracking-[0.01em] text-[color:var(--gold-neon)] drop-shadow-[0_0_18px_rgba(250,204,21,0.2)] transition group-hover:text-amber-200 group-hover:drop-shadow-[0_0_24px_rgba(250,204,21,0.3)]",
            featured ? "text-[18px] sm:text-[24px]" : "text-[16px] sm:text-[20px]"
          )}
        >
          {article.title}
        </h3>

        <p className="mt-2.5 line-clamp-3 flex-1 text-[14px] font-medium leading-relaxed text-neutral-200 sm:mt-3 sm:text-[17px]">
          {article.description}
        </p>

        <span
          className={cx(
            "mt-4 inline-flex w-fit items-center gap-2 rounded-md border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 transition group-hover:border-cyan-200/55 group-hover:text-cyan-50",
            articleOpening && "border-cyan-200/65 text-cyan-50"
          )}
          aria-live="polite"
        >
          {articleOpening ? (
            <>
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.65)]" />
              Opening…
            </>
          ) : (
            "Open article page →"
          )}
        </span>
      </Link>

      <div className="relative z-[1] mt-auto flex flex-col gap-2 border-t border-cyan-300/10 px-4 pb-4 pt-3 sm:flex-row sm:gap-3 sm:px-6 sm:pb-6">
        {hasPdf && onOpenPdf ? (
          <button
            type="button"
            disabled={pdfOpening}
            onClick={(e) => {
              e.preventDefault();
              void handlePdf();
            }}
            className="cut-frame-sm cyber-frame gold-stroke premium-gold-border inline-flex flex-1 items-center justify-center bg-black/40 px-3 py-3 text-center text-[11px] font-black uppercase tracking-[0.13em] text-[color:var(--gold-neon)]/92 transition hover:border-[rgba(255,215,0,0.55)] hover:text-[rgba(255,215,0,0.98)] disabled:opacity-50 sm:px-4 sm:py-3.5 sm:text-[13px] sm:tracking-[0.16em]"
          >
            {pdfOpening ? "Loading…" : "View PDF"}
          </button>
        ) : null}
        {hasWeb && onOpenWeb ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleWeb();
            }}
            className={cx(
              "cut-frame-sm cyber-frame gold-stroke premium-gold-border inline-flex flex-1 items-center justify-center bg-black/40 px-4 py-3.5 text-center text-[13px] font-black uppercase tracking-[0.16em] text-[color:var(--gold-neon)]/92 transition hover:border-[rgba(255,215,0,0.55)] hover:text-[rgba(255,215,0,0.98)]",
              "px-3 py-3 text-[11px] tracking-[0.13em] sm:px-4 sm:py-3.5 sm:text-[13px] sm:tracking-[0.16em]",
              hasPdf && onOpenPdf && "border-white/20 text-white/80 hover:text-white/95"
            )}
          >
            Read online
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}
