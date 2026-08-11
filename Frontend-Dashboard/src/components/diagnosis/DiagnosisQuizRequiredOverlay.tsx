"use client";

import Link from "next/link";

import { DASHBOARD_HEADING_LIGHTNING } from "@/components/dashboard/dashboardPrimitives";
import {
  DIAGNOSIS_QUIZ_REQUIRED_DETAIL,
  type DiagnosisUnlockResult,
} from "@/lib/diagnosisUnlock";
import { cn } from "@/lib/cn";

type Props = {
  result: DiagnosisUnlockResult;
  onClose?: () => void;
};

export function DiagnosisQuizRequiredOverlay({ result, onClose }: Props) {
  const title = result.program_title || "this program";
  const quizUrl = result.quiz_url || "/quiz";
  const detail = result.detail || DIAGNOSIS_QUIZ_REQUIRED_DETAIL;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnosis-gate-title"
    >
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-xl border border-cyan-300/40 bg-[#05070d]/96 p-6 shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_40px_rgba(34,211,238,0.18),0_0_48px_rgba(168,85,247,0.12)] sm:p-8",
        )}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(420px_200px_at_10%_0%,rgba(34,211,238,0.16),transparent_65%),radial-gradient(380px_180px_at_100%_100%,rgba(244,63,94,0.12),transparent_70%)]" />
        <div className="relative z-[1]">
          <p className="mb-2 text-[12px] font-black uppercase tracking-[0.16em] text-cyan-200/80">
            Syndicate access gate
          </p>
          <h2
            id="diagnosis-gate-title"
            className={`${DASHBOARD_HEADING_LIGHTNING} text-[clamp(1.15rem,1.2vw+0.85rem,1.5rem)] font-black uppercase tracking-[0.08em]`}
          >
            Syn Diagnosis required
          </h2>
          <p className="mt-4 text-[16px] font-semibold leading-relaxed text-amber-50 sm:text-[17px]">
            {detail}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-300/85">
            Complete Syn Diagnosis, then return with the same email to unlock{" "}
            <span className="font-semibold text-amber-100">{title}</span>.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={quizUrl}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-md border border-amber-300/55 bg-amber-400/20 px-5 py-3 text-center text-[14px] font-black uppercase tracking-[0.08em] text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.2)] transition hover:bg-amber-400/30"
            >
              Syn Diagnosis
            </Link>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-white/20 bg-black/40 px-5 py-3 text-[14px] font-black uppercase tracking-[0.08em] text-slate-200 transition hover:bg-white/10"
              >
                Stay on dashboard
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
