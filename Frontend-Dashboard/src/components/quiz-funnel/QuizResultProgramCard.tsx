"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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
      ? nextOptimizedImageUrl(rawThumb, 480)
      : optimizeCoverImageSrc(rawThumb, 480) ?? rawThumb
    : "";

  const href = isFree
    ? buildFreeTicketLoginHref(loginEmail, courseTitle)
    : meta.unlockHref;

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
                  <X className="h-5 w-5" aria-hidden />
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
            />
          ) : (
            <div className="result-program-card__img-fallback" aria-hidden />
          )}
          <div className="result-program-card__media-overlay" aria-hidden />
          {isFree ? <span className="result-program-card__free-badge">Free</span> : null}
        </div>
        <div className="result-program-card__body">
          <h3 className="result-program-card__title">{meta.title}</h3>
          <p className="result-program-card__desc">{meta.description}</p>
          <div className="result-program-card__actions">
            <button
              type="button"
              className="result-program-card__details-btn"
              onClick={() => setDetailsOpen(true)}
            >
              Details
            </button>
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
        </div>
      </article>
      {detailsModal}
    </>
  );
}
