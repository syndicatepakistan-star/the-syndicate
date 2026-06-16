import { useCallback, useEffect, useState } from "react";
import { fetchChallengesToday, type ChallengeRow } from "@/app/challenges/services/challengesApi";
import { getSyndicateDeviceId } from "@/lib/syndicateDeviceId";
import { getSyndicateAuthToken, getSyndicateUser } from "@/lib/syndicateAuth";
import { SYNDICATE_DASHBOARD_REFRESH_EVENT } from "@/lib/syndicateProgressSync";
import { syndicateUserStorageKey as ls } from "@/lib/syndicateStorageKeys";

const MISSION_BOARD_TTL_MS = 24 * 60 * 60 * 1000;

function rowOnBoard(row: ChallengeRow, nowMs: number): boolean {
  const t = Date.parse(row.created_at);
  if (Number.isNaN(t)) return true;
  return nowMs - t < MISSION_BOARD_TTL_MS;
}

function loadDoneIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(ls("completed_challenge_ids"));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

type ReminderEntry = { atIso: string; title: string };

function loadMissionReminders(): Map<number, ReminderEntry> {
  const out = new Map<number, ReminderEntry>();
  if (typeof window === "undefined") return out;
  try {
    const raw = window.localStorage.getItem(ls("mission_reminders_v1"));
    if (!raw) return out;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [k, v] of Object.entries(parsed)) {
      const id = parseInt(k, 10);
      if (!Number.isFinite(id) || !v || typeof v !== "object" || Array.isArray(v)) continue;
      const o = v as Record<string, unknown>;
      const atIso = typeof o.atIso === "string" ? o.atIso : "";
      const title = typeof o.title === "string" ? o.title : "Mission";
      if (!atIso || Number.isNaN(Date.parse(atIso))) continue;
      out.set(id, { atIso, title });
    }
  } catch {
    /* ignore */
  }
  return out;
}

export type SyndicateMissionPeekRow = {
  id: number;
  title: string;
  /** Short mission description when available from API. */
  subtitle?: string;
  mood: string;
  category: string;
  difficulty: string;
  points: number;
  onBoard: boolean;
  completed: boolean;
  reminderAtMs: number | null;
  /** Human-readable countdown / “in 2h” for upcoming reminders. */
  reminderRelative?: string;
};

function missionTitle(row: ChallengeRow): string {
  const t = row.payload?.challenge_title?.trim();
  return t && t.length > 0 ? t : `Mission #${row.id}`;
}

function missionSubtitle(row: ChallengeRow): string | undefined {
  const d = row.payload?.challenge_description?.trim();
  if (!d) return undefined;
  const oneLine = d.replace(/\s+/g, " ").trim();
  if (oneLine.length <= 140) return oneLine;
  return `${oneLine.slice(0, 137)}…`;
}

export function formatSyndicateReminderCountdown(atMs: number, nowMs: number = Date.now()): string {
  const d = atMs - nowMs;
  if (d <= 0) return "Due now";
  const mins = Math.floor(d / 60_000);
  if (mins < 1) return "Under 1 min";
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 48) return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
  const days = Math.floor(h / 24);
  return `in ${days}d`;
}

function buildPeekList(rows: ChallengeRow[], nowMs: number): SyndicateMissionPeekRow[] {
  const done = loadDoneIds();
  const reminders = loadMissionReminders();
  const byId = new Map(rows.map((r) => [r.id, r]));

  type Acc = SyndicateMissionPeekRow & { sortKey: number };
  const acc: Acc[] = [];

  for (const row of rows) {
    const onBoard = rowOnBoard(row, nowMs);
    const completed = done.has(row.id);
    const rem = reminders.get(row.id);
    const reminderAtMs = rem ? Date.parse(rem.atIso) : NaN;
    const hasFutureReminder = Number.isFinite(reminderAtMs) && reminderAtMs > nowMs;

    if (!onBoard && !hasFutureReminder && completed) continue;
    if (!onBoard && !hasFutureReminder && !completed) continue;

    const sortKey = completed ? 2 : hasFutureReminder ? 0 : 1;
    const rel =
      hasFutureReminder && Number.isFinite(reminderAtMs) ? formatSyndicateReminderCountdown(reminderAtMs, nowMs) : undefined;
    acc.push({
      id: row.id,
      title: missionTitle(row),
      subtitle: missionSubtitle(row),
      mood: row.mood || "—",
      category: row.category || "—",
      difficulty: row.difficulty || "—",
      points: row.points ?? 0,
      onBoard,
      completed,
      reminderAtMs: Number.isFinite(reminderAtMs) ? reminderAtMs : null,
      reminderRelative: rel,
      sortKey
    });
  }

  for (const [id, rem] of reminders) {
    if (byId.has(id)) continue;
    const reminderAtMs = Date.parse(rem.atIso);
    if (!Number.isFinite(reminderAtMs) || reminderAtMs <= nowMs) continue;
    acc.push({
      id,
      title: rem.title,
      subtitle: undefined,
      mood: "reminder",
      category: "—",
      difficulty: "—",
      points: 0,
      onBoard: false,
      completed: false,
      reminderAtMs,
      reminderRelative: formatSyndicateReminderCountdown(reminderAtMs, nowMs),
      sortKey: 0
    });
  }

  acc.sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    const ar = a.reminderAtMs ?? Infinity;
    const br = b.reminderAtMs ?? Infinity;
    if (ar !== br) return ar - br;
    return b.id - a.id;
  });

  return acc.slice(0, 10).map(({ sortKey: _s, ...rest }) => rest);
}

export function useSyndicateMissionsPeek(enabled = true): {
  rows: SyndicateMissionPeekRow[];
  loading: boolean;
  error: string | null;
  /** Email/name session (optional); missions still load for guests via device id + localStorage. */
  linkedAccount: boolean;
  apiReached: boolean;
  refresh: () => void;
} {
  const [rows, setRows] = useState<SyndicateMissionPeekRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedAccount, setLinkedAccount] = useState(false);
  const [apiReached, setApiReached] = useState(false);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      setLinkedAccount(false);
      setLoading(false);
      setError(null);
      setRows([]);
      setApiReached(false);
      return;
    }
    const token = getSyndicateAuthToken();
    const user = getSyndicateUser();
    setLinkedAccount(!!(token && user));
    setLoading(true);
    setError(null);
    const device = getSyndicateDeviceId();
    const now = Date.now();

    void fetchChallengesToday(device)
      .then((td) => {
        setApiReached(true);
        setRows(buildPeekList(td.results ?? [], now));
        setError(null);
      })
      .catch((e: unknown) => {
        setApiReached(false);
        const localOnly = buildPeekList([], now);
        setRows(localOnly);
        const msg = e instanceof Error ? e.message : "Could not load missions";
        if (token && localOnly.length === 0) setError(msg);
        else setError(null);
      })
      .finally(() => setLoading(false));
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => refresh();
    window.addEventListener(SYNDICATE_DASHBOARD_REFRESH_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    window.addEventListener("storage", onRefresh);
    const id = window.setInterval(onRefresh, 60_000);
    return () => {
      window.removeEventListener(SYNDICATE_DASHBOARD_REFRESH_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("storage", onRefresh);
      window.clearInterval(id);
    };
  }, [refresh]);

  return {
    rows,
    loading,
    error,
    linkedAccount,
    apiReached,
    refresh
  };
}
