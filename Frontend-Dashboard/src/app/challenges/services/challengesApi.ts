/**
 * Challenges API — base URL from existing env (single .env / NEXT_PUBLIC_SYNDICATE_API_URL).
 * All paths are under /api/challenges/ on the Django server.
 */
import { getSyndicateAuthHeaders, getSyndicateAuthToken, logoutSyndicateSession } from "@/lib/syndicateAuth";
import { getSyndicateApiBase } from "@/lib/syndicateApiBase";

const API_BASE = getSyndicateApiBase();

export function challengesApiUrl(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE}/challenges/${p}`;
}

/** Thrown after clearing session when the API rejects the token (e.g. DRF "Invalid token."). */
export class SyndicateSessionLostError extends Error {
  constructor() {
    super("Session expired.");
    this.name = "SyndicateSessionLostError";
  }
}

/**
 * Call after an authenticated request. If the server returns 401 and we had sent a token, clears storage and sends the user to login.
 */
export function ensureSyndicateSessionOrRedirect(r: Response, hadAuthToken: boolean): void {
  if (r.status !== 401 || !hadAuthToken) return;
  logoutSyndicateSession();
  if (typeof window !== "undefined") {
    window.location.replace("/");
  }
  throw new SyndicateSessionLostError();
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const tokenBefore = getSyndicateAuthToken();
  const headers = {
    ...(init?.headers ?? {}),
    ...getSyndicateAuthHeaders(false)
  };
  const r = await fetch(url, { ...init, headers });
  ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
  return r;
}

export type SyndicateProgressPayload = {
  state: Record<string, string>;
  streak_count: number;
  last_activity_date: string | null;
};

function parseProgressJson(j: {
  state?: Record<string, unknown>;
  streak_count?: unknown;
  last_activity_date?: unknown;
  detail?: string;
}): SyndicateProgressPayload {
  const raw = j.state || {};
  const state: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined) continue;
    state[k] = typeof v === "string" ? v : String(v);
  }
  const sc = j.streak_count;
  const streak_count = typeof sc === "number" && Number.isFinite(sc) ? sc : parseInt(String(sc ?? "0"), 10) || 0;
  const lad = j.last_activity_date;
  const last_activity_date =
    lad == null || lad === "" ? null : typeof lad === "string" ? lad.slice(0, 10) : String(lad).slice(0, 10);
  return { state, streak_count, last_activity_date };
}

export async function fetchSyndicateProgress(): Promise<SyndicateProgressPayload> {
  if (!getSyndicateAuthToken()) {
    return { state: {}, streak_count: 0, last_activity_date: null };
  }
  const r = await apiFetch(challengesApiUrl("me/progress/"), { cache: "no-store" });
  if (r.status === 403) {
    return { state: {}, streak_count: 0, last_activity_date: null };
  }
  const j = (await r.json()) as { state?: Record<string, unknown>; streak_count?: unknown; last_activity_date?: unknown; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load progress");
  return parseProgressJson(j);
}


export async function patchSyndicateProgress(state: Record<string, string>): Promise<SyndicateProgressPayload> {
  if (!getSyndicateAuthToken()) {
    return parseProgressJson({
      state: { ...state },
      streak_count: 0,
      last_activity_date: null
    });
  }
  const r = await apiFetch(challengesApiUrl("me/progress/"), {
    method: "PATCH",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ state })
  });
  const j = (await r.json()) as { state?: Record<string, unknown>; streak_count?: unknown; last_activity_date?: unknown; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to save progress");
  return parseProgressJson(j);
}

export async function postSyndicateStreakRecord(activityDate?: string): Promise<{ ok: boolean; streak_count: number; last_activity_date: string }> {
  if (!getSyndicateAuthToken()) {
    throw new Error("Syndicate login required for streak sync");
  }
  const body: Record<string, string> = {};
  if (activityDate) body.activity_date = activityDate;
  const r = await apiFetch(challengesApiUrl("me/streak_record/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify(body)
  });
  const j = (await r.json()) as { ok?: boolean; streak_count?: unknown; last_activity_date?: string; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Could not update streak");
  const sc = j.streak_count;
  const streak_count = typeof sc === "number" && Number.isFinite(sc) ? sc : parseInt(String(sc ?? "0"), 10) || 0;
  const last_activity_date = (j.last_activity_date || activityDate || "").slice(0, 10);
  return { ok: !!j.ok, streak_count, last_activity_date };
}

export async function postSyndicateStreakRestore(streakCount: number): Promise<SyndicateProgressPayload> {
  if (!getSyndicateAuthToken()) {
    throw new Error("Syndicate login required for streak restore");
  }
  const r = await apiFetch(challengesApiUrl("me/streak_restore/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ streak_count: streakCount })
  });
  const j = (await r.json()) as { state?: Record<string, unknown>; streak_count?: unknown; last_activity_date?: unknown; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Could not restore streak");
  return parseProgressJson(j);
}

export type ChallengePayload = {
  challenge_title: string;
  challenge_description: string;
  /** Set when row was created via user_task API. */
  user_created?: boolean;
  /** Legacy single field; prefer example_tasks */
  example_task?: string;
  /** Legacy single field; prefer benefits_list */
  benefits?: string;
  example_tasks?: string[];
  benefits_list?: string[];
  based_on_mindset: string;
  suitable_moods: string[];
  category?: string;
  difficulty?: string;
  points?: number;
  slot?: number;
};

function splitLegacyLines(text: string | undefined, max: number): string[] {
  const t = (text ?? "").trim();
  if (!t) return [];
  let parts = t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, max);
  parts = t
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, max);
  const sents = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sents.length >= 2) return sents.slice(0, max);
  return [t];
}

/** Up to three example lines for UI (new API or legacy). */
export function getChallengeExamples(p: ChallengePayload): string[] {
  if (Array.isArray(p.example_tasks) && p.example_tasks.length) {
    const xs = p.example_tasks.map((x) => String(x).trim()).filter(Boolean);
    if (xs.length) return xs.slice(0, 3);
  }
  return splitLegacyLines(p.example_task, 3);
}

/** Up to three benefit lines for UI (new API or legacy). */
export function getChallengeBenefits(p: ChallengePayload): string[] {
  if (Array.isArray(p.benefits_list) && p.benefits_list.length) {
    const xs = p.benefits_list.map((x) => String(x).trim()).filter(Boolean);
    if (xs.length) return xs.slice(0, 3);
  }
  return splitLegacyLines(p.benefits, 3);
}

export type ChallengeRow = {
  id: number;
  mood: string;
  category: string;
  difficulty: string;
  points: number;
  slot: number;
  challenge_date: string | null;
  payload: ChallengePayload;
  created_at: string;
  /** True when this row was created via POST user_task/ for this device. */
  user_created?: boolean;
};

export type ChallengesTodayResponse = {
  results: ChallengeRow[];
  detail?: string;
  /** False while background generation streams categories into the DB (poll until true). */
  batch_complete?: boolean;
  /** True when the server is still generating today’s agent batch (incremental). */
  generating?: boolean;
};

export async function fetchChallengesToday(deviceId?: string): Promise<ChallengesTodayResponse> {
  const q = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const r = await apiFetch(challengesApiUrl(`today/${q}`), { cache: "no-store" });
  const j = (await r.json()) as ChallengesTodayResponse;
  if (r.status === 403) {
    return { results: [], batch_complete: true, generating: false };
  }
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load missions");
  }
  return j;
}

/** Poll until batch_complete or generating stops (incremental daily generation). */
export async function fetchChallengesTodayUntilComplete(
  deviceId: string,
  opts?: {
    intervalMs?: number;
    maxPolls?: number;
    /** Called after each fetch so the UI can show missions as categories finish saving. */
    onPartial?: (td: ChallengesTodayResponse) => void;
  }
): Promise<ChallengesTodayResponse> {
  const intervalMs = opts?.intervalMs ?? 450;
  const maxPolls = opts?.maxPolls ?? 120;
  let td = await fetchChallengesToday(deviceId);
  opts?.onPartial?.(td);
  let polls = 0;
  while (td.generating === true && td.batch_complete === false && polls < maxPolls) {
    await new Promise((r) => setTimeout(r, intervalMs));
    td = await fetchChallengesToday(deviceId);
    opts?.onPartial?.(td);
    polls += 1;
  }
  return td;
}

function drfDetailMessage(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((x) => (typeof x === "string" ? x : String(x))).filter(Boolean);
    return parts.length ? parts.join(" ") : null;
  }
  return null;
}

export async function postUserCustomChallenge(
  deviceId: string,
  title: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<{ result: ChallengeRow }> {
  const r = await apiFetch(challengesApiUrl("user_task/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ device_id: deviceId, title: title.trim(), difficulty })
  });
  const j = (await r.json()) as { result?: ChallengeRow; detail?: unknown };
  if (!r.ok) {
    throw new Error(drfDetailMessage(j.detail) ?? "Could not create mission");
  }
  if (!j.result) {
    throw new Error("Invalid response");
  }
  return { result: j.result };
}

export async function fetchChallengesRoot(): Promise<ChallengesTodayResponse> {
  const r = await apiFetch(challengesApiUrl(""), { cache: "no-store" });
  const j = (await r.json()) as ChallengesTodayResponse;
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load missions");
  }
  return j;
}

export async function postRegenerateDaily(force = true): Promise<ChallengesTodayResponse> {
  const r = await apiFetch(challengesApiUrl("generate_daily/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ force })
  });
  const j = (await r.json()) as ChallengesTodayResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Regenerate failed");
  }
  return j as ChallengesTodayResponse;
}

export async function postGeneratePair(category: string): Promise<ChallengesTodayResponse> {
  const r = await apiFetch(challengesApiUrl("generate_pair/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ category })
  });
  const j = (await r.json()) as ChallengesTodayResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Generate pair failed");
  }
  return j as ChallengesTodayResponse;
}

export type LeaderboardRow = {
  rank: number;
  user_id?: number | null;
  display_name: string;
  points_total: number;
  updated_at: string;
  avatar_url?: string;
};

export async function fetchLeaderboard(): Promise<{ results: LeaderboardRow[] }> {
  const r = await apiFetch(challengesApiUrl("leaderboard/"), { cache: "no-store" });
  const j = (await r.json()) as { results?: LeaderboardRow[] };
  if (!r.ok) {
    throw new Error("Leaderboard unavailable");
  }
  return { results: j.results ?? [] };
}

export async function syncLeaderboard(pointsTotal: number, displayName?: string): Promise<void> {
  await apiFetch(challengesApiUrl("leaderboard/sync/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({
      points_total: pointsTotal,
      display_name: displayName ?? "Anonymous"
    })
  });
}

/** Pre-scoring gate from the evaluation agent (strict ``is_valid``). */
export type MissionAgentValidation = {
  is_valid: boolean;
  reason: string;
  source?: string;
};

/** Qualitative mission check from the OpenAI agent (null if API key missing or call failed). */
export type MissionAgentAttestation = {
  verdict: "pass" | "partial" | "needs_work";
  attestation: string;
  checks: string[];
  suggestions: string[];
};

export type MissionScoreBreakdown = {
  word_count: number;
  word_score: number;
  elapsed_seconds: number;
  target_seconds: number;
  time_score: number;
  /** Present when scored after validation: secondary speed factor (1 + k·time_score). */
  time_multiplier?: number;
  accuracy_ratio?: number;
  relevance_score: number;
  keyword_score?: number;
  unique_ratio: number;
  repetition_penalty: number;
  syndicate_bonus: number;
};

export type MissionScoreResponse = {
  /** False when the evaluation agent rejected the response (no numeric rubric applied). */
  is_valid?: boolean;
  agent_validation?: MissionAgentValidation;
  awarded_points: number;
  max_points: number;
  score_ratio: number;
  accuracy_ratio?: number | null;
  breakdown: MissionScoreBreakdown | null;
  agent_attestation?: MissionAgentAttestation | null;
};

export async function postScoreMissionResponse(args: {
  /** How the operator completed the mission (required with completionLearned). */
  completionHow: string;
  /** What the operator learned from it (required with completionHow). */
  completionLearned: string;
  challengeTitle: string;
  difficulty: string;
  maxPoints: number;
  elapsedSeconds: number;
  /** Mission body text — improves validation and attestation. */
  challengeDescription?: string;
  /** Example actions from the mission card. */
  exampleTasks?: string[];
}): Promise<MissionScoreResponse> {
  const body: Record<string, unknown> = {
    completion_how: args.completionHow.trim(),
    completion_learned: args.completionLearned.trim(),
    challenge_title: args.challengeTitle,
    difficulty: args.difficulty,
    max_points: args.maxPoints,
    elapsed_seconds: args.elapsedSeconds
  };
  const desc = (args.challengeDescription ?? "").trim();
  if (desc) body.challenge_description = desc;
  if (Array.isArray(args.exampleTasks) && args.exampleTasks.length > 0) {
    body.example_tasks = args.exampleTasks.map((t) => String(t).trim()).filter(Boolean).slice(0, 8);
  }
  const r = await apiFetch(challengesApiUrl("score_response/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify(body)
  });
  const j = (await r.json()) as MissionScoreResponse & { detail?: string };
  if (!r.ok) {
    throw new Error(typeof j.detail === "string" ? j.detail : "Could not score mission response");
  }
  return j;
}

export type AdminTaskRow = {
  id: number;
  title: string;
  description: string;
  points_target: number;
  /** Visibility duration set by admin in Django admin panel. */
  visibility_hours?: number;
  /** Short admin hint shown near countdown on frontend. */
  admin_note?: string;
  image_url?: string;
  active: boolean;
  /** ISO datetime — task expires based on admin-set visibility hours. */
  created_at?: string;
  expires_at?: string;
  submission?: {
    status: "pending" | "reviewed" | "rejected";
    awarded_points: number;
    points_claimed: boolean;
    submitted_at: string;
    elapsed_seconds?: number;
    review_notes?: string;
    reviewed_at?: string | null;
    has_attachment?: boolean;
  } | null;
};

export type AdminTasksActiveResult = {
  results: AdminTaskRow[];
  /** Set when the server returned 401; callers should stop polling until remount/login. */
  unauthorized?: boolean;
};

export async function fetchAdminTasksActive(deviceId: string): Promise<AdminTasksActiveResult> {
  if (!getSyndicateAuthToken()) {
    return { results: [] };
  }
  try {
    const r = await apiFetch(challengesApiUrl(`admin_tasks/active/?device_id=${encodeURIComponent(deviceId)}`), { cache: "no-store" });
    const j = (await r.json()) as { results?: AdminTaskRow[]; detail?: string };
    if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to load admin tasks");
    return { results: j.results ?? [] };
  } catch (e) {
    if (e instanceof SyndicateSessionLostError) {
      return { results: [], unauthorized: true };
    }
    throw e;
  }
}

export async function postAdminTaskSubmit(args: {
  deviceId: string;
  taskId: number;
  responseText: string;
  startedAtMs?: number;
  attachment?: File | null;
}): Promise<{ ok: boolean; status: string; message?: string; submitted_at?: string }> {
  const url = challengesApiUrl("admin_tasks/submit/");
  if (args.attachment) {
    const fd = new FormData();
    fd.append("device_id", args.deviceId);
    fd.append("task_id", String(args.taskId));
    fd.append("response_text", args.responseText);
    if (args.startedAtMs != null) fd.append("started_at_ms", String(args.startedAtMs));
    fd.append("attachment", args.attachment);
    const r = await apiFetch(url, { method: "POST", body: fd });
    const j = (await r.json()) as { ok?: boolean; status?: string; message?: string; detail?: string; submitted_at?: string };
    if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to submit task response");
    return { ok: !!j.ok, status: j.status ?? "pending", message: j.message, submitted_at: j.submitted_at };
  }
  const r = await apiFetch(url, {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({
      device_id: args.deviceId,
      task_id: args.taskId,
      response_text: args.responseText,
      started_at_ms: args.startedAtMs ?? null
    })
  });
  const j = (await r.json()) as { ok?: boolean; status?: string; message?: string; detail?: string; submitted_at?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to submit task response");
  return { ok: !!j.ok, status: j.status ?? "pending", message: j.message, submitted_at: j.submitted_at };
}

export async function postAdminTaskClaimPoints(deviceId: string): Promise<{ points_awarded: number; submission_ids: number[] }> {
  const r = await apiFetch(challengesApiUrl("admin_tasks/claim_points/"), {
    method: "POST",
    headers: getSyndicateAuthHeaders(true),
    body: JSON.stringify({ device_id: deviceId })
  });
  const j = (await r.json()) as { points_awarded?: number; submission_ids?: number[]; detail?: string };
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Failed to claim admin task points");
  return { points_awarded: j.points_awarded ?? 0, submission_ids: j.submission_ids ?? [] };
}
