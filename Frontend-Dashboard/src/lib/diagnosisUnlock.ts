/** Diagnosis-gated permanent unlock for two Level 1 psychology programs. */

export const DIAGNOSIS_UNLOCK_STORAGE_KEY = "syndicate_diagnosis_unlock_v1";

export const DIAGNOSIS_UNLOCK_PROGRAMS = {
  "mastering-risk-and-uncertainty": {
    key: "mastering-risk-and-uncertainty",
    title: "Mastering Risk and Uncertainty",
    path: "/access/mastering-risk-and-uncertainty",
  },
  "the-secret-to-transformation": {
    key: "the-secret-to-transformation",
    title: "The Secret To Transformation",
    path: "/access/the-secret-to-transformation",
  },
} as const;

export type DiagnosisUnlockKey = keyof typeof DIAGNOSIS_UNLOCK_PROGRAMS;

export type DiagnosisUnlockResult = {
  status: "unlocked" | "quiz_required" | "invalid_program" | "playlist_missing";
  program_key?: string;
  program_title?: string;
  playlist_id?: number;
  playlist_slug?: string;
  redirect_path?: string;
  quiz_url?: string;
  detail?: string;
  user_id?: number;
  user_created?: boolean;
};

export function isDiagnosisUnlockKey(value: string | null | undefined): value is DiagnosisUnlockKey {
  return !!value && value in DIAGNOSIS_UNLOCK_PROGRAMS;
}

export function diagnosisUnlockTitle(key: DiagnosisUnlockKey): string {
  return DIAGNOSIS_UNLOCK_PROGRAMS[key].title;
}

export function persistDiagnosisUnlockIntent(key: DiagnosisUnlockKey) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DIAGNOSIS_UNLOCK_STORAGE_KEY, key);
  } catch {
    /* ignore */
  }
}

export function readDiagnosisUnlockIntent(): DiagnosisUnlockKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = (sessionStorage.getItem(DIAGNOSIS_UNLOCK_STORAGE_KEY) || "").trim();
    return isDiagnosisUnlockKey(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function clearDiagnosisUnlockIntent() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DIAGNOSIS_UNLOCK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function diagnosisLoginHref(key: DiagnosisUnlockKey): string {
  const params = new URLSearchParams();
  params.set("diagnosis_unlock", key);
  return `/login?${params.toString()}`;
}
