"use client";

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
      ? nextOptimizedImageUrl(rawThumb, 640)
      : optimizeCoverImageSrc(rawThumb, 640) ?? rawThumb
    : "";

  const href = isFree
    ? buildFreeTicketLoginHref(loginEmail, courseTitle)
    : meta.unlockHref;

  return (
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
  );
}
