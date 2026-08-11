"use client";

import { useCallback, useEffect, useState } from "react";

import { DiagnosisQuizRequiredOverlay } from "@/components/diagnosis/DiagnosisQuizRequiredOverlay";
import {
  clearDiagnosisGate,
  clearDiagnosisUnlockIntent,
  diagnosisQuizRequiredResult,
  isDiagnosisUnlockKey,
  persistDiagnosisGate,
  readDiagnosisGate,
  type DiagnosisUnlockResult,
} from "@/lib/diagnosisUnlock";

/**
 * Shows the Syn Diagnosis gate overlay on dashboard after OTP when the email
 * is not registered in the diagnosis quiz. Reads ?diagnosis_gate=1 or sessionStorage.
 */
export function DashboardDiagnosisGateHost() {
  const [gate, setGate] = useState<DiagnosisUnlockResult | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let key: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      if ((params.get("diagnosis_gate") || "").trim() === "1") {
        const fromUrl = (params.get("diagnosis_unlock") || "").trim();
        if (isDiagnosisUnlockKey(fromUrl)) key = fromUrl;
      }
    } catch {
      /* ignore */
    }
    if (!key) key = readDiagnosisGate();
    if (!key || !isDiagnosisUnlockKey(key)) return;

    persistDiagnosisGate(key);
    setGate(diagnosisQuizRequiredResult(key));

    // Clean URL so refresh does not re-fight playlist deep links.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("diagnosis_gate") || url.searchParams.has("diagnosis_unlock")) {
        url.searchParams.delete("diagnosis_gate");
        url.searchParams.delete("diagnosis_unlock");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onClose = useCallback(() => {
    clearDiagnosisGate();
    clearDiagnosisUnlockIntent();
    setGate(null);
  }, []);

  if (!gate) return null;
  return <DiagnosisQuizRequiredOverlay result={gate} onClose={onClose} />;
}
