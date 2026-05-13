"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  challengesApiUrl,
  ensureSyndicateSessionOrRedirect,
  fetchAdminTasksActive,
  fetchChallengesTodayUntilComplete,
  fetchLeaderboard,
  fetchSyndicateProgress,
  getChallengeBenefits,
  getChallengeExamples,
  patchSyndicateProgress,
  postAdminTaskClaimPoints,
  postAdminTaskSubmit,
  postScoreMissionResponse,
  postSyndicateStreakRecord,
  postSyndicateStreakRestore,
  postUserCustomChallenge,
  SyndicateSessionLostError,
  syncLeaderboard,
  type AdminTaskRow,
  type LeaderboardRow,
  type MissionScoreResponse
} from "@/app/challenges/services/challengesApi";
import type { ChallengeRow } from "@/app/challenges/services/challengesApi";
import { getSyndicateAuthHeaders, getSyndicateAuthToken, getSyndicateUser } from "@/lib/syndicateAuth";
import {
  applySyncedStateFromServer,
  collectSyncedState,
  mirrorShellProfileIntoSyndicateStorage,
  onSyndicatePersist
} from "@/lib/syndicateProgressSync";
import { getSyndicateApiBase } from "@/lib/syndicateApiBase";
import {
  DASHBOARD_PROFILE_UPDATED_EVENT,
  DEFAULT_DASHBOARD_PROFILE_NAME,
  PROFILE_AVATAR_STORAGE_KEY,
  PROFILE_DISPLAY_NAME_KEY,
  readDashboardProfileAvatarStorageRaw,
  readDashboardProfileDisplayName,
  resolveDashboardAvatarDisplayUrl
} from "@/lib/dashboardProfileStorage";
import { syndicateUserStorageKey as ls } from "@/lib/syndicateStorageKeys";

const API_BASE = getSyndicateApiBase();

/** Camera/mic need HTTPS (or localhost). */
function isBrowserSecureForCamera(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.isSecureContext === true ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]"
  );
}

/** Prefer a concrete codec so MediaRecorder works across Chrome / Edge / Safari. */
function pickMediaRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

/** Mega mission / admin task: a video file must be attached (camera recording or video upload). */
function adminTaskAttachmentIsVideo(file: File | null | undefined): boolean {
  if (!file || typeof file.size !== "number" || file.size <= 0) return false;
  const ct = (file.type || "").trim().toLowerCase();
  if (ct.startsWith("video/")) return true;
  const name = (file.name || "").toLowerCase();
  return /\.(webm|mp4|mov|mkv|m4v|ogv|avi)$/i.test(name);
}

export type { ChallengeRow } from "@/app/challenges/services/challengesApi";

const CATEGORIES = ["business", "money", "fitness", "power", "grooming", "personal"] as const;

const CAT_LABEL: Record<string, string> = {
  business: "Business",
  money: "Money",
  fitness: "Fitness",
  power: "Power",
  grooming: "Grooming",
  personal: "Your mission"
};

/** Moods for Stats & profile filtering (matches API + challenge suitable_moods). */
const STATS_MOODS = ["energetic", "happy", "tired"] as const;

const STATS_MOOD_LABEL: Record<string, string> = {
  energetic: "Energetic",
  happy: "Happy",
  tired: "Tired"
};

const _MOOD_ORDER: Record<string, number> = { energetic: 0, happy: 1, tired: 2 };

function compareRowsByMoodThenSlot(a: ChallengeRow, b: ChallengeRow): number {
  const ma = (a.mood || "").toLowerCase();
  const mb = (b.mood || "").toLowerCase();
  const oa = ma in _MOOD_ORDER ? _MOOD_ORDER[ma] : 99;
  const ob = mb in _MOOD_ORDER ? _MOOD_ORDER[mb] : 99;
  if (oa !== ob) return oa - ob;
  return (a.slot || 0) - (b.slot || 0);
}

/**
 * Narrow hints for inferring a single bucket when `suitable_moods` does not name a mood explicitly.
 * Avoid generic words like "focus" or "positive" — they appeared in almost every row and made every mood match.
 */
const STATS_MOOD_HINTS_INFER: Record<(typeof STATS_MOODS)[number], string[]> = {
  energetic: ["energetic", "energy", "motivated", "drive", "active", "momentum", "upbeat", "vigor"],
  happy: ["happy", "joy", "grateful", "celebrate", "optimism", "uplift", "cheerful", "delight"],
  tired: ["tired", "rest", "relax", "recovery", "ease", "slow", "exhausted", "fatigue", "burnout", "comfort", "gentle", "healing", "empathy"]
};

/** Best-effort primary mood for a row when the dropdown filter is applied. */
function inferStatsMoodForRow(row: ChallengeRow): (typeof STATS_MOODS)[number] {
  const p = row.payload;
  const sm = Array.isArray(p?.suitable_moods) ? p.suitable_moods.map((x) => String(x).toLowerCase()) : [];
  for (const mk of STATS_MOODS) {
    if (sm.some((s) => moodTagEqualsFilter(s, mk))) return mk;
  }

  const text = [...sm, p?.challenge_title ?? "", p?.challenge_description ?? "", p?.based_on_mindset ?? ""]
    .join(" ")
    .toLowerCase();

  let best: (typeof STATS_MOODS)[number] = STATS_MOODS[0];
  let bestScore = -1;
  for (const mk of STATS_MOODS) {
    let sc = 0;
    for (const h of STATS_MOOD_HINTS_INFER[mk]) {
      if (text.includes(h)) sc += h.length;
    }
    if (sc > bestScore) {
      bestScore = sc;
      best = mk;
    }
  }
  return bestScore > 0 ? best : "energetic";
}

function isPrimaryStatsMood(s: string): s is (typeof STATS_MOODS)[number] {
  return (STATS_MOODS as readonly string[]).includes(s);
}

/** True if a mood tag equals the filter (exact match after trim); never use substring — "unhappy" must not match "happy". */
function moodTagEqualsFilter(tag: string, filterMood: string): boolean {
  const t = String(tag).toLowerCase().trim();
  const m = filterMood.toLowerCase();
  if (t === m) return true;
  for (const part of t.split(/[/|,]+/)) {
    if (part.trim() === m) return true;
  }
  return false;
}

/** Filter by mood: daily batches store exact mood on `row.mood` (one per category × mood). */
function challengeMatchesStatsMood(row: ChallengeRow, mood: string): boolean {
  const rowMood = (row.mood || "").toLowerCase();
  if (rowMood === "custom") return true;
  const m = mood.toLowerCase();
  if (rowMood === "sad") {
    return m === "tired";
  }

  if (isPrimaryStatsMood(rowMood)) {
    return rowMood === m;
  }

  const list = row.payload?.suitable_moods;
  const sm = Array.isArray(list) ? list.map((x) => String(x).toLowerCase()) : [];

  if (rowMood && rowMood !== "daily" && rowMood === m) return true;
  if (sm.some((s) => moodTagEqualsFilter(s, m))) return true;

  return inferStatsMoodForRow(row) === m;
}

/**
 * When multiple system rows share the same (category, mood) (legacy two-slot data), completing one
 * hides the other incomplete row. Single-slot batches never duplicate keys.
 */
function applyMoodCategoryPairHide(rows: ChallengeRow[], doneIds: Set<number>): ChallengeRow[] {
  const key = (r: ChallengeRow): string | null => {
    if (r.user_created) return null;
    const cat = (r.category || r.payload?.category || "").toLowerCase();
    const mood = (r.mood || "").toLowerCase();
    if (!cat || !mood || mood === "custom" || mood === "daily") return null;
    return `${cat}|${mood}`;
  };
  const byKey = new Map<string, ChallengeRow[]>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(r);
  }
  const hide = new Set<number>();
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    const done = group.filter((x) => doneIds.has(x.id));
    const undone = group.filter((x) => !doneIds.has(x.id));
    if (done.length >= 1 && undone.length >= 1) {
      for (const x of undone) hide.add(x.id);
    }
  }
  return rows.filter((r) => !hide.has(r.id));
}

/** One system mission per (category, primary mood); keeps lowest slot then lowest id (legacy double-slot rows). */
function dedupePrimaryMoodSystemRows(rows: ChallengeRow[]): ChallengeRow[] {
  const winners = new Map<string, ChallengeRow>();
  for (const r of rows) {
    if (r.user_created) continue;
    const cat = (r.category || r.payload?.category || "").toLowerCase();
    const mood = (r.mood || "").toLowerCase();
    if (!cat || !isPrimaryStatsMood(mood)) continue;
    const k = `${cat}|${mood}`;
    const prev = winners.get(k);
    if (!prev) {
      winners.set(k, r);
      continue;
    }
    const rs = r.slot ?? 1;
    const ps = prev.slot ?? 1;
    if (rs < ps || (rs === ps && r.id < prev.id)) winners.set(k, r);
  }
  return rows.filter((r) => {
    if (r.user_created) return true;
    const cat = (r.category || r.payload?.category || "").toLowerCase();
    const mood = (r.mood || "").toLowerCase();
    if (!cat || !isPrimaryStatsMood(mood)) return true;
    const w = winners.get(`${cat}|${mood}`);
    return w?.id === r.id;
  });
}

/** Distinct slices for pie (categories). */
const PIE_COLORS = ["#ffd54a", "#4fd1b8", "#7b9cff", "#ff7ab8", "#c792ea", "#ff9f43", "#00e5ff", "#69f0ae"];

/** One color per day in the weekly bar chart (7 bars). */
const WEEK_BAR_COLORS = ["#ff6b9d", "#ffd54a", "#4fd1b8", "#7b9cff", "#c792ea", "#ff9f43", "#69f0ae"];

/** Stats & profile pie: custom tooltip so “points” stays white; when all slices are placeholder, show 0. */
function SyndicateStatsPieTooltip({
  active,
  payload,
  pieDailyData,
  allZero
}: {
  active?: boolean;
  /** Recharts `Tooltip` payload shape varies by chart; normalize loosely at runtime. */
  payload?: unknown;
  pieDailyData: Array<{ name: string; value: number }>;
  allZero: boolean;
}) {
  const rows = Array.isArray(payload) ? payload : [];
  if (!active || !rows.length) return null;
  const row = rows[0] as { name?: string | number; payload?: { name?: string } };
  const name = String(row?.name ?? row?.payload?.name ?? "");
  const pts = allZero ? 0 : pieDailyData.find((d) => d.name === name)?.value ?? 0;
  return (
    <div
      className="rounded-lg border border-[rgba(255,215,0,0.35)] bg-[#141414] px-3 py-2 text-[15px] leading-snug text-white shadow-lg"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
    >
      <div className="font-semibold text-white">{name}</div>
      <div className="text-white">points: {pts}</div>
    </div>
  );
}

/** Native `<select>`: colors from globals.css (`.syndicate-select--*`) so options stay legible on Windows. */
const SYNDICATE_SELECT_BASE =
  "syndicate-select syndicate-readable min-h-[40px] min-w-0 w-full max-w-full cursor-pointer rounded-lg px-3 py-2 text-[14px] font-medium outline-none transition focus:outline-none focus:ring-2 sm:w-auto sm:min-w-[132px] sm:max-w-none";

const SYNDICATE_SELECT_MOOD = `${SYNDICATE_SELECT_BASE} syndicate-select--mood focus:ring-[rgba(160,170,255,0.35)]`;

const SYNDICATE_SELECT_CATEGORY = `${SYNDICATE_SELECT_BASE} syndicate-select--category focus:ring-[rgba(255,215,0,0.28)]`;

const SYNDICATE_SELECT_STATUS = `${SYNDICATE_SELECT_BASE} syndicate-select--status focus:ring-[rgba(72,220,180,0.35)]`;

const SYNDICATE_DATE_INPUT =
  "syndicate-date-input syndicate-readable mt-1.5 block w-full rounded-lg border border-cyan-400/35 bg-[#0a0e14] px-3 py-2.5 text-[15px] font-medium text-white/95 outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-400/15";
/** Max agent-generated missions completable per day (not how many appear on the board). */
const MAX_AGENT_COMPLETIONS_PER_DAY = 4;
const MAX_CUSTOM_COMPLETIONS_PER_DAY = 2;
/** Matches backend `create_user_custom_challenge` limit message for create-mission UI. */
const CREATE_MISSION_DAILY_LIMIT_MSG = `Maximum ${MAX_CUSTOM_COMPLETIONS_PER_DAY} custom missions per calendar day.`;
/** Forge UI no longer exposes difficulty; backend still requires a value. */
const CUSTOM_MISSION_DEFAULT_DIFFICULTY = "medium" as const;
const POINTS_PER_10_POUNDS = 100;
const POUNDS_PER_100_POINTS = 10;

const CTA_BTN =
  "syndicate-hud-cta rounded-md border border-[#eab308] bg-[linear-gradient(180deg,#fef08a_0%,#fde047_46%,#eab308_100%)] text-black [box-shadow:inset_0_1px_0_rgba(255,252,220,0.88),inset_0_-2px_0_rgba(161,98,7,0.55),0_0_16px_rgba(253,224,71,0.45)] hover:brightness-110";
const HUD_LABEL = "text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--gold)]/48";
const HUD_VALUE = "mt-1 font-mono font-black text-[#fefce8]/94";

/** Files in `public/assets/rewards/` (spaces encoded for URLs). */
function rewardsPublicAsset(filename: string): string {
  return `/assets/rewards/${encodeURIComponent(filename)}`;
}

const REWARD_MILESTONES = [
  {
    id: "rw-20",
    unlock_points: 20,
    bonus_points: 5,
    title: "Bronze coin",
    image: rewardsPublicAsset("bronze.jpeg")
  },
  {
    id: "rw-50",
    unlock_points: 50,
    bonus_points: 10,
    title: "Silver coin",
    image: rewardsPublicAsset("silver.jpeg")
  },
  {
    id: "rw-100",
    unlock_points: 100,
    bonus_points: 20,
    title: "Gold coin",
    image: rewardsPublicAsset("gold.png")
  },
  {
    id: "rw-150",
    unlock_points: 150,
    bonus_points: 30,
    title: "Blackcoin",
    image: rewardsPublicAsset("black.jpeg")
  },
  {
    id: "rw-200",
    unlock_points: 200,
    bonus_points: 50,
    title: "Lamborghini",
    image: rewardsPublicAsset("lambo.jpeg")
  },
  {
    id: "rw-350",
    unlock_points: 350,
    bonus_points: 100,
    title: "Private jet",
    image: rewardsPublicAsset("jet.jpeg")
  }
] as const;

type DayBucket = { total: number; byCategory: Record<string, number> };
type HistoryV1 = { days: Record<string, DayBucket> };

function loadHistory(): HistoryV1 {
  if (typeof window === "undefined") return { days: {} };
  try {
    const raw = window.localStorage.getItem(ls("points_history_v1"));
    if (!raw) return { days: {} };
    const p = JSON.parse(raw) as HistoryV1;
    if (!p.days || typeof p.days !== "object") return { days: {} };
    return p;
  } catch {
    return { days: {} };
  }
}

function saveHistory(h: HistoryV1) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("points_history_v1"), JSON.stringify(h));
  onSyndicatePersist();
}

function appendPointsForDay(iso: string, category: string, pts: number) {
  const h = loadHistory();
  if (!h.days[iso]) h.days[iso] = { total: 0, byCategory: {} };
  h.days[iso].total += pts;
  const k = category.toLowerCase();
  h.days[iso].byCategory[k] = (h.days[iso].byCategory[k] || 0) + pts;
  saveHistory(h);
}

type ChallengeDayV1 = {
  /** Calendar date (YYYY-MM-DD) → number of challenges completed that day (first-time submits). */
  completionsByDate: Record<string, number>;
  /** Calendar date → challenge count when that day’s list was loaded (best effort). */
  offeredByDate: Record<string, number>;
};

function loadChallengeDay(): ChallengeDayV1 {
  if (typeof window === "undefined") return { completionsByDate: {}, offeredByDate: {} };
  try {
    const raw = window.localStorage.getItem(ls("challenge_day_v1"));
    if (!raw) return { completionsByDate: {}, offeredByDate: {} };
    const p = JSON.parse(raw) as Partial<ChallengeDayV1>;
    return {
      completionsByDate: typeof p.completionsByDate === "object" && p.completionsByDate ? p.completionsByDate : {},
      offeredByDate: typeof p.offeredByDate === "object" && p.offeredByDate ? p.offeredByDate : {}
    };
  } catch {
    return { completionsByDate: {}, offeredByDate: {} };
  }
}

function saveChallengeDay(d: ChallengeDayV1) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("challenge_day_v1"), JSON.stringify(d));
  onSyndicatePersist();
}

/** Remember how many challenges were on the list for that calendar day (updates when the list loads). */
function recordOfferedSnapshot(iso: string, count: number) {
  if (!iso || count < 0) return;
  const d = loadChallengeDay();
  d.offeredByDate[iso] = count;
  saveChallengeDay(d);
}

/** Increment completed count for a calendar day (one increment per newly finished challenge). */
function recordCompletionForDay(iso: string) {
  const d = loadChallengeDay();
  d.completionsByDate[iso] = (d.completionsByDate[iso] ?? 0) + 1;
  saveChallengeDay(d);
}

function resetChallengeDayForDate(iso: string) {
  const d = loadChallengeDay();
  delete d.completionsByDate[iso];
  delete d.offeredByDate[iso];
  saveChallengeDay(d);
}

function calendarIsoFromRows(rows: ChallengeRow[]): string {
  if (!rows.length) return todayLocalISO();
  const cd = rows[0].challenge_date;
  if (cd == null || cd === "") return todayLocalISO();
  return String(cd).slice(0, 10);
}

/** Missions leave the main board after this TTL from `created_at`; reminders stay until their target time. */
const MISSION_BOARD_TTL_MS = 24 * 60 * 60 * 1000;

function rowWithinMissionBoardTtl(row: ChallengeRow, nowMs: number): boolean {
  const t = Date.parse(row.created_at);
  if (Number.isNaN(t)) return true;
  return nowMs - t < MISSION_BOARD_TTL_MS;
}

function isoDateAddDays(iso: string, delta: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDatesFrom(todayIso: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(isoDateAddDays(todayIso, -i));
  }
  return out;
}

function shortWeekday(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()] ?? iso;
}

function aggregateCategoryTotals(h: HistoryV1): Record<string, number> {
  const out: Record<string, number> = {};
  for (const day of Object.values(h.days)) {
    for (const [k, v] of Object.entries(day.byCategory)) {
      out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SyndicateHelpTopic =
  | "custom-mission"
  | "hud-points"
  | "hud-streak"
  | "points-to-pounds"
  | "unlock"
  | "mega-mission"
  | "mission-reminder";

export type SyndicateHelpOpenFn = (topic: SyndicateHelpTopic, anchorEl: HTMLElement) => void;

type SyndicateHelpOpenState = { topic: SyndicateHelpTopic; anchorEl: HTMLElement };

function syndicateHelpTitle(topic: SyndicateHelpTopic): string {
  if (topic === "custom-mission") return "Create your mission";
  if (topic === "hud-points") return "Points";
  if (topic === "hud-streak") return "Streak";
  if (topic === "points-to-pounds") return "Points to pounds";
  if (topic === "unlock") return "Unlock & redeem rewards";
  if (topic === "mission-reminder") return "Mission reminders";
  return "Mega mission";
}

function SyndicateHelpMark({
  topic,
  label,
  onOpen
}: {
  topic: SyndicateHelpTopic;
  label: string;
  onOpen: SyndicateHelpOpenFn;
}) {
  return (
    <button
      type="button"
      onClick={(e) => onOpen(topic, e.currentTarget)}
      aria-label={label}
      className="syndicate-help-mark inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-red-400/60 bg-[radial-gradient(circle_at_35%_30%,rgba(254,202,202,0.22),rgba(60,10,14,0.96)_62%)] text-[10px] font-black leading-none text-red-50 shadow-[0_0_6px_rgba(248,113,113,0.4),inset_0_1px_0_rgba(254,226,226,0.2)] transition hover:scale-[1.05] hover:border-red-300/90 hover:text-white hover:shadow-[0_0_10px_rgba(248,113,113,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/65 sm:h-5 sm:w-5 sm:text-[10px]"
    >
      ?
    </button>
  );
}

function SyndicateHelpContent({ topic }: { topic: SyndicateHelpTopic }) {
  return (
    <div className="mt-4 space-y-3 text-left text-[15px] leading-relaxed text-white/88">
          {topic === "custom-mission" ? (
            <>
              <p>
                <strong className="text-white">Create own mission</strong> opens the forge: you type a short title. Use it when you want extra missions you define yourself on top of the daily board.
              </p>
              <p>
                You can create up to <strong className="text-white">two custom missions per calendar day</strong> (resets at local midnight with your other daily data). Each needs a title (at least three characters).
              </p>
              <p>
                The server fills in points in the <strong className="text-white">3–5</strong> range, plus description, examples, and benefits, and stores a short mindset note that can shape your next{" "}
                <strong className="text-white">custom missions</strong> and <strong className="text-white">mood + category</strong> picks.
              </p>
              <p>Finishing a custom mission uses the same daily completion limits as the main mission board.</p>
            </>
          ) : topic === "hud-points" ? (
            <>
              <p>
                <strong className="text-amber-100">Points</strong> are your <strong className="text-white">lifetime total</strong> earned from daily missions, mega-mission payouts when you claim them, and bonus points when you redeem tiers under Unlock &amp; redeem rewards.
              </p>
              <p>
                That total drives your <strong className="text-white">syndicate level</strong> (same point thresholds as the reward cards). You can spend part of your balance by converting to pounds in the <strong className="text-white">Points to pounds</strong> section—only if you have enough points for the amount you enter.
              </p>
            </>
          ) : topic === "hud-streak" ? (
            <>
              <p>
                <strong className="text-fuchsia-100">Streak</strong> is your <strong className="text-white">run of consecutive calendar days</strong> where you completed at least one qualifying mission. The server tracks your last activity date; starting a new day with a completion extends the count.
              </p>
              <p>
                If you miss a day, the streak can reset to <strong className="text-white">zero</strong>. For the next{" "}
                <strong className="text-white">seven calendar days</strong> (counting from that break day), you can use{" "}
                <strong className="text-white">Restore streak</strong> with a referral invite or friend code; the dashboard shows how many of those days are left.
              </p>
            </>
          ) : topic === "points-to-pounds" ? (
            <>
              <p>
                You can <strong className="text-white">convert mission points into pounds</strong> at the rate on this screen ({POINTS_PER_10_POUNDS} points = £{POUNDS_PER_100_POINTS}). Enter how many points to convert and tap Convert; that amount is <strong className="text-white">deducted from your points total</strong> and the same value in pounds is added to your <strong className="text-white">pounds balance</strong> right away.
              </p>
              <p>
                Use your pounds balance for real value in the product: <strong className="text-white">you can unlock courses with these pounds</strong> (and any other paid unlocks your account offers). Because conversion lowers your points, keep enough points if you are still working toward the next Unlock &amp; redeem tier.
              </p>
            </>
          ) : topic === "unlock" ? (
            <>
              <p>
                Rewards redeem <strong className="text-white">in order</strong>: Level 1, then 2, then 3, and so on. You must redeem the previous tier before the next one can be redeemed, even if you already have enough points.
              </p>
              <p>
                Each card shows the <strong className="text-white">points threshold</strong> for that tier and the <strong className="text-white">bonus points</strong> you get when you redeem. Redeeming adds those bonus points to your total.
              </p>
            </>
          ) : topic === "mission-reminder" ? (
            <>
              <p>
                A <strong className="text-cyan-100">mission reminder</strong> is optional. It lets you pick a <strong className="text-white">date and time</strong> (your device&apos;s local clock) so you remember to finish this mission. Nothing is saved until you press{" "}
                <strong className="text-white">Done</strong> — then it appears on the <strong className="text-white">Missions</strong> tab and in <strong className="text-white">Reminders</strong> with a countdown to that target time.
              </p>
              <p>
                The reminder does <strong className="text-white">not</strong> complete the mission for you. It only tracks the deadline you chose and surfaces actions (open the mission, mark done from the reminder flow, or dismiss).
              </p>
              <p>
                <strong className="text-amber-100">Points:</strong> if the target time passes and this mission is <strong className="text-white">still incomplete</strong>, the server may deduct <strong className="text-amber-100">1 point once</strong> from your total for that reminder. Completing the mission removes the reminder and avoids that penalty for this entry.
              </p>
              <p>
                Missions can roll off the daily board after 24 hours, but the reminder can stay until the target time. Use <strong className="text-white">Open mission</strong> while the mission is still on the board; later, use the options on the reminder card. You can clear the picker with <strong className="text-white">Clear reminder</strong> before saving.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-white">Mega mission</strong> is the bonus track: tasks published by admins show up here, often with a visible time limit from when they were posted.
              </p>
              <p>
                You submit a <strong className="text-white">written response</strong> and a <strong className="text-white">video</strong> (use <strong className="text-white">Record video</strong> or upload MP4/WebM/MOV — max 50MB). Staff review in admin; you get <strong className="text-white">one submission per device per task</strong>.
              </p>
              <p>After approval, use <strong className="text-white">Claim reviewed points</strong> on that task to receive the payout—this pipeline is separate from your daily syndicate missions.</p>
            </>
          )}
    </div>
  );
}

function SyndicateHelpAnchoredPopover({
  topic,
  anchorEl,
  onClose
}: {
  topic: SyndicateHelpTopic;
  anchorEl: HTMLElement;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [pos, setPos] = useState({ top: 0, left: 0, width: 560, maxHeight: 360 });

  const updatePosition = useCallback(() => {
    const el = anchorEl;
    if (!el.isConnected) {
      onCloseRef.current();
      return;
    }
    const r = el.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 400;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const margin = 8;
    const gap = 10;
    const popoverWidth = Math.min(720, Math.max(280, vw - 2 * margin));
    let left = r.left + r.width / 2 - popoverWidth / 2;
    left = Math.max(margin, Math.min(left, vw - popoverWidth - margin));

    const maxContent = Math.min(400, Math.floor(vh * 0.72));
    let top = r.bottom + gap;
    let maxHeight = Math.max(160, Math.min(maxContent, vh - top - margin));

    if (maxHeight < 180 && r.top > margin + gap) {
      const aboveH = Math.min(maxContent, r.top - margin - gap);
      if (aboveH >= 160) {
        top = Math.max(margin, r.top - gap - aboveH);
        maxHeight = aboveH;
      }
    }

    if (top + maxHeight > vh - margin) {
      maxHeight = Math.max(160, vh - margin - top);
    }

    setPos({ top, left, width: popoverWidth, maxHeight });
  }, [anchorEl]);

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  if (typeof document === "undefined") return null;

  const title = syndicateHelpTitle(topic);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[179] bg-black/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="syndicate-help-title"
        className="syndicate-mood-context syndicate-readable fixed z-[180] overflow-x-hidden overflow-y-auto rounded-2xl border border-[rgba(255,215,0,0.35)] bg-[linear-gradient(180deg,rgba(24,18,10,0.98),rgba(8,6,4,0.99))] p-5 shadow-[0_12px_48px_rgba(0,0,0,0.65)] sm:p-6"
        style={{
          top: pos.top,
          left: pos.left,
          width: pos.width,
          maxHeight: pos.maxHeight
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="syndicate-help-title" className="text-left text-[18px] font-black uppercase tracking-[0.08em] text-[color:var(--gold)] sm:text-[20px]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-white/25 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <SyndicateHelpContent topic={topic} />
      </div>
    </>,
    document.body
  );
}

/** Scroll the dashboard shell and window so mission detail opens at the top (not the list bottom). */
function scrollSyndicateShellToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll("[data-syndicate-scroll-root], [data-main-shell-scroll]").forEach((el) => {
    const node = el as HTMLElement;
    node.scrollTop = 0;
    if (typeof node.scrollTo === "function") {
      node.scrollTo({ top: 0, behavior: "instant" });
    }
  });
}

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local calendar day `YYYY-MM-DD` from an ISO instant (for date filters). */
function localDateKeyFromIso(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** `datetime-local` value from a Date in the user's local timezone. */
function toDatetimeLocalValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

type MissionReminderEntry = {
  atIso: string;
  title: string;
  penaltyApplied?: boolean;
  /** ISO instant when the mission row was created (24h board window). */
  missionCreatedAtIso?: string;
  /** When the user last saved this reminder (ISO). Used for sort / “added on” date filter. */
  addedAtIso?: string;
};

function loadMissionReminders(): Record<number, MissionReminderEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("mission_reminders_v1"));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<number, MissionReminderEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = parseInt(k, 10);
      if (!Number.isFinite(id) || !v || typeof v !== "object" || Array.isArray(v)) continue;
      const o = v as Record<string, unknown>;
      const atIso = typeof o.atIso === "string" ? o.atIso : "";
      const title = typeof o.title === "string" ? o.title : "Mission";
      if (!atIso || Number.isNaN(Date.parse(atIso))) continue;
      const penaltyApplied = o.penaltyApplied === true;
      const missionCreatedAtIso = typeof o.missionCreatedAtIso === "string" ? o.missionCreatedAtIso : undefined;
      const addedAtIso = typeof o.addedAtIso === "string" ? o.addedAtIso : undefined;
      out[id] = {
        atIso,
        title,
        penaltyApplied,
        ...(missionCreatedAtIso ? { missionCreatedAtIso } : {}),
        ...(addedAtIso ? { addedAtIso } : {})
      };
    }
    return out;
  } catch {
    return {};
  }
}

function persistMissionReminders(m: Record<number, MissionReminderEntry>) {
  if (typeof window === "undefined") return;
  const obj: Record<string, MissionReminderEntry> = {};
  for (const [k, v] of Object.entries(m)) obj[String(k)] = v;
  window.localStorage.setItem(ls("mission_reminders_v1"), JSON.stringify(obj));
  onSyndicatePersist();
}

/** UUID v4 without relying on `crypto.randomUUID` (missing on some browsers / non-secure HTTP origins). */
function randomUuidV4(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(ls("device_id"));
  if (!id) {
    id = randomUuidV4();
    window.localStorage.setItem(ls("device_id"), id);
  }
  return id;
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

function loadTotalPoints(): number {
  if (typeof window === "undefined") return 0;
  const n = parseInt(window.localStorage.getItem(ls("points_total")) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

/** In-memory / localStorage shape for mission draft (two required fields before submit). */
type MissionResponseDraft = { how: string; learned: string };

/** Must match ``resolve_mission_response_text`` in ``backend/apps/challenges/services.py``. */
const COMBINED_HOW_PREFIX = "How I completed this mission:\n";
const COMBINED_LEARNED_MARKER = "\n\nWhat I learned from it:\n";

function formatCombinedMissionResponse(how: string, learned: string): string {
  return `${COMBINED_HOW_PREFIX}${how.trim()}${COMBINED_LEARNED_MARKER}${learned.trim()}`;
}

function normalizeResponseEntry(raw: unknown): MissionResponseDraft {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if ("how" in o || "learned" in o) {
      return {
        how: typeof o.how === "string" ? o.how : "",
        learned: typeof o.learned === "string" ? o.learned : ""
      };
    }
  }
  if (typeof raw === "string") {
    if (raw.startsWith(COMBINED_HOW_PREFIX) && raw.includes(COMBINED_LEARNED_MARKER)) {
      const body = raw.slice(COMBINED_HOW_PREFIX.length);
      const i = body.indexOf(COMBINED_LEARNED_MARKER);
      if (i >= 0) {
        return {
          how: body.slice(0, i).trim(),
          learned: body.slice(i + COMBINED_LEARNED_MARKER.length).trim()
        };
      }
    }
    return { how: raw, learned: "" };
  }
  return { how: "", learned: "" };
}

function loadResponses(): Record<number, MissionResponseDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("challenge_responses"));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<number, MissionResponseDraft> = {};
    for (const [k, v] of Object.entries(parsed || {})) {
      const id = parseInt(k, 10);
      if (Number.isFinite(id)) out[id] = normalizeResponseEntry(v);
    }
    return out;
  } catch {
    return {};
  }
}

function persistDone(ids: Set<number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("completed_challenge_ids"), JSON.stringify([...ids]));
  onSyndicatePersist();
}

function persistPoints(n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("points_total"), String(n));
  onSyndicatePersist();
}

function persistResponses(r: Record<number, MissionResponseDraft>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("challenge_responses"), JSON.stringify(r));
  onSyndicatePersist();
}

function loadMissionStartTimes(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("mission_started_at_v1"));
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, number>;
  } catch {
    return {};
  }
}

function persistMissionStartTimes(map: Record<number, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("mission_started_at_v1"), JSON.stringify(map));
  onSyndicatePersist();
}

function loadRedeemedRewards(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(ls("redeemed_rewards_v1"));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistRedeemedRewards(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("redeemed_rewards_v1"), JSON.stringify([...ids]));
  onSyndicatePersist();
}

function loadPoundsBalance(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(ls("pounds_balance_v1")) || "0";
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function persistPoundsBalance(v: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("pounds_balance_v1"), String(Math.max(0, v)));
  onSyndicatePersist();
}

function loadMissionScores(): Record<number, MissionScoreResponse> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("mission_scores_v1"));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MissionScoreResponse>;
    const out: Record<number, MissionScoreResponse> = {};
    for (const [k, v] of Object.entries(parsed || {})) {
      const id = parseInt(k, 10);
      if (Number.isFinite(id) && v && typeof v === "object") out[id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function persistMissionScores(map: Record<number, MissionScoreResponse>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("mission_scores_v1"), JSON.stringify(map));
  onSyndicatePersist();
}

function loadMissionAwardedPoints(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ls("mission_awarded_points_v1"));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const out: Record<number, number> = {};
    for (const [k, v] of Object.entries(parsed || {})) {
      const id = parseInt(k, 10);
      if (Number.isFinite(id) && Number.isFinite(v)) out[id] = Number(v);
    }
    return out;
  } catch {
    return {};
  }
}

function persistMissionAwardedPoints(map: Record<number, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ls("mission_awarded_points_v1"), JSON.stringify(map));
  onSyndicatePersist();
}

const MAX_MISSION_COMPLETION_LOG = 400;

/** Append-only log for Stats & profile (mission title, response, points, completion date). */
type MissionCompletionLogEntryV1 = {
  entryId: string;
  challengeId: number;
  /** Calendar date (YYYY-MM-DD) for filtering by day. */
  completedIso: string;
  /** When the mission was submitted (ISO 8601); used for time-of-day display. */
  completedAtIso?: string;
  title: string;
  category: string;
  mood: string;
  /** Combined string (same format as API); used for sync and legacy display. */
  responseText: string;
  completionHow?: string;
  completionLearned?: string;
  awardedPoints: number;
  maxPoints: number;
  /** Seconds from first opening the mission detail to submit (same as scoring timer). */
  elapsedSeconds?: number;
};

function splitCompletionLogEntry(e: MissionCompletionLogEntryV1): { how: string; learned: string } | null {
  const ch = typeof e.completionHow === "string" ? e.completionHow.trim() : "";
  const cl = typeof e.completionLearned === "string" ? e.completionLearned.trim() : "";
  if (ch || cl) return { how: ch, learned: cl };
  const t = (e.responseText || "").trim();
  if (t.startsWith(COMBINED_HOW_PREFIX) && t.includes(COMBINED_LEARNED_MARKER)) {
    const body = t.slice(COMBINED_HOW_PREFIX.length);
    const i = body.indexOf(COMBINED_LEARNED_MARKER);
    return {
      how: body.slice(0, i).trim(),
      learned: body.slice(i + COMBINED_LEARNED_MARKER.length).trim()
    };
  }
  return null;
}

function isMissionCompletionLogEntry(x: unknown): x is MissionCompletionLogEntryV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.entryId !== "string" ||
    typeof o.challengeId !== "number" ||
    !Number.isFinite(o.challengeId) ||
    typeof o.completedIso !== "string" ||
    typeof o.title !== "string" ||
    typeof o.category !== "string" ||
    typeof o.mood !== "string" ||
    typeof o.responseText !== "string" ||
    typeof o.awardedPoints !== "number" ||
    typeof o.maxPoints !== "number"
  ) {
    return false;
  }
  if (o.completionHow !== undefined && typeof o.completionHow !== "string") return false;
  if (o.completionLearned !== undefined && typeof o.completionLearned !== "string") return false;
  if (o.completedAtIso !== undefined && typeof o.completedAtIso !== "string") return false;
  if (o.elapsedSeconds !== undefined) {
    if (typeof o.elapsedSeconds !== "number" || !Number.isFinite(o.elapsedSeconds) || o.elapsedSeconds < 0) return false;
  }
  return true;
}

/** Local date/time string for completion log; falls back to date-only if no timestamp. */
function formatMissionCompletionTime(e: MissionCompletionLogEntryV1): string {
  const raw = (e.completedAtIso || "").trim();
  if (raw) {
    try {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      }
    } catch {
      /* ignore */
    }
  }
  return e.completedIso;
}

function formatSyndicateInstant(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  try {
    return new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function loadMissionCompletionLog(): MissionCompletionLogEntryV1[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ls("mission_completion_log_v1"));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMissionCompletionLogEntry);
  } catch {
    return [];
  }
}

function persistMissionCompletionLog(entries: MissionCompletionLogEntryV1[]) {
  if (typeof window === "undefined") return;
  const trimmed = entries.slice(0, MAX_MISSION_COMPLETION_LOG);
  window.localStorage.setItem(ls("mission_completion_log_v1"), JSON.stringify(trimmed));
  onSyndicatePersist();
}

const MAX_MISSION_MISSED_LOG = 400;

/** Missions that were never completed before the 24h board window (from `created_at`) ended. */
type MissionMissedLogEntryV1 = {
  entryId: string;
  challengeId: number;
  title: string;
  category: string;
  mood: string;
  createdAtIso: string;
  /** When the 24h mission-board window closed. */
  boardExpiredAtIso: string;
  /** When this device first recorded the miss. */
  missedAtIso: string;
  /** Local calendar day when recorded (YYYY-MM-DD). */
  missedIso: string;
  userCreated?: boolean;
};

function isMissionMissedLogEntry(x: unknown): x is MissionMissedLogEntryV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.entryId === "string" &&
    typeof o.challengeId === "number" &&
    Number.isFinite(o.challengeId) &&
    typeof o.title === "string" &&
    typeof o.category === "string" &&
    typeof o.mood === "string" &&
    typeof o.createdAtIso === "string" &&
    typeof o.boardExpiredAtIso === "string" &&
    typeof o.missedAtIso === "string" &&
    typeof o.missedIso === "string" &&
    (o.userCreated === undefined || typeof o.userCreated === "boolean")
  );
}

function loadMissionMissedLog(): MissionMissedLogEntryV1[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ls("mission_missed_log_v1"));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMissionMissedLogEntry);
  } catch {
    return [];
  }
}

function persistMissionMissedLog(entries: MissionMissedLogEntryV1[]) {
  if (typeof window === "undefined") return;
  const trimmed = entries.slice(0, MAX_MISSION_MISSED_LOG);
  window.localStorage.setItem(ls("mission_missed_log_v1"), JSON.stringify(trimmed));
  onSyndicatePersist();
}

function missedEntryIdForRow(row: ChallengeRow): string | null {
  const createdMs = Date.parse(row.created_at);
  if (Number.isNaN(createdMs)) return null;
  return `${row.id}-${createdMs}`;
}

/** e.g. 264 → "4m 24s", 3725 → "1h 2m 5s" */
function formatDurationReadable(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (rs > 0 || parts.length === 0) parts.push(`${rs}s`);
  return parts.join(" ");
}

/** Plain language for popups, e.g. 264 → "4 minutes and 24 seconds". */
function formatDurationForPopup(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  const parts: string[] = [];
  if (h === 1) parts.push("1 hour");
  else if (h > 1) parts.push(`${h} hours`);
  if (m === 1) parts.push("1 minute");
  else if (m > 1) parts.push(`${m} minutes`);
  if (rs === 1) parts.push("1 second");
  else if (rs > 0 || parts.length === 0) parts.push(`${rs} seconds`);
  if (parts.length <= 1) return parts[0] ?? "0 seconds";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function startOfLocalDayMs(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function secondsUntilLocalMidnight(nowMs: number): number {
  const d = new Date(nowMs);
  const next = new Date(d);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((next.getTime() - nowMs) / 1000));
}

function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(rs).padStart(2, "0")}`;
}

/** Countdown for mission reminders: includes days when ≥ 24h left. */
function formatReminderTimeLeft(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const days = Math.floor(s / 86400);
  const rem = s % 86400;
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const rs = rem % 60;
  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}, ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(rs).padStart(2, "0")}`;
  }
  return formatCountdown(s);
}

/** How long since the reminder deadline (for overdue / penalty rows). Same day + clock shape as time left. */
function formatReminderOverduePast(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const days = Math.floor(s / 86400);
  const rem = s % 86400;
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const rs = rem % 60;
  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}, ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(rs).padStart(2, "0")}`;
  }
  return formatCountdown(s);
}

export type MissionReminderListItem = {
  id: number;
  title: string;
  atIso: string;
  dueAt: number;
  overdue: boolean;
  onBoard: boolean;
  secLeft: number;
  penaltyApplied: boolean;
  howDraft: string;
  /** When the reminder was saved; omitted on very old local data. */
  addedAtIso?: string;
};

function MissionReminderCard({
  item,
  nowTick,
  rows,
  onOpenMission,
  onDismiss
}: {
  item: MissionReminderListItem;
  nowTick: number;
  rows: ChallengeRow[];
  onOpenMission: (row: ChallengeRow) => void;
  onDismiss: (id: number) => void;
}) {
  const secPast = Math.max(0, (nowTick - item.dueAt) / 1000);
  const statusTag = item.penaltyApplied ? "Closed" : item.overdue ? "Due" : "Active";

  return (
    <li className="list-none">
      <article className="syndicate-readable syndicate-cyber-card syndicate-cyber-card--reminder">
        <div className="syndicate-cyber-card__shell">
          <div
            className={cn(
              "syndicate-cyber-card__body",
              item.penaltyApplied && "syndicate-cyber-card__body--reminder-penalty",
              !item.penaltyApplied && item.overdue && "syndicate-cyber-card__body--reminder-overdue"
            )}
          >
            <div className="syndicate-cyber-card__bokeh" aria-hidden />
            <div className="syndicate-cyber-card__grid" aria-hidden />
            <div className="syndicate-cyber-card__content syndicate-cyber-card__content--reminder">
              <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="syndicate-cyber-card__meta syndicate-cyber-card__meta--reminder">
                    <span className="syndicate-cyber-card__tag text-[0.58rem]">{statusTag}</span>
                    <span className="syndicate-cyber-card__mood">Reminder</span>
                    {item.penaltyApplied ? (
                      <span className="rounded-full border border-rose-400/55 bg-black/55 px-2 py-0.5 font-mono text-[0.58rem] font-extrabold tabular-nums text-rose-200/95">
                        −1 PT
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "syndicate-cyber-card__timer tabular-nums",
                          item.overdue && item.secLeft <= 0 && "border-amber-400/55 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.2)]"
                        )}
                      >
                        {item.secLeft > 0 ? formatReminderTimeLeft(item.secLeft) : "0:00:00"}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                    {item.penaltyApplied ? "Deadline passed" : !item.overdue ? "Time left" : "Due now"}
                  </div>
                  <h4 className="syndicate-cyber-card__title syndicate-cyber-card__title--reminder">{item.title}</h4>
                  {item.howDraft ? (
                    <div className="mt-2 rounded-md border border-white/12 bg-black/40 p-2.5 sm:p-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/75">
                        How will you complete it
                      </div>
                      <p className="mt-1.5 max-h-[140px] overflow-y-auto whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/88 sm:text-[14px]">
                        {item.howDraft}
                      </p>
                    </div>
                  ) : null}
                  {item.penaltyApplied ? (
                    <>
                      <p className="mt-2 font-mono text-[13px] tabular-nums text-rose-200/95">
                        −1 pt applied · reminder closed for scoring
                      </p>
                      <div className="mt-1 font-mono text-[14px] tabular-nums leading-snug text-amber-100/85">
                        Overdue by {formatReminderOverduePast(secPast)}
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 space-y-1">
                      <div className="font-mono text-[14px] tabular-nums leading-snug text-cyan-100/90">
                        {item.secLeft > 0 ? (
                          <>
                            <span className="text-cyan-200/95">{formatReminderTimeLeft(item.secLeft)}</span>
                            <span className="text-[12px] font-semibold text-white/55"> · remaining</span>
                          </>
                        ) : (
                          <span className="text-amber-100/90">0:00:00 · time&apos;s up</span>
                        )}
                      </div>
                      {item.overdue ? (
                        <div className="font-mono text-[14px] tabular-nums leading-snug text-amber-100/85">
                          Overdue by {formatReminderOverduePast(secPast)}
                        </div>
                      ) : null}
                    </div>
                  )}
                  <div className="mt-1 text-[12px] text-white/55">
                    Target:{" "}
                    {new Date(item.atIso).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                  </div>
                  {!item.onBoard ? (
                    <p className="mt-1 text-[11px] text-amber-200/80">
                      This mission is no longer on the board (24h window). The reminder stays until the target time.
                    </p>
                  ) : null}
                </div>
                <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:flex-col sm:items-stretch">
                  {item.onBoard ? (
                    <button
                      type="button"
                      onClick={() => {
                        const r = rows.find((x) => x.id === item.id);
                        if (r) onOpenMission(r);
                      }}
                      className="syndicate-cyber-card__cta syndicate-cyber-card__cta--view min-h-[44px] flex-1 px-4 py-2 text-[11px] sm:min-h-0 sm:flex-none"
                    >
                      Open mission
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDismiss(item.id)}
                      className="syndicate-cyber-card__cta min-h-[44px] flex-1 px-4 py-2 text-[11px] sm:min-h-0 sm:flex-none"
                    >
                      Done
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDismiss(item.id)}
                    className="min-h-[44px] rounded-md border border-white/20 bg-black/35 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 transition hover:border-white/35 hover:bg-black/50 sm:min-h-0"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function friendlyAdminTaskError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (!msg) return "Admin tasks are temporarily unavailable.";
  if (msg.toLowerCase().includes("unexpected token")) {
    return "Admin tasks endpoint is unavailable right now. Please try again later.";
  }
  return msg;
}

/** Referral streak restore: exactly this many local **calendar** days from `streak_break_date` (day 0 = break day). */
const RESTORE_WINDOW_CALENDAR_DAYS = 7;

function streakBreakLocalMidnight(): Date | null {
  if (typeof window === "undefined") return null;
  const br = window.localStorage.getItem(ls("streak_break_date"));
  if (!br || !/^\d{4}-\d{2}-\d{2}$/.test(br.trim())) return null;
  const [ys, ms, ds] = br.trim().split("-");
  const y = parseInt(ys, 10);
  const m = parseInt(ms, 10) - 1;
  const d = parseInt(ds, 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m, d);
}

/** Whole local calendar days since break day (0 on the break day). */
function calendarDaysSinceStreakBreak(nowMs: number = Date.now()): number | null {
  const breakStart = streakBreakLocalMidnight();
  if (!breakStart) return null;
  const today = new Date(nowMs);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.floor((t0 - breakStart.getTime()) / 86400000);
}

function withinRestoreWindow(nowMs: number = Date.now()): boolean {
  const days = calendarDaysSinceStreakBreak(nowMs);
  if (days === null) return false;
  return days >= 0 && days < RESTORE_WINDOW_CALENDAR_DAYS;
}

function restoreDaysLeft(nowMs: number = Date.now()): number {
  const days = calendarDaysSinceStreakBreak(nowMs);
  if (days === null || days < 0) return 0;
  if (days >= RESTORE_WINDOW_CALENDAR_DAYS) return 0;
  return RESTORE_WINDOW_CALENDAR_DAYS - days;
}

/** Stored when the server resets streak after a missed day (`streak_before_break` in syndicate state). */
function readStreakBeforeBreakCount(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ls("streak_before_break"));
  if (raw == null || raw === "") return null;
  const n = parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(999, n);
}

function parseStreakBeforeBreakFromSyncedState(state: Record<string, string> | undefined): number | null {
  if (!state) return null;
  const raw = state["streak_before_break"];
  if (raw == null || raw === "") return null;
  const n = parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(999, n);
}

/** Server-backed “streak before break” while current streak is 0; null when streak > 0. */
function streakBeforeBreakHintForProgress(streakCount: number, state: Record<string, string> | undefined): number | null {
  if (streakCount !== 0) return null;
  return parseStreakBeforeBreakFromSyncedState(state);
}

function difficultyStyle(d: string) {
  const x = d.toLowerCase();
  if (x === "easy") return "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
  if (x === "hard") return "border-rose-500/50 bg-rose-500/10 text-rose-200";
  return "border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.08)] text-[color:var(--gold)]";
}

/** Visual accent for mission cards: cyan/blue vs lime/green (matches reference board). */
function categoryCyberTheme(category: string): "cyan" | "lime" {
  const c = category.toLowerCase();
  if (c === "fitness" || c === "grooming") return "lime";
  return "cyan";
}

function moodLabelForMissionCard(mood: string | undefined): string {
  const key = (mood ?? "").toLowerCase();
  if (key && STATS_MOOD_LABEL[key]) return STATS_MOOD_LABEL[key];
  if (!mood || !mood.trim()) return "Daily";
  return mood
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function CompactCard({
  row,
  done,
  dayCountdownSec,
  onView,
}: {
  row: ChallengeRow;
  done: boolean;
  dayCountdownSec: number;
  onView: () => void;
}) {
  const p = row.payload;
  const title = p?.challenge_title ?? "Mission";
  const pts = row.points ?? p?.points ?? 0;
  const theme = categoryCyberTheme(row.category ?? "");
  const moodLine = moodLabelForMissionCard(row.mood);

  return (
    <article
      className={cn(
        "syndicate-readable syndicate-cyber-card",
        theme === "lime" && "syndicate-cyber-card--lime",
        done && "syndicate-cyber-card--done"
      )}
    >
      <div className="syndicate-cyber-card__shell">
        <div className="syndicate-cyber-card__body">
          <div className="syndicate-cyber-card__bokeh" aria-hidden />
          <div className="syndicate-cyber-card__grid" aria-hidden />
          <div className="syndicate-cyber-card__content">
            <div>
              <div className="syndicate-cyber-card__meta">
                <span className="syndicate-cyber-card__pts tabular-nums">
                  {pts} PTS
                </span>
                <span className="syndicate-cyber-card__mood">Mood: {moodLine}</span>
                {done ? (
                  <span className="syndicate-cyber-card__timer syndicate-cyber-card__timer--complete">COMPLETE</span>
                ) : (
                  <span className="syndicate-cyber-card__timer tabular-nums">{formatCountdown(dayCountdownSec)}</span>
                )}
              </div>
              {row.user_created ? (
                <div className="syndicate-cyber-card__tags">
                  <span className="syndicate-cyber-card__tag syndicate-cyber-card__tag--yours">Yours</span>
                </div>
              ) : null}
              <h4 className="syndicate-cyber-card__title">{title}</h4>
            </div>
            <button
              type="button"
              onClick={onView}
              className="syndicate-cyber-card__cta syndicate-cyber-card__cta--view min-h-[44px] touch-manipulation sm:min-h-0"
            >
              View mission
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function agentAttestPanelClass(verdict: string): string {
  const v = (verdict || "").toLowerCase();
  if (v === "pass") return "border-emerald-400/45 bg-emerald-500/10";
  if (v === "needs_work") return "border-amber-400/50 bg-amber-500/12";
  return "border-cyan-400/40 bg-cyan-500/10";
}

function DetailPane({
  row,
  initialResponse,
  submitting,
  scorePreview,
  awardedPoints,
  submitDisabled,
  submitLockedMessage,
  nowMs,
  done,
  /** Wall-clock ms when user opened this mission (detail); used for elapsed scoring. */
  taskTimerStartMs,
  onBack,
  onSubmit,
  onDraftPersist,
  missionReminderIso = null,
  onMissionReminderChange,
  onMissionReminderDone,
  onSyndicateHelpOpen
}: {
  row: ChallengeRow;
  initialResponse: MissionResponseDraft;
  submitting?: boolean;
  scorePreview?: MissionScoreResponse | null;
  awardedPoints?: number | null;
  submitDisabled?: boolean;
  submitLockedMessage?: string | null;
  nowMs: number;
  done?: boolean;
  taskTimerStartMs?: number | null;
  onBack: () => void;
  onSubmit: (draft: MissionResponseDraft) => Promise<void>;
  /** Persist draft to localStorage while typing (incomplete missions only). */
  onDraftPersist?: (draft: MissionResponseDraft) => void;
  /** Optional reminder (local time picker); stored as ISO on the parent. */
  missionReminderIso?: string | null;
  onMissionReminderChange?: (iso: string | null) => void;
  /** After user confirms date/time with Done: e.g. navigate to reminders list. */
  onMissionReminderDone?: () => void;
  /** Opens syndicate help popover anchored to the ? control (e.g. mission reminder explainer). */
  onSyndicateHelpOpen?: SyndicateHelpOpenFn;
}) {
  const p = row.payload;
  const [how, setHow] = useState(initialResponse.how);
  const [learned, setLearned] = useState(initialResponse.learned);
  const draftRef = useRef({ how: initialResponse.how, learned: initialResponse.learned });
  draftRef.current = { how, learned };
  const examples = getChallengeExamples(p);
  const benefits = getChallengeBenefits(p);
  const readOnlyCompleted = !!done;
  const missionElapsedSec =
    !done && taskTimerStartMs != null && taskTimerStartMs > 0
      ? Math.max(0, Math.floor((nowMs - taskTimerStartMs) / 1000))
      : 0;

  // Keep local textarea state stable while typing. Re-syncing from storage on every parent
  // render (e.g. timer ticks) can wipe in-progress edits before debounce persistence runs.

  useEffect(() => {
    if (readOnlyCompleted || !onDraftPersist) return;
    const t = window.setTimeout(() => {
      onDraftPersist({ how, learned });
    }, 400);
    return () => window.clearTimeout(t);
  }, [how, learned, readOnlyCompleted, onDraftPersist, row.id]);

  useEffect(() => {
    if (readOnlyCompleted || !onDraftPersist) return;
    return () => {
      onDraftPersist(draftRef.current);
    };
  }, [row.id, readOnlyCompleted, onDraftPersist]);
  const remainingSec = secondsUntilLocalMidnight(nowMs);

  const [reminderLocal, setReminderLocal] = useState("");
  useEffect(() => {
    if (readOnlyCompleted || !onMissionReminderChange) {
      setReminderLocal("");
      return;
    }
    setReminderLocal(missionReminderIso ? toDatetimeLocalValue(new Date(missionReminderIso)) : "");
  }, [missionReminderIso, row.id, readOnlyCompleted, onMissionReminderChange]);

  const handleMissionReminderDone = () => {
    if (!onMissionReminderChange) return;
    const v = reminderLocal.trim();
    if (!v) {
      if (missionReminderIso) {
        onMissionReminderChange(null);
        onMissionReminderDone?.();
      }
      return;
    }
    const parsed = new Date(v);
    if (Number.isNaN(parsed.getTime())) return;
    onMissionReminderChange(parsed.toISOString());
    onMissionReminderDone?.();
  };

  return (
    <div
      id="syndicate-mission-detail-top"
      className="syndicate-readable syndicate-detail-pane flex h-full min-h-0 w-full min-w-0 max-w-none flex-1 flex-col overflow-hidden scroll-mt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+4.5rem))] px-1 pb-2 pt-1 sm:px-2 sm:pb-3 sm:pt-2 md:px-3"
    >
      <div className="z-20 -mx-2 mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,8,10,0.97),rgba(6,6,8,0.92))] px-3 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.55)] backdrop-blur-md sm:-mx-4 sm:px-4 md:-mx-5 md:mb-4 md:px-5">
        <button
          type="button"
          onClick={onBack}
          className="syndicate-link-skip min-h-[44px] px-1 py-2 text-left text-[14px] font-semibold text-[color:var(--gold)] underline-offset-4 hover:underline sm:min-h-0"
        >
          ← Back to missions
        </button>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-lg border border-[rgba(0,255,255,0.3)] bg-[linear-gradient(165deg,rgba(5,14,24,0.94),rgba(0,0,0,0.84)_52%,rgba(46,10,58,0.64))] p-4 [box-shadow:0_0_28px_rgba(0,255,255,0.1)] sm:p-6 md:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded border border-white/25 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-tight tracking-wide text-white/80 sm:text-[10px]">
            {row.category}
          </span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]",
              difficultyStyle(row.difficulty)
            )}
          >
            {row.difficulty} · {row.points} pts
          </span>
          {!done ? (
            <span
              className="rounded border border-cyan-400/40 bg-cyan-500/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums tracking-wide text-cyan-200/95 sm:text-[10px]"
              title="Time until local midnight (daily mission window)"
            >
              {formatCountdown(remainingSec)}
            </span>
          ) : null}
        </div>
        {!done && taskTimerStartMs != null ? (
          <div
            className="mb-3 w-full max-w-[min(24rem,100%)] rounded-md border border-white/12 bg-black/30 px-2.5 py-2 sm:px-3 sm:py-2"
            title="Mission and daily window timers"
          >
            <p className="syndicate-nav-headline text-[clamp(0.82rem,2.9vw,1.05rem)] leading-tight sm:text-[clamp(0.88rem,2.4vw,1.15rem)] md:text-[clamp(0.95rem,2vw,1.2rem)]">
              Your mission has started
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-mono text-[clamp(0.95rem,2.8vw,1.35rem)] font-black tabular-nums leading-none text-[color:var(--gold)] sm:text-[clamp(1.05rem,2.2vw,1.5rem)]">
              <span className="text-[color:var(--gold)]/95" title="Elapsed since you first opened this mission (used for scoring)">
                {formatDurationReadable(missionElapsedSec)}
              </span>
            </div>
          </div>
        ) : null}
        {!done && taskTimerStartMs != null ? (
          <p className="mb-3 text-[11px] font-medium leading-snug text-white/60 sm:text-[12px]">
            Time counts <span className="text-white/75">since you first opened</span> this mission (not the time of day). Going back and opening again does not reset it.
            Faster completion can improve your score.
          </p>
        ) : null}
        <h3 className="text-[19px] font-bold leading-[1.2] tracking-tight text-white sm:text-[23px] md:text-[27px] md:leading-[1.15]">
          {p.challenge_title}
        </h3>

        <section className="mt-6">
          <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]/85">About this mission</h4>
          <p className="mt-3 text-[16px] leading-[1.65] text-white/92 antialiased md:text-[17px] md:leading-[1.7]">
            {p.challenge_description}
          </p>
        </section>

        <section className="mt-7">
          <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]/85">Examples</h4>
          {examples.length ? (
            <ul className="mt-3 list-none space-y-3">
              {examples.map((line, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/90 antialiased md:text-[16px]">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-[12px] font-bold text-white/90">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] text-white/55">No examples listed for this mission.</p>
          )}
        </section>

        <section className="mt-7">
          <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]/85">Benefits</h4>
          {benefits.length ? (
            <ul className="mt-3 list-none space-y-3">
              {benefits.map((line, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/90 antialiased md:text-[16px]">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--gold)]/80" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] text-white/55">No benefits listed for this mission.</p>
          )}
        </section>

        <p className="mt-7 text-[15px] leading-relaxed text-white/70">
          <span className="text-white/50">Mindset: </span>
          <span className="text-[color:var(--gold)]/95">{p.based_on_mindset}</span>
        </p>

        <div className="mt-8 border-t border-white/10 pt-5">
          <h4 className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]/85">
            {readOnlyCompleted ? "Your submitted response" : "Your completion"}
          </h4>
          {readOnlyCompleted ? (
            how.trim() || learned.trim() ? (
              learned.trim() ? (
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--gold)]/75">
                      How will you complete it
                    </div>
                    <div className="syndicate-readable whitespace-pre-wrap break-words rounded-md border border-white/15 bg-black/50 px-3 py-2.5 text-[15px] leading-relaxed text-white/95">
                      {how.trim() || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--gold)]/75">
                      What you learned from it
                    </div>
                    <div className="syndicate-readable whitespace-pre-wrap break-words rounded-md border border-white/15 bg-black/50 px-3 py-2.5 text-[15px] leading-relaxed text-white/95">
                      {learned.trim()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="syndicate-readable rounded-md border border-white/15 bg-black/50 px-3 py-2.5 text-[15px] leading-relaxed text-white/95">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Your response</div>
                  <p className="whitespace-pre-wrap break-words">{how.trim()}</p>
                </div>
              )
            ) : (
              <p className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-[13px] text-white/65">
                No response was submitted for this completed mission.
              </p>
            )
          ) : (
            <>
              <label className="mb-1.5 block text-[12px] font-semibold text-white/80" htmlFor="mission-how">
                How will you complete it
              </label>
              <textarea
                id="mission-how"
                value={how}
                onChange={(e) => setHow(e.target.value)}
                rows={4}
                placeholder="Describe how you will complete this mission…"
                className="syndicate-readable mb-4 min-h-[112px] w-full resize-y rounded-md border border-white/18 bg-black/50 px-3 py-3 text-[16px] leading-relaxed text-white/95 outline-none placeholder:text-white/35 focus:border-cyan-400/45 focus:ring-1 focus:ring-cyan-400/20 sm:text-[15px]"
              />
              {onMissionReminderChange ? (
                <div className="mb-6 rounded-lg border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(0,45,70,0.35),rgba(0,0,0,0.25))] p-4 [box-shadow:inset_0_0_0_1px_rgba(120,200,255,0.08)]">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <label
                      className="text-[12px] font-bold uppercase tracking-[0.12em] text-cyan-200/85"
                      htmlFor="syndicate-mission-reminder"
                    >
                      Reminder date &amp; time (optional)
                    </label>
                    {onSyndicateHelpOpen ? (
                      <SyndicateHelpMark
                        topic="mission-reminder"
                        label="How mission reminders work and how points can change"
                        onOpen={onSyndicateHelpOpen}
                      />
                    ) : null}
                  </div>
                  <p className="mb-2 text-[11px] leading-snug text-white/50 sm:text-[12px]">
                    Pick a date and time, then press <span className="font-semibold text-cyan-100/90">Done</span> to save. Tap{" "}
                    <span className="font-semibold text-red-300/90" aria-hidden>
                      ?
                    </span>{" "}
                    for what this reminder does and how points may be deducted.
                  </p>
                  <input
                    id="syndicate-mission-reminder"
                    type="datetime-local"
                    value={reminderLocal}
                    onChange={(e) => setReminderLocal(e.target.value)}
                    className={cn(
                      SYNDICATE_DATE_INPUT,
                      "mt-1 w-full max-w-[min(100%,22rem)] text-[15px] text-white [color-scheme:dark]"
                    )}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMissionReminderDone}
                      disabled={
                        !reminderLocal.trim() && !missionReminderIso
                      }
                      className={cn(
                        "syndicate-readable min-h-[44px] touch-manipulation rounded-md border px-4 py-2 text-[13px] font-bold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-40",
                        "border-cyan-400/45 bg-cyan-500/15 text-cyan-50 hover:border-cyan-300/55 hover:bg-cyan-500/25"
                      )}
                    >
                      Done
                    </button>
                    {reminderLocal || missionReminderIso ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReminderLocal("");
                          onMissionReminderChange(null);
                        }}
                        className="syndicate-link-skip min-h-[44px] text-[12px] font-semibold uppercase tracking-wide text-cyan-200/80 underline-offset-4 hover:text-cyan-100 hover:underline"
                      >
                        Clear reminder
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <label className="mb-1.5 block text-[12px] font-semibold text-white/80" htmlFor="mission-learned">
                What you learned from it
              </label>
              <textarea
                id="mission-learned"
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                rows={4}
                placeholder="Reflect on insights, skills, or takeaways from doing this mission…"
                className="syndicate-readable min-h-[112px] w-full resize-y rounded-md border border-white/18 bg-black/50 px-3 py-3 text-[16px] leading-relaxed text-white/95 outline-none placeholder:text-white/35 focus:border-cyan-400/45 focus:ring-1 focus:ring-cyan-400/20 sm:text-[15px]"
              />
              <p className="mt-2 text-[11px] leading-snug text-white/50 sm:text-[12px]">
                Both fields are required before you can submit. Scoring uses them together.
              </p>
              <button
                type="button"
                disabled={!how.trim() || !learned.trim() || submitting || submitDisabled}
                onClick={() => void onSubmit({ how: how.trim(), learned: learned.trim() })}
                className={cn(
                  "syndicate-readable mt-3 px-5 py-2.5 text-[15px] font-bold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-40",
                  CTA_BTN
                )}
              >
                {submitting ? "Scoring..." : "Submit completion"}
              </button>
            </>
          )}
          {submitLockedMessage ? <p className="mt-2 text-[12px] text-rose-200/90">{submitLockedMessage}</p> : null}
          {awardedPoints !== null && awardedPoints !== undefined ? (
            <>
              <p className="mt-2 rounded-md border border-emerald-300/45 bg-emerald-500/10 px-3 py-2 text-[13px] font-bold text-emerald-100">
                You earned <span className="text-[16px] font-black">+{awardedPoints}</span> points.
              </p>
            </>
          ) : null}
          {readOnlyCompleted && (awardedPoints === null || awardedPoints === undefined) ? (
            <p className="mt-2 text-[12px] text-white/60">Points record is unavailable for this older completed mission.</p>
          ) : null}
          {scorePreview ? (
            <>
              {scorePreview.is_valid === false ? (
                <div className="mt-2 space-y-2 rounded-md border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-[12px] leading-relaxed text-amber-100/90">
                  <p>
                    <span className="font-bold text-amber-50">Not scored.</span> The evaluation agent rejected this
                    response (0 / {scorePreview.max_points} points). Time and accuracy rubric were not applied.
                  </p>
                  {scorePreview.agent_validation?.reason ? (
                    <p className="text-[11px] text-amber-100/75 sm:text-[12px]">{scorePreview.agent_validation.reason}</p>
                  ) : null}
                </div>
              ) : scorePreview.breakdown ? (
                <p className="mt-2 text-[12px] leading-relaxed text-white/70">
                  Score: <span className="font-semibold text-[color:var(--gold)]">{scorePreview.awarded_points}</span> /{" "}
                  {scorePreview.max_points} points · Accuracy:{" "}
                  {typeof scorePreview.accuracy_ratio === "number"
                    ? `${Math.round(scorePreview.accuracy_ratio * 100)}%`
                    : typeof scorePreview.breakdown.accuracy_ratio === "number"
                      ? `${Math.round(scorePreview.breakdown.accuracy_ratio * 100)}%`
                      : "—"}{" "}
                  · Time bonus: ×{scorePreview.breakdown.time_multiplier?.toFixed(3) ?? "1.000"} · Words:{" "}
                  {scorePreview.breakdown.word_count} · Elapsed:{" "}
                  <span className="font-medium text-white/85">
                    {formatDurationReadable(scorePreview.breakdown.elapsed_seconds)}
                  </span>{" "}
                  ({scorePreview.breakdown.elapsed_seconds}s) · Relevance:{" "}
                  {Math.round(scorePreview.breakdown.relevance_score * 100)}%
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-white/60">Score details unavailable.</p>
              )}
              {scorePreview.agent_attestation ? (
                <div
                  className={cn(
                    "mt-4 rounded-lg border p-4 sm:p-5 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.06)]",
                    agentAttestPanelClass(scorePreview.agent_attestation.verdict)
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/75">Agent attestation</span>
                    <span className="rounded border border-white/25 bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90">
                      {(scorePreview.agent_attestation.verdict || "partial").replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/92 sm:text-[15px]">
                    {scorePreview.agent_attestation.attestation}
                  </p>
                  {scorePreview.agent_attestation.checks.length > 0 ? (
                    <div className="mt-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Checks</div>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-snug text-white/82">
                        {scorePreview.agent_attestation.checks.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {scorePreview.agent_attestation.suggestions.length > 0 ? (
                    <div className="mt-3 rounded-md border border-white/12 bg-black/30 p-3 sm:p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Suggestions</div>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-snug text-white/78">
                        {scorePreview.agent_attestation.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : scorePreview.agent_attestation === null && scorePreview.is_valid !== false ? (
                <p className="mt-3 text-[11px] leading-snug text-white/45 sm:text-[12px]">
                  Agent attestation unavailable (no API key or model error). Your validated score above still applies.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SyndicateAiChallengePanel() {
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>("load");
  /** True while today/ API reports incremental generation still running (partial rows may not match filters yet). */
  const [dailyBatchStreaming, setDailyBatchStreaming] = useState(false);
  const [selected, setSelected] = useState<ChallengeRow | null>(null);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<number>>(() => new Set());
  /** Per-challenge reminders (ISO instant + title snapshot); synced via syndicate progress when logged in. */
  const [missionReminders, setMissionReminders] = useState<Record<number, MissionReminderEntry>>({});
  const [streak, setStreak] = useState(0);
  /** From last `me/progress/` payload when streak is 0 (avoids missing “was X” before localStorage sync). */
  const [streakBeforeBreakHint, setStreakBeforeBreakHint] = useState<number | null>(null);
  /** Server `last_activity_date` (YYYY-MM-DD); first mission completion of the day triggers streak_record. */
  const [lastActivityIso, setLastActivityIso] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<"all" | (typeof CATEGORIES)[number]>("all");
  const [doneFilter, setDoneFilter] = useState<"all" | "complete" | "incomplete">("incomplete");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [canClaimRestore, setCanClaimRestore] = useState(false);
  const [referralMsg, setReferralMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  /** Inline stats + profile panel (not a modal). */
  const [showStatsProfile, setShowStatsProfile] = useState(false);
  const [syndicateView, setSyndicateView] = useState<"dashboard" | "challenges" | "reminders">("dashboard");
  /** Reminders full-page list: sort by when the reminder was saved (newest / oldest). */
  const [reminderPageSort, setReminderPageSort] = useState<"newest" | "oldest">("newest");
  /** `YYYY-MM-DD` or empty — show reminders whose saved-on day matches (legacy rows use target day). */
  const [reminderFilterDate, setReminderFilterDate] = useState<string>("");
  /** Filter missions inside Stats & profile by mood (default: energetic). */
  const [statsMood, setStatsMood] = useState<string>("energetic");
  const [customTitle, setCustomTitle] = useState("");
  /** “Create your mission” form — modal on Missions tab only (not inline). */
  const [createMissionModalOpen, setCreateMissionModalOpen] = useState(false);
  /** Shown inside the create-mission modal (global `error` sits under the overlay and is easy to miss). */
  const [createMissionError, setCreateMissionError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(() =>
    typeof window === "undefined" ? DEFAULT_DASHBOARD_PROFILE_NAME : readDashboardProfileDisplayName()
  );
  const [profileAvatarRaw, setProfileAvatarRaw] = useState(() =>
    typeof window === "undefined" ? "" : readDashboardProfileAvatarStorageRaw()
  );

  const refreshFromShellProfile = useCallback(() => {
    if (typeof window === "undefined") return;
    setProfileName(readDashboardProfileDisplayName());
    setProfileAvatarRaw(readDashboardProfileAvatarStorageRaw());
    mirrorShellProfileIntoSyndicateStorage();
  }, []);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leaderboardErr, setLeaderboardErr] = useState<string | null>(null);
  const [challengeLogVersion, setChallengeLogVersion] = useState(0);
  const [historyFilterDate, setHistoryFilterDate] = useState(() => todayLocalISO());
  const [missionStartMap, setMissionStartMap] = useState<Record<number, number>>({});
  const [nowTick, setNowTick] = useState(() => Date.now());
  /** Bumps when `challenge_responses` drafts change so reminder cards re-read `loadResponses()`. */
  const [responseDraftsVersion, setResponseDraftsVersion] = useState(0);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [lastScore, setLastScore] = useState<MissionScoreResponse | null>(null);
  const [missionScores, setMissionScores] = useState<Record<number, MissionScoreResponse>>({});
  const [missionAwardedMap, setMissionAwardedMap] = useState<Record<number, number>>({});
  const [missionCompletionLog, setMissionCompletionLog] = useState<MissionCompletionLogEntryV1[]>([]);
  const [missionMissedLog, setMissionMissedLog] = useState<MissionMissedLogEntryV1[]>([]);
  const [missionCompleteToast, setMissionCompleteToast] = useState<{
    title: string;
    points: number;
    elapsedSeconds: number;
  } | null>(null);
  const [redeemedRewards, setRedeemedRewards] = useState<Set<string>>(() => new Set());
  const [syndicateHelpPanel, setSyndicateHelpPanel] = useState<SyndicateHelpOpenState | null>(null);
  const openSyndicateHelp = useCallback<SyndicateHelpOpenFn>((topic, anchorEl) => {
    setSyndicateHelpPanel({ topic, anchorEl });
  }, []);
  const [adminTasks, setAdminTasks] = useState<AdminTaskRow[]>([]);
  const [adminTaskDrafts, setAdminTaskDrafts] = useState<Record<number, string>>({});
  /** Latest drafts for MediaRecorder onstop (closure-safe). */
  const adminTaskDraftsRef = useRef<Record<number, string>>({});
  const [adminTaskFiles, setAdminTaskFiles] = useState<Record<number, File | null>>({});
  const [adminTaskRecording, setAdminTaskRecording] = useState<Record<number, boolean>>({});
  const [adminTaskBusyId, setAdminTaskBusyId] = useState<number | null>(null);
  const [adminTaskMsg, setAdminTaskMsg] = useState<string | null>(null);
  /** Client start time (ms) when a bonus task becomes available — sent as `started_at_ms` so admin sees elapsed time. */
  const [adminTaskStartedAtMs, setAdminTaskStartedAtMs] = useState<Record<number, number>>({});
  const [poundsBalance, setPoundsBalance] = useState(0);
  const [convertPointsInput, setConvertPointsInput] = useState("100");
  const lineGradientUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const lastSeenDayRef = useRef<string>(todayLocalISO());
  const bonusMissionSectionRef = useRef<HTMLElement | null>(null);
  const streakRestoreSectionRef = useRef<HTMLDivElement | null>(null);
  const initialLoadOnceRef = useRef(false);
  /** After a 401 on bonus-task polling, stop hitting the endpoint until remount (avoids log spam / useless requests). */
  const adminTasksPollPausedRef = useRef(false);
  const adminTaskRecorderRef = useRef<Record<number, MediaRecorder | null>>({});
  const adminTaskStreamRef = useRef<Record<number, MediaStream | null>>({});
  const adminTaskChunksRef = useRef<Record<number, BlobPart[]>>({});
  /** Wall-clock ms when admin-task recording started (for on-screen duration). */
  const adminTaskRecordingStartMsRef = useRef<Record<number, number>>({});
  /** Fullscreen portal preview (avoids iOS clipping from parent overflow; user sees full-screen camera). */
  const adminTaskFullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  /** Blocks double `getUserMedia` while the first call is still pending. */
  const adminTaskCameraOpeningRef = useRef<Record<number, boolean>>({});

  /** iOS Safari often needs playsinline attrs + repeated play(); keep preview visible. */
  const bindFullscreenCameraStream = useCallback((stream: MediaStream) => {
    const vid = adminTaskFullscreenVideoRef.current;
    if (!vid) return;
    vid.srcObject = stream;
    vid.muted = true;
    vid.playsInline = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    const tryPlay = () => {
      void vid.play().catch(() => null);
    };
    tryPlay();
    requestAnimationFrame(tryPlay);
    requestAnimationFrame(() => requestAnimationFrame(tryPlay));
    if (typeof window !== "undefined") {
      window.setTimeout(tryPlay, 0);
      window.setTimeout(tryPlay, 80);
      window.setTimeout(tryPlay, 250);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let res = await fetchSyndicateProgress();
        if (cancelled) return;
        applySyncedStateFromServer(res.state ?? {});
        if (Object.keys(res.state ?? {}).length === 0) {
          const local = collectSyncedState();
          if (Object.keys(local).length > 0) {
            res = await patchSyndicateProgress(local);
            applySyncedStateFromServer(res.state ?? {});
          }
        }
        if (!cancelled) {
          setStreak(res.streak_count);
          setLastActivityIso(res.last_activity_date);
          setStreakBeforeBreakHint(streakBeforeBreakHintForProgress(res.streak_count, res.state));
        }
      } catch {
        /* offline / network — keep namespaced localStorage */
      }
      if (cancelled) return;
      setMounted(true);
      setPointsTotal(loadTotalPoints());
      setDoneIds(loadDoneIds());
      setMissionReminders(loadMissionReminders());
      setMissionStartMap(loadMissionStartTimes());
      setMissionScores(loadMissionScores());
      setMissionAwardedMap(loadMissionAwardedPoints());
      setMissionCompletionLog(loadMissionCompletionLog());
      setMissionMissedLog(loadMissionMissedLog());
      setRedeemedRewards(loadRedeemedRewards());
      setPoundsBalance(loadPoundsBalance());
      if (typeof window !== "undefined") {
        refreshFromShellProfile();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshFromShellProfile]);

  useEffect(() => {
    adminTaskDraftsRef.current = adminTaskDrafts;
  }, [adminTaskDrafts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  /** Reminder penalties run on the server (`process_syndicate_reminder_expiries`); poll progress to sync state. */
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetchSyndicateProgress();
        if (cancelled) return;
        applySyncedStateFromServer(res.state ?? {});
        setPointsTotal(loadTotalPoints());
        setDoneIds(loadDoneIds());
        setMissionReminders(loadMissionReminders());
        setMissionMissedLog(loadMissionMissedLog());
        setMissionCompletionLog(loadMissionCompletionLog());
        setStreak(res.streak_count);
        setLastActivityIso(res.last_activity_date);
        setStreakBeforeBreakHint(streakBeforeBreakHintForProgress(res.streak_count, res.state));
        refreshFromShellProfile();
      } catch {
        /* offline */
      }
    };
    const t = window.setInterval(() => void pull(), 120_000);
    void pull();
    const onVis = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mounted, refreshFromShellProfile]);

  useEffect(() => {
    return () => {
      const recs = adminTaskRecorderRef.current;
      const streams = adminTaskStreamRef.current;
      for (const rec of Object.values(recs)) {
        try {
          rec?.state !== "inactive" && rec?.stop();
        } catch {
          /* ignore */
        }
      }
      for (const stream of Object.values(streams)) {
        try {
          stream?.getTracks().forEach((tr) => tr.stop());
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const visibleAdminTasks = useMemo(() => {
    return adminTasks.filter((t) => {
      if (!t.expires_at) return true;
      return new Date(t.expires_at).getTime() > nowTick;
    });
  }, [adminTasks, nowTick]);

  const dashboardAvatarUrl = useMemo(
    () => resolveDashboardAvatarDisplayUrl(profileAvatarRaw),
    [profileAvatarRaw]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUpdate = () => refreshFromShellProfile();
    window.addEventListener(DASHBOARD_PROFILE_UPDATED_EVENT, onUpdate);
    const onStorage = (e: StorageEvent) => {
      const k = e.key ?? "";
      if (
        k === PROFILE_DISPLAY_NAME_KEY ||
        k === PROFILE_AVATAR_STORAGE_KEY ||
        k.startsWith("dashboarded:shell:v1:")
      ) {
        onUpdate();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DASHBOARD_PROFILE_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshFromShellProfile]);

  useEffect(() => {
    setAdminTaskStartedAtMs((prev) => {
      const next = { ...prev };
      for (const t of adminTasks) {
        if (!t.submission && next[t.id] == null) {
          next[t.id] = Date.now();
        }
      }
      return next;
    });
  }, [adminTasks]);

  const hasActionableBonusMission = useMemo(
    () => visibleAdminTasks.some((t) => t.submission == null),
    [visibleAdminTasks]
  );

  /** Which bonus task is recording — drives fullscreen camera portal (esp. iOS). */
  const recordingAdminTaskId = useMemo(() => {
    for (const [k, v] of Object.entries(adminTaskRecording)) {
      if (v) return Number(k);
    }
    return null;
  }, [adminTaskRecording]);

  useLayoutEffect(() => {
    if (recordingAdminTaskId == null) return;
    const stream = adminTaskStreamRef.current[recordingAdminTaskId];
    if (stream) bindFullscreenCameraStream(stream);
  }, [recordingAdminTaskId, bindFullscreenCameraStream]);

  useEffect(() => {
    if (recordingAdminTaskId == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [recordingAdminTaskId]);

  const goToBonusMissions = useCallback(() => {
    // Mega mission lives under dashboard and is hidden while Stats & profile is open — close it first
    // so the section mounts, then scroll after paint.
    setShowStatsProfile(false);
    setSyndicateView("dashboard");
    window.setTimeout(() => {
      bonusMissionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }, []);

  const dismissMissionReminder = useCallback((id: number) => {
    setMissionReminders((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      persistMissionReminders(next);
      return next;
    });
  }, []);

  const setMissionReminderForSelected = useCallback((iso: string | null) => {
    if (!selected) return;
    setMissionReminders((prev) => {
      const next = { ...prev };
      if (!iso) delete next[selected.id];
      else {
        next[selected.id] = {
          atIso: iso,
          title: (selected.payload?.challenge_title ?? "Mission").trim() || "Mission",
          penaltyApplied: false,
          missionCreatedAtIso: selected.created_at,
          addedAtIso: new Date().toISOString()
        };
      }
      persistMissionReminders(next);
      return next;
    });
  }, [selected]);

  const pieDailyData = useMemo(() => {
    const today = todayLocalISO();
    const h = loadHistory();
    const day = h.days[today];
    return CATEGORIES.map((c, i) => ({
      name: CAT_LABEL[c] ?? c,
      value: day?.byCategory[c] ?? 0,
      fill: PIE_COLORS[i % PIE_COLORS.length]
    }));
  }, [pointsTotal]);

  const pieDailyPointsSum = useMemo(
    () => pieDailyData.reduce((s, d) => s + (typeof d.value === "number" ? d.value : 0), 0),
    [pieDailyData]
  );

  /** Equal placeholder slices when today has no points so the pie (and legend) always render. */
  const pieDailyChartData = useMemo(() => {
    if (pieDailyPointsSum <= 0) {
      return pieDailyData.map((d) => ({ ...d, value: 1 }));
    }
    return pieDailyData;
  }, [pieDailyData, pieDailyPointsSum]);

  /** Lifetime points per category — used on main Syndicate dashboard pie. */
  const pieLifetimeCategoryData = useMemo(() => {
    const h = loadHistory();
    const totals: Record<string, number> = {};
    for (const c of CATEGORIES) totals[c] = 0;
    for (const day of Object.values(h.days)) {
      for (const [k, v] of Object.entries(day.byCategory)) {
        if (CATEGORIES.includes(k as (typeof CATEGORIES)[number])) {
          totals[k] = (totals[k] ?? 0) + (typeof v === "number" ? v : 0);
        }
      }
    }
    return CATEGORIES.map((c, i) => ({
      name: CAT_LABEL[c] ?? c,
      value: totals[c] ?? 0,
      fill: PIE_COLORS[i % PIE_COLORS.length]
    }));
  }, [pointsTotal]);

  /**
   * Same gates as reward cards: Level 0 until 20 pts, then Level 1; 50 → 2; 100 → 3; … (not 100 pts per level).
   */
  const syndicateProgressHud = useMemo(() => {
    const safePts = Math.max(0, pointsTotal);
    let syndicateLevel = 0;
    for (const m of REWARD_MILESTONES) {
      if (safePts >= m.unlock_points) syndicateLevel += 1;
      else break;
    }
    const nextMilestone = REWARD_MILESTONES.find((m) => safePts < m.unlock_points);
    const atMaxTier = !nextMilestone;
    const ptsToNextLevel = nextMilestone ? Math.max(0, nextMilestone.unlock_points - safePts) : 0;
    const nextLevelNumber = nextMilestone
      ? REWARD_MILESTONES.findIndex((m) => m.id === nextMilestone.id) + 1
      : null;
    const nextTierTotalPoints = nextMilestone?.unlock_points ?? null;
    return { syndicateLevel, ptsToNextLevel, nextLevelNumber, atMaxTier, nextTierTotalPoints };
  }, [pointsTotal]);

  const weeklyBarData = useMemo(() => {
    const today = todayLocalISO();
    const h = loadHistory();
    return lastNDatesFrom(today, 7).map((iso, i) => ({
      name: shortWeekday(iso),
      points: h.days[iso]?.total ?? 0,
      fill: WEEK_BAR_COLORS[i % WEEK_BAR_COLORS.length]
    }));
  }, [pointsTotal]);

  const monthlyLineData = useMemo(() => {
    const today = todayLocalISO();
    const h = loadHistory();
    return lastNDatesFrom(today, 30).map((iso) => ({
      name: iso.slice(5),
      points: h.days[iso]?.total ?? 0
    }));
  }, [pointsTotal]);

  const bestWorst = useMemo(() => {
    const totals = aggregateCategoryTotals(loadHistory());
    let best: { cat: string; pts: number } | null = null;
    let worst: { cat: string; pts: number } | null = null;
    for (const c of CATEGORIES) {
      const pts = totals[c] ?? 0;
      if (!best || pts > best.pts) best = { cat: c, pts };
      if (!worst || pts < worst.pts) worst = { cat: c, pts };
    }
    return { best, worst, totals };
  }, [pointsTotal]);

  const todayPointsFromHistory = useMemo(() => {
    const h = loadHistory();
    return h.days[todayLocalISO()]?.total ?? 0;
  }, [pointsTotal]);

  const dashboardBestCategoryLabel = useMemo(() => {
    const sum = CATEGORIES.reduce((s, c) => s + (bestWorst.totals[c] ?? 0), 0);
    if (sum === 0 || !bestWorst.best) return "—";
    return CAT_LABEL[bestWorst.best.cat] ?? bestWorst.best.cat;
  }, [bestWorst, pointsTotal]);

  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(() => {
      const email = getSyndicateUser()?.email?.trim() || "";
      void syncLeaderboard(pointsTotal, profileName.trim() || email || "Anonymous").catch(() => {
        /* offline */
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, [mounted, pointsTotal, profileName]);

  useEffect(() => {
    if (!showStatsProfile) return;
    setLeaderboardErr(null);
    void fetchLeaderboard()
      .then((r) => setLeaderboard(r.results))
      .catch(() => setLeaderboardErr("Could not load leaderboard."));
  }, [showStatsProfile]);

  const pollReferral = useCallback(async () => {
    const device = getDeviceId();
    const tokenBefore = getSyndicateAuthToken();
    try {
      const r = await fetch(challengesApiUrl(`referral/status/?device_id=${encodeURIComponent(device)}`), {
        headers: getSyndicateAuthHeaders(false),
        cache: "no-store"
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = await r.json();
      if (r.ok) setCanClaimRestore(!!j.can_claim);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (streak !== 0 || !withinRestoreWindow()) return;
    void pollReferral();
    const t = window.setInterval(() => void pollReferral(), 12000);
    return () => window.clearInterval(t);
  }, [streak, pollReferral]);

  const rowsOnMissionBoard = useMemo(
    () => rows.filter((r) => rowWithinMissionBoardTtl(r, nowTick)),
    [rows, nowTick]
  );

  const filteredRows = useMemo(() => {
    const base = rowsOnMissionBoard.filter((r) => {
      if (!challengeMatchesStatsMood(r, statsMood)) return false;
      const k = (r.category || r.payload?.category || "").toLowerCase();
      if (catFilter !== "all" && k !== catFilter) return false;
      const done = doneIds.has(r.id);
      if (doneFilter === "complete" && !done) return false;
      if (doneFilter === "incomplete" && done) return false;
      return true;
    });
    return dedupePrimaryMoodSystemRows(applyMoodCategoryPairHide(base, doneIds));
  }, [rowsOnMissionBoard, catFilter, doneFilter, doneIds, statsMood]);

  useEffect(() => {
    if (!selected) return;
    if (filteredRows.some((r) => r.id === selected.id)) return;
    setSelected(null);
  }, [filteredRows, selected]);

  const byCategoryFiltered = useMemo(() => {
    const m: Record<string, ChallengeRow[]> = {};
    for (const c of CATEGORIES) m[c] = [];
    for (const r of filteredRows) {
      const k = (r.category || r.payload?.category || "").toLowerCase();
      if (CATEGORIES.includes(k as (typeof CATEGORIES)[number])) {
        m[k].push(r);
      }
    }
    for (const c of CATEGORIES) {
      m[c].sort(compareRowsByMoodThenSlot);
      m[c] = m[c].slice(0, 3);
    }
    return m;
  }, [filteredRows]);
  const dailyVisibleMissionRows = useMemo(() => {
    const grouped: Record<string, ChallengeRow[]> = {};
    for (const c of CATEGORIES) grouped[c] = [];
    for (const r of rowsOnMissionBoard) {
      const k = (r.category || r.payload?.category || "").toLowerCase();
      if (CATEGORIES.includes(k as (typeof CATEGORIES)[number])) grouped[k].push(r);
    }
    const out: ChallengeRow[] = [];
    const seen = new Set<number>();
    for (const c of CATEGORIES) {
      const top = grouped[c].sort(compareRowsByMoodThenSlot).slice(0, 3);
      for (const r of top) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
      }
    }
    return out;
  }, [rowsOnMissionBoard]);
  const userMissionRows = useMemo(() => {
    const seen = new Set<number>();
    const out: ChallengeRow[] = [];
    for (const c of CATEGORIES) {
      for (const r of byCategoryFiltered[c] ?? []) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
      }
    }
    for (const r of byCategoryFiltered.other ?? []) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  }, [byCategoryFiltered]);
  const userCompletedCount = useMemo(() => userMissionRows.filter((r) => doneIds.has(r.id)).length, [userMissionRows, doneIds]);
  const userRemainingCount = useMemo(() => Math.max(0, dailyVisibleMissionRows.length - userCompletedCount), [dailyVisibleMissionRows.length, userCompletedCount]);
  /** Incomplete missions with a saved reminder — shown under the mission grid on the Missions tab. */
  const missionsTabReminders = useMemo(() => {
    const responses = loadResponses();
    const items: {
      id: number;
      title: string;
      atIso: string;
      dueAt: number;
      overdue: boolean;
      onBoard: boolean;
      secLeft: number;
      penaltyApplied: boolean;
      /** Saved “how you completed it” draft for this mission (from mission detail). */
      howDraft: string;
      addedAtIso?: string;
    }[] = [];
    for (const [key, entry] of Object.entries(missionReminders)) {
      const id = parseInt(key, 10);
      if (!Number.isFinite(id) || doneIds.has(id)) continue;
      const dueAt = Date.parse(entry.atIso);
      if (Number.isNaN(dueAt)) continue;
      const row = rowsOnMissionBoard.find((r) => r.id === id);
      const secLeft = Math.max(0, (dueAt - nowTick) / 1000);
      const howDraft = (responses[id]?.how ?? "").trim();
      items.push({
        id,
        title: (row?.payload?.challenge_title ?? entry.title ?? "Mission").trim() || "Mission",
        atIso: entry.atIso,
        dueAt,
        overdue: dueAt <= nowTick,
        onBoard: !!row,
        secLeft,
        penaltyApplied: entry.penaltyApplied === true,
        howDraft,
        ...(entry.addedAtIso ? { addedAtIso: entry.addedAtIso } : {})
      });
    }
    items.sort((a, b) => a.dueAt - b.dueAt);
    return items;
  }, [missionReminders, doneIds, rowsOnMissionBoard, nowTick, responseDraftsVersion]);

  const remindersPageSortedFiltered = useMemo(() => {
    const list = [...missionsTabReminders];
    const day = reminderFilterDate.trim();
    const filtered = day
      ? list.filter((item) => {
          const refIso = item.addedAtIso ?? item.atIso;
          return localDateKeyFromIso(refIso) === day;
        })
      : list;
    filtered.sort((a, b) => {
      const aMs = a.addedAtIso ? Date.parse(a.addedAtIso) : NaN;
      const bMs = b.addedAtIso ? Date.parse(b.addedAtIso) : NaN;
      const av = Number.isNaN(aMs) ? a.dueAt : aMs;
      const bv = Number.isNaN(bMs) ? b.dueAt : bMs;
      return reminderPageSort === "newest" ? bv - av : av - bv;
    });
    return filtered;
  }, [missionsTabReminders, reminderFilterDate, reminderPageSort]);

  const missedLogEntryIds = useMemo(() => new Set(missionMissedLog.map((e) => e.entryId)), [missionMissedLog]);

  /** Stable key so we do not re-run the logger every `nowTick` with new object identities. */
  const pendingMissedMissionIdsKey = useMemo(() => {
    const ids: string[] = [];
    for (const r of rows) {
      if (doneIds.has(r.id)) continue;
      if (rowWithinMissionBoardTtl(r, nowTick)) continue;
      const entryId = missedEntryIdForRow(r);
      if (!entryId || missedLogEntryIds.has(entryId)) continue;
      ids.push(entryId);
    }
    ids.sort();
    return ids.join("\u0001");
  }, [rows, doneIds, nowTick, missedLogEntryIds]);

  useEffect(() => {
    if (!pendingMissedMissionIdsKey) return;
    const want = new Set(pendingMissedMissionIdsKey.split("\u0001").filter(Boolean));
    const missedAtIso = new Date().toISOString();
    const missedDay = todayLocalISO();
    setMissionMissedLog((prev) => {
      const have = new Set(prev.map((e) => e.entryId));
      let next = prev;
      for (const r of rows) {
        const entryId = missedEntryIdForRow(r);
        if (!entryId || !want.has(entryId) || have.has(entryId)) continue;
        const createdMs = Date.parse(r.created_at);
        if (Number.isNaN(createdMs)) continue;
        const e: MissionMissedLogEntryV1 = {
          entryId,
          challengeId: r.id,
          title: ((r.payload?.challenge_title ?? "Mission") as string).trim() || "Mission",
          category: ((r.category || r.payload?.category || "business") as string).toLowerCase(),
          mood: ((r.mood || "") as string).toLowerCase() || "—",
          createdAtIso: r.created_at,
          boardExpiredAtIso: new Date(createdMs + MISSION_BOARD_TTL_MS).toISOString(),
          missedAtIso,
          missedIso: missedDay,
          userCreated: !!r.user_created
        };
        next = [e, ...next];
        have.add(entryId);
      }
      if (next === prev) return prev;
      const trimmed = next.slice(0, MAX_MISSION_MISSED_LOG);
      persistMissionMissedLog(trimmed);
      return trimmed;
    });
  }, [pendingMissedMissionIdsKey, rows]);

  const missionsTabMissedSorted = useMemo(
    () => [...missionMissedLog].sort((a, b) => Date.parse(b.missedAtIso) - Date.parse(a.missedAtIso)),
    [missionMissedLog]
  );

  const missionsTabCompletedPreview = useMemo(() => {
    const sorted = [...missionCompletionLog].sort((a, b) => {
      const ta = Date.parse(a.completedAtIso || `${a.completedIso}T12:00:00`);
      const tb = Date.parse(b.completedAtIso || `${b.completedIso}T12:00:00`);
      const av = Number.isNaN(ta) ? 0 : ta;
      const bv = Number.isNaN(tb) ? 0 : tb;
      return bv - av;
    });
    return sorted.slice(0, 24);
  }, [missionCompletionLog]);

  const dayCountdownSec = useMemo(() => secondsUntilLocalMidnight(nowTick), [nowTick]);
  const completedAgentTodayCount = useMemo(
    () => rows.filter((r) => !r.user_created && doneIds.has(r.id)).length,
    [rows, doneIds]
  );
  const completedCustomTodayCount = useMemo(
    () => rows.filter((r) => !!r.user_created && doneIds.has(r.id)).length,
    [rows, doneIds]
  );
  const completedTotalTodayCount = useMemo(
    () => completedAgentTodayCount + completedCustomTodayCount,
    [completedAgentTodayCount, completedCustomTodayCount]
  );
  const totalDailyCompletionCap = useMemo(
    () => MAX_AGENT_COMPLETIONS_PER_DAY + (rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0),
    [rows]
  );
  const pendingDailyCompletionSlots = useMemo(
    () => Math.max(0, totalDailyCompletionCap - completedTotalTodayCount),
    [totalDailyCompletionCap, completedTotalTodayCount]
  );
  const getStartLimitMessage = useCallback(
    (row: ChallengeRow): string | null => {
      if (row.user_created) {
        if (completedCustomTodayCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) {
          return `Daily limit reached: you can complete only ${MAX_CUSTOM_COMPLETIONS_PER_DAY} custom missions per day.`;
        }
        return null;
      }
      if (completedAgentTodayCount >= MAX_AGENT_COMPLETIONS_PER_DAY) {
        return `Daily limit reached: you can complete only ${MAX_AGENT_COMPLETIONS_PER_DAY} generated missions per day.`;
      }
      return null;
    },
    [completedAgentTodayCount, completedCustomTodayCount]
  );

  /** Isolated from mood filter updates so Recharts does not redraw on every mood change. */
  const statsProfileChartsLeftColumn = useMemo(
    () => (
      <div className="min-w-0 space-y-10">
        <div>
          <h3 className="mb-3 text-[15px] font-bold uppercase tracking-[0.12em] text-white sm:text-[16px]">
            Today · mission points by category (pie)
          </h3>
          <div className="h-[300px] w-full overflow-hidden rounded-lg sm:h-[420px] md:h-[480px] lg:h-[520px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={pieDailyChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  innerRadius="22%"
                  outerRadius="78%"
                  paddingAngle={2}
                  labelLine={false}
                  label={false}
                >
                  {pieDailyChartData.map((e, i) => (
                    <Cell key={e.name} stroke="rgba(0,0,0,0.35)" strokeWidth={1} fill={e.fill ?? PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={(props) => (
                    <SyndicateStatsPieTooltip
                      active={props.active}
                      payload={props.payload}
                      pieDailyData={pieDailyData}
                      allZero={pieDailyPointsSum <= 0}
                    />
                  )}
                />
                <Legend
                  wrapperStyle={{ fontSize: 15, paddingTop: 12, color: "#ffffff" }}
                  formatter={(value: string) => <span className="text-white">{value}</span>}
                  iconType="circle"
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-bold uppercase tracking-[0.12em] text-white sm:text-[16px]">
            Weekly · mission points (bar)
          </h3>
          <div className="h-[220px] w-full min-h-[200px] overflow-hidden rounded-lg sm:h-[260px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 14 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 14 }} />
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid rgba(255,215,0,0.35)",
                    borderRadius: 8,
                    fontSize: 15,
                    color: "#fff"
                  }}
                  labelStyle={{ color: "#fff", fontSize: 15 }}
                  itemStyle={{ color: "#fff", fontSize: 15 }}
                />
                <Bar dataKey="points" radius={[6, 6, 0, 0]}>
                  {weeklyBarData.map((entry, i) => (
                    <Cell key={`w-${entry.name}-${i}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-bold uppercase tracking-[0.12em] text-white sm:text-[16px]">
            Monthly · daily mission points (line)
          </h3>
          <div className="h-[220px] w-full min-h-[200px] overflow-hidden rounded-lg sm:h-[260px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`syndicate-line-${lineGradientUid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff6b9d" />
                    <stop offset="22%" stopColor="#ffd54a" />
                    <stop offset="44%" stopColor="#4fd1b8" />
                    <stop offset="66%" stopColor="#7b9cff" />
                    <stop offset="88%" stopColor="#c792ea" />
                    <stop offset="100%" stopColor="#69f0ae" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} interval={4} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 14 }} />
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid rgba(255,215,0,0.35)",
                    borderRadius: 8,
                    fontSize: 15,
                    color: "#fff"
                  }}
                  labelStyle={{ color: "#fff", fontSize: 15 }}
                  itemStyle={{ color: "#fff", fontSize: 15 }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke={`url(#syndicate-line-${lineGradientUid})`}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 1, fill: "#ffd54a", stroke: "#1a1a1a" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    ),
    [pieDailyData, pieDailyChartData, pieDailyPointsSum, weeklyBarData, monthlyLineData, lineGradientUid]
  );

  const loadFast = useCallback(async () => {
    setError(null);
    setBusy("load");
    try {
      const device = getDeviceId();
      const tokenBefore = getSyndicateAuthToken();
      const td = await fetchChallengesTodayUntilComplete(device, {
        onPartial: (partial) => {
          const list = partial.results ?? [];
          setRows(list);
          setDailyBatchStreaming(partial.generating === true && partial.batch_complete === false);
          if (list.length > 0) setBusy(null);
        }
      });
      setDailyBatchStreaming(false);
      const list = td.results ?? [];
      setRows(list);
      if (list.length > 0) {
        setBusy(null);
      }

      const [stRes, at] = await Promise.all([
        fetch(`${API_BASE}/mindset/status/`, { headers: getSyndicateAuthHeaders(false) }),
        fetchAdminTasksActive(device).catch(() => ({ results: [] as AdminTaskRow[] } as const))
      ]);
      ensureSyndicateSessionOrRedirect(stRes, !!tokenBefore);
      const st = await stRes.json();
      if ("unauthorized" in at && at.unauthorized) adminTasksPollPausedRef.current = true;
      setAdminTasks(at.results ?? []);

      if (!st.ready) {
        setError(
          typeof td.detail === "string" && td.detail
            ? td.detail
            : "Mindsets are not loaded on the server yet. Add documents under backend/data/uploads/ and ingest, or use the admin upload API."
        );
      }
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) {
        return;
      }
      setError(
        e instanceof Error ? e.message : "Cannot reach the API. Run: python manage.py runserver (in backend/)"
      );
      setRows([]);
      setDailyBatchStreaming(false);
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    if (initialLoadOnceRef.current) return;
    initialLoadOnceRef.current = true;
    void loadFast();
  }, [loadFast]);

  // Keep bonus tasks fresh with lightweight polling; only while dashboard is visible.
  useEffect(() => {
    if (!mounted || syndicateView !== "dashboard") return;
    let cancelled = false;
    const run = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (!getSyndicateAuthToken() || adminTasksPollPausedRef.current) return;
      try {
        const out = await fetchAdminTasksActive(getDeviceId());
        if (cancelled) return;
        if (out.unauthorized) {
          adminTasksPollPausedRef.current = true;
          setAdminTasks([]);
          return;
        }
        setAdminTasks(out.results ?? []);
      } catch {
        /* ignore intermittent network errors */
      }
    };
    void run();
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    window.addEventListener("visibilitychange", onVisible);
    const t = window.setInterval(() => void run(), 30000);
    return () => {
      cancelled = true;
      window.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(t);
    };
  }, [mounted, syndicateView]);

  useEffect(() => {
    if (!mounted || !rows.length) return;
    const iso = calendarIsoFromRows(rows);
    const offeredToday = MAX_AGENT_COMPLETIONS_PER_DAY + (rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0);
    recordOfferedSnapshot(iso, offeredToday);
    setChallengeLogVersion((v) => v + 1);
  }, [mounted, rows]);

  const challengeDayData = useMemo(() => {
    void challengeLogVersion;
    return loadChallengeDay();
  }, [challengeLogVersion]);

  const filteredDayChallengeStats = useMemo(() => {
    const iso = historyFilterDate;
    const today = todayLocalISO();
    const isSelectedToday = iso === today;
    const offeredToday = MAX_AGENT_COMPLETIONS_PER_DAY + (rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0);
    const offered =
      isSelectedToday
        ? offeredToday
        : challengeDayData.offeredByDate[iso] ?? null;
    const completed = isSelectedToday
      ? Math.min(offeredToday, rows.filter((r) => doneIds.has(r.id)).length)
      : challengeDayData.completionsByDate[iso] ?? 0;
    const missed = offered !== null ? Math.max(0, offered - completed) : null;
    const achievedPoints = loadHistory().days[iso]?.total ?? 0;
    return { offered, completed, missed, achievedPoints, isSelectedToday };
  }, [challengeDayData, historyFilterDate, rows, doneIds, challengeLogVersion, pointsTotal]);

  const lastSevenDayChallengeRows = useMemo(() => {
    const today = todayLocalISO();
    const dates = lastNDatesFrom(today, 7).slice().reverse();
    const offeredToday = MAX_AGENT_COMPLETIONS_PER_DAY + (rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0);
    const h = loadHistory();
    return dates.map((iso) => {
      const isRowToday = iso === today;
      const offered =
        isRowToday
          ? offeredToday
          : challengeDayData.offeredByDate[iso] ?? null;
      const completed = isRowToday
        ? Math.min(offeredToday, rows.filter((r) => doneIds.has(r.id)).length)
        : challengeDayData.completionsByDate[iso] ?? 0;
      const missed = offered !== null ? Math.max(0, offered - completed) : null;
      const achievedPoints = h.days[iso]?.total ?? 0;
      return { iso, offered, completed, missed, achievedPoints };
    });
  }, [challengeDayData, rows, doneIds, challengeLogVersion, pointsTotal]);

  const completionEntriesForHistoryDate = useMemo(
    () => missionCompletionLog.filter((e) => e.completedIso === historyFilterDate),
    [missionCompletionLog, historyFilterDate]
  );

  const regenerateNewDay = useCallback(async () => {
    setError(null);
    setBusy("regen");
    try {
      const tokenBefore = getSyndicateAuthToken();
      const r = await fetch(challengesApiUrl("generate_daily/"), {
        method: "POST",
        headers: getSyndicateAuthHeaders(true),
        body: JSON.stringify({ force: true })
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = (await r.json()) as { detail?: string; results?: ChallengeRow[] };
      if (!r.ok) {
        setError(typeof j.detail === "string" ? j.detail : "Regenerate failed");
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ls("completed_challenge_ids"));
        window.localStorage.removeItem(ls("challenge_responses"));
        window.localStorage.removeItem(ls("mission_started_at_v1"));
        resetChallengeDayForDate(todayLocalISO());
        onSyndicatePersist();
      }
      // Keep lifetime points; only reset per-day completion state.
      setPointsTotal(loadTotalPoints());
      setDoneIds(new Set());
      setMissionStartMap({});
      try {
        const pr = await fetchSyndicateProgress();
        applySyncedStateFromServer(pr.state ?? {});
        setStreak(pr.streak_count);
        setLastActivityIso(pr.last_activity_date);
        setStreakBeforeBreakHint(streakBeforeBreakHintForProgress(pr.streak_count, pr.state));
        // New day ⇒ challenge IDs change; drop reminders so stale IDs are not synced back.
        window.localStorage.removeItem(ls("mission_reminders_v1"));
        persistMissionReminders({});
        setMissionReminders({});
        setMissionCompletionLog(loadMissionCompletionLog());
      } catch {
        /* streak unchanged if progress fetch fails */
      }
      const refreshed = await fetchChallengesTodayUntilComplete(getDeviceId(), {
        onPartial: (p) => {
          setRows(p.results ?? []);
          setDailyBatchStreaming(p.generating === true && p.batch_complete === false);
        }
      });
      setDailyBatchStreaming(false);
      setRows(refreshed.results ?? []);
      setSelected(null);
      setChallengeLogVersion((v) => v + 1);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setError("Regenerate failed (network).");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const today = todayLocalISO();
    if (today !== lastSeenDayRef.current && busy !== "regen") {
      lastSeenDayRef.current = today;
      void regenerateNewDay();
    }
  }, [nowTick, mounted, busy, regenerateNewDay]);

  const userCustomCount = useMemo(() => rows.filter((r) => r.user_created).length, [rows]);

  /** First time user opens mission detail, start the timer; reopening the same mission does not reset it. */
  const openMissionDetail = useCallback((row: ChallengeRow) => {
    if (!doneIds.has(row.id)) {
      setMissionStartMap((prev) => {
        if (prev[row.id] != null) return prev;
        const t = Date.now();
        const next = { ...prev, [row.id]: t };
        persistMissionStartTimes(next);
        return next;
      });
    }
    setSelected(row);
  }, [doneIds]);

  const createUserCustomTask = useCallback(async () => {
    const t = customTitle.trim();
    if (t.length < 3) {
      setCreateMissionError("Title must be at least 3 characters.");
      return;
    }
    if (userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) {
      setCreateMissionError(CREATE_MISSION_DAILY_LIMIT_MSG);
      return;
    }
    setCreateMissionError(null);
    setBusy("custom");
    try {
      const { result } = await postUserCustomChallenge(getDeviceId(), t, CUSTOM_MISSION_DEFAULT_DIFFICULTY);
      setCreateMissionError(null);
      setRows((prev) => [...prev, result]);
      setCustomTitle("");
      setChallengeLogVersion((v) => v + 1);
      setCreateMissionModalOpen(false);
      openMissionDetail(result);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setCreateMissionError(e instanceof Error ? e.message : "Could not create mission");
    } finally {
      setBusy(null);
    }
  }, [customTitle, userCustomCount, openMissionDetail]);

  useEffect(() => {
    if (syndicateView !== "challenges" || showStatsProfile) {
      setCreateMissionModalOpen(false);
      setCreateMissionError(null);
    }
  }, [syndicateView, showStatsProfile]);

  useEffect(() => {
    if (!createMissionModalOpen || typeof document === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && busy !== "custom") setCreateMissionModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [createMissionModalOpen, busy]);

  async function createInviteCode() {
    setReferralMsg(null);
    try {
      const tokenBefore = getSyndicateAuthToken();
      const r = await fetch(challengesApiUrl("referral/create/"), {
        method: "POST",
        headers: getSyndicateAuthHeaders(true),
        body: JSON.stringify({ device_id: getDeviceId() })
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = await r.json();
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Failed");
        return;
      }
      setInviteCode(j.code);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setReferralMsg("Could not create code.");
    }
  }

  async function redeemFriend() {
    setReferralMsg(null);
    try {
      const tokenBefore = getSyndicateAuthToken();
      const r = await fetch(challengesApiUrl("referral/redeem/"), {
        method: "POST",
        headers: getSyndicateAuthHeaders(true),
        body: JSON.stringify({ code: friendCode.trim().toUpperCase(), device_id: getDeviceId() })
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = await r.json();
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Invalid");
        return;
      }
      setReferralMsg("Code applied. Thanks for helping a friend.");
      setFriendCode("");
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setReferralMsg("Network error.");
    }
  }

  async function claimRestore() {
    setReferralMsg(null);
    try {
      const tokenBefore = getSyndicateAuthToken();
      const r = await fetch(challengesApiUrl("referral/claim/"), {
        method: "POST",
        headers: getSyndicateAuthHeaders(true),
        body: JSON.stringify({ device_id: getDeviceId() })
      });
      ensureSyndicateSessionOrRedirect(r, !!tokenBefore);
      const j = (await r.json()) as {
        detail?: string;
        restore_streak_count?: unknown;
      };
      if (!r.ok) {
        setReferralMsg(typeof j.detail === "string" ? j.detail : "Cannot claim");
        return;
      }
      const fromServer = j.restore_streak_count;
      const n =
        typeof fromServer === "number" && Number.isFinite(fromServer)
          ? fromServer
          : parseInt(window.localStorage.getItem(ls("streak_before_break")) || "1", 10);
      const restored = await postSyndicateStreakRestore(Math.max(1, Math.min(999, n)));
      applySyncedStateFromServer(restored.state ?? {});
      setMissionCompletionLog(loadMissionCompletionLog());
      window.localStorage.removeItem(ls("streak_before_break"));
      window.localStorage.removeItem(ls("streak_break_date"));
      setStreak(restored.streak_count);
      setLastActivityIso(restored.last_activity_date);
      setStreakBeforeBreakHint(null);
      onSyndicatePersist();
      setCanClaimRestore(false);
      setReferralMsg("Streak restored.");
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setReferralMsg("Network error.");
    }
  }

  async function submitAdminTask(taskId: number) {
    const draft = (adminTaskDrafts[taskId] || "").trim();
    const file = adminTaskFiles[taskId] ?? null;
    if (draft.length < 3) {
      if (file) {
        setAdminTaskMsg(
          "Text is required: type at least 3 characters above. Your video is already attached — then press Submit again."
        );
      } else {
        setAdminTaskMsg(
          "Text is required: type at least 3 characters above, then attach a video (Record video or choose a video file) and press Submit."
        );
      }
      if (typeof document !== "undefined") {
        const el = document.getElementById(`admin-task-response-${taskId}`);
        if (el instanceof HTMLElement) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          window.setTimeout(() => el.focus(), 100);
        }
      }
      return;
    }
    if (!adminTaskAttachmentIsVideo(file)) {
      if (file) {
        setAdminTaskMsg(
          "Mega mission requires a video file: remove the non-video file, then use Record video or choose MP4/WebM/MOV (max 50MB)."
        );
      } else {
        setAdminTaskMsg(
          "Video is required: use Record video or choose a video file below, then press Submit again with your written response."
        );
      }
      if (typeof document !== "undefined") {
        const el = document.getElementById(`admin-task-file-${taskId}`);
        if (el instanceof HTMLElement) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }
    setAdminTaskMsg("Submitting your written response and video for admin review…");
    setAdminTaskBusyId(taskId);
    try {
      const device = getDeviceId();
      await postAdminTaskSubmit({
        deviceId: device,
        taskId,
        responseText: draft,
        startedAtMs: adminTaskStartedAtMs[taskId],
        attachment: file
      });
      const refreshed = await fetchAdminTasksActive(device);
      setAdminTasks(refreshed.results ?? []);
      setAdminTaskFiles((prev) => ({ ...prev, [taskId]: null }));
      setAdminTaskRecording((prev) => ({ ...prev, [taskId]: false }));
      setAdminTaskStartedAtMs((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      const today = todayLocalISO();
      if (lastActivityIso !== today) {
        try {
          const sr = await postSyndicateStreakRecord(today);
          setStreak(sr.streak_count);
          setLastActivityIso(sr.last_activity_date);
          if (sr.streak_count > 0) setStreakBeforeBreakHint(null);
        } catch {
          /* keep UI stale until next progress fetch */
        }
      }
      setAdminTaskMsg(
        "Saved: your written response and video were sent. Staff will review; you will get points after analysis."
      );
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setAdminTaskMsg(friendlyAdminTaskError(e));
    } finally {
      setAdminTaskBusyId(null);
    }
  }

  async function startAdminTaskVideoRecord(taskId: number) {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setAdminTaskMsg("Camera recording is not supported in this browser.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setAdminTaskMsg("Video recording is not supported in this browser. Use Choose file to upload a video instead.");
      return;
    }
    if (!isBrowserSecureForCamera()) {
      setAdminTaskMsg("Camera needs a secure site (HTTPS). Open this page over HTTPS or use localhost, or upload a file instead.");
      return;
    }
    if (adminTaskRecording[taskId] || adminTaskCameraOpeningRef.current[taskId]) return;
    setAdminTaskMsg("Opening camera…");
    adminTaskCameraOpeningRef.current[taskId] = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true
      });
      const mimeType = pickMediaRecorderMimeType();
      let rec: MediaRecorder;
      try {
        rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch {
        rec = new MediaRecorder(stream);
      }
      adminTaskChunksRef.current[taskId] = [];
      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) adminTaskChunksRef.current[taskId].push(e.data);
      };
      rec.onstop = () => {
        delete adminTaskRecordingStartMsRef.current[taskId];
        const fs = adminTaskFullscreenVideoRef.current;
        if (fs) fs.srcObject = null;
        const chunks = adminTaskChunksRef.current[taskId] || [];
        const outType = rec.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunks, { type: outType });
        if (blob.size > 0) {
          const ext = outType.includes("mp4") ? "mp4" : "webm";
          const file = new File([blob], `admin-task-${taskId}-${Date.now()}.${ext}`, {
            type: blob.type || outType
          });
          setAdminTaskFiles((prev) => ({ ...prev, [taskId]: file }));
          const written = (adminTaskDraftsRef.current[taskId] || "").trim();
          if (written.length >= 3) {
            setAdminTaskMsg(
              "Video saved and attached. You can press Submit for admin review — your text and video will be sent together."
            );
          } else {
            setAdminTaskMsg(
              "Video saved and attached. Text is required: write at least 3 characters in the field above, then press Submit."
            );
          }
        } else {
          setAdminTaskMsg(
            "Recording had no data — try again and record a few seconds, or upload a video file. A video is required to submit this mega mission."
          );
        }
        stream.getTracks().forEach((tr) => tr.stop());
        adminTaskRecorderRef.current[taskId] = null;
        adminTaskStreamRef.current[taskId] = null;
        setAdminTaskRecording((prev) => ({ ...prev, [taskId]: false }));
      };
      adminTaskRecorderRef.current[taskId] = rec;
      adminTaskStreamRef.current[taskId] = stream;
      adminTaskRecordingStartMsRef.current[taskId] = Date.now();
      try {
        // Timeslice so browsers reliably emit chunks (avoids empty files on some builds).
        rec.start(250);
      } catch (e) {
        stream.getTracks().forEach((tr) => tr.stop());
        adminTaskRecorderRef.current[taskId] = null;
        adminTaskStreamRef.current[taskId] = null;
        setAdminTaskMsg(
          e instanceof Error
            ? `Could not start recording: ${e.message}`
            : "Could not start recording. Try another browser or upload a file."
        );
        return;
      }
      setAdminTaskRecording((prev) => ({ ...prev, [taskId]: true }));
      setAdminTaskMsg("Camera is on — fullscreen preview. Tap Stop recording when finished.");
      requestAnimationFrame(() => {
        const s = adminTaskStreamRef.current[taskId];
        if (s) bindFullscreenCameraStream(s);
      });
    } catch (e) {
      const name = e && typeof e === "object" && "name" in e ? String((e as DOMException).name) : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setAdminTaskMsg("Camera or microphone permission was denied. Allow access in the browser address bar, or upload a file instead.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setAdminTaskMsg("No camera or microphone was found. Connect a device or upload a file instead.");
      } else if (name === "NotReadableError") {
        setAdminTaskMsg("Camera is in use by another app. Close it and try again, or upload a file.");
      } else {
        setAdminTaskMsg(
          e instanceof Error
            ? `Camera error: ${e.message}`
            : "Camera access failed. Try HTTPS, allow permissions, or upload a file."
        );
      }
    } finally {
      adminTaskCameraOpeningRef.current[taskId] = false;
    }
  }

  function stopAdminTaskVideoRecord(taskId: number) {
    const rec = adminTaskRecorderRef.current[taskId];
    if (!rec) return;
    try {
      if (rec.state === "recording") {
        rec.requestData();
        rec.stop();
      } else if (rec.state === "paused") {
        rec.stop();
      }
    } catch {
      setAdminTaskMsg("Could not stop recording.");
    }
  }

  async function claimReviewedAdminPoints() {
    setAdminTaskMsg(null);
    try {
      const out = await postAdminTaskClaimPoints(getDeviceId());
      if (out.points_awarded > 0) {
        const next = pointsTotal + out.points_awarded;
        persistPoints(next);
        setPointsTotal(next);
        setAdminTaskMsg(`+${out.points_awarded} points added from admin-reviewed tasks.`);
      } else {
        setAdminTaskMsg("No reviewed task points available yet.");
      }
      const refreshed = await fetchAdminTasksActive(getDeviceId());
      setAdminTasks(refreshed.results ?? []);
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setAdminTaskMsg(friendlyAdminTaskError(e));
    }
  }

  useLayoutEffect(() => {
    if (!selected) return;
    scrollSyndicateShellToTop();
    const top = document.getElementById("syndicate-mission-detail-top");
    top?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [selected]);

  async function handleSubmit(draft: MissionResponseDraft) {
    if (!selected) return;
    if (doneIds.has(selected.id)) {
      setError("Mission already completed. You can only view your submitted response.");
      return;
    }
    if (!doneIds.has(selected.id)) {
      if (selected.user_created) {
        if (completedCustomTodayCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) {
          setError("You can complete up to 2 custom missions per day.");
          return;
        }
      } else if (completedAgentTodayCount >= MAX_AGENT_COMPLETIONS_PER_DAY) {
        setError(`You can complete up to ${MAX_AGENT_COMPLETIONS_PER_DAY} generated missions per day.`);
        return;
      }
    }
    const how = draft.how.trim();
    const learned = draft.learned.trim();
    if (!how || !learned) {
      setError("Fill in both how you will complete the mission and what you learned before submitting.");
      return;
    }
    setSubmitBusy(true);
    try {
      const id = selected.id;
      const responses = loadResponses();
      responses[id] = { how, learned };
      persistResponses(responses);
      setResponseDraftsVersion((v) => v + 1);

      const startedAt = missionStartMap[id] ?? Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      // elapsedSeconds = first open of this mission’s detail → submit (timer not reset on repeat opens).
      const sp = selected.payload;
      const exampleTasksRaw = Array.isArray(sp?.example_tasks) ? sp.example_tasks : [];
      const exampleTasks = exampleTasksRaw.map((x) => String(x).trim()).filter(Boolean);
      const scored = await postScoreMissionResponse({
        completionHow: how,
        completionLearned: learned,
        challengeTitle: sp?.challenge_title ?? "Mission",
        difficulty: selected.difficulty || sp?.difficulty || "medium",
        maxPoints: selected.points || 0,
        elapsedSeconds,
        challengeDescription: typeof sp?.challenge_description === "string" ? sp.challenge_description : undefined,
        exampleTasks: exampleTasks.length > 0 ? exampleTasks : undefined
      });
      setLastScore(scored);
      const nextScores = { ...missionScores, [id]: scored };
      persistMissionScores(nextScores);
      setMissionScores(nextScores);
      const nextAwarded = { ...missionAwardedMap, [id]: scored.awarded_points || 0 };
      persistMissionAwardedPoints(nextAwarded);
      setMissionAwardedMap(nextAwarded);

      const nextDone = new Set(doneIds);
      let total = pointsTotal;
      const today = todayLocalISO();

      if (!nextDone.has(id)) {
        nextDone.add(id);
        const pts = scored.awarded_points || 0;
        total += pts;
        setMissionCompleteToast({
          title: (selected.payload?.challenge_title ?? "Mission").trim() || "Mission",
          points: pts,
          elapsedSeconds
        });
        persistDone(nextDone);
        persistPoints(total);
        setDoneIds(nextDone);
        setPointsTotal(total);
        const cat = (selected.category || selected.payload?.category || "business").toLowerCase();
        appendPointsForDay(today, cat, pts);
        recordCompletionForDay(today);
        const combined = formatCombinedMissionResponse(how, learned);
        const logEntry: MissionCompletionLogEntryV1 = {
          entryId: `${id}-${today}-${Date.now()}`,
          challengeId: id,
          completedIso: today,
          completedAtIso: new Date().toISOString(),
          title: ((selected.payload?.challenge_title ?? "Mission") as string).trim() || "Mission",
          category: cat,
          mood: ((selected.mood || "") as string).toLowerCase() || "—",
          responseText: combined,
          completionHow: how,
          completionLearned: learned,
          awardedPoints: pts,
          maxPoints: typeof scored.max_points === "number" ? scored.max_points : selected.points || 0,
          elapsedSeconds
        };
        const nextLog = [logEntry, ...loadMissionCompletionLog()].slice(0, MAX_MISSION_COMPLETION_LOG);
        persistMissionCompletionLog(nextLog);
        setMissionCompletionLog(nextLog);
        setChallengeLogVersion((v) => v + 1);

        const missedKey = missedEntryIdForRow(selected);
        if (missedKey) {
          setMissionMissedLog((prev) => {
            const filtered = prev.filter((e) => e.entryId !== missedKey);
            if (filtered.length === prev.length) return prev;
            persistMissionMissedLog(filtered);
            return filtered;
          });
        }

        if (lastActivityIso !== today) {
          try {
            const sr = await postSyndicateStreakRecord(today);
            setStreak(sr.streak_count);
            setLastActivityIso(sr.last_activity_date);
            if (sr.streak_count > 0) setStreakBeforeBreakHint(null);
          } catch {
            /* streak stays stale until next progress fetch */
          }
        }
      }

      const nextStarts = { ...missionStartMap };
      delete nextStarts[id];
      persistMissionStartTimes(nextStarts);
      setMissionStartMap(nextStarts);

      setMissionReminders((rmPrev) => {
        if (!rmPrev[id]) return rmPrev;
        const rmNext = { ...rmPrev };
        delete rmNext[id];
        persistMissionReminders(rmNext);
        return rmNext;
      });
    } catch (e) {
      if (e instanceof SyndicateSessionLostError) return;
      setError(e instanceof Error ? e.message : "Unable to score mission response.");
    } finally {
      setSubmitBusy(false);
    }
  }

  useEffect(() => {
    if (missionCompleteToast === null) return;
    const t = window.setTimeout(() => setMissionCompleteToast(null), 5200);
    return () => window.clearTimeout(t);
  }, [missionCompleteToast]);

  const initialResp = selected ? loadResponses()[selected.id] ?? { how: "", learned: "" } : { how: "", learned: "" };

  const persistMissionDraft = useCallback((draft: MissionResponseDraft) => {
    if (!selected) return;
    const responses = loadResponses();
    responses[selected.id] = draft;
    persistResponses(responses);
    setResponseDraftsVersion((v) => v + 1);
  }, [selected]);
  const selectedScorePreview = selected ? missionScores[selected.id] ?? lastScore : null;
  const selectedAwardedPoints =
    selected && typeof missionAwardedMap[selected.id] === "number"
      ? missionAwardedMap[selected.id]
      : selectedScorePreview
        ? selectedScorePreview.awarded_points
        : null;

  const showRestore = mounted && streak === 0 && withinRestoreWindow(nowTick);
  const restoreDaysLeftCount = useMemo(
    () => (showRestore ? restoreDaysLeft(nowTick) : 0),
    [showRestore, nowTick]
  );
  const streakBeforeBreakCount = useMemo(() => {
    if (streak !== 0 || !showRestore) return null;
    if (streakBeforeBreakHint != null) return streakBeforeBreakHint;
    return readStreakBeforeBreakCount();
  }, [streak, showRestore, streakBeforeBreakHint, nowTick]);
  const openStreakRestoreSection = useCallback(() => {
    setShowStatsProfile(true);
    window.setTimeout(() => {
      streakRestoreSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
  }, []);
  const selectedAlreadyDone = selected ? doneIds.has(selected.id) : false;
  const selectedSubmitLocked =
    !!selected &&
    !selectedAlreadyDone &&
    ((!!selected.user_created && completedCustomTodayCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) ||
      (!selected.user_created && completedAgentTodayCount >= MAX_AGENT_COMPLETIONS_PER_DAY));
  const selectedSubmitLockedMessage =
    !!selected && !selectedAlreadyDone
      ? selected.user_created
        ? completedCustomTodayCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY
          ? "Daily limit reached: only 2 custom missions can be completed."
          : null
        : completedAgentTodayCount >= MAX_AGENT_COMPLETIONS_PER_DAY
          ? `Daily limit reached: only ${MAX_AGENT_COMPLETIONS_PER_DAY} generated missions can be completed.`
          : null
      : null;

  function redeemRewardMilestone(id: string) {
    const idx = REWARD_MILESTONES.findIndex((r) => r.id === id);
    const reward = idx >= 0 ? REWARD_MILESTONES[idx] : undefined;
    if (!reward) return;
    if (idx > 0) {
      const prevId = REWARD_MILESTONES[idx - 1]!.id;
      if (!redeemedRewards.has(prevId)) return;
    }
    if (pointsTotal < reward.unlock_points) return;
    if (redeemedRewards.has(id)) return;
    const nextRedeemed = new Set(redeemedRewards);
    nextRedeemed.add(id);
    persistRedeemedRewards(nextRedeemed);
    setRedeemedRewards(nextRedeemed);
    const nextTotal = pointsTotal + reward.bonus_points;
    persistPoints(nextTotal);
    setPointsTotal(nextTotal);
    setError(null);
  }

  function convertPointsToPounds() {
    const raw = parseInt(convertPointsInput, 10);
    if (!Number.isFinite(raw) || raw <= 0) {
      setError("Enter a valid points amount.");
      return;
    }
    if (raw > pointsTotal) {
      setError("Not enough points to convert.");
      return;
    }
    const poundsToAdd = (raw / POINTS_PER_10_POUNDS) * POUNDS_PER_100_POINTS;
    const nextPoints = Math.max(0, pointsTotal - raw);
    const nextPounds = poundsBalance + poundsToAdd;
    persistPoints(nextPoints);
    setPointsTotal(nextPoints);
    persistPoundsBalance(nextPounds);
    setPoundsBalance(nextPounds);
    setError(null);
  }

  function renderPointsToPoundsSection() {
    const previewPounds =
      (((Math.max(0, parseFloat(convertPointsInput || "0")) || 0) / POINTS_PER_10_POUNDS) * POUNDS_PER_100_POINTS) || 0;
    return (
      <div className="relative">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-amber-400/[0.07] blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-cyan-400/[0.06] blur-2xl" aria-hidden />
        <div className="relative">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 text-center sm:text-left">
              <div className="inline-flex items-center gap-2">
                <span className="rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-amber-100/95">
                  Exchange
                </span>
              </div>
              <h3 className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="text-[18px] font-black uppercase tracking-[0.06em] text-[color:var(--gold)] [text-shadow:0_0_20px_rgba(255,200,80,0.12)] sm:text-[21px]">
                  Points to pounds
                </span>
                <SyndicateHelpMark
                  topic="points-to-pounds"
                  label="How points to pounds and course unlocks work"
                  onOpen={openSyndicateHelp}
                />
              </h3>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/62 sm:text-[14px]">
                Spend points from your lifetime total; pounds credit applies immediately at the rate shown.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/55 to-black/40 px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(167,243,208,0.12)] sm:min-w-[11rem] sm:text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/75">Fixed rate</div>
              <div className="mt-1 font-mono text-[15px] font-bold tabular-nums leading-none text-emerald-50">
                {POINTS_PER_10_POUNDS} pts → £{POUNDS_PER_100_POINTS}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
            <div
              className="rounded-xl border border-cyan-400/25 bg-gradient-to-b from-cyan-950/50 to-black/50 px-2.5 py-3 text-center shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(165,243,252,0.08)] sm:px-3"
              title="Time until local midnight (daily mission window)"
            >
              <div className={cn(HUD_LABEL, "!text-[9px] text-cyan-200/75")}>Day ends</div>
              <div
                className={cn(
                  HUD_VALUE,
                  "mt-1 text-[19px] text-cyan-50 [text-shadow:0_0_16px_rgba(34,211,238,0.25)] sm:text-[22px]"
                )}
              >
                {formatCountdown(dayCountdownSec)}
              </div>
            </div>
            <div className="rounded-xl border border-sky-400/25 bg-gradient-to-b from-sky-950/45 to-black/50 px-2.5 py-3 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(186,230,253,0.07)] sm:px-3">
              <div className={cn(HUD_LABEL, "!text-[9px] text-sky-200/80")}>Available</div>
              <div className={cn(HUD_VALUE, "mt-1 text-[21px] text-sky-50 sm:text-[24px]")}>{pointsTotal}</div>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-gradient-to-b from-emerald-950/55 to-black/50 px-2.5 py-3 text-center shadow-[0_4px_20px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(167,243,208,0.08)] sm:px-3">
              <div className={cn(HUD_LABEL, "!text-[9px] text-emerald-200/80")}>£ Balance</div>
              <div className={cn(HUD_VALUE, "mt-1 text-[19px] text-emerald-50 sm:text-[22px]")}>£{poundsBalance.toFixed(2)}</div>
            </div>
            <div className="rounded-xl border border-amber-400/35 bg-gradient-to-b from-amber-950/40 to-black/50 px-2.5 py-3 text-center shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(253,230,138,0.08)] sm:px-3">
              <div className={cn(HUD_LABEL, "!text-[9px] text-amber-200/85")}>Preview</div>
              <div className={cn(HUD_VALUE, "mt-1 text-[19px] text-amber-50 sm:text-[22px]")}>£{previewPounds.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.1] bg-black/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55" htmlFor="syndicate-convert-points-input">
              Points to convert
            </label>
            <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
              <input
                id="syndicate-convert-points-input"
                type="number"
                min={1}
                step={1}
                value={convertPointsInput}
                onChange={(e) => setConvertPointsInput(e.target.value)}
                className="min-h-[48px] w-full min-w-0 flex-1 rounded-lg border border-amber-400/30 bg-[#0c0a08] px-4 py-3 text-[17px] font-semibold tabular-nums text-amber-50/95 outline-none ring-0 transition placeholder:text-white/25 focus:border-amber-400/55 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.12)] sm:max-w-[16rem] sm:text-[16px]"
              />
              <button
                type="button"
                onClick={convertPointsToPounds}
                className={cn(
                  "min-h-[48px] shrink-0 rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-500/25 to-amber-950/60 px-6 py-3 text-[14px] font-black uppercase tracking-[0.1em] text-amber-50 shadow-[0_4px_20px_rgba(245,158,11,0.15)] transition hover:border-amber-300/50 hover:from-amber-400/35 sm:px-8",
                  "active:scale-[0.98]"
                )}
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completionToast =
    missionCompleteToast !== null ? (
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed left-3 right-3 top-auto bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] max-w-none rounded-lg border border-white/15 bg-[rgba(12,18,24,0.96)] px-4 py-4 text-[15px] font-normal leading-relaxed text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.55)] sm:left-auto sm:right-6 sm:top-6 sm:bottom-auto sm:max-w-[min(20rem,calc(100vw-2rem))]"
      >
        <p className="text-[16px] font-medium text-white">You completed this challenge.</p>
        <p className="mt-2 line-clamp-3 text-[14px] text-white/75">{missionCompleteToast.title}</p>
        <p className="mt-3 text-[14px] text-white/90">
          <span className="text-white/55">Time: </span>
          {formatDurationForPopup(missionCompleteToast.elapsedSeconds)}
          <span className="text-white/45"> ({missionCompleteToast.elapsedSeconds}s)</span>
        </p>
        <p className="mt-2 text-[14px] text-white/90">
          <span className="text-white/55">Points: </span>
          <span className="font-semibold text-amber-200">+{missionCompleteToast.points}</span>
        </p>
      </div>
    ) : null;

  const syndicateHelpModal =
    syndicateHelpPanel !== null ? (
      <SyndicateHelpAnchoredPopover
        topic={syndicateHelpPanel.topic}
        anchorEl={syndicateHelpPanel.anchorEl}
        onClose={() => setSyndicateHelpPanel(null)}
      />
    ) : null;

  const adminTaskRecordingPortal =
    recordingAdminTaskId != null &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="syndicate-mood-context syndicate-admin-recording-shell pointer-events-auto fixed inset-0 z-[2147483646] grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-black touch-none [isolation:isolate]"
            style={{
              minHeight: "100dvh",
              height: "100dvh",
              width: "100vw",
              maxHeight: "-webkit-fill-available",
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)"
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Live camera recording"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/80 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-rose-200">
                <span
                  className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-rose-300 shadow-[0_0_10px_rgba(254,205,211,0.9)]"
                  aria-hidden
                />
                Recording
              </span>
              <span className="font-mono text-[15px] font-black tabular-nums text-white sm:text-[16px]">
                {formatDurationReadable(
                  Math.max(
                    0,
                    Math.floor(
                      (nowTick - (adminTaskRecordingStartMsRef.current[recordingAdminTaskId] ?? nowTick)) / 1000
                    )
                  )
                )}
              </span>
            </div>
            <div className="relative min-h-0 w-full min-w-0 overflow-hidden bg-black">
              <video
                ref={adminTaskFullscreenVideoRef}
                className="absolute inset-0 z-0 h-full min-h-[40vh] w-full object-cover [transform:translateZ(0)]"
                playsInline
                muted
                autoPlay
              />
            </div>
            <div className="shrink-0 border-t border-white/10 bg-black/95 px-4 py-4">
              <p className="mb-3 text-center text-[14px] leading-snug text-white/88">
                You should see yourself above in real time. Stop when finished — your written response stays in the form; submit sends text and video together.
              </p>
              <button
                type="button"
                onClick={() => stopAdminTaskVideoRecord(recordingAdminTaskId)}
                className="w-full min-h-[52px] rounded-xl border border-rose-300/60 bg-rose-600/30 px-4 py-3.5 text-[15px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_24px_rgba(225,29,72,0.35)] active:bg-rose-600/45"
              >
                Stop recording
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  if (selected) {
    return (
      <>
        {adminTaskRecordingPortal}
        {completionToast}
        {syndicateHelpModal}
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
          <DetailPane
            key={selected.id}
            row={selected}
            initialResponse={initialResp}
            submitting={submitBusy}
            scorePreview={selectedScorePreview}
            awardedPoints={selectedAwardedPoints}
            submitDisabled={selectedSubmitLocked}
            submitLockedMessage={selectedSubmitLockedMessage}
            nowMs={nowTick}
            done={doneIds.has(selected.id)}
            taskTimerStartMs={doneIds.has(selected.id) ? null : missionStartMap[selected.id] ?? null}
            onBack={() => setSelected(null)}
            onSubmit={handleSubmit}
            onDraftPersist={doneIds.has(selected.id) ? undefined : persistMissionDraft}
            missionReminderIso={missionReminders[selected.id]?.atIso ?? null}
            onMissionReminderChange={doneIds.has(selected.id) ? undefined : setMissionReminderForSelected}
            onMissionReminderDone={
              doneIds.has(selected.id)
                ? undefined
                : () => {
                    setShowStatsProfile(false);
                    setSyndicateView("reminders");
                    setSelected(null);
                    window.setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }, 0);
                  }
            }
            onSyndicateHelpOpen={openSyndicateHelp}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {adminTaskRecordingPortal}
      {completionToast}
      {syndicateHelpModal}
      <div className="syndicate-dash-outer relative flex h-full min-h-0 w-full min-w-0 max-w-none flex-1 flex-col space-y-2 border px-0 pt-0 sm:space-y-3 sm:pt-0 max-md:space-y-2 max-md:border-0 max-md:bg-[linear-gradient(168deg,#050508_0%,#0d0818_44%,#0a0610_100%)] max-md:px-0 max-md:pt-0 max-md:shadow-none">
      <div className="pointer-events-none absolute inset-0 -z-10 syndicate-dash-scanlines max-md:opacity-35" />
      <div className="syndicate-dash-header mb-1 flex w-full flex-col gap-2 rounded-2xl border px-2 py-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-2.5 sm:py-2 max-md:mb-0 max-md:rounded-none max-md:border-x-0 max-md:border-t-0 max-md:border-b-[rgba(255,215,0,0.24)] max-md:px-2 max-md:py-1.5">
        <div className="min-w-0 w-full sm:flex-1 sm:min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--gold)]/88 sm:text-[12px]">
            <span className="inline-flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[color:var(--gold)] shadow-[0_0_10px_rgba(255,215,0,0.85)] sm:h-3 sm:w-3" />
            On the board
          </div>
          <h3 className="m-0 mt-1 w-full min-w-0 overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]">
            <span className="syndicate-nav-headline block w-max max-w-none whitespace-nowrap text-[clamp(1rem,3.2vw+0.55rem,1.95rem)] leading-none tracking-[0.06em] sm:text-[clamp(1.15rem,2.2vw+0.55rem,2.2rem)]">
              Syndicate Mode
            </span>
            <span className="syndicate-nav-tagline mt-1 block w-max max-w-none whitespace-nowrap text-[clamp(0.48rem,1.65vw+0.26rem,0.78rem)] font-black italic uppercase leading-none tracking-[0.08em] text-[color:var(--gold-neon)] [text-shadow:0_0_12px_rgba(250,204,21,0.26),0_0_22px_rgba(212,175,55,0.1)] sm:mt-1 sm:tracking-[0.12em]">
              Money, Power, Freedom, Honour
            </span>
          </h3>
        </div>
        <div className="grid w-full shrink-0 grid-cols-2 gap-1.5 sm:w-auto sm:grid-cols-2 sm:gap-2 sm:pt-0.5">
          <button
            type="button"
            onClick={() => {
              setSyndicateView("dashboard");
              setShowStatsProfile(false);
            }}
            className={cn(
              "syndicate-nav-action min-h-[40px] min-w-0 touch-manipulation px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.06em] sm:min-w-[128px] sm:px-3 sm:py-2.5 sm:text-[11px] sm:tracking-[0.08em] md:min-w-[136px] md:text-[12px]",
              syndicateView === "dashboard" && !showStatsProfile && "syndicate-nav-action--active-gold"
            )}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              setSyndicateView("challenges");
              setShowStatsProfile(false);
            }}
            className={cn(
              "syndicate-nav-action min-h-[40px] min-w-0 touch-manipulation px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.06em] sm:min-w-[128px] sm:px-3 sm:py-2.5 sm:text-[11px] sm:tracking-[0.08em] md:min-w-[136px] md:text-[12px]",
              syndicateView === "challenges" && !showStatsProfile && "syndicate-nav-action--active-rose"
            )}
          >
            Missions
          </button>
          <button
            type="button"
            onClick={() => {
              setSyndicateView("reminders");
              setShowStatsProfile(false);
            }}
            className={cn(
              "syndicate-nav-action min-h-[40px] min-w-0 touch-manipulation px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.06em] sm:min-w-[128px] sm:px-3 sm:py-2.5 sm:text-[11px] sm:tracking-[0.08em] md:min-w-[136px] md:text-[12px]",
              syndicateView === "reminders" && !showStatsProfile && "syndicate-nav-action--active-cyan"
            )}
          >
            Reminders
            {missionsTabReminders.length > 0 ? (
              <span className="ml-1.5 inline-flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black tabular-nums leading-none text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                {missionsTabReminders.length > 9 ? "9+" : missionsTabReminders.length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            aria-expanded={showStatsProfile}
            aria-controls="syndicate-stats-profile"
            onClick={() => setShowStatsProfile(true)}
            className={cn(
              "syndicate-nav-action min-h-[40px] min-w-0 touch-manipulation px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.06em] sm:min-w-[128px] sm:px-3 sm:py-2.5 sm:text-[11px] sm:tracking-[0.08em] md:min-w-[136px] md:text-[12px]",
              showStatsProfile && "syndicate-nav-action--active-violet"
            )}
          >
            Stats & profile
          </button>
        </div>
      </div>

      {hasActionableBonusMission ? (
        <button
          type="button"
          onClick={goToBonusMissions}
          className="syndicate-readable group mb-2 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-cyan-400/35 bg-[linear-gradient(92deg,rgba(6,182,212,0.1),rgba(255,215,0,0.08),rgba(6,182,212,0.06))] px-3 py-2.5 text-left shadow-[0_0_20px_rgba(6,182,212,0.14)] ring-1 ring-[rgba(250,204,21,0.12)] transition hover:border-cyan-300/55 hover:shadow-[0_0_26px_rgba(250,204,21,0.22)] sm:px-4 sm:py-3 sm:text-center"
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-[color:var(--gold)] shadow-[0_0_12px_rgba(254,222,0,0.85)]"
              aria-hidden
            />
            <span className="text-[13px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)] sm:text-[14px]">
              Bonus mission activated
            </span>
          </span>
          <span className="text-[12px] font-semibold text-cyan-100/90 sm:text-[13px]">
            Click to go to the bonus mission section
          </span>
        </button>
      ) : null}

      {showStatsProfile ? (
        <section
          id="syndicate-stats-profile"
          className="syndicate-readable w-full min-w-0 scroll-mt-4 rounded-3xl border border-[rgba(255,215,0,0.4)] bg-[linear-gradient(165deg,rgba(255,215,0,0.1),rgba(8,28,62,0.62)_42%,rgba(96,44,156,0.34))] p-5 sm:p-7 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_0_1px_rgba(0,255,255,0.18),0_0_48px_rgba(0,0,0,0.6)] max-md:rounded-none max-md:border-x-0 max-md:border-t-0 max-md:border-b-[rgba(255,215,0,0.28)] max-md:p-4 max-md:shadow-none"
        >
          <h2 className="mb-2 text-[20px] font-black uppercase leading-tight tracking-[0.1em] text-[color:var(--gold)] sm:text-[24px]">
            Stats &amp; profile
          </h2>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 min-w-0 lg:order-1">{statsProfileChartsLeftColumn}</div>

            <div className="order-1 min-w-0 space-y-7 lg:order-2 lg:border-l lg:border-white/10 lg:pl-10">
              <div className="syndicate-day-points-card relative overflow-hidden rounded-2xl p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  <div className="relative z-[1] min-w-0 border-b border-white/10 pb-5 sm:border-b-0 sm:border-r sm:border-white/10 sm:pb-0 sm:pr-6">
                    <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-cyan-200/80 sm:text-[13px]">Day ends</div>
                    <div
                      className="mt-2 select-none font-mono text-[1.05rem] font-black tabular-nums leading-none tracking-tight text-cyan-200 [text-shadow:0_0_12px_rgba(34,211,238,0.38),0_1px_0_rgba(0,0,0,0.88)] sm:text-[1.2rem]"
                      title="Time until local midnight (daily mission window)"
                      aria-live="polite"
                    >
                      {formatCountdown(dayCountdownSec)}
                    </div>
                    <p className="mt-2 text-[11px] font-medium leading-snug text-white/45">Resets with the local day.</p>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/65 sm:text-[13px]">Total points</div>
                    <div className="mt-2 text-[1.5rem] font-black tabular-nums leading-none text-[color:var(--gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.22)] sm:text-[1.75rem]">
                      {pointsTotal}
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="syndicate-shell-profile-summary"
                className="scroll-mt-6 space-y-5 rounded-2xl border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.32))] p-5 sm:p-6 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.06)]"
              >
                <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/55">Profile</div>
                <div>
                  <label className="text-[12px] font-semibold text-white/55">Account email</label>
                  <div className="mt-1 break-all text-[15px] font-medium text-white/90">{getSyndicateUser()?.email ?? "—"}</div>
                  <p className="mt-1 text-[12px] text-white/45">Sign-in address (read-only).</p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="mx-auto shrink-0 sm:mx-0">
                    <div className="text-[12px] font-semibold text-white/55">Photo</div>
                    <div className="mt-2 h-28 w-24 overflow-hidden rounded-md border-2 border-cyan-300/70 bg-black/40 sm:h-32 sm:w-28">
                      <img src={dashboardAvatarUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="text-[12px] font-semibold text-white/55">Display name</div>
                    <div className="break-words text-[18px] font-black leading-tight text-white sm:text-[20px]">{profileName}</div>
                    <p className="text-[12px] leading-snug text-white/45">
                      Same as the top bar profile. Open the profile button next to search to change your name or picture.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[rgba(255,215,0,0.32)] bg-black/35 p-4 [box-shadow:0_0_16px_rgba(255,215,0,0.08)]">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-white/55">Best category</div>
                  <div className="mt-2 text-[16px] font-semibold leading-snug text-white">
                    {CATEGORIES.reduce((s, c) => s + (bestWorst.totals[c] ?? 0), 0) > 0 && bestWorst.best
                      ? `${CAT_LABEL[bestWorst.best.cat] ?? bestWorst.best.cat} (${bestWorst.best.pts} pts)`
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-[rgba(255,215,0,0.32)] bg-black/35 p-4 [box-shadow:0_0_16px_rgba(255,215,0,0.08)]">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-white/55">Lowest category</div>
                  <div className="mt-2 text-[16px] font-semibold leading-snug text-white">
                    {CATEGORIES.reduce((s, c) => s + (bestWorst.totals[c] ?? 0), 0) > 0 && bestWorst.worst
                      ? `${CAT_LABEL[bestWorst.worst.cat] ?? bestWorst.worst.cat} (${bestWorst.worst.pts} pts)`
                      : "—"}
                  </div>
                </div>
              </div>

              <div
                ref={streakRestoreSectionRef}
                id="syndicate-streak-restore"
                className="scroll-mt-6 rounded-2xl border border-[rgba(120,200,255,0.4)] bg-[rgba(0,40,80,0.24)] p-5 sm:p-6 [box-shadow:inset_0_0_0_1px_rgba(180,240,255,0.08)]"
              >
                <div className="text-[15px] font-bold uppercase tracking-wide text-[#a8d8ff]">Restore streak (invite a friend)</div>
                <p className="mt-2 text-[15px] leading-relaxed text-white/65">
                  After a streak break (7-day window), generate a code and share it. Your friend signs up and taps{" "}
                  <span className="text-white/85">Redeem</span> with that code. Then <span className="text-white/85">you</span>{" "}
                  (same account) return here and press <span className="text-white/85">Claim streak restore</span> — the streak
                  value comes from your server progress, not only this device.
                </p>
                {showRestore ? (
                  <p className="mt-2 text-[14px] font-semibold leading-relaxed text-amber-200/95">
                    {streakBeforeBreakCount != null ? (
                      <>
                        Your streak was <span className="tabular-nums text-amber-50">{streakBeforeBreakCount}</span> and now it is{" "}
                        <span className="tabular-nums text-amber-50">0</span>. You can restore in the next{" "}
                        <span className="tabular-nums text-amber-50">{restoreDaysLeftCount}</span>{" "}
                        {restoreDaysLeftCount === 1 ? "day" : "days"} (max {RESTORE_WINDOW_CALENDAR_DAYS} calendar days from the break;
                        the countdown drops by one each day).
                      </>
                    ) : (
                      <>
                        Your streak is <span className="tabular-nums text-amber-50">0</span>. You can restore in the next{" "}
                        <span className="tabular-nums text-amber-50">{restoreDaysLeftCount}</span>{" "}
                        {restoreDaysLeftCount === 1 ? "day" : "days"} (one fewer each calendar day; max {RESTORE_WINDOW_CALENDAR_DAYS}{" "}
                        from the break).
                      </>
                    )}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void createInviteCode()}
                    className="rounded-md border border-[rgba(120,200,255,0.55)] bg-black/40 px-4 py-2 text-[14px] font-semibold text-[#b5e8ff]"
                  >
                    Generate invite code
                  </button>
                  {inviteCode ? (
                    <code className="rounded border border-white/20 bg-black/50 px-3 py-2 font-mono text-[14px] text-[color:var(--gold)]">{inviteCode}</code>
                  ) : null}
                  {canClaimRestore ? (
                    <button
                      type="button"
                      onClick={() => void claimRestore()}
                      className="rounded-md border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-[14px] font-semibold text-emerald-200"
                    >
                      Claim streak restore
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="w-full min-w-0 flex-1 sm:min-w-[12rem]">
                    <label className="text-[13px] font-medium text-white/60">Friend&apos;s code</label>
                    <input
                      value={friendCode}
                      onChange={(e) => setFriendCode(e.target.value)}
                      placeholder="SYN-…"
                      className="syndicate-readable mt-1.5 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2.5 font-mono text-[15px] text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void redeemFriend()}
                    className="w-full min-h-[44px] shrink-0 rounded-md border border-white/30 px-4 py-2.5 text-[14px] font-semibold text-white/90 sm:w-auto sm:min-h-0"
                  >
                    Redeem
                  </button>
                </div>
                {referralMsg ? <p className="mt-3 text-[14px] text-[#b5ecff]/90">{referralMsg}</p> : null}
              </div>

              <div className="rounded-2xl border border-[rgba(120,200,255,0.34)] bg-[rgba(0,35,55,0.35)] p-4 [box-shadow:inset_0_0_0_1px_rgba(180,240,255,0.08)]">
                <h3 className="text-[16px] font-black uppercase tracking-[0.12em] text-[#a8d8ff] sm:text-[17px]">
                  History by date
                </h3>
                <p className="mt-1 text-[13px] text-white/65">Check your mission performance for any date.</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="w-full min-w-0 sm:w-auto sm:min-w-[12rem]">
                    <label htmlFor="syndicate-history-date" className="text-[12px] font-semibold text-white/70">
                      Filter date
                    </label>
                    <input
                      id="syndicate-history-date"
                      type="date"
                      max={todayLocalISO()}
                      value={historyFilterDate}
                      onChange={(e) => setHistoryFilterDate(e.target.value || todayLocalISO())}
                      className={SYNDICATE_DATE_INPUT}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryFilterDate(todayLocalISO())}
                    className={cn(
                      "min-h-[44px] w-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] sm:min-h-0 sm:w-auto",
                      CTA_BTN
                    )}
                  >
                    Today
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 max-[360px]:grid-cols-1 sm:grid-cols-4">
                  <div className="rounded-lg border border-white/12 bg-black/35 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/55">Offered</div>
                    <div className="mt-1 text-[20px] font-black text-white">{filteredDayChallengeStats.offered ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/80">Completed</div>
                    <div className="mt-1 text-[20px] font-black text-cyan-100">{filteredDayChallengeStats.completed}</div>
                  </div>
                  <div className="rounded-lg border border-orange-300/30 bg-orange-500/10 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-orange-100/85">Missed</div>
                    <div className="mt-1 text-[20px] font-black text-orange-100">{filteredDayChallengeStats.missed ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.08)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--gold)]/90">Achieved pts</div>
                    <div className="mt-1 text-[20px] font-black tabular-nums text-[color:var(--gold)]">
                      {filteredDayChallengeStats.achievedPoints}
                    </div>
                  </div>
                </div>
                <div className="mt-4 -mx-1 max-h-[210px] overflow-x-auto overflow-y-auto overscroll-x-contain rounded-lg border border-white/10 bg-black/25 sm:mx-0">
                  <table className="w-full min-w-[min(100%,480px)] text-left text-[12px] sm:min-w-[480px]">
                    <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/55">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2 text-right">Offered</th>
                        <th className="px-3 py-2 text-right">Completed</th>
                        <th className="px-3 py-2 text-right">Missed</th>
                        <th className="px-3 py-2 text-right text-[color:var(--gold)]/90">Achieved pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastSevenDayChallengeRows.map((row) => (
                        <tr
                          key={row.iso}
                          className={cn("border-t border-white/6 text-white/90", row.iso === historyFilterDate ? "bg-cyan-500/10" : "")}
                        >
                          <td className="px-3 py-2">{row.iso}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.offered ?? "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-cyan-100">{row.completed}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-orange-100">{row.missed ?? "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-[color:var(--gold)]">{row.achievedPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <h4 className="text-[15px] font-black uppercase tracking-[0.12em] text-[#a8d8ff] sm:text-[16px]">
                    Completed missions · detail
                  </h4>
                  <p className="mt-1 text-[12px] leading-snug text-white/60 sm:text-[13px]">
                    Your submitted text and points for the date selected above (default: today). New completions are saved with your profile and sync across devices.
                  </p>
                  <div className="mt-4 max-h-[min(70vh,28rem)] space-y-3 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]">
                    {completionEntriesForHistoryDate.length === 0 ? (
                      <p className="rounded-lg border border-white/10 bg-black/30 px-4 py-6 text-center text-[14px] text-white/55">
                        No completed missions recorded for {historyFilterDate}.
                      </p>
                    ) : (
                      completionEntriesForHistoryDate.map((e) => (
                        <article
                          key={e.entryId}
                          className="rounded-xl border border-cyan-400/25 bg-[linear-gradient(180deg,rgba(0,45,70,0.35),rgba(0,0,0,0.45))] p-4 sm:p-5 [box-shadow:inset_0_0_0_1px_rgba(180,240,255,0.06)]"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                            <h5 className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-white sm:text-[16px]">{e.title}</h5>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <span className="rounded-md border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.1)] px-2.5 py-1 text-[12px] font-black tabular-nums text-[color:var(--gold)]">
                                +{e.awardedPoints}
                                {e.maxPoints > 0 ? (
                                  <span className="font-semibold text-[color:var(--gold)]/75"> / {e.maxPoints}</span>
                                ) : null}{" "}
                                pts
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50 sm:text-[12px]">
                            <span>
                              {CAT_LABEL[e.category] ?? e.category}
                            </span>
                            <span className="text-white/25" aria-hidden>
                              ·
                            </span>
                            <span className="capitalize text-cyan-200/85">{e.mood}</span>
                            <span className="text-white/25 max-sm:hidden" aria-hidden>
                              ·
                            </span>
                            <span className="font-medium normal-case tracking-normal text-emerald-200/90" title="When you submitted this completion">
                              {formatMissionCompletionTime(e)}
                            </span>
                            {typeof e.elapsedSeconds === "number" &&
                            Number.isFinite(e.elapsedSeconds) &&
                            e.elapsedSeconds >= 0 ? (
                              <>
                                <span className="text-white/25 max-sm:hidden" aria-hidden>
                                  ·
                                </span>
                                <span
                                  className="font-medium normal-case tracking-normal text-amber-100/88"
                                  title="Time from first opening this mission until you submitted"
                                >
                                  {formatDurationReadable(e.elapsedSeconds)} total
                                </span>
                              </>
                            ) : null}
                            <span className="text-white/25 max-sm:hidden" aria-hidden>
                              ·
                            </span>
                            <span className="w-full text-white/40 max-sm:mt-0.5 sm:w-auto">ID {e.challengeId}</span>
                          </div>
                          <div className="mt-3 rounded-lg border border-white/10 bg-black/35 p-3 sm:p-4">
                            {(() => {
                              const parts = splitCompletionLogEntry(e);
                              if (parts && (parts.how.trim() || parts.learned.trim())) {
                                return (
                                  <div className="space-y-4">
                                    <div>
                                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                                        How will you complete it
                                      </div>
                                      <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white/88 sm:text-[15px]">
                                        {parts.how.trim() || "—"}
                                      </p>
                                    </div>
                                    <div>
                                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                                        What you learned from it
                                      </div>
                                      <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white/88 sm:text-[15px]">
                                        {parts.learned.trim() || "—"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <>
                                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Your response</div>
                                  <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white/88 sm:text-[15px]">
                                    {e.responseText.trim() || "—"}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 min-w-0 border-t border-[rgba(255,215,0,0.2)] pt-8">
            <div className="min-w-0 rounded-2xl border border-[rgba(120,200,255,0.34)] bg-[rgba(0,35,55,0.45)] p-4 sm:p-7 [box-shadow:inset_0_0_0_1px_rgba(180,240,255,0.08),0_0_24px_rgba(0,0,0,0.35)]">
              <h3 className="text-[20px] font-black uppercase tracking-[0.12em] text-[#a8d8ff] sm:text-[24px]">
                Leaderboard · Top 10
              </h3>
              <p className="mt-2 text-[14px] text-white/70">
                Top performers ranked by total points.
              </p>
              {leaderboardErr ? (
                <p className="mt-4 text-[15px] text-rose-300/90">{leaderboardErr}</p>
              ) : leaderboard.length === 0 ? (
                <p className="mt-4 text-[15px] leading-relaxed text-white/55">No entries yet. Earn points and sync automatically.</p>
              ) : (
                <>
                  <ul
                    className="mt-4 space-y-2 md:hidden"
                    aria-label="Leaderboard top 10"
                  >
                    {leaderboard.slice(0, 10).map((e, i) => (
                      <li
                        key={e.user_id != null ? `u${e.user_id}` : `${e.rank}-${e.display_name}-${i}`}
                        className="flex min-w-0 items-center gap-3 rounded-lg border border-white/12 bg-black/40 px-3 py-3"
                      >
                        <span className="w-7 shrink-0 text-center text-[13px] font-bold tabular-nums text-white/70">{e.rank}</span>
                        <div className="shrink-0">
                          {e.avatar_url ? (
                            <img
                              src={e.avatar_url}
                              alt=""
                              className="h-10 w-10 rounded-full border border-white/20 bg-black/40 object-cover"
                            />
                          ) : (
                            <span className="inline-block h-10 w-10 rounded-full border border-white/15 bg-white/10" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-white">{e.display_name}</p>
                        </div>
                        <span className="shrink-0 text-[15px] font-black tabular-nums text-[color:var(--gold)]" title="Total points">
                          {e.points_total}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 -mx-2 hidden overflow-x-auto overflow-y-visible overscroll-x-contain rounded-lg border border-white/12 bg-black/35 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:mx-0 md:block">
                    <table className="w-full min-w-[560px] text-left text-[15px]">
                      <thead className="border-b border-white/10 text-[12px] uppercase tracking-[0.12em] text-white/60">
                        <tr>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3 w-14" aria-hidden />
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.slice(0, 10).map((e, i) => (
                          <tr
                            key={e.user_id != null ? `u${e.user_id}` : `${e.rank}-${e.display_name}-${i}`}
                            className="border-t border-white/5 text-white/90"
                          >
                            <td className="px-4 py-3 tabular-nums text-white/75">{e.rank}</td>
                            <td className="px-4 py-3">
                              {e.avatar_url ? (
                                <img
                                  src={e.avatar_url}
                                  alt=""
                                  className="h-9 w-9 rounded-full border border-white/20 bg-black/40 object-cover"
                                />
                              ) : (
                                <span className="inline-block h-9 w-9 rounded-full border border-white/15 bg-white/10" />
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold">{e.display_name}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-[color:var(--gold)]">{e.points_total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {!showStatsProfile && syndicateView === "dashboard" ? (
          <section className="syndicate-readable w-full min-w-0 px-2 py-2 sm:px-3 sm:py-3">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
            <div className="border-b border-fuchsia-300/45 p-2 sm:p-3">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex w-full min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
                  <div className="h-28 w-24 shrink-0 overflow-hidden rounded-md border-2 border-cyan-300/80 bg-black/30 shadow-[0_0_30px_rgba(103,232,249,0.45)] sm:h-32 sm:w-28">
                    <img src={dashboardAvatarUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/70">Your profile</div>
                    <div className="mt-1 break-words text-[24px] font-black leading-none text-white sm:text-[28px]">
                      {profileName}
                    </div>
                    <p className="mt-2 w-full min-w-0 text-[15px] font-semibold leading-relaxed text-[#f5e6c8]/90 sm:text-[16px]">
                      Chip away at missions — heat builds with every day you show up.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block" aria-hidden />
              </div>
              <div className="mt-4 grid grid-cols-1 items-start gap-4 min-[420px]:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="syndicate-stat-card syndicate-stat-card--cyan flex flex-col px-4 py-4 text-center">
                    <div className={cn(HUD_LABEL, "text-[11px] text-sky-100 sm:text-[12px]")}>Level</div>
                    <div className="mt-1 text-[28px] font-black tabular-nums leading-none text-sky-50 sm:text-[34px]">
                      {syndicateProgressHud.syndicateLevel}
                    </div>
                    <div className="mt-2 text-[11px] font-bold uppercase leading-tight tracking-[0.1em] text-sky-200 sm:text-[12px]">
                      Syndicate level
                    </div>
                  </div>
                  <div className="space-y-1.5 px-0.5 text-center">
                    {syndicateProgressHud.atMaxTier ? (
                      <p className="text-[12px] font-semibold leading-snug text-sky-100/90 sm:text-[13px]">
                        Highest syndicate level — all reward tiers reached.
                      </p>
                    ) : syndicateProgressHud.nextLevelNumber != null && syndicateProgressHud.nextTierTotalPoints != null ? (
                      <>
                        <p className="text-[12px] font-semibold leading-snug text-sky-100/92 sm:text-[13px]">
                          <span className="font-black tabular-nums text-sky-50">
                            {syndicateProgressHud.ptsToNextLevel === 1
                              ? "1 pt"
                              : `${syndicateProgressHud.ptsToNextLevel} pts`}
                          </span>{" "}
                          to reach{" "}
                          <span className="font-black text-sky-50">Level {syndicateProgressHud.nextLevelNumber}</span>
                        </p>
                        <p className="text-[11px] font-medium leading-snug text-sky-200/90 sm:text-[12px]">
                          Level {syndicateProgressHud.nextLevelNumber} unlocks at{" "}
                          <span className="font-bold tabular-nums text-sky-100">
                            {syndicateProgressHud.nextTierTotalPoints}
                          </span>{" "}
                          total points (same as reward Level {syndicateProgressHud.nextLevelNumber}).
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="syndicate-stat-card syndicate-stat-card--amber flex flex-col px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn(HUD_LABEL, "text-amber-100")}>Points</div>
                      <SyndicateHelpMark topic="hud-points" label="How points work" onOpen={openSyndicateHelp} />
                    </div>
                    <div className="mt-1 text-[22px] font-black tabular-nums text-amber-50 sm:text-[24px]">{pointsTotal}</div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-200 sm:text-[11px]">Total earned</div>
                  </div>
                  <div className="space-y-1 px-0.5 text-center">
                    <p className="text-[11px] leading-snug text-amber-100/88 sm:text-[12px]">
                      Lifetime points from missions, bonus tasks, and reward bonuses.
                    </p>
                    <p className="text-[11px] leading-snug text-amber-200/75 sm:text-[12px]">Spend milestones in Unlock &amp; rewards.</p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="syndicate-stat-card syndicate-stat-card--fuchsia flex flex-col px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn(HUD_LABEL, "text-fuchsia-100")}>Streak 🔥</div>
                      <SyndicateHelpMark topic="hud-streak" label="How streak works" onOpen={openSyndicateHelp} />
                    </div>
                    <div className="mt-1 text-[20px] font-black tabular-nums text-fuchsia-100">
                      🔥 {streak} {streak === 1 ? "day" : "days"}
                    </div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-fuchsia-200 sm:text-[11px]">
                      Consecutive days
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 px-0.5 text-center">
                    <p className="text-[11px] leading-snug text-fuchsia-100/85 sm:text-[12px]">
                      {streak === 0 ? (
                        showRestore ? (
                          streakBeforeBreakCount != null ? (
                            <>
                              Your streak was <span className="font-black tabular-nums text-fuchsia-100">{streakBeforeBreakCount}</span>{" "}
                              and now it is <span className="font-black tabular-nums text-fuchsia-100">0</span>. You can restore in the next{" "}
                              <span className="font-black tabular-nums text-fuchsia-100">{restoreDaysLeftCount}</span>{" "}
                              {restoreDaysLeftCount === 1 ? "day" : "days"}. The countdown drops by one each calendar day.
                            </>
                          ) : (
                            <>
                              Your streak is <span className="font-black tabular-nums text-fuchsia-100">0</span>. You can restore in the next{" "}
                              <span className="font-black tabular-nums text-fuchsia-100">{restoreDaysLeftCount}</span>{" "}
                              {restoreDaysLeftCount === 1 ? "day" : "days"} — one fewer each calendar day.
                            </>
                          )
                        ) : (
                          <>
                            Your streak is <span className="font-semibold text-fuchsia-50/95">0</span>. Complete a mission today to start a new run.
                          </>
                        )
                      ) : (
                        <>Complete at least one mission per day to keep the streak alive.</>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={openStreakRestoreSection}
                      className="syndicate-link-skip mx-auto max-w-[95%] text-center text-[11px] font-bold leading-snug tracking-wide text-fuchsia-200 underline decoration-fuchsia-400/55 underline-offset-2 transition hover:text-white hover:decoration-white sm:text-[12px]"
                    >
                      {showRestore ? (
                        <>
                          Restore streak ({restoreDaysLeftCount} {restoreDaysLeftCount === 1 ? "day" : "days"} left)
                        </>
                      ) : (
                        "Restore streak"
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="hidden xl:block">
                <section
                  id="syndicate-points-to-pounds"
                  className="syndicate-readable mt-4 w-full min-w-0 overflow-hidden rounded-2xl border border-amber-400/20 bg-[linear-gradient(165deg,rgba(32,26,14,0.95),rgba(8,6,5,0.98))] px-3 py-4 shadow-[0_16px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,200,120,0.06)] sm:px-5 sm:py-6"
                >
                  {renderPointsToPoundsSection()}
                </section>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px] text-white/70">
                  <span>Daily completion quota</span>
                  <span className="font-mono">{completedTotalTodayCount}/{Math.max(1, totalDailyCompletionCap)}</span>
                </div>
                <div className="h-3 bg-white/10">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#22d3ee,#818cf8,#facc15)]"
                    style={{ width: `${Math.min(100, Math.round((completedTotalTodayCount / Math.max(1, totalDailyCompletionCap)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {missionsTabReminders.length > 0 ? (
                <section
                  className="syndicate-readable w-full min-w-0 rounded-2xl border border-[rgba(250,204,21,0.38)] bg-[linear-gradient(165deg,rgba(32,26,10,0.72),rgba(6,6,10,0.96))] px-3 py-4 [box-shadow:0_0_0_1px_rgba(250,204,21,0.12),0_8px_36px_rgba(0,0,0,0.45),0_0_28px_rgba(250,204,21,0.08)] sm:px-5 sm:py-5"
                  aria-label="Mission reminders dashboard"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[13px] font-black uppercase tracking-[0.18em] text-[color:var(--gold)]/92">Next reminder</h3>
                      <p className="mt-1 text-[11px] text-white/55">
                        {missionsTabReminders.length} active · nearest target first
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatsProfile(false);
                        setSyndicateView("reminders");
                      }}
                      className={cn(
                        "min-h-[40px] shrink-0 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] sm:min-h-[44px] sm:px-4 sm:text-[12px]",
                        CTA_BTN
                      )}
                    >
                      See all your reminders
                      {missionsTabReminders.length > 1 ? ` (${missionsTabReminders.length})` : ""}
                    </button>
                  </div>
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/12 bg-black/35 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/72">Reminder rules</span>
                    <SyndicateHelpMark
                      topic="mission-reminder"
                      label="How mission reminders work and how points can change"
                      onOpen={openSyndicateHelp}
                    />
                  </div>
                  <ul className="list-none space-y-4 p-0">
                    {missionsTabReminders[0] ? (
                      <MissionReminderCard
                        key={`dashboard-rem-${missionsTabReminders[0].id}`}
                        item={missionsTabReminders[0]}
                        nowTick={nowTick}
                        rows={rows}
                        onOpenMission={openMissionDetail}
                        onDismiss={dismissMissionReminder}
                      />
                    ) : null}
                  </ul>
                </section>
              ) : null}

              <div className={cn("border-b border-[rgba(255,215,0,0.28)] pb-3", "bg-transparent")}>
                <div className={HUD_LABEL}>Mission stats</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="border border-cyan-300/45 bg-cyan-500/10 p-2 [box-shadow:0_0_14px_rgba(34,211,238,0.18)]">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/85">Completed</div>
                    <div className="text-[22px] font-black text-cyan-100">{completedTotalTodayCount}</div>
                  </div>
                  <div className="border border-orange-300/45 bg-orange-500/10 p-2 [box-shadow:0_0_14px_rgba(249,115,22,0.2)]">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-orange-100/85">Pending</div>
                    <div className="text-[22px] font-black text-orange-100">{pendingDailyCompletionSlots}</div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-white/60">
                  Daily: {completedAgentTodayCount}/{MAX_AGENT_COMPLETIONS_PER_DAY} · Custom: {completedCustomTodayCount}/
                  {rows.some((r) => !!r.user_created) ? MAX_CUSTOM_COMPLETIONS_PER_DAY : 0}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-white/12 bg-black/25 px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100/85">Best category</span>
                  <span className="text-[13px] font-black uppercase tracking-[0.06em] text-[color:var(--gold)]">
                    {dashboardBestCategoryLabel}
                  </span>
                </div>
                <div className="mt-3 h-[220px] w-full min-w-0 sm:h-[250px] md:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completed", value: Math.max(0, completedTotalTodayCount) },
                          { name: "Pending", value: Math.max(0, pendingDailyCompletionSlots) }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={92}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        <Cell fill="#22d3ee" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
                        <Cell fill="#f97316" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#141414",
                          border: "1px solid rgba(120,200,255,0.35)",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#fff"
                        }}
                        labelStyle={{ color: "#fff", fontSize: 12 }}
                        itemStyle={{ color: "#fff", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className={cn("border-b border-[rgba(255,215,0,0.28)] pb-3", "bg-transparent")}>
              <div className={HUD_LABEL}>Daily mission</div>
              <div className="mt-1 text-[26px] font-black leading-tight text-white">
                {rowsOnMissionBoard[0]?.payload?.challenge_title ?? "No mission loaded"}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-white/75">
                <span className="border border-white/15 px-2 py-0.5">{rowsOnMissionBoard[0]?.points ?? 0} XP</span>
                <span>{doneIds.size} completed today</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSyndicateView("challenges")}
                  className={cn("px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => setSyndicateView("challenges")}
                  className={cn("px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                >
                  Open
                </button>
              </div>
            </div>

            <div className={cn("border-b border-[rgba(244,114,182,0.32)] pb-3", "bg-transparent")}>
              <div className={HUD_LABEL}>Quick actions</div>
              <div className="mt-2 grid gap-2">
                <button
                  type="button"
                  onClick={() => setSyndicateView("challenges")}
                  className={cn("px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                >
                  Play missions
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatsProfile(true)}
                  className={cn("px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                >
                  Open stats
                </button>
              </div>
            </div>
          </div>

          <div className="xl:hidden mt-4 w-full">
            <section
              className="syndicate-readable w-full min-w-0 overflow-hidden rounded-2xl border border-amber-400/20 bg-[linear-gradient(165deg,rgba(32,26,14,0.95),rgba(8,6,5,0.98))] px-3 py-4 shadow-[0_16px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,200,120,0.06)] sm:px-5 sm:py-6"
              aria-label="Points to pounds"
            >
              {renderPointsToPoundsSection()}
            </section>
          </div>
        </section>
      ) : null}

      <>
          {!showStatsProfile && syndicateView === "dashboard" ? (
          <section className="syndicate-readable syndicate-hud-deck syndicate-game-vault mt-3 w-full min-w-0 max-md:mt-3 max-md:rounded-none max-md:border-0 max-md:px-0 max-md:py-0 sm:mt-4">
            <div className="syndicate-hud-deck-inner syndicate-game-brackets px-3 py-3 sm:px-4 sm:py-4">
              <div className="syndicate-game-header-rail border-b border-cyan-400/20 pb-3 lg:border-b-0 lg:pb-0">
                <div className="syndicate-game-header-main min-w-0 border-l-[3px] border-[color:var(--gold-neon)] pl-3 sm:pl-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.32em] text-cyan-300/80 sm:text-[10px]">
                    Tier matrix · sequential unlock
                  </p>
                  <h3 className="mt-1.5 flex flex-wrap items-center gap-2 text-left text-[clamp(1rem,2.8vw+0.4rem,1.35rem)] font-black uppercase leading-tight tracking-[0.12em] text-[color:var(--gold)] [text-shadow:0_0_18px_rgba(250,204,21,0.25)] sm:text-[1.4rem] sm:tracking-[0.14em]">
                    <span>Unlock &amp; redeem rewards</span>
                    <SyndicateHelpMark topic="unlock" label="How unlock and redeem rewards work" onOpen={openSyndicateHelp} />
                  </h3>
                  <p className="mt-2 max-w-[42rem] text-[12px] font-medium leading-snug text-white/72 sm:text-[13px]">
                    Redeem in order: Level 1, then 2, then 3… Meet each points threshold and redeem before the next tier opens.
                  </p>
                </div>
                <div className="syndicate-game-header-side syndicate-game-data-slab mt-3 px-3 py-2.5 lg:mt-0 lg:self-stretch lg:px-3.5 lg:py-3">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-400/90">Signal</p>
                  <p className="mt-1 text-[12px] font-semibold leading-snug text-cyan-100/92 sm:text-[13px]">
                    Earn points to unlock tiers — each redeem adds bonus points to your total.
                  </p>
                </div>
              </div>

            <div className="syndicate-game-deck-rail">
              <div className="syndicate-game-deck-spine" aria-hidden />
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
              {REWARD_MILESTONES.map((rw, levelIndex) => {
                const level = levelIndex + 1;
                const prevRedeemed = levelIndex === 0 || redeemedRewards.has(REWARD_MILESTONES[levelIndex - 1]!.id);
                const hasPoints = pointsTotal >= rw.unlock_points;
                const canRedeem = prevRedeemed && hasPoints;
                const redeemed = redeemedRewards.has(rw.id);
                const readyToRedeem = hasPoints && prevRedeemed && !redeemed;
                const sequentialBlocked = !prevRedeemed && !redeemed;
                const isBlackCoinReward = rw.id === "rw-150";
                const isGoldToneReward = rw.id === "rw-100" || rw.id === "rw-200" || rw.id === "rw-350";
                return (
                  <div
                    key={rw.id}
                    className={cn(
                      "syndicate-reward-tile flex min-h-[188px] flex-col px-1.5 pb-2.5 pt-2.5 text-center sm:min-h-[280px] sm:px-3 sm:pb-3 sm:pt-3 md:min-h-[300px]",
                      redeemed && "syndicate-reward-tile--cleared bg-emerald-950/35",
                      !redeemed &&
                        readyToRedeem &&
                        "syndicate-reward-tile--hot bg-[linear-gradient(165deg,rgba(255,200,80,0.16),rgba(8,12,20,0.9))]",
                      !redeemed &&
                        !readyToRedeem &&
                        "bg-[linear-gradient(180deg,rgba(10,20,30,0.95),rgba(4,8,14,0.96))]",
                      sequentialBlocked && "opacity-[0.82] [filter:grayscale(0.45)]"
                    )}
                  >
                    <div className="flex flex-1 flex-col items-center">
                      <div
                        className={cn(
                          "relative mx-auto mb-2 flex aspect-square w-full max-w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:mb-2.5 sm:max-w-[7.25rem] sm:p-2.5 md:max-w-[8rem]",
                          isBlackCoinReward
                            ? "border-white/45 ring-2 ring-white/35 bg-[radial-gradient(ellipse_at_50%_38%,rgba(255,255,255,0.88)_0%,rgba(220,215,205,0.65)_38%,rgba(90,85,80,0.75)_72%,rgba(28,26,24,0.98)_100%)]"
                            : isGoldToneReward
                              ? "border-amber-200/35 ring-1 ring-amber-300/25 bg-[radial-gradient(ellipse_at_50%_32%,rgba(255,230,160,0.45)_0%,rgba(200,150,60,0.42)_48%,rgba(25,18,8,0.94)_100%)]"
                              : "border-white/25 ring-1 ring-white/15 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.22)_0%,rgba(60,55,45,0.55)_45%,rgba(10,8,6,0.92)_100%)]"
                        )}
                      >
                        <img
                          src={rw.image}
                          alt={rw.title}
                          className={cn(
                            "h-full w-full max-h-[5rem] object-contain object-center sm:max-h-[6.5rem] md:max-h-[7.25rem]",
                            isBlackCoinReward
                              ? "drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)] [filter:brightness(1.5)_contrast(1.12)]"
                              : isGoldToneReward
                                ? "drop-shadow-[0_4px_20px_rgba(255,200,90,0.45)] [filter:saturate(1.45)_brightness(1.18)_contrast(1.08)]"
                                : "drop-shadow-[0_4px_14px_rgba(0,0,0,0.55)]"
                          )}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="text-[12px] font-black uppercase tracking-[0.12em] text-cyan-200 sm:text-[15px] sm:tracking-[0.14em]">Level {level}</div>
                      <div className="mt-1 w-full max-w-full px-0.5 text-[10px] font-black uppercase leading-tight tracking-[0.04em] text-white sm:max-w-[11rem] sm:text-[13px] sm:leading-snug sm:tracking-[0.06em]">
                        {rw.title}
                      </div>
                      <div className="mt-2 text-[12px] font-semibold tabular-nums text-white/88 sm:mt-3 sm:text-[15px]">
                        Req:{" "}
                        <span className="font-bold text-[color:var(--gold)] [text-shadow:0_0_12px_rgba(254,222,0,0.25)]">
                          {rw.unlock_points}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] font-semibold tabular-nums text-cyan-100 sm:mt-1.5 sm:text-[15px]">
                        Bonus{" "}
                        <span className="font-bold text-emerald-200 [text-shadow:0_0_10px_rgba(52,211,153,0.2)]">
                          +{rw.bonus_points}
                        </span>
                      </div>
                      <div className="mt-2 flex min-h-[2.25rem] w-full flex-col items-center justify-center px-0.5 sm:mt-3 sm:min-h-[2.75rem]">
                        {sequentialBlocked ? (
                          <p className="text-center text-[10px] font-bold leading-tight text-amber-200 sm:text-[13px] sm:leading-snug">
                            Redeem level {level - 1} first
                          </p>
                        ) : !redeemed && prevRedeemed && !hasPoints ? (
                          <p className="text-center text-[10px] font-semibold leading-tight text-white/60 sm:text-[13px] sm:leading-snug">
                            Need {rw.unlock_points} pts
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canRedeem || redeemed}
                      onClick={() => redeemRewardMilestone(rw.id)}
                      className={cn(
                        "mt-auto w-full shrink-0 px-1 py-2 text-[10px] font-extrabold uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-45 sm:px-2 sm:py-3 sm:text-[13px] sm:tracking-[0.08em]",
                        CTA_BTN
                      )}
                    >
                      {redeemed ? "Redeemed" : canRedeem ? "Redeem" : "Locked"}
                    </button>
                  </div>
                );
              })}
            </div>
            </div>
            <p className="mt-3 border-t border-cyan-500/15 pt-3 font-mono text-[10px] leading-relaxed text-white/40 sm:text-[11px]">
              Reward art: <code className="text-cyan-200/70">public/assets/rewards/</code> · config:{" "}
              <code className="text-cyan-200/70">REWARD_MILESTONES</code>
            </p>
            </div>
          </section>
          ) : null}

          {!showStatsProfile && syndicateView === "dashboard" ? (
          <section
            id="syndicate-bonus-missions"
            ref={bonusMissionSectionRef}
            className="syndicate-readable syndicate-hud-deck syndicate-hud-deck--mega syndicate-game-vault syndicate-game-vault--mega mt-5 w-full min-w-0 scroll-mt-6 space-y-0 max-md:mt-4 max-md:rounded-none max-md:border-0"
          >
            <div className="syndicate-hud-deck-inner syndicate-game-brackets px-3 py-3 sm:px-4 sm:py-4">
              <header className="syndicate-game-header-rail border-b border-amber-400/15 pb-3 lg:border-b-0 lg:pb-0">
                <div className="syndicate-game-header-main min-w-0 border-l-[3px] border-cyan-400/55 pl-3 sm:pl-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-300/85 sm:text-[10px]">
                    Bonus track · high-yield
                  </p>
                  <h2 className="mt-1.5 flex flex-wrap items-center gap-2 text-left text-[clamp(1.25rem,4vw+0.35rem,2.15rem)] font-black uppercase leading-none tracking-[0.1em] text-[color:var(--gold)] [text-shadow:0_0_20px_rgba(250,204,21,0.35),0_0_40px_rgba(34,211,238,0.12)] sm:tracking-[0.12em]">
                    <span>Mega mission</span>
                    <SyndicateHelpMark topic="mega-mission" label="How mega missions work" onOpen={openSyndicateHelp} />
                  </h2>
                  <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75 sm:text-[11px] sm:tracking-[0.26em]">
                    Admin-reviewed payouts · timed visibility
                  </p>
                </div>
                <div className="syndicate-game-header-side syndicate-game-data-slab mt-3 border-amber-400/25 px-3 py-2.5 lg:mt-0 lg:self-stretch lg:border-cyan-400/35 lg:px-3.5 lg:py-3">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-amber-200/95">Protocol</p>
                  <p className="mt-1 max-w-[16rem] text-[11px] font-medium leading-snug text-white/82 sm:text-[12px]">
                    Submit text + optional file. One entry per device per task. Claim after approval.
                  </p>
                </div>
              </header>

              <div className="syndicate-game-briefing mt-4">
                <div className="syndicate-game-briefing__main p-3 sm:p-4 lg:p-5 lg:pr-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-sm bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" aria-hidden />
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--gold)]/88 sm:text-[12px]">
                      Field briefing
                    </p>
                  </div>
                  <h3 className="mt-2 text-[1.1rem] font-black uppercase tracking-[0.08em] text-[#fde68a] [text-shadow:0_0_18px_rgba(255,215,0,0.22)] sm:text-[1.3rem]">
                    Admin review lane
                  </h3>
                  <p className="mt-3 text-[14px] font-medium leading-relaxed text-white/88 sm:text-[15px]">
                    When an admin posts a bonus task, it appears below. Submit your{" "}
                    <span className="font-semibold text-cyan-100">written response</span> and a{" "}
                    <span className="font-semibold text-cyan-100">video</span> (record with your camera or upload a video file) — both are required and visible to staff in Django admin.
                  </p>
                  <ul className="mt-4 grid gap-2.5 text-left sm:gap-3">
                    <li className="flex gap-2 border-l-[3px] border-cyan-400/50 bg-black/25 py-2 pl-3 pr-2 [clip-path:polygon(0_0,100%_0,100%_100%,6px_100%,0_calc(100%-8px))] sm:text-[14px]">
                      <span className="text-[13px] font-medium leading-snug text-white/85 sm:leading-relaxed">
                        One submission per device per task. After approval, use Claim reviewed points.
                      </span>
                    </li>
                    <li className="flex gap-2 border-l-[3px] border-amber-400/55 bg-black/25 py-2 pl-3 pr-2 [clip-path:polygon(0_0,100%_0,100%_100%,6px_100%,0_calc(100%-8px))] sm:text-[14px]">
                      <span className="text-[13px] font-medium leading-snug text-amber-50/95 sm:leading-relaxed">
                        Task visibility uses admin-set hours from post time — submit before the countdown ends.
                      </span>
                    </li>
                  </ul>
                </div>
                <aside className="syndicate-game-briefing__side flex flex-col justify-center gap-1.5 p-3 sm:p-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200/85">Post-review</p>
                  <p className="text-[12px] leading-snug text-cyan-100/88 sm:text-[13px]">Claim buttons appear under each reviewed result.</p>
                  {adminTaskMsg ? <p className="text-[12px] leading-snug text-amber-100/95 sm:text-[13px]">{adminTaskMsg}</p> : null}
                </aside>
              </div>
            </div>

            <div className="syndicate-hud-deck-inner border-t border-cyan-400/12 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
            {visibleAdminTasks.length === 0 ? (
              <div className="syndicate-game-data-slab mx-auto max-w-lg border-amber-400/20 px-4 py-6 text-center sm:px-5 sm:py-8">
                <p className="text-[17px] font-semibold text-[#fef3c7]/95">No bonus tasks right now</p>
                <p className="mt-2 w-full min-w-0 text-[15px] leading-relaxed text-white/70">
                  When an admin creates a task, it will show here. Complete daily missions and check back.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {visibleAdminTasks.map((t) => {
                  const sub = t.submission ?? null;
                  const expiresMs = t.expires_at ? new Date(t.expires_at).getTime() : 0;
                  const leftSec = expiresMs > 0 ? Math.max(0, Math.floor((expiresMs - nowTick) / 1000)) : 0;
                  const submittedLabel =
                    sub?.submitted_at != null
                      ? (() => {
                          try {
                            return new Date(sub.submitted_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short"
                            });
                          } catch {
                            return sub.submitted_at;
                          }
                        })()
                      : null;
                  const fileName = adminTaskFiles[t.id]?.name;
                  const isRecording = !!adminTaskRecording[t.id];
                  const videoAttached = adminTaskAttachmentIsVideo(adminTaskFiles[t.id] ?? null);
                  return (
                    <article
                      key={t.id}
                      className="syndicate-game-ops-card overflow-hidden"
                    >
                      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 sm:px-5 sm:py-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {t.expires_at ? (
                              <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/90">Time left</span>
                                <span className="font-mono text-[16px] font-black tabular-nums text-amber-50 sm:text-lg">
                                  {formatCountdown(leftSec)}
                                </span>
                              </div>
                            ) : null}
                            {t.admin_note ? (
                              <div className="max-w-[100%] rounded-lg border border-fuchsia-300/50 bg-fuchsia-500/15 px-2.5 py-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-100/90">Admin note</span>
                                <p className="mt-0.5 text-[12px] font-semibold leading-snug text-fuchsia-50">{t.admin_note}</p>
                              </div>
                            ) : null}
                            <span className="rounded border border-[rgba(255,215,0,0.5)] bg-[rgba(255,215,0,0.1)] px-2 py-0.5 text-[11px] font-black text-[color:var(--gold)]">
                              {t.points_target} pts
                            </span>
                          </div>
                          <h4 className="mt-2 text-[18px] font-black uppercase leading-tight tracking-[0.05em] text-white sm:text-[20px]">
                            {t.title}
                          </h4>
                        </div>
                      </header>

                      {t.image_url ? (
                        <div className="border-b border-white/10">
                          <div className="aspect-[21/9] max-h-52 w-full overflow-hidden bg-black/50">
                            <img src={t.image_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        </div>
                      ) : null}

                      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
                        <div className="min-w-0 border-b border-white/10 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:border-white/10">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Task instructions</p>
                          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/45 p-4 text-[14px] leading-relaxed text-white/88 [scrollbar-color:rgba(255,255,255,0.25)_transparent] sm:text-[15px] sm:leading-relaxed">
                            <div className="whitespace-pre-wrap break-words">{t.description || "No additional instructions."}</div>
                          </div>
                        </div>

                        <div className="min-w-0 bg-black/25 p-4 sm:p-5">
                          {sub ? (
                            <div className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 p-4 text-[14px] leading-snug text-cyan-100/95">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-200/80">Submission received</p>
                              {submittedLabel ? (
                                <p className="mt-2 font-semibold text-white/95">
                                  {submittedLabel}
                                  {sub.has_attachment ? <span className="text-cyan-200/90"> · Video included</span> : null}
                                </p>
                              ) : null}
                              {typeof sub.elapsed_seconds === "number" && sub.elapsed_seconds > 0 ? (
                                <p className="mt-1 text-[12px] text-cyan-100/82">
                                  Completed in {formatDurationReadable(sub.elapsed_seconds)} ({sub.elapsed_seconds}s)
                                </p>
                              ) : null}
                              <p className="mt-2 text-[13px] text-cyan-100/88">
                                {sub.status === "pending"
                                  ? "Pending admin review."
                                  : sub.status === "reviewed"
                                    ? sub.points_claimed
                                      ? `Approved: +${sub.awarded_points} points claimed.`
                                      : `Approved: +${sub.awarded_points} points.`
                                    : "Reviewed: no points awarded."}
                              </p>
                              {sub.status === "reviewed" && !sub.points_claimed && (sub.awarded_points || 0) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => void claimReviewedAdminPoints()}
                                  className={cn("mt-2 w-full px-3 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                                >
                                  Claim +{sub.awarded_points} points
                                </button>
                              ) : null}
                              {sub.status !== "pending" && sub.reviewed_at ? (
                                <p className="mt-1 text-[12px] text-cyan-100/72">
                                  Reviewed at{" "}
                                  {(() => {
                                    try {
                                      return new Date(sub.reviewed_at).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short"
                                      });
                                    } catch {
                                      return sub.reviewed_at;
                                    }
                                  })()}
                                </p>
                              ) : null}
                              {sub.review_notes ? (
                                <p className="mt-2 rounded-lg border border-white/12 bg-black/25 px-2.5 py-2 text-[12px] leading-snug text-cyan-50/90">
                                  Admin note: {sub.review_notes}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200/85">Your response</p>
                                <p className="mt-1 text-[12px] text-white/55">
                                  <span className="text-emerald-200/90">Text is required</span> (at least 3 characters).{" "}
                                  <span className="text-amber-200/90">A video is required</span> — use Record video or upload MP4/WebM/MOV (max 50MB). Both are sent in one submission.
                                </p>
                              </div>
                              <div>
                                <label className="sr-only" htmlFor={`admin-task-response-${t.id}`}>
                                  Written response
                                </label>
                                <textarea
                                  id={`admin-task-response-${t.id}`}
                                  rows={5}
                                  value={adminTaskDrafts[t.id] ?? ""}
                                  onChange={(e) => setAdminTaskDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                  placeholder="Describe what you did, paste links, or explain how you completed the task…"
                                  className="w-full rounded-xl border border-white/18 bg-black/55 px-3 py-3 text-[15px] leading-relaxed text-white outline-none ring-cyan-400/30 placeholder:text-white/35 focus:border-cyan-400/50 focus:ring-2"
                                />
                              </div>
                              <div className="rounded-xl border border-white/12 bg-black/35 p-3">
                                <label className="block text-[12px] font-semibold text-white/80" htmlFor={`admin-task-file-${t.id}`}>
                                  Video <span className="font-normal text-amber-200/90">(required)</span>{" "}
                                  <span className="font-normal text-white/45">— record or upload</span>
                                </label>
                                <input
                                  id={`admin-task-file-${t.id}`}
                                  type="file"
                                  accept="video/*,.webm,.mp4,.mov,.mkv,.m4v,.ogv,.avi"
                                  className="mt-2 block w-full cursor-pointer text-[13px] text-white/85 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-cyan-500/30 file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-cyan-50 hover:file:bg-cyan-500/40"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0] ?? null;
                                    if (isRecording) stopAdminTaskVideoRecord(t.id);
                                    if (f && !adminTaskAttachmentIsVideo(f)) {
                                      setAdminTaskMsg(
                                        "Mega mission requires a video file. Choose MP4, WebM, MOV, or use Record video."
                                      );
                                      e.target.value = "";
                                      setAdminTaskFiles((prev) => ({ ...prev, [t.id]: null }));
                                      return;
                                    }
                                    setAdminTaskFiles((prev) => ({ ...prev, [t.id]: f }));
                                  }}
                                />
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {!isRecording ? (
                                    <button
                                      type="button"
                                      onClick={() => void startAdminTaskVideoRecord(t.id)}
                                      className="rounded-lg border border-cyan-300/55 bg-cyan-500/18 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-cyan-100 hover:bg-cyan-500/28"
                                    >
                                      Record video
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => stopAdminTaskVideoRecord(t.id)}
                                      className="rounded-lg border border-rose-300/60 bg-rose-500/20 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-rose-100 hover:bg-rose-500/30"
                                    >
                                      Stop recording
                                    </button>
                                  )}
                                  {isRecording ? (
                                    <span className="inline-flex max-w-full flex-col gap-0.5 sm:inline-flex sm:flex-row sm:items-center sm:gap-2">
                                      <span className="inline-flex items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-rose-50">
                                        <span
                                          className="inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-300 shadow-[0_0_10px_rgba(254,205,211,0.9)]"
                                          aria-hidden
                                        />
                                        Recording
                                      </span>
                                      <span className="text-[11px] font-medium leading-snug text-cyan-100/90">
                                        Fullscreen camera is open — use Stop below or in the bar above the form.
                                      </span>
                                    </span>
                                  ) : null}
                                </div>
                                {isRecording ? (
                                  <p className="mt-2 text-[12px] leading-snug text-cyan-200/85">
                                    The live preview uses the full screen so you can see yourself clearly (especially on iPhone). Scroll is locked until you stop.
                                  </p>
                                ) : null}
                                {fileName ? (
                                  <p className="mt-2 text-[12px] text-cyan-200/90">
                                    Selected: {fileName}
                                    {!videoAttached ? (
                                      <span className="ml-2 text-amber-200/95"> — not detected as video; pick a video file or record.</span>
                                    ) : null}
                                  </p>
                                ) : (
                                  <p className="mt-2 text-[11px] text-white/45">
                                    Video only (max 50MB). Shown to admin with your text.
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                disabled={adminTaskBusyId === t.id || isRecording || !videoAttached}
                                title={
                                  !videoAttached
                                    ? "Attach a video (record or upload) before submitting."
                                    : isRecording
                                      ? "Stop recording before submitting."
                                      : undefined
                                }
                                onClick={() => void submitAdminTask(t.id)}
                                className={cn("w-full px-4 py-3 text-[14px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                              >
                                {adminTaskBusyId === t.id ? "Submitting…" : "Submit for admin review"}
                              </button>
                              {!videoAttached && !isRecording ? (
                                <p className="text-center text-[11px] text-amber-200/85">Video required — record or choose a video file above.</p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            </div>
          </section>
          ) : null}

          {!showStatsProfile && syndicateView === "challenges" ? (
          <>
          <section className="syndicate-readable syndicate-missions-hud mt-2 w-full min-w-0 px-0" aria-label="Today's missions board">
            <div className="syndicate-missions-hud__shell max-md:rounded-none max-md:[clip-path:none] max-md:p-px">
              <div className="syndicate-missions-hud__body max-md:[clip-path:none]">
                <header className="syndicate-missions-hud__head">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="syndicate-nav-headline m-0 leading-tight">Today&apos;s missions</h3>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy !== null || userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY}
                        aria-label="Create own mission. Tap the red question mark on this button for what it does, how it works, and the two-per-day limit."
                        onClick={(e) => {
                          const helpEl = (e.target as HTMLElement).closest("[data-custom-mission-help]");
                          if (helpEl) {
                            openSyndicateHelp("custom-mission", helpEl as HTMLElement);
                            return;
                          }
                          setCreateMissionError(null);
                          setCreateMissionModalOpen(true);
                        }}
                        className={cn(
                          "syndicate-nav-action syndicate-nav-action--hud-primary inline-flex min-h-[40px] min-w-0 touch-manipulation items-center justify-center gap-2 px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.06em] sm:min-w-[148px] sm:gap-2.5 sm:px-3.5 sm:py-2.5 sm:text-[11px] sm:tracking-[0.08em]",
                          (busy !== null || userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY) && "pointer-events-none opacity-45"
                        )}
                      >
                        <span className="min-w-0 text-center leading-tight" aria-hidden>
                          Create own mission
                        </span>
                        <span
                          data-custom-mission-help
                          className="inline-flex h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[#ff0000] bg-black/90 text-[9px] font-black leading-none text-[#ff0000] shadow-[0_0_10px_rgba(255,0,0,0.5)] transition hover:scale-105 sm:h-5 sm:w-5 sm:text-[10px]"
                          aria-hidden
                        >
                          ?
                        </span>
                      </button>
                      <span className="syndicate-missions-hud__slots tabular-nums">
                        {userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY
                          ? "Forge locked"
                          : `${MAX_CUSTOM_COMPLETIONS_PER_DAY - userCustomCount} forge slot${MAX_CUSTOM_COMPLETIONS_PER_DAY - userCustomCount === 1 ? "" : "s"}`}
                      </span>
                    </div>
                  </div>
                </header>

                {mounted && createMissionModalOpen && syndicateView === "challenges"
                  ? createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[181] bg-black/60 backdrop-blur-[2px]"
                          onClick={() => {
                            if (busy !== "custom") {
                              setCreateMissionError(null);
                              setCreateMissionModalOpen(false);
                            }
                          }}
                          aria-hidden
                        />
                        <div
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="syndicate-create-mission-title"
                          className="syndicate-mood-context syndicate-readable fixed left-1/2 top-1/2 z-[182] w-[min(calc(100vw-1.25rem),40rem)] max-h-[min(90vh,calc(100dvh-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain shadow-[0_24px_80px_rgba(0,0,0,0.78)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="syndicate-missions-hud__forge m-0 p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <span id="syndicate-create-mission-title" className="syndicate-missions-hud__forge-title">
                                  Create your mission
                                </span>
                                <SyndicateHelpMark
                                  topic="custom-mission"
                                  label="How creating your own mission works"
                                  onOpen={openSyndicateHelp}
                                />
                              </div>
                              <button
                                type="button"
                                disabled={busy === "custom"}
                                onClick={() => {
                                  setCreateMissionError(null);
                                  setCreateMissionModalOpen(false);
                                }}
                                className="shrink-0 rounded-md border border-white/25 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Close
                              </button>
                            </div>
                            {createMissionError ? (
                              <div
                                className="syndicate-readable mt-3 rounded-md border border-[rgba(255,59,59,0.55)] bg-[linear-gradient(180deg,rgba(255,59,59,0.16),rgba(255,59,59,0.08))] px-3 py-2 text-[13px] text-[#ffc9c9]"
                                role="alert"
                              >
                                {createMissionError}
                              </div>
                            ) : null}
                            <p className="syndicate-readable mt-2 max-w-[56rem] text-[13px] leading-relaxed text-white/78 sm:text-[14px]">
                              Up to <strong className="text-[#fde047]/95">two</strong> per day. You set the title; the server fills in{" "}
                              <strong className="text-white/88">random points from 3–5</strong>, description, examples, and benefits, and keeps a short mindset note for your next{" "}
                              <strong className="text-white/88">custom missions</strong> and <strong className="text-white/88">mood + category</strong> picks.
                            </p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <label htmlFor="syndicate-custom-title" className="syndicate-missions-hud__label">
                                  Title
                                </label>
                                <input
                                  id="syndicate-custom-title"
                                  value={customTitle}
                                  onChange={(e) => setCustomTitle(e.target.value)}
                                  maxLength={220}
                                  placeholder="What you want to accomplish today…"
                                  disabled={busy !== null || userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY}
                                  className="syndicate-readable syndicate-missions-hud__input w-full"
                                />
                              </div>
                              <button
                                type="button"
                                disabled={busy !== null || userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY || customTitle.trim().length < 3}
                                onClick={() => void createUserCustomTask()}
                                className="syndicate-readable syndicate-cyber-card__cta w-full min-h-[48px] shrink-0 px-4 py-3 text-[11px] sm:w-auto sm:min-h-[44px] sm:text-[12px]"
                              >
                                {busy === "custom" ? "Creating…" : "Create mission"}
                              </button>
                            </div>
                            <p className="syndicate-readable mt-3 text-[12px] font-medium text-white/62 sm:text-[13px]">
                              {userCustomCount >= MAX_CUSTOM_COMPLETIONS_PER_DAY
                                ? "You’ve used both custom mission slots for today."
                                : `${MAX_CUSTOM_COMPLETIONS_PER_DAY - userCustomCount} custom mission slot${MAX_CUSTOM_COMPLETIONS_PER_DAY - userCustomCount === 1 ? "" : "s"} left today.`}
                            </p>
                          </div>
                        </div>
                      </>,
                      document.body
                    )
                  : null}

                <div className="syndicate-missions-hud-filters syndicate-readable">
                  <div className="flex min-w-0 flex-col">
                    <label htmlFor="syndicate-dashboard-mood" className="syndicate-missions-hud__label">
                      Mood
                    </label>
                    <select
                      id="syndicate-dashboard-mood"
                      value={statsMood}
                      onChange={(e) => setStatsMood(e.target.value)}
                      className={cn(SYNDICATE_SELECT_MOOD, "mt-1.5 w-full min-w-0")}
                      aria-label="Filter missions by mood"
                    >
                      {STATS_MOODS.map((m) => (
                        <option key={m} value={m}>
                          {STATS_MOOD_LABEL[m]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <label htmlFor="syndicate-dashboard-category" className="syndicate-missions-hud__label">
                      Category
                    </label>
                    <select
                      id="syndicate-dashboard-category"
                      value={catFilter}
                      onChange={(e) =>
                        setCatFilter(e.target.value as "all" | (typeof CATEGORIES)[number])
                      }
                      className={cn(SYNDICATE_SELECT_CATEGORY, "mt-1.5 w-full min-w-0")}
                      aria-label="Filter missions by category"
                    >
                      <option value="all">All</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CAT_LABEL[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <label htmlFor="syndicate-dashboard-status" className="syndicate-missions-hud__label">
                      Status
                    </label>
                    <select
                      id="syndicate-dashboard-status"
                      value={doneFilter}
                      onChange={(e) => setDoneFilter(e.target.value as typeof doneFilter)}
                      className={cn(SYNDICATE_SELECT_STATUS, "mt-1.5 w-full min-w-0")}
                      aria-label="Filter missions by completion status"
                    >
                      <option value="all">All</option>
                      <option value="complete">Complete</option>
                      <option value="incomplete">Incomplete</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="syndicate-readable rounded-md border border-[rgba(255,59,59,0.55)] bg-[linear-gradient(180deg,rgba(255,59,59,0.16),rgba(255,59,59,0.08))] px-3 py-2 text-[13px] text-[#ffc9c9]">{error}</div>
          ) : null}

          {busy === "regen" ? (
            <div className="syndicate-readable rounded-md border border-[rgba(255,215,0,0.35)] bg-[rgba(30,22,0,0.3)] px-3 py-2 text-[12px] text-white/60">
              Regenerating today&apos;s missions and applying a fresh &quot;new day&quot; on this browser…
            </div>
          ) : null}
          {busy === "custom" ? (
            <div className="syndicate-readable rounded-md border border-[rgba(120,200,255,0.4)] bg-[rgba(0,25,40,0.45)] px-3 py-2 text-[12px] text-[#a8d8ff]/90">
              Building your mission (description, examples, benefits)…
            </div>
          ) : null}

          {busy === "load" && rows.length === 0 && !error ? (
            <div
              className="syndicate-readable flex flex-col items-center justify-center gap-4 py-16"
              role="status"
              aria-live="polite"
              aria-label="Loading missions"
            >
              <div
                className="h-11 w-11 animate-spin rounded-full border-2 border-[rgba(255,215,0,0.35)] border-t-[color:var(--gold)]"
                aria-hidden
              />
              <p className="text-[14px] text-white/50">Loading missions…</p>
            </div>
          ) : null}

          {dailyBatchStreaming && filteredRows.length === 0 && rows.length > 0 && !error ? (
            <div
              className="syndicate-readable flex flex-col items-center justify-center gap-3 rounded-md border border-[rgba(120,200,255,0.25)] bg-[rgba(0,30,48,0.35)] py-12"
              role="status"
              aria-live="polite"
              aria-label="Loading more missions"
            >
              <div
                className="h-9 w-9 animate-spin rounded-full border-2 border-[rgba(255,215,0,0.35)] border-t-[color:var(--gold)]"
                aria-hidden
              />
              <p className="text-[13px] font-medium text-cyan-100/85">Generating missions…</p>
              <p className="max-w-sm px-4 text-center text-[12px] text-white/50">
                More categories and moods are still loading. This is not your final list.
              </p>
            </div>
          ) : null}

          {!busy && !dailyBatchStreaming && filteredRows.length === 0 && rows.length > 0 ? (
            <div className="syndicate-readable rounded-md border border-white/10 py-8 text-center text-[13px] text-white/50">No missions match these filters.</div>
          ) : null}

          {!busy && !dailyBatchStreaming && rows.length === 0 && !error ? (
            <div className="syndicate-readable rounded-lg border border-white/10 bg-black/35 py-10 text-center text-[13px] text-white/55">
              No missions for today. Check that the API is running, mindsets are ingested on the server, then reload.
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {CATEGORIES.map((cat) => {
              const list = byCategoryFiltered[cat] ?? [];
              if (list.length === 0) return null;
              return (
                <div key={cat}>
                  <h4 className="syndicate-readable mb-3 border-b border-[rgba(255,215,0,0.2)] pb-2 text-[13px] font-bold uppercase tracking-[0.2em] text-[color:var(--gold)]/90">
                    {CAT_LABEL[cat] ?? cat}
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {list.map((row) => (
                      <CompactCard
                        key={row.id}
                        row={row}
                        done={doneIds.has(row.id)}
                        dayCountdownSec={dayCountdownSec}
                        onView={() => openMissionDetail(row)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {(byCategoryFiltered.other ?? []).length > 0 ? (
              <div key="other-cat">
                <h4 className="syndicate-readable mb-3 border-b border-[rgba(255,215,0,0.2)] pb-2 text-[13px] font-bold uppercase tracking-[0.2em] text-white/75">
                  Other
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {(byCategoryFiltered.other ?? []).map((row) => (
                    <CompactCard
                      key={row.id}
                      row={row}
                      done={doneIds.has(row.id)}
                      dayCountdownSec={dayCountdownSec}
                      onView={() => openMissionDetail(row)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="syndicate-readable mt-10 space-y-8">
            <section
              className="rounded-2xl border border-[rgba(255,90,90,0.38)] bg-[linear-gradient(165deg,rgba(40,12,12,0.55),rgba(8,6,6,0.94))] px-4 py-5 sm:px-5"
              aria-label="Missed missions"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[rgba(255,90,90,0.25)] pb-3">
                <div>
                  <h3 className="text-[15px] font-black uppercase tracking-[0.14em] text-rose-200/95 sm:text-[16px]">
                    Missed missions
                  </h3>
                  <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-white/58 sm:text-[13px]">
                    These stayed incomplete after the <strong className="text-white/75">24-hour window</strong> from when each mission appeared. They are saved here and sync with your account when you&apos;re signed in.
                  </p>
                </div>
                <span className="rounded-md border border-rose-400/35 bg-black/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-rose-200/88">
                  {missionsTabMissedSorted.length} stored
                </span>
              </div>
              {missionsTabMissedSorted.length === 0 ? (
                <p className="text-center text-[13px] text-white/48">No missed missions recorded yet.</p>
              ) : (
                <ul className="list-none space-y-3 p-0">
                  {missionsTabMissedSorted.map((e) => {
                    const liveRow = rows.find((r) => missedEntryIdForRow(r) === e.entryId);
                    return (
                      <li
                        key={e.entryId}
                        className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                      >
                        <div className="min-w-0">
                          <div className="text-[14px] font-bold text-white/88">{e.title}</div>
                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] uppercase tracking-[0.08em] text-white/45">
                            <span>{CAT_LABEL[e.category] ?? e.category}</span>
                            <span>·</span>
                            <span>{e.mood}</span>
                            {e.userCreated ? (
                              <>
                                <span>·</span>
                                <span className="text-cyan-200/80">Custom</span>
                              </>
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-[11px] text-rose-200/65">
                            Board closed {formatSyndicateInstant(e.boardExpiredAtIso)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {liveRow ? (
                            <button
                              type="button"
                              onClick={() => openMissionDetail(liveRow)}
                              className={cn("min-h-[40px] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
                            >
                              Open mission
                            </button>
                          ) : (
                            <span className="self-center text-[11px] text-white/40">No longer on device list</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section
              className="rounded-2xl border border-[rgba(0,255,122,0.28)] bg-[linear-gradient(165deg,rgba(8,28,18,0.5),rgba(6,8,8,0.94))] px-4 py-5 sm:px-5"
              aria-label="Completed missions"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[rgba(0,255,122,0.2)] pb-3">
                <div>
                  <h3 className="text-[15px] font-black uppercase tracking-[0.14em] text-emerald-200/95 sm:text-[16px]">
                    Completed missions
                  </h3>
                  <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-white/58 sm:text-[13px]">
                    Finished missions are stored here (and in <strong className="text-white/75">Stats &amp; profile</strong> with full history). New completions appear automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatsProfile(true);
                    setSyndicateView("challenges");
                  }}
                  className="min-h-[40px] shrink-0 rounded-lg border border-emerald-400/40 bg-black/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200/90 hover:bg-black/45"
                >
                  Full history
                </button>
              </div>
              {missionsTabCompletedPreview.length === 0 ? (
                <p className="text-center text-[13px] text-white/48">Complete a mission to build this list.</p>
              ) : (
                <ul className="list-none space-y-3 p-0">
                  {missionsTabCompletedPreview.map((e) => (
                    <li
                      key={e.entryId}
                      className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 sm:px-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="min-w-0 flex-1 text-[14px] font-bold text-white/88">{e.title}</span>
                        <span className="shrink-0 text-[12px] font-black tabular-nums text-emerald-200/90">
                          +{e.awardedPoints} pts
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-white/48">
                        {formatMissionCompletionTime(e)} · {CAT_LABEL[e.category] ?? e.category} · {e.mood}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {missionsTabReminders.length > 0 ? (
            <div className="syndicate-readable mt-8 flex flex-col gap-3 rounded-xl border border-[rgba(250,204,21,0.35)] bg-[linear-gradient(165deg,rgba(32,26,10,0.65),rgba(8,8,10,0.92))] px-4 py-4 [box-shadow:0_0_24px_rgba(250,204,21,0.08)] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[14px] text-white/82">
                <span className="font-black tabular-nums text-[color:var(--gold)]">{missionsTabReminders.length}</span> mission reminder
                {missionsTabReminders.length === 1 ? "" : "s"} — open the full list to manage them.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowStatsProfile(false);
                  setSyndicateView("reminders");
                }}
                className={cn("min-h-[44px] shrink-0 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em]", CTA_BTN)}
              >
                See all your reminders
              </button>
            </div>
          ) : null}
          </>
          ) : !showStatsProfile && syndicateView === "reminders" ? (
          <>
            <div className="syndicate-readable mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="syndicate-readable text-[21px] font-black uppercase tracking-[0.1em] text-[color:var(--gold)] sm:text-[24px]">
                Your mission reminders
              </h3>
              <button
                type="button"
                onClick={() => setSyndicateView("dashboard")}
                className="rounded-lg border border-white/25 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white/85 hover:bg-white/5"
              >
                Back to dashboard
              </button>
            </div>
            <p className="syndicate-readable mb-3 max-w-3xl text-[13px] leading-relaxed text-white/70 sm:mb-4 sm:text-[14px]">
              Set date &amp; time under <span className="text-white/85">How will you complete it</span> on an incomplete mission. Reminders stay until the target time or you clear them.
              Within 24 hours of the mission appearing, use <span className="font-semibold text-cyan-200/90">Open mission</span>; after that, use{" "}
              <span className="font-semibold text-cyan-200/90">Done</span> or <span className="font-semibold text-cyan-200/90">Dismiss</span>. If the target passes with no action, the server may deduct{" "}
              <span className="font-semibold text-amber-200/90">1 point</span> and remove the reminder.
            </p>
            {missionsTabReminders.length === 0 ? (
              <p className="syndicate-readable rounded-lg border border-white/10 bg-black/30 px-4 py-8 text-center text-[14px] text-white/55">
                No active reminders. Add one from any incomplete mission&apos;s detail view.
              </p>
            ) : (
              <>
                <div className="syndicate-readable mb-3 flex flex-col gap-3 rounded-xl border border-[rgba(250,204,21,0.22)] bg-black/30 px-3 py-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 sm:px-4">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--gold)]/85" htmlFor="syndicate-reminder-sort">
                      Sort by when set
                    </label>
                    <select
                      id="syndicate-reminder-sort"
                      value={reminderPageSort}
                      onChange={(e) => setReminderPageSort(e.target.value === "oldest" ? "oldest" : "newest")}
                      className={cn(
                        SYNDICATE_DATE_INPUT,
                        "max-w-full text-[14px] text-white [color-scheme:dark] sm:max-w-[16rem]"
                      )}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5 sm:items-end">
                    <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--gold)]/85" htmlFor="syndicate-reminder-day-filter">
                      Added on date
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        id="syndicate-reminder-day-filter"
                        type="date"
                        value={reminderFilterDate}
                        onChange={(e) => setReminderFilterDate(e.target.value)}
                        className={cn(SYNDICATE_DATE_INPUT, "text-[14px] text-white [color-scheme:dark]")}
                      />
                      {reminderFilterDate ? (
                        <button
                          type="button"
                          onClick={() => setReminderFilterDate("")}
                          className="min-h-[40px] shrink-0 rounded-md border border-white/20 px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-white/80 hover:bg-white/10"
                        >
                          Clear date
                        </button>
                      ) : null}
                    </div>
                    <p className="max-w-md text-[11px] leading-snug text-white/45 sm:text-right">
                      Matches the day you saved the reminder. Older entries without that use the reminder&apos;s target day.
                    </p>
                  </div>
                </div>
                {remindersPageSortedFiltered.length === 0 ? (
                  <p className="syndicate-readable rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-8 text-center text-[14px] text-amber-100/90">
                    No reminders for this date. Try another day or{" "}
                    <button
                      type="button"
                      onClick={() => setReminderFilterDate("")}
                      className="syndicate-link-skip font-semibold text-cyan-200 underline-offset-2 hover:underline"
                    >
                      clear the date filter
                    </button>
                    .
                  </p>
                ) : (
                  <section
                    className="syndicate-readable w-full min-w-0 rounded-2xl border border-[rgba(250,204,21,0.38)] bg-[linear-gradient(165deg,rgba(32,26,10,0.72),rgba(6,6,10,0.96))] px-3 py-5 [box-shadow:0_0_0_1px_rgba(250,204,21,0.12),0_8px_36px_rgba(0,0,0,0.45),0_0_28px_rgba(250,204,21,0.08)] sm:px-5 sm:py-6"
                    aria-label="All mission reminders"
                  >
                    {reminderFilterDate ? (
                      <p className="mb-4 text-[12px] text-white/55">
                        Showing{" "}
                        <span className="font-semibold tabular-nums text-cyan-200/95">{remindersPageSortedFiltered.length}</span> of{" "}
                        <span className="tabular-nums text-white/75">{missionsTabReminders.length}</span>
                      </p>
                    ) : null}
                    <ul className="list-none space-y-4 p-0">
                      {remindersPageSortedFiltered.map((item) => (
                        <MissionReminderCard
                          key={`all-rem-${item.id}`}
                          item={item}
                          nowTick={nowTick}
                          rows={rows}
                          onOpenMission={openMissionDetail}
                          onDismiss={dismissMissionReminder}
                        />
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </>
          ) : null}
        </>
      
    </div>
    </>
  );
}

