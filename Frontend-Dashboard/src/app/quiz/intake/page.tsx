"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import BrandHeader from "@/components/quiz-funnel/BrandHeader";
import {
  fetchIntakeSession,
  submitIntake,
  type QuizIntakeQuestion,
} from "@/lib/quizFunnelApi";
import "./quiz-intake.css";

const NEON_ACCENTS = ["cyan", "fuchsia", "amber", "emerald", "violet"] as const;

function accentForIndex(index: number): (typeof NEON_ACCENTS)[number] {
  return NEON_ACCENTS[index % NEON_ACCENTS.length];
}

function IntakePageInner() {
  const searchParams = useSearchParams();
  const refParam = (searchParams.get("ref") || "").trim();
  const emailParam = (searchParams.get("email") || "").trim();

  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [questions, setQuestions] = useState<QuizIntakeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  /** Resolved identity from API (email link may also return intake_ref). */
  const [sessionRef, setSessionRef] = useState(refParam);
  const [sessionEmail, setSessionEmail] = useState(emailParam);

  useEffect(() => {
    if (!refParam && !emailParam) {
      setSessionError(
        "This link is missing your email. Open the link from your Syn Diagnosis email.",
      );
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setSessionError("");
      try {
        const session = await fetchIntakeSession({ ref: refParam, email: emailParam });
        if (cancelled) return;
        if (!session.valid) {
          setSessionError(session.error || "Invalid or expired link.");
          return;
        }
        setFirstName(session.first_name || "");
        setAlreadySubmitted(Boolean(session.already_submitted));
        setQuestions(session.questions || []);
        if (session.intake_ref) setSessionRef(session.intake_ref);
        if (session.email) setSessionEmail(session.email);
        if (session.already_submitted) {
          setDone(true);
        }
      } catch {
        if (!cancelled) {
          setSessionError("Could not load your form. Please try again in a moment.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refParam, emailParam]);

  const allFilled = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q) => (answers[q.id] || "").trim().length >= 2);
  }, [questions, answers]);

  const handleSubmit = useCallback(async () => {
    if ((!sessionRef && !sessionEmail && !refParam && !emailParam) || !allFilled || submitting) {
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        ref: sessionRef || refParam || undefined,
        email: sessionEmail || emailParam || undefined,
        answers: questions.map((q) => ({
          question_id: q.id,
          answer: (answers[q.id] || "").trim(),
        })),
      };
      const result = await submitIntake(payload);
      setDone(true);
      setAlreadySubmitted(Boolean(result.already_submitted));
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    sessionRef,
    sessionEmail,
    refParam,
    emailParam,
    allFilled,
    submitting,
    questions,
    answers,
  ]);

  if (loading) {
    return (
      <main className="quiz-intake-page">
        <section className="quiz-intake-card">
          <BrandHeader subtitle="Loading your follow-up…" />
          <p className="quiz-intake-loading">Preparing your questions…</p>
        </section>
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="quiz-intake-page">
        <section className="quiz-intake-card quiz-intake-card--error">
          <BrandHeader subtitle="Link not recognized" />
          <p className="quiz-intake-error">{sessionError}</p>
        </section>
      </main>
    );
  }

  if (done || alreadySubmitted) {
    return (
      <main className="quiz-intake-page">
        <section className="quiz-intake-card quiz-intake-card--success">
          <BrandHeader
            subtitle={
              firstName
                ? `${firstName} — we already have your answers.`
                : "Thank you — your answers are saved."
            }
          />
          <p className="quiz-intake-thanks">
            Your responses are linked to your Syn Diagnosis profile. You can close this page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="quiz-intake-page">
      <section className="quiz-intake-card">
        <BrandHeader
          subtitle={
            firstName
              ? `${firstName} — 5 quick questions (about 2 minutes).`
              : "5 quick questions — about 2 minutes."
          }
        />
        <p className="quiz-intake-intro">
          Help us understand your situation so we can tailor what you see next. No login — your link already
          identifies you.
        </p>

        <form
          className="quiz-intake-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          {questions.map((q, index) => {
            const accent = accentForIndex(index);
            return (
              <label
                key={q.id}
                className={`quiz-intake-field quiz-intake-field--${accent}`}
              >
                <span className="quiz-intake-field__num">{index + 1}</span>
                <span className="quiz-intake-field__label">{q.label}</span>
                <textarea
                  className="quiz-intake-field__input"
                  name={q.id}
                  rows={3}
                  placeholder={q.placeholder}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  disabled={submitting}
                  maxLength={4000}
                  required
                />
              </label>
            );
          })}

          {submitError ? <p className="quiz-intake-submit-error">{submitError}</p> : null}

          <button
            type="submit"
            className="quiz-intake-submit"
            disabled={!allFilled || submitting}
          >
            {submitting ? "Submitting…" : "Submit answers"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function QuizIntakePage() {
  return (
    <Suspense
      fallback={
        <main className="quiz-intake-page">
          <section className="quiz-intake-card">
            <BrandHeader subtitle="Loading…" />
          </section>
        </main>
      }
    >
      <IntakePageInner />
    </Suspense>
  );
}
