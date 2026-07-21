"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildFreeTicketLoginHref,
  isFreeTicketPsychologyCourse,
} from "@/lib/quizFreeTicketCourses";
import {
  parseStackCourseTitle,
  resolveQuizResultProgramCardMeta,
  type ArchetypeMapLineCategory,
} from "@/lib/quizArchetypeCourseLinks";
import {
  courseActionButtonTheme,
  resolveCourseNeonTheme,
  type CourseNeonTheme,
} from "@/lib/quizResultCourseNeon";
import { nextOptimizedImageUrl, optimizeCoverImageSrc } from "@/lib/optimizeImageUrl";

type Props = {
  courseValue: string;
  category: ArchetypeMapLineCategory;
  loginEmail: string;
  rowThemeOverride?: CourseNeonTheme;
};

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

export function QuizResultProgramCard({
  courseValue,
  category,
  loginEmail,
  rowThemeOverride,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const courseTitle = parseStackCourseTitle(courseValue);
  const meta = resolveQuizResultProgramCardMeta(courseValue, category);
  const isFree =
    meta.isFree ||
    isFreeTicketPsychologyCourse(courseTitle) ||
    category === "free_psychology";
  const rowTheme = rowThemeOverride ?? resolveCourseNeonTheme(courseTitle);
  const btnTheme = courseActionButtonTheme(courseTitle, isFree, rowThemeOverride);

  const rawThumb = (meta.thumbnailSrc ?? "").trim();
  const thumbSrc = rawThumb
    ? rawThumb.startsWith("/")
      ? nextOptimizedImageUrl(rawThumb, 320)
      : optimizeCoverImageSrc(rawThumb, 320) ?? rawThumb
    : "";

  const href = isFree
    ? buildFreeTicketLoginHref(loginEmail, courseTitle)
    : meta.unlockHref;

  const priceLabel = isFree ? "Free" : meta.priceLabel;

  useEffect(() => {
    if (!detailsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detailsOpen]);

  const detailsModal =
    detailsOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="result-program-details-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`quiz-card-details-${meta.unlockButtonId || courseTitle}`}
          >
            <button
              type="button"
              className="result-program-details-backdrop"
              aria-label="Close details"
              onClick={() => setDetailsOpen(false)}
            />
            <div className="result-program-details-panel">
              <div className="result-program-details-head">
                <h2
                  id={`quiz-card-details-${meta.unlockButtonId || courseTitle}`}
                  className="result-program-details-title"
                >
                  {meta.title}
                </h2>
                <button
                  type="button"
                  className="result-program-details-close"
                  aria-label="Close"
                  onClick={() => setDetailsOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="result-program-details-body">
                <p>{meta.detailDescription}</p>
              </div>
              <div className="result-program-details-actions">
                {href ? (
                  <a
                    className={
                      isFree
                        ? `result-ticket-btn result-ticket-btn--${btnTheme}`
                        : `result-unlock-btn result-unlock-btn--${btnTheme}`
                    }
                    href={href}
                  >
                    {isFree ? "Get For Free" : "Unlock"}
                  </a>
                ) : null}
                <button
                  type="button"
                  className="result-program-card__details-btn"
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <article className={`result-program-card result-program-card--${rowTheme}`}>
        <div className="result-program-card__media">
          {thumbSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- quiz funnel uses static/optimized URLs
            <img
              src={thumbSrc}
              alt=""
              className="result-program-card__img"
              loading="lazy"
              decoding="async"
              width={240}
              height={320}
            />
          ) : (
            <div className="result-program-card__img-fallback" aria-hidden />
          )}
          <div className="result-program-card__media-overlay" aria-hidden />
          <span
            className={
              isFree
                ? "result-program-card__price-badge result-program-card__price-badge--free"
                : "result-program-card__price-badge"
            }
          >
            {priceLabel}
            {!isFree ? <span className="result-program-card__price-suffix">lifetime</span> : null}
          </span>
        </div>
        <div className="result-program-card__body">
          <h3 className="result-program-card__title">{meta.title}</h3>
          <button
            type="button"
            className="result-program-card__details-btn"
            onClick={() => setDetailsOpen(true)}
          >
            Details
          </button>
          <p className="result-program-card__desc">{meta.description}</p>
          {href ? (
            <a
              id={meta.unlockButtonId}
              className={
                isFree
                  ? `result-ticket-btn result-ticket-btn--${btnTheme} result-program-card__cta`
                  : `result-unlock-btn result-unlock-btn--${btnTheme} result-program-card__cta`
              }
              href={href}
            >
              {isFree ? "Get For Free" : "Unlock"}
            </a>
          ) : null}
        </div>
      </article>
      {detailsModal}
    </>
  );
}
