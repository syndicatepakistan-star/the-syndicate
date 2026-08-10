"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DiagnosisQuizRequiredOverlay } from "@/components/diagnosis/DiagnosisQuizRequiredOverlay";
import { DASHBOARD_HEADING_LIGHTNING } from "@/components/dashboard/dashboardPrimitives";
import {
  clearDiagnosisUnlockIntent,
  diagnosisLoginHref,
  diagnosisUnlockTitle,
  persistDiagnosisUnlockIntent,
  type DiagnosisUnlockKey,
  type DiagnosisUnlockResult,
} from "@/lib/diagnosisUnlock";
import { hasSimpleAuthSessionClient, portalFetch, persistSimpleAuthSession } from "@/lib/portal-api";

type Props = { programKey: DiagnosisUnlockKey };

/**
 * Unique share URL entry: stash intent and send the user through OTP login.
 * If already signed in, claim unlock immediately (or show diagnosis quiz gate).
 */
export function DiagnosisAccessEntry({ programKey }: Props) {
  const router = useRouter();
  const title = diagnosisUnlockTitle(programKey);
  const [gate, setGate] = useState<DiagnosisUnlockResult | null>(null);
  const [status, setStatus] = useState("Preparing secure login…");

  useEffect(() => {
    let cancelled = false;
    persistDiagnosisUnlockIntent(programKey);

    void (async () => {
      if (hasSimpleAuthSessionClient()) {
        setStatus("Checking diagnosis access…");
        const { ok, data } = await portalFetch<{
          diagnosis_unlock?: DiagnosisUnlockResult;
          token?: string | null;
          user?: { id?: number; email?: string; username?: string } | null;
          redirect_url?: string;
        }>("/api/auth/diagnosis-unlock/claim/", {
          method: "POST",
          body: JSON.stringify({ diagnosis_unlock: programKey }),
        });
        if (cancelled) return;
        const unlock = data?.diagnosis_unlock;
        if (ok && unlock?.status === "unlocked" && unlock.redirect_path) {
          clearDiagnosisUnlockIntent();
          if (data.token && data.user) {
            persistSimpleAuthSession(data.token, {
              email: data.user.email || data.user.username || "",
              userId: data.user.id,
            });
          }
          window.location.replace(unlock.redirect_path);
          return;
        }
        if (unlock?.status === "quiz_required") {
          setGate(unlock);
          setStatus("");
          return;
        }
        if (unlock?.status === "playlist_missing" || unlock?.status === "invalid_program") {
          setStatus(unlock.detail || "This program is unavailable.");
          return;
        }
      }
      router.replace(diagnosisLoginHref(programKey));
    })();

    return () => {
      cancelled = true;
    };
  }, [programKey, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#05070d] px-4">
      {gate ? (
        <DiagnosisQuizRequiredOverlay
          result={gate}
          onClose={() => {
            clearDiagnosisUnlockIntent();
            router.replace("/login");
          }}
        />
      ) : (
        <div className="max-w-md text-center">
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-cyan-200/75">
            Diagnosis access
          </p>
          <h1
            className={`${DASHBOARD_HEADING_LIGHTNING} mt-2 text-[clamp(1.2rem,2vw+0.8rem,1.6rem)] font-black uppercase tracking-[0.1em]`}
          >
            {title}
          </h1>
          <p className="mt-3 text-[15px] text-slate-300/85">{status || "Preparing secure login…"}</p>
        </div>
      )}
    </div>
  );
}
