"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { portalFetch } from "@/lib/portal-api";
import {
  DeckListItem,
  DeckListToolbar,
  DueDateLine,
  type DeckSortDir,
  filterBySearch,
  MissionStatusBadge
} from "./DeckListPrimitives";
import { DeckBrowseDateBar, DeckDateField, DeckTimeField } from "./DeckDateTimePickers";
import { missionLocalDay, noteLocalDay, toYyyyMmDd } from "./deck-date-utils";
import { playDeckAlarmSound, unlockDeckAlarmAudio } from "@/lib/deck-alarm-sound";
import toast from "react-hot-toast";
import { Card, cn, type ThemeMode } from "./dashboardPrimitives";

function localDateAndTimeToIso(dateStr: string, timeStr: string): string | null {
  if (!dateStr?.trim() || !timeStr?.trim()) return null;
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const d = new Date(`${dateStr}T${t}`);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

const LS_MISSIONS = "dashboarded:deck-missions";
const LS_REMINDERS = "dashboarded:deck-reminders";
const LS_NOTES = "dashboarded:deck-notes";

type MissionRow = {
  id: string;
  title: string;
  targetIso: string;
  points: number;
  status: "active" | "missed" | "done";
};

type ReminderRow = {
  id: string;
  title: string;
  date: string;
  time: string;
  status: "active" | "completed";
};

type NoteRow = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

/** Session-scoped cache so reopening the ops deck paints lists before the portal round-trip (not cookies — larger quota, no extra HTTP). */
const SS_PORTAL_DECK_CACHE = "dashboarded:portal-deck-cache-v1";

type PortalDeckCachePayload = {
  missions: MissionRow[];
  reminders: ReminderRow[];
  notes: NoteRow[];
};

function readPortalDeckCache(): PortalDeckCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SS_PORTAL_DECK_CACHE);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<PortalDeckCachePayload>;
    if (!Array.isArray(o.missions) || !Array.isArray(o.reminders) || !Array.isArray(o.notes)) return null;
    return { missions: o.missions, reminders: o.reminders, notes: o.notes };
  } catch {
    return null;
  }
}

function writePortalDeckCache(m: MissionRow[], r: ReminderRow[], n: NoteRow[]) {
  try {
    const payload: PortalDeckCachePayload = { missions: m, reminders: r, notes: n };
    sessionStorage.setItem(SS_PORTAL_DECK_CACHE, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

type ApiMission = { id: number; title: string; target_at: string; points: number; status: string };
type ApiReminder = { id: number; title: string; date: string; time: string; points: number; status: string };
type ApiNote = { id: number; title: string; body: string; created_at: string };
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function mapMission(m: ApiMission): MissionRow {
  return {
    id: String(m.id),
    title: m.title,
    targetIso: m.target_at,
    points: m.points,
    status: m.status as MissionRow["status"]
  };
}

function mapReminder(r: ApiReminder): ReminderRow {
  const t = r.time?.length >= 5 ? r.time.slice(0, 5) : r.time;
  return {
    id: String(r.id),
    title: r.title,
    date: r.date,
    time: t,
    status: r.status as ReminderRow["status"]
  };
}

function mapNote(n: ApiNote): NoteRow {
  return {
    id: String(n.id),
    title: n.title,
    body: n.body ?? "",
    createdAt: new Date(n.created_at).getTime()
  };
}

function timeForApi(t: string) {
  if (t.length === 5) return `${t}:00`;
  return t;
}

/** Points still sent to API / stored locally when the field is hidden from UI */
const DEFAULT_MISSION_POINTS = 10;

/** Offsets before mission target — auto reminder rows (local wall time). */
const MISSION_AUTO_REMINDER_OFFSETS: ReadonlyArray<{ label: string; ms: number }> = [
  { label: "1 week before", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "3 days before", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "24 hours before", ms: 24 * 60 * 60 * 1000 },
  { label: "12 hours before", ms: 12 * 60 * 60 * 1000 },
  { label: "6 hours before", ms: 6 * 60 * 60 * 1000 },
  { label: "1 hour before", ms: 60 * 60 * 1000 },
  { label: "30 minutes before", ms: 30 * 60 * 1000 }
];

function localWallDateTimeFromInstant(instantMs: number): { date: string; time: string } | null {
  const d = new Date(instantMs);
  if (!Number.isFinite(d.getTime())) return null;
  const date = toYyyyMmDd(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { date, time: `${hh}:${mm}` };
}

/** Future reminder slots only; skips offsets already in the past. */
function buildMissionAutoReminderPayloads(
  missionTitle: string,
  targetIso: string
): Array<{ title: string; date: string; time: string }> {
  const targetMs = new Date(targetIso).getTime();
  if (!Number.isFinite(targetMs)) return [];
  const now = Date.now();
  const rows: Array<{ title: string; date: string; time: string }> = [];
  for (const { label, ms } of MISSION_AUTO_REMINDER_OFFSETS) {
    const at = targetMs - ms;
    if (at <= now) continue;
    const parts = localWallDateTimeFromInstant(at);
    if (!parts?.date || !parts.time) continue;
    rows.push({ title: `${missionTitle} (${label})`, date: parts.date, time: parts.time });
  }
  return rows;
}

/** Local scheduled instant for a reminder row (date + time). */
function reminderDueMs(r: ReminderRow): number {
  const tp = r.time.length === 5 ? `${r.time}:00` : r.time;
  const ms = new Date(`${r.date}T${tp}`).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

/** Advance reminder schedule by N minutes (keeps local YYYY-MM-DD + wall time). */
function addMinutesToReminderDateTime(dateStr: string, timeStr: string, minutes: number): { date: string; time: string } {
  const tp = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const d = new Date(`${dateStr}T${tp}`);
  if (!Number.isFinite(d.getTime())) return { date: dateStr, time: timeStr.length === 5 ? `${timeStr}:00` : timeStr };
  d.setMinutes(d.getMinutes() + minutes);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}:${ss}` };
}

function formatReminderTimeDisplay(time: string) {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function isoToLocalDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return { date: "", time: "" };
  const date = toYyyyMmDd(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { date, time: `${hh}:${mm}` };
}

function addMinutesToIso(iso: string, minutes: number): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

type DeckTimeEditTarget =
  | { kind: "reminder"; id: string; title: string; date: string; time: string }
  | { kind: "mission"; id: string; title: string; targetIso: string };

const DECK_NOTES_OUTER =
  "relative w-full min-w-0 shrink-0 overflow-hidden rounded-xl p-[2px] shadow-[0_0_40px_rgba(217,70,239,0.12),0_0_56px_rgba(255,215,0,0.08),0_0_72px_rgba(52,211,153,0.1)]";
const DECK_NOTES_INNER =
  "relative min-w-0 overflow-hidden rounded-[11px] border border-white/10 bg-[#060606]/88 p-[var(--fluid-deck-p)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[10px]";

function DeckGlowNotes() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.88] [background:radial-gradient(720px_300px_at_18%_0%,rgba(217,70,239,0.12),rgba(0,0,0,0)_58%),radial-gradient(640px_280px_at_88%_20%,rgba(52,211,153,0.1),rgba(0,0,0,0)_55%),radial-gradient(520px_240px_at_50%_100%,rgba(255,215,0,0.08),rgba(0,0,0,0)_52%)]"
      aria-hidden
    />
  );
}

const SCROLL_GOLD =
  "[scrollbar-color:rgba(255,215,0,0.45)_rgba(0,0,0,0.35)]";

const SCROLL_EMERALD =
  "[scrollbar-color:rgba(52,211,153,0.45)_rgba(0,0,0,0.35)]";

const SCROLL_ROSE =
  "[scrollbar-color:rgba(251,113,133,0.45)_rgba(0,0,0,0.35)]";

const SCROLL_FUCHSIA =
  "[scrollbar-color:rgba(217,70,239,0.45)_rgba(0,0,0,0.35)]";

const MISSION_PAGE_SIZE = 5;

/** Missions list body: compact when empty; grows with rows; scroll cap unchanged. */
function missionListScrollClass(displayedCount: number, scrollbarClass: string) {
  return cn(
    "mt-2 space-y-[clamp(0.4rem,1vw+0.15rem,0.65rem)] overflow-x-hidden py-1 pr-[clamp(0.25rem,0.8vw+0.1rem,0.45rem)]",
    scrollbarClass,
    displayedCount === 0
      ? "min-h-0 max-h-none overflow-visible"
      : cn(
          "overflow-y-auto max-h-[min(68vh,720px)]",
          displayedCount <= 1 && "min-h-[7.25rem]",
          displayedCount === 2 && "min-h-[10rem]",
          displayedCount >= 3 && "min-h-[min(12.5rem,24vh)]",
        ),
  );
}

function MissionBucketPagination({
  page,
  total,
  onPageChange,
  accent
}: {
  page: number;
  total: number;
  onPageChange: (next: number) => void;
  accent: "gold" | "cyan" | "rose" | "emerald" | "fuchsia";
}) {
  const pages = Math.max(1, Math.ceil(total / MISSION_PAGE_SIZE));
  if (total <= MISSION_PAGE_SIZE) return null;
  const btn =
    accent === "gold"
      ? "border-[color:var(--goals-milestones-line)] bg-black/50 text-[color:var(--goals-milestones-gold)] hover:border-[rgba(255,235,160,0.65)] hover:shadow-[0_0_16px_rgba(255,200,0,0.22)] disabled:opacity-35"
      : accent === "cyan"
        ? "border-cyan-400/45 bg-black/50 text-cyan-100 hover:border-cyan-300/70 hover:shadow-[0_0_16px_rgba(34,211,238,0.25)] disabled:opacity-35"
        : accent === "rose"
          ? "border-rose-400/45 bg-black/50 text-rose-100 hover:border-rose-300/70 hover:shadow-[0_0_16px_rgba(251,113,133,0.22)] disabled:opacity-35"
          : accent === "fuchsia"
            ? "border-fuchsia-400/45 bg-black/50 text-fuchsia-100 hover:border-fuchsia-300/70 hover:shadow-[0_0_16px_rgba(217,70,239,0.22)] disabled:opacity-35"
            : "border-emerald-400/45 bg-black/50 text-emerald-100 hover:border-emerald-300/70 hover:shadow-[0_0_16px_rgba(52,211,153,0.22)] disabled:opacity-35";
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] font-semibold normal-case tracking-normal text-neutral-300/95">
      <span className="tabular-nums">
        {total} total · page {page + 1} / {pages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            "rounded-lg px-3 py-2 text-[11px] font-semibold tracking-normal transition motion-safe:duration-200",
            btn,
          )}
        >
          Prev
        </button>
        <button
          type="button"
          disabled={page >= pages - 1}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            "rounded-lg px-3 py-2 text-[11px] font-semibold tracking-normal transition motion-safe:duration-200",
            btn,
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const FORM_SHELL =
  "mt-[clamp(0.65rem,1.5vw+0.2rem,1.35rem)] space-y-[clamp(0.4rem,1vw+0.15rem,0.75rem)] rounded-xl border border-[rgba(255,215,0,0.22)] bg-black/50 p-[var(--fluid-deck-form-p)] shadow-[0_10px_36px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,215,0,0.1),inset_0_1px_0_rgba(255,215,0,0.08)]";

const FORM_MISSIONS =
  "mt-[clamp(0.65rem,1.5vw+0.2rem,1.35rem)] space-y-[clamp(0.4rem,1vw+0.15rem,0.75rem)] rounded-xl border-2 border-[rgba(255,215,0,0.42)] bg-gradient-to-br from-[rgba(255,215,0,0.08)] to-black/55 p-[var(--fluid-deck-form-p)] shadow-[0_0_28px_rgba(255,200,0,0.12),inset_0_1px_0_rgba(255,235,160,0.06)]";

/** Inner list panels — per-column neon */
const DECK_SUBPANEL_ACTIVE =
  "min-w-0 rounded-xl border-2 border-[color:var(--goals-milestones-line)] bg-[#060606]/75 p-3 shadow-[0_0_36px_rgba(255,200,0,0.14),inset_0_1px_0_rgba(255,215,0,0.08)] md:p-4";
const DECK_SUBPANEL_MISSED =
  "min-w-0 rounded-xl border-2 border-rose-400/42 bg-[#060606]/75 p-3 shadow-[0_0_36px_rgba(251,113,133,0.12),inset_0_1px_0_rgba(251,113,133,0.05)] md:p-4";
const DECK_SUBPANEL_DONE =
  "min-w-0 rounded-xl border-2 border-emerald-400/42 bg-[#060606]/75 p-3 shadow-[0_0_36px_rgba(52,211,153,0.12),inset_0_1px_0_rgba(52,211,153,0.05)] md:p-4";

const DECK_TITLE_ACTIVE =
  "text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--goals-milestones-gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.35)] md:text-[11px]";
const DECK_TITLE_MISSED =
  "text-[10px] font-black uppercase tracking-[0.16em] text-rose-200/95 [text-shadow:0_0_14px_rgba(251,113,133,0.32)] md:text-[11px]";
const DECK_TITLE_DONE =
  "text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200/95 [text-shadow:0_0_14px_rgba(52,211,153,0.32)] md:text-[11px]";

const FORM_NOTES =
  "mt-[clamp(0.65rem,1.5vw+0.2rem,1.35rem)] space-y-[clamp(0.4rem,1vw+0.15rem,0.75rem)] rounded-xl border-2 border-fuchsia-400/38 bg-gradient-to-br from-fuchsia-950/15 to-black/55 p-[var(--fluid-deck-form-p)] shadow-[0_0_24px_rgba(217,70,239,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]";

const DECK_SUBPANEL_NOTES_LIB =
  "flex min-h-0 min-w-0 flex-col rounded-xl border-2 border-fuchsia-400/38 bg-[#060606]/78 shadow-[0_0_28px_rgba(217,70,239,0.12),inset_0_1px_0_rgba(217,70,239,0.06)] lg:min-h-0 lg:flex-1";
const DECK_SUBPANEL_NOTES_READER =
  "flex min-h-0 min-w-0 flex-col rounded-xl border-2 border-emerald-400/36 bg-[#050a08]/80 shadow-[0_0_28px_rgba(52,211,153,0.1),inset_0_1px_0_rgba(52,211,153,0.06)] lg:min-h-0 lg:flex-1";

/** Primary row actions: 40px+ hit area, neon focus ring (keyboard). */
const DECK_ROW_BTN_PRIMARY =
  "inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]";

const DECK_ROW_BTN_SECONDARY =
  "inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]";

/** Compact actions for top-bar due toasts (navbar strip). */
const DECK_TOAST_BTN =
  "inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] transition motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]";

const DECK_DUE_TOAST_WRAP =
  "w-full max-w-full rounded-md border border-red-500/60 bg-[#0a0505]/96 px-2 py-2 sm:px-3 sm:py-2.5 min-h-[2.7rem] sm:min-h-[3.1rem] md:min-h-[3.35rem] shadow-[0_0_0_1px_rgba(255,215,0,0.42),inset_0_0_0_1px_rgba(239,68,68,0.35),0_10px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(239,68,68,0.14)] sm:flex sm:items-center sm:gap-2";

/** Single navbar slot for reminders: fixed height, one at a time (new replaces previous). */
const REMINDER_NAV_SLOT_ID = "deck-reminder-due-slot";
/** Navbar strip auto-dismiss + same as Snooze 10m if user does not act. */
const REMINDER_NAV_AUTO_SNOOZE_MS = 60 * 1000;
const TOAST_DURATION_LONG_MS = 7 * 24 * 60 * 60 * 1000;

function bucketMissions(missions: MissionRow[]) {
  const now = Date.now();
  const active: MissionRow[] = [];
  const missed: MissionRow[] = [];
  const done: MissionRow[] = [];
  for (const m of missions) {
    if (m.status === "done") {
      done.push(m);
      continue;
    }
    if (m.status === "missed") {
      missed.push(m);
      continue;
    }
    if (m.status === "active") {
      const due = new Date(m.targetIso).getTime();
      if (Number.isFinite(due) && due < now) missed.push(m);
      else active.push(m);
    }
  }
  return { active, missed, done };
}

type DeckEmptyCtaTone = "gold" | "cyan" | "rose" | "emerald";

const DECK_EMPTY_CTA_BTN: Record<
  DeckEmptyCtaTone,
  string
> = {
  gold:
    "border-white/18 bg-black/50 text-white/90 shadow-[0_3px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-[rgba(255,215,0,0.45)] hover:bg-black/60 focus-visible:ring-[rgba(255,215,0,0.45)]",
  cyan:
    "border-cyan-400/55 bg-cyan-950/35 text-cyan-50 shadow-[0_3px_0_rgba(0,0,0,0.35),0_0_18px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(34,211,238,0.12)] hover:border-cyan-300/75 hover:bg-cyan-950/50 focus-visible:ring-cyan-400/50",
  rose:
    "border-rose-400/55 bg-rose-950/30 text-rose-50 shadow-[0_3px_0_rgba(0,0,0,0.35),0_0_18px_rgba(251,113,133,0.14),inset_0_1px_0_rgba(251,113,133,0.1)] hover:border-rose-300/75 hover:bg-rose-950/45 focus-visible:ring-rose-400/50",
  emerald:
    "border-emerald-400/55 bg-emerald-950/28 text-emerald-50 shadow-[0_3px_0_rgba(0,0,0,0.35),0_0_18px_rgba(52,211,153,0.14),inset_0_1px_0_rgba(52,211,153,0.1)] hover:border-emerald-300/75 hover:bg-emerald-950/42 focus-visible:ring-emerald-400/50"
};

const DECK_EMPTY_CTA_MSG: Record<DeckEmptyCtaTone, string> = {
  gold: "text-neutral-200/92",
  cyan: "text-cyan-100/88",
  rose: "text-rose-100/88",
  emerald: "text-emerald-100/88"
};

function DeckEmptyCta({
  message,
  actionLabel,
  onAction,
  accentClass,
  ctaTone = "gold"
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
  accentClass: string;
  ctaTone?: DeckEmptyCtaTone;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed px-4 py-6 text-center",
        accentClass
      )}
    >
      <p className={cn("text-[14px] font-medium leading-relaxed", DECK_EMPTY_CTA_MSG[ctaTone])}>{message}</p>
      <button
        type="button"
        onClick={onAction}
        className={cn(
          "mt-4 inline-flex min-h-[44px] w-full max-w-[16rem] items-center justify-center rounded-lg px-4 text-[11px] font-black uppercase tracking-[0.18em] transition motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]",
          DECK_EMPTY_CTA_BTN[ctaTone]
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function MissionCommandDeckCard({
  themeMode,
  layoutVariant = "embedded"
}: {
  themeMode: ThemeMode;
  /** `fullscreen`: opened from mobile viewport overlay — tighter chrome, no hover lift. */
  layoutVariant?: "embedded" | "fullscreen";
}) {
  const { user, loading: authLoading, can } = useAuth();

  const useApiDeck =
    !authLoading && !!user && (can("deck.view") || can("deck.manage") || can("*"));
  const canDeckWrite = can("deck.manage") || can("*");
  const deckInit = useMemo((): PortalDeckCachePayload => {
    return readPortalDeckCache() ?? { missions: [], reminders: [], notes: [] };
  }, []);
  const [missions, setMissions] = useState<MissionRow[]>(() => deckInit.missions);
  const [reminders, setReminders] = useState<ReminderRow[]>(() => deckInit.reminders);
  const [notes, setNotes] = useState<NoteRow[]>(() => deckInit.notes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  const [mSearchA, setMSearchA] = useState("");
  const [mSearchM, setMSearchM] = useState("");
  const [mSearchC, setMSearchC] = useState("");
  const [mSortA, setMSortA] = useState<DeckSortDir>("asc");
  const [mSortM, setMSortM] = useState<DeckSortDir>("desc");
  const [mSortC, setMSortC] = useState<DeckSortDir>("desc");

  const [missionsHelpOpen, setMissionsHelpOpen] = useState(false);
  const [missionPageActive, setMissionPageActive] = useState(0);
  const [missionPageMissed, setMissionPageMissed] = useState(0);
  const [missionPageDone, setMissionPageDone] = useState(0);
  const [notePage, setNotePage] = useState(0);

  const [nSearch, setNSearch] = useState("");
  const [nSort, setNSort] = useState<DeckSortDir>("desc");

  const [mTitle, setMTitle] = useState("");
  const [mDate, setMDate] = useState("");
  const [mTime, setMTime] = useState("");

  const [nTitle, setNTitle] = useState("");
  const [nBody, setNBody] = useState("");

  const missionTitleInputRef = useRef<HTMLInputElement>(null);
  const noteTitleInputRef = useRef<HTMLInputElement>(null);

  /** Filter all deck lists to this calendar day (local). Null = show everything. */
  const [browseDate, setBrowseDate] = useState<string | null>(null);

  const remindersRef = useRef<ReminderRow[]>(reminders);
  remindersRef.current = reminders;
  const missionsRef = useRef<MissionRow[]>(missions);
  missionsRef.current = missions;
  /** One toast per reminder *schedule* until snooze/complete clears it. */
  const reminderToastKeysRef = useRef<Set<string>>(new Set());
  /** One toast per mission *target* until snooze/complete clears it. */
  const missionToastKeysRef = useRef<Set<string>>(new Set());

  /** Reminder navbar slot: one visible due at a time; same id replaces content. */
  const lastReminderNavSlotKeyRef = useRef<string | null>(null);
  const reminderNavSlotTargetIdRef = useRef<string | null>(null);
  /** True after user snoozes, edits time, or completes — stops auto-snooze. */
  const reminderUserAcknowledgedRef = useRef(false);
  const reminderNavAutoTimeoutRef = useRef<number | null>(null);

  const [timeEdit, setTimeEdit] = useState<DeckTimeEditTarget | null>(null);
  const [timeEditDate, setTimeEditDate] = useState("");
  const [timeEditTime, setTimeEditTime] = useState("");

  const scrollComposerIntoView = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const smooth =
      typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
  }, []);

  const focusMissionComposer = useCallback(() => {
    scrollComposerIntoView("deck-mission-compose");
    window.setTimeout(() => missionTitleInputRef.current?.focus(), 200);
  }, [scrollComposerIntoView]);

  const focusNoteComposer = useCallback(() => {
    scrollComposerIntoView("deck-note-compose");
    window.setTimeout(() => noteTitleInputRef.current?.focus(), 200);
  }, [scrollComposerIntoView]);

  const refreshPortal = useCallback(async () => {
    if (!user || !useApiDeck) return;
    setPortalBusy(true);
    setPortalError(null);
    try {
      const [mRes, rRes, nRes] = await Promise.all([
        portalFetch<unknown>(`/api/portal/missions/`),
        portalFetch<unknown>(`/api/portal/reminders/`),
        portalFetch<unknown>(`/api/portal/notes/`)
      ]);

      let mList = (mRes.ok && Array.isArray(mRes.data) ? mRes.data : []) as ApiMission[];
      if (canDeckWrite && mList.length) {
        const now = Date.now();
        const overdue = mList.filter(
          (x) => x.status === "active" && new Date(x.target_at).getTime() < now
        );
        if (overdue.length) {
          await Promise.all(
            overdue.map((x) =>
              portalFetch(`/api/portal/missions/${x.id}/`, {
                method: "PATCH",
                body: JSON.stringify({ status: "missed" })
              })
            )
          );
          const again = await portalFetch<unknown>(`/api/portal/missions/`);
          if (again.ok && Array.isArray(again.data)) mList = again.data as ApiMission[];
        }
      }
      const mappedM = mList.map(mapMission);
      const rList = (rRes.ok && Array.isArray(rRes.data) ? rRes.data : []) as ApiReminder[];
      const mappedR = rList.map(mapReminder);
      const nList = (nRes.ok && Array.isArray(nRes.data) ? nRes.data : []) as ApiNote[];
      const mappedN = nList.map(mapNote).sort((a, b) => b.createdAt - a.createdAt);
      setMissions(mappedM);
      setReminders(mappedR);
      setNotes(mappedN);
      writePortalDeckCache(mappedM, mappedR, mappedN);
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Portal sync failed");
    } finally {
      setPortalBusy(false);
    }
  }, [user, useApiDeck, canDeckWrite]);

  const hydrateLocal = useCallback(() => {
    let m = safeParse<MissionRow[]>(window.localStorage.getItem(LS_MISSIONS), []);
    const now = Date.now();
    m = m.map((row) => {
      if (row.status !== "active") return row;
      const due = new Date(row.targetIso).getTime();
      if (Number.isFinite(due) && due < now) return { ...row, status: "missed" as const };
      return row;
    });
    setMissions(m);
    window.localStorage.setItem(LS_MISSIONS, JSON.stringify(m));

    setReminders(safeParse<ReminderRow[]>(window.localStorage.getItem(LS_REMINDERS), []));
    const n = safeParse<NoteRow[]>(window.localStorage.getItem(LS_NOTES), []);
    n.sort((a, b) => b.createdAt - a.createdAt);
    setNotes(n);
  }, []);

  useEffect(() => {
    if (useApiDeck) {
      void refreshPortal();
    } else if (!authLoading) {
      hydrateLocal();
    }
  }, [useApiDeck, authLoading, refreshPortal, hydrateLocal]);

  useEffect(() => {
    if (useApiDeck) return;
    writePortalDeckCache(missions, reminders, notes);
  }, [useApiDeck, missions, reminders, notes]);

  const persistMissions = useCallback((next: MissionRow[]) => {
    setMissions(next);
    window.localStorage.setItem(LS_MISSIONS, JSON.stringify(next));
  }, []);

  const persistReminders = useCallback((next: ReminderRow[]) => {
    setReminders(next);
    window.localStorage.setItem(LS_REMINDERS, JSON.stringify(next));
  }, []);

  /** Creates portal or local reminder rows leading up to a mission target (no UI). */
  const postAutoRemindersForMission = useCallback(
    async (missionTitle: string, targetIso: string) => {
      const payloads = buildMissionAutoReminderPayloads(missionTitle, targetIso);
      if (payloads.length === 0) return;
      if (useApiDeck && canDeckWrite) {
        for (const p of payloads) {
          const res = await portalFetch(`/api/portal/reminders/`, {
            method: "POST",
            body: JSON.stringify({
              title: p.title,
              date: p.date,
              time: timeForApi(p.time),
              points: 0,
              status: "active"
            })
          });
          if (!res.ok) {
            setPortalError("Could not create automatic mission reminder");
            return;
          }
        }
      } else {
        const nextRows: ReminderRow[] = payloads.map((p) => ({
          id: uid(),
          title: p.title,
          date: p.date,
          time: p.time,
          status: "active"
        }));
        persistReminders([...nextRows, ...remindersRef.current]);
      }
    },
    [useApiDeck, canDeckWrite, persistReminders]
  );

  const persistNotes = useCallback((next: NoteRow[]) => {
    const sorted = [...next].sort((a, b) => b.createdAt - a.createdAt);
    setNotes(sorted);
    window.localStorage.setItem(LS_NOTES, JSON.stringify(sorted));
  }, []);

  const clearReminderNavAutoTimeout = useCallback(() => {
    if (reminderNavAutoTimeoutRef.current != null) {
      window.clearTimeout(reminderNavAutoTimeoutRef.current);
      reminderNavAutoTimeoutRef.current = null;
    }
  }, []);

  const clearReminderToastKeysForId = useCallback(
    (id: string) => {
      const s = reminderToastKeysRef.current;
      for (const k of [...s]) {
        if (k.startsWith(`${id}|`)) s.delete(k);
      }
      if (reminderNavSlotTargetIdRef.current === id) {
        reminderUserAcknowledgedRef.current = true;
        clearReminderNavAutoTimeout();
        reminderNavSlotTargetIdRef.current = null;
        lastReminderNavSlotKeyRef.current = null;
        toast.dismiss(REMINDER_NAV_SLOT_ID);
      }
    },
    [clearReminderNavAutoTimeout]
  );

  const clearMissionToastKeysForId = useCallback((id: string) => {
    const s = missionToastKeysRef.current;
    for (const k of [...s]) {
      if (k.startsWith(`${id}|`)) s.delete(k);
    }
    toast.dismiss(`mission-due-${id}`);
  }, []);

  useEffect(() => {
    if (!timeEdit) return;
    if (timeEdit.kind === "reminder") {
      setTimeEditDate(timeEdit.date);
      setTimeEditTime(timeEdit.time.length >= 5 ? timeEdit.time.slice(0, 5) : timeEdit.time);
    } else {
      const { date, time } = isoToLocalDateTime(timeEdit.targetIso);
      setTimeEditDate(date);
      setTimeEditTime(time);
    }
  }, [timeEdit]);

  const patchReminder = useCallback(
    async (id: string, patch: Partial<Pick<ReminderRow, "status" | "date" | "time">>) => {
      if (useApiDeck && canDeckWrite) {
        const body: Record<string, unknown> = {};
        if (patch.status !== undefined) body.status = patch.status;
        if (patch.date !== undefined) body.date = patch.date;
        if (patch.time !== undefined) body.time = typeof patch.time === "string" && patch.time.length === 5 ? `${patch.time}:00` : patch.time;
        const res = await portalFetch(`/api/portal/reminders/${id}/`, {
          method: "PATCH",
          body: JSON.stringify(body)
        });
        if (!res.ok) setPortalError("Could not update reminder");
        await refreshPortal();
      } else if (!useApiDeck) {
        persistReminders(
          remindersRef.current.map((x) => {
            if (x.id !== id) return x;
            const next = { ...x, ...patch };
            if (typeof next.time === "string" && next.time.length >= 8) next.time = next.time.slice(0, 5);
            return next;
          })
        );
      }
    },
    [useApiDeck, canDeckWrite, persistReminders, refreshPortal]
  );

  const patchMission = useCallback(
    async (id: string, patch: Partial<Pick<MissionRow, "status" | "targetIso">>) => {
      if (useApiDeck && canDeckWrite) {
        const body: Record<string, unknown> = {};
        if (patch.status !== undefined) body.status = patch.status;
        if (patch.targetIso !== undefined) body.target_at = patch.targetIso;
        const res = await portalFetch(`/api/portal/missions/${id}/`, {
          method: "PATCH",
          body: JSON.stringify(body)
        });
        if (!res.ok) setPortalError("Could not update mission");
        await refreshPortal();
      } else if (!useApiDeck) {
        persistMissions(missionsRef.current.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      }
    },
    [useApiDeck, canDeckWrite, persistMissions, refreshPortal]
  );

  const canEditReminders = !useApiDeck || canDeckWrite;

  /** After 1 min in navbar: remove strip and apply +10 min (same as Snooze) if user has not acted. */
  const scheduleReminderNavAutoSnooze = useCallback(() => {
    clearReminderNavAutoTimeout();
    reminderNavAutoTimeoutRef.current = window.setTimeout(() => {
      reminderNavAutoTimeoutRef.current = null;
      if (reminderUserAcknowledgedRef.current) return;
      const id = reminderNavSlotTargetIdRef.current;
      if (!id) return;

      for (const k of [...reminderToastKeysRef.current]) {
        if (k.startsWith(`${id}|`)) reminderToastKeysRef.current.delete(k);
      }
      lastReminderNavSlotKeyRef.current = null;
      reminderNavSlotTargetIdRef.current = null;
      toast.dismiss(REMINDER_NAV_SLOT_ID);

      if (!canEditReminders) return;
      const latest = remindersRef.current.find((x) => x.id === id);
      if (!latest || latest.status !== "active") return;
      const due = reminderDueMs(latest);
      if (!Number.isFinite(due) || due > Date.now()) return;
      const next = addMinutesToReminderDateTime(latest.date, latest.time, 10);
      void patchReminder(latest.id, { date: next.date, time: next.time });
    }, REMINDER_NAV_AUTO_SNOOZE_MS);
  }, [canEditReminders, clearReminderNavAutoTimeout, patchReminder]);

  const snoozeReminder10Min = useCallback(
    async (r: ReminderRow) => {
      if (!canEditReminders) return;
      reminderUserAcknowledgedRef.current = true;
      clearReminderNavAutoTimeout();
      for (const k of [...reminderToastKeysRef.current]) {
        if (k.startsWith(`${r.id}|`)) reminderToastKeysRef.current.delete(k);
      }
      lastReminderNavSlotKeyRef.current = null;
      if (reminderNavSlotTargetIdRef.current === r.id) {
        reminderNavSlotTargetIdRef.current = null;
        toast.dismiss(REMINDER_NAV_SLOT_ID);
      }
      const next = addMinutesToReminderDateTime(r.date, r.time, 10);
      await patchReminder(r.id, { date: next.date, time: next.time });
    },
    [canEditReminders, clearReminderNavAutoTimeout, patchReminder]
  );

  const snoozeMission10Min = useCallback(
    async (m: MissionRow) => {
      if (!canEditReminders) return;
      clearMissionToastKeysForId(m.id);
      const nextIso = addMinutesToIso(m.targetIso, 10);
      await patchMission(m.id, { targetIso: nextIso });
    },
    [canEditReminders, clearMissionToastKeysForId, patchMission]
  );

  const saveTimeEdit = useCallback(async () => {
    if (!timeEdit) return;
    const iso = localDateAndTimeToIso(timeEditDate, timeEditTime);
    if (!iso) return;
    if (timeEdit.kind === "reminder") {
      clearReminderToastKeysForId(timeEdit.id);
      const d = new Date(iso);
      const date = toYyyyMmDd(d);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      await patchReminder(timeEdit.id, { date, time: `${hh}:${mm}:${ss}` });
    } else {
      clearMissionToastKeysForId(timeEdit.id);
      await patchMission(timeEdit.id, { targetIso: iso });
    }
    setTimeEdit(null);
  }, [timeEdit, timeEditDate, timeEditTime, patchReminder, patchMission, clearReminderToastKeysForId, clearMissionToastKeysForId]);

  /** When a scheduled time is reached: one reminder slot in navbar; after 1 min auto-dismiss + snooze +10m if ignored. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tick = () => {
      const now = Date.now();
      const rList = remindersRef.current.filter((x) => x.status === "active");
      const dueRows = rList
        .map((r) => {
          const due = reminderDueMs(r);
          return { r, due };
        })
        .filter(({ due }) => Number.isFinite(due) && due <= now)
        .sort((a, b) => a.due - b.due);

      const primary = dueRows[0]?.r ?? null;

      if (!primary) {
        clearReminderNavAutoTimeout();
        reminderNavSlotTargetIdRef.current = null;
        lastReminderNavSlotKeyRef.current = null;
        toast.dismiss(REMINDER_NAV_SLOT_ID);
      } else {
        missionToastKeysRef.current.clear();
        for (const m of missionsRef.current) {
          toast.dismiss(`mission-due-${m.id}`);
        }
        const slotKey = `${primary.id}|${primary.date}|${primary.time}`;
        if (lastReminderNavSlotKeyRef.current !== slotKey) {
          lastReminderNavSlotKeyRef.current = slotKey;
          reminderNavSlotTargetIdRef.current = primary.id;
          reminderUserAcknowledgedRef.current = false;
          clearReminderNavAutoTimeout();
          const r = primary;
          const whenLabel = `${r.date} · ${formatReminderTimeDisplay(r.time)}`;
          playDeckAlarmSound();
          toast.custom(
            (t) => (
              <div role="alert" className="pointer-events-auto deck-reminder-nav-strip">
                <div className="deck-reminder-left">
                  <span className="deck-alarm-bell deck-reminder-bell" aria-hidden>
                    🔔
                  </span>
                  <div className="deck-reminder-copy">
                    <div className="deck-reminder-label">Reminder due</div>
                    <div className="deck-reminder-title">{r.title}</div>
                    <div className="deck-reminder-when">{whenLabel}</div>
                  </div>
                </div>
                {canEditReminders ? (
                  <div className="deck-reminder-actions">
                    <button
                      type="button"
                      className="deck-reminder-btn deck-reminder-btn--snooze"
                      onClick={() => {
                        toast.dismiss(t.id);
                        const latest = remindersRef.current.find((x) => x.id === r.id);
                        if (latest) void snoozeReminder10Min(latest);
                      }}
                    >
                      10m
                    </button>
                    <button
                      type="button"
                      className="deck-reminder-btn deck-reminder-btn--ghost"
                      onClick={() => {
                        toast.dismiss(t.id);
                        reminderUserAcknowledgedRef.current = true;
                        clearReminderNavAutoTimeout();
                        const latest = remindersRef.current.find((x) => x.id === r.id);
                        if (latest)
                          setTimeEdit({
                            kind: "reminder",
                            id: latest.id,
                            title: latest.title,
                            date: latest.date,
                            time: latest.time
                          });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="deck-reminder-btn deck-reminder-btn--done"
                      onClick={() => {
                        toast.dismiss(t.id);
                        clearReminderToastKeysForId(r.id);
                        void patchReminder(r.id, { status: "completed" });
                      }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <p className="deck-reminder-viewonly">View only</p>
                )}
              </div>
            ),
            { id: REMINDER_NAV_SLOT_ID, duration: TOAST_DURATION_LONG_MS }
          );
          scheduleReminderNavAutoSnooze();
        }
      }

      if (!primary) {
      const mList = missionsRef.current.filter((x) => x.status === "active");
      for (const m of mList) {
        const dueTs = new Date(m.targetIso).getTime();
        if (!Number.isFinite(dueTs) || dueTs > now) continue;
        const key = `${m.id}|${m.targetIso}`;
        if (missionToastKeysRef.current.has(key)) continue;
        missionToastKeysRef.current.add(key);
        playDeckAlarmSound();
        const whenLabel = new Date(m.targetIso).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short"
        });
        toast.custom(
          (t) => (
            <div role="alert" className={cn("pointer-events-auto", DECK_DUE_TOAST_WRAP)}>
              <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
                <span className="deck-alarm-bell text-[1.25rem] leading-none" aria-hidden>
                  🔔
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-red-300/95">Mission due</div>
                  <div className="truncate text-[14px] font-semibold leading-tight text-white/96">{m.title}</div>
                  <div className="text-[11px] font-medium text-red-200/85">{whenLabel}</div>
                </div>
              </div>
              {canEditReminders ? (
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5 sm:mt-0 sm:ml-auto sm:max-w-[min(100%,28rem)] sm:justify-end">
                  <button
                    type="button"
                    className={cn(
                      DECK_TOAST_BTN,
                      "border-red-600/55 bg-red-950/55 text-red-50 hover:border-red-400/75 focus-visible:ring-red-400/55"
                    )}
                    onClick={() => {
                      toast.dismiss(t.id);
                      const latest = missionsRef.current.find((x) => x.id === m.id);
                      if (latest) void snoozeMission10Min(latest);
                    }}
                  >
                    Snooze 10m
                  </button>
                  <button
                    type="button"
                    className={cn(
                      DECK_TOAST_BTN,
                      "border-white/22 bg-black/55 text-white/92 hover:border-white/40 focus-visible:ring-white/35"
                    )}
                    onClick={() => {
                      toast.dismiss(t.id);
                      const latest = missionsRef.current.find((x) => x.id === m.id);
                      if (latest)
                        setTimeEdit({
                          kind: "mission",
                          id: latest.id,
                          title: latest.title,
                          targetIso: latest.targetIso
                        });
                    }}
                  >
                    Edit time
                  </button>
                  <button
                    type="button"
                    className={cn(
                      DECK_TOAST_BTN,
                      "border-[rgba(255,215,0,0.42)] bg-black/50 text-[rgba(255,248,220,0.92)] hover:border-[rgba(255,215,0,0.62)] focus-visible:ring-[rgba(255,215,0,0.45)]"
                    )}
                    onClick={() => {
                      toast.dismiss(t.id);
                      clearMissionToastKeysForId(m.id);
                      void patchMission(m.id, { status: "done" });
                    }}
                  >
                    Complete
                  </button>
                </div>
              ) : (
                <p className="mt-1.5 text-[10px] text-red-200/70 sm:mt-0 sm:self-center">View only — cannot act on missions.</p>
              )}
            </div>
          ),
          { id: `mission-due-${m.id}`, duration: 60000 }
        );
      }
      }
    };
    tick();
    const timerId = window.setInterval(tick, 4000);
    return () => {
      window.clearInterval(timerId);
      clearReminderNavAutoTimeout();
    };
  }, [
    canEditReminders,
    clearReminderNavAutoTimeout,
    clearReminderToastKeysForId,
    clearMissionToastKeysForId,
    patchReminder,
    patchMission,
    snoozeReminder10Min,
    snoozeMission10Min,
    scheduleReminderNavAutoSnooze
  ]);

  const missionBuckets = useMemo(() => bucketMissions(missions), [missions]);
  const activeMissions = missionBuckets.active;
  const missedMissions = missionBuckets.missed;
  const completedMissions = missionBuckets.done;

  const sortByTarget = (a: MissionRow, b: MissionRow, dir: DeckSortDir) => {
    const da = new Date(a.targetIso).getTime();
    const db = new Date(b.targetIso).getTime();
    return dir === "desc" ? db - da : da - db;
  };

  const filteredActiveMissions = useMemo(() => {
    let rows = filterBySearch(activeMissions, (r) => `${r.title} ${r.targetIso}`, mSearchA);
    if (browseDate) rows = rows.filter((r) => missionLocalDay(r.targetIso) === browseDate);
    return [...rows].sort((a, b) => sortByTarget(a, b, mSortA));
  }, [activeMissions, mSearchA, mSortA, browseDate]);

  const filteredMissedMissions = useMemo(() => {
    let rows = filterBySearch(missedMissions, (r) => `${r.title} ${r.targetIso}`, mSearchM);
    if (browseDate) rows = rows.filter((r) => missionLocalDay(r.targetIso) === browseDate);
    return [...rows].sort((a, b) => sortByTarget(a, b, mSortM));
  }, [missedMissions, mSearchM, mSortM, browseDate]);

  const filteredCompletedMissions = useMemo(() => {
    let rows = filterBySearch(completedMissions, (r) => `${r.title} ${r.targetIso}`, mSearchC);
    if (browseDate) rows = rows.filter((r) => missionLocalDay(r.targetIso) === browseDate);
    return [...rows].sort((a, b) => sortByTarget(a, b, mSortC));
  }, [completedMissions, mSearchC, mSortC, browseDate]);

  useEffect(() => {
    setMissionPageActive(0);
    setMissionPageMissed(0);
    setMissionPageDone(0);
  }, [browseDate, mSearchA, mSearchM, mSearchC, mSortA, mSortM, mSortC]);

  useEffect(() => {
    const maxP = Math.max(0, Math.ceil(filteredActiveMissions.length / MISSION_PAGE_SIZE) - 1);
    setMissionPageActive((p) => Math.min(p, maxP));
  }, [filteredActiveMissions.length]);

  useEffect(() => {
    const maxP = Math.max(0, Math.ceil(filteredMissedMissions.length / MISSION_PAGE_SIZE) - 1);
    setMissionPageMissed((p) => Math.min(p, maxP));
  }, [filteredMissedMissions.length]);

  useEffect(() => {
    const maxP = Math.max(0, Math.ceil(filteredCompletedMissions.length / MISSION_PAGE_SIZE) - 1);
    setMissionPageDone((p) => Math.min(p, maxP));
  }, [filteredCompletedMissions.length]);

  const pagedActiveMissions = useMemo(() => {
    const start = missionPageActive * MISSION_PAGE_SIZE;
    return filteredActiveMissions.slice(start, start + MISSION_PAGE_SIZE);
  }, [filteredActiveMissions, missionPageActive]);

  const pagedMissedMissions = useMemo(() => {
    const start = missionPageMissed * MISSION_PAGE_SIZE;
    return filteredMissedMissions.slice(start, start + MISSION_PAGE_SIZE);
  }, [filteredMissedMissions, missionPageMissed]);

  const pagedCompletedMissions = useMemo(() => {
    const start = missionPageDone * MISSION_PAGE_SIZE;
    return filteredCompletedMissions.slice(start, start + MISSION_PAGE_SIZE);
  }, [filteredCompletedMissions, missionPageDone]);

  const filteredNotes = useMemo(() => {
    let rows = filterBySearch(notes, (n) => `${n.title} ${n.body}`, nSearch);
    if (browseDate) rows = rows.filter((n) => noteLocalDay(n.createdAt) === browseDate);
    return [...rows].sort((a, b) => {
      const cmp = a.createdAt - b.createdAt;
      return nSort === "desc" ? -cmp : cmp;
    });
  }, [notes, nSearch, nSort, browseDate]);

  useEffect(() => {
    setNotePage(0);
  }, [browseDate, nSearch, nSort]);

  useEffect(() => {
    const maxP = Math.max(0, Math.ceil(filteredNotes.length / MISSION_PAGE_SIZE) - 1);
    setNotePage((p) => Math.min(p, maxP));
  }, [filteredNotes.length]);

  const pagedNotes = useMemo(() => {
    const start = notePage * MISSION_PAGE_SIZE;
    return filteredNotes.slice(start, start + MISSION_PAGE_SIZE);
  }, [filteredNotes, notePage]);

  useEffect(() => {
    if (!selectedNoteId) return;
    if (!filteredNotes.some((n) => n.id === selectedNoteId)) setSelectedNoteId(null);
  }, [filteredNotes, selectedNoteId]);

  const selectedNote = filteredNotes.find((n) => n.id === selectedNoteId) ?? filteredNotes[0] ?? null;

  const addMission = async () => {
    const title = mTitle.trim();
    const targetIso = localDateAndTimeToIso(mDate, mTime);
    if (!title || !targetIso) return;
    if (useApiDeck && canDeckWrite) {
      const res = await portalFetch(`/api/portal/missions/`, {
        method: "POST",
        body: JSON.stringify({
          title,
          target_at: targetIso,
          points: DEFAULT_MISSION_POINTS,
          status: "active"
        })
      });
      if (!res.ok) {
        setPortalError("Could not create mission");
        return;
      }
      await postAutoRemindersForMission(title, targetIso);
      await refreshPortal();
    } else {
      const row: MissionRow = {
        id: uid(),
        title,
        targetIso,
        points: DEFAULT_MISSION_POINTS,
        status: "active"
      };
      persistMissions([row, ...missions]);
      await postAutoRemindersForMission(title, targetIso);
    }
    setMTitle("");
    setMDate("");
    setMTime("");
  };

  const addNote = async () => {
    const title = nTitle.trim();
    if (!title) return;
    if (useApiDeck && canDeckWrite) {
      const res = await portalFetch(`/api/portal/notes/`, {
        method: "POST",
        body: JSON.stringify({ title, body: nBody.trim() })
      });
      if (!res.ok) setPortalError("Could not save note");
      await refreshPortal();
      if (res.ok && res.data && typeof res.data === "object" && "id" in res.data) {
        setSelectedNoteId(String((res.data as { id: number }).id));
      }
    } else {
      const row: NoteRow = { id: uid(), title, body: nBody.trim(), createdAt: Date.now() };
      persistNotes([row, ...notes]);
      setSelectedNoteId(row.id);
    }
    setNTitle("");
    setNBody("");
  };

  const missionsFormLabel =
    "text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--goals-milestones-gold)] md:text-[12px]";
  const missionsFormInput =
    "mt-1.5 w-full rounded-lg border-[rgba(255,215,0,0.46)] bg-[#0a0906] px-3 py-2.5 text-[15px] font-medium leading-relaxed text-[rgba(255,248,220,0.96)] outline-none placeholder:text-[rgba(255,230,150,0.22)] shadow-[inset_0_2px_8px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,215,0,0.07)] focus:border-[rgba(255,230,120,0.78)] focus:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,215,0,0.28),0_0_24px_rgba(255,200,0,0.2)] focus-visible:ring-2 focus-visible:ring-[rgba(255,215,0,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] md:py-3";

  const notesFormLabel =
    "text-[11px] font-extrabold uppercase tracking-[0.16em] text-fuchsia-200/95 md:text-[12px]";
  const notesFormInput =
    "mt-1.5 w-full rounded-lg border-fuchsia-400/42 bg-[#0c0610] px-3 py-2.5 text-[15px] font-medium leading-relaxed text-fuchsia-50/95 outline-none placeholder:text-fuchsia-200/25 shadow-[inset_0_2px_8px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(217,70,239,0.08)] focus:border-fuchsia-300/78 focus:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(217,70,239,0.28),0_0_24px_rgba(192,132,252,0.18)] focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] md:py-3";

  return (
    <Card
      themeMode={themeMode}
      frameVariant="shell"
      shellAccent="goals"
      titleTone="goals"
      disableHoverLift={layoutVariant === "fullscreen"}
      className={cn(
        "shadow-[0_18px_56px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
        layoutVariant === "fullscreen" && "!p-3.5 sm:!p-4 md:!p-6 lg:!p-7"
      )}
      title="Goals & Milestones"
      right={
        portalBusy ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--goals-milestones-gold)]/80">
            Syncing…
          </span>
        ) : undefined
      }
    >
      {portalError ? (
        <div className="mb-3 rounded-md border border-red-500/35 bg-red-950/40 px-3 py-2 text-[13px] font-medium leading-snug text-red-100/95">
          {portalError}{" "}
          <button
            type="button"
            className="min-h-[40px] rounded px-2 font-semibold underline decoration-red-300/80 underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060606]"
            onClick={() => setPortalError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mb-5">
        <DeckBrowseDateBar browseDate={browseDate} onBrowseDateChange={setBrowseDate} tone="fuchsia" />
      </div>

      <div className="flex w-full max-w-none min-w-0 flex-col gap-6 min-[1400px]:gap-8 lg:gap-7 xl:gap-8">
        {/* 1 — Missions: multi-neon shell + paged buckets */}
        <div
          className="relative w-full min-w-0 shrink-0 overflow-hidden rounded-xl p-[2px] shadow-[0_0_48px_rgba(34,211,238,0.14),0_0_72px_rgba(251,191,36,0.1),0_0_88px_rgba(192,132,252,0.12)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(34,211,238,0.55), rgba(251,191,36,0.42), rgba(192,132,252,0.48))"
          }}
        >
          <div className="relative min-w-0 overflow-hidden rounded-[11px] border border-white/10 bg-[#060606]/88 p-[var(--fluid-deck-p)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[10px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.95] [background:radial-gradient(620px_280px_at_14%_0%,rgba(34,211,238,0.12),transparent_58%),radial-gradient(560px_260px_at_92%_6%,rgba(251,191,36,0.1),transparent_54%),radial-gradient(480px_220px_at_50%_100%,rgba(192,132,252,0.09),transparent_52%)]"
              aria-hidden
            />
            <div className="relative z-[1]">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[color:var(--goals-milestones-gold)] md:text-[13px] lg:text-[14px]">
                  Missions
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-[color:var(--goals-milestones-line)] bg-black/55 text-[color:var(--goals-milestones-gold)] shadow-[0_0_16px_rgba(255,200,0,0.22),inset_0_1px_0_rgba(255,235,160,0.08)] transition hover:border-[rgba(255,235,160,0.72)] hover:text-[rgba(255,248,220,0.98)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,215,0,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                  aria-label={missionsHelpOpen ? "Hide missions info" : "What are missions?"}
                  aria-expanded={missionsHelpOpen}
                  aria-controls="missions-help-inline"
                  onClick={() => setMissionsHelpOpen((v) => !v)}
                >
                  <HelpCircle className="h-4 w-4" aria-hidden />
                </button>
              </div>

              {missionsHelpOpen ? (
                <div
                  id="missions-help-inline"
                  className="mt-3 rounded-xl border border-[color:var(--goals-milestones-line)] bg-black/55 px-4 py-4 shadow-[0_0_24px_rgba(255,200,0,0.12),inset_0_1px_0_rgba(255,215,0,0.06)] sm:px-5 sm:py-5"
                  role="region"
                  aria-labelledby="missions-help-title"
                >
                  <h3
                    id="missions-help-title"
                    className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--goals-milestones-gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.28)] md:text-xs"
                  >
                    Missions — straight talk
                  </h3>
                  <div className="mt-3 space-y-3 text-[14px] font-medium leading-relaxed text-neutral-200/92 md:text-[15px] md:leading-relaxed">
                    <p>
                      These are <span className="text-[color:var(--goals-milestones-gold)]/95">your</span> custom
                      missions — not a points farm, not a fake leaderboard, not corporate &quot;wellness&quot; theater.
                      Nobody scores you here.
                    </p>
                    <p>
                      Name the hit. Lock a deadline. The deck pings you on the way in — 1 week out, 3 days, 24h, down
                      to 30 minutes — so you move <span className="text-amber-200/95">before</span> the clock eats you,
                      not after.
                    </p>
                    <p>
                      Active, missed, done: three piles, zero fluff. You decide what matters — ship the build, run the
                      block, kill the debt, close the loop. Set the line. Hold it.
                    </p>
                  </div>
                </div>
              ) : null}

              {useApiDeck && !canDeckWrite ? (
                <p className="mt-2 text-[12px] font-medium leading-snug text-amber-100/92">
                  Read-only: your role can view missions but not edit.
                </p>
              ) : null}

              <div id="deck-mission-compose" className={FORM_MISSIONS}>
                <div>
                  <label className={missionsFormLabel}>Mission title</label>
                  <input
                    ref={missionTitleInputRef}
                    className={missionsFormInput}
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="e.g. Deep work — proposal"
                    disabled={useApiDeck && !canDeckWrite}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DeckDateField
                    id="mission-target-date"
                    label="Target date"
                    labelClassName={missionsFormLabel}
                    value={mDate}
                    onValueChange={setMDate}
                    disabled={useApiDeck && !canDeckWrite}
                    tone="fuchsia"
                  />
                  <DeckTimeField
                    id="mission-target-time"
                    label="Target time"
                    labelClassName={missionsFormLabel}
                    value={mTime}
                    onValueChange={setMTime}
                    disabled={useApiDeck && !canDeckWrite}
                    tone="fuchsia"
                  />
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => void addMission()}
                  disabled={useApiDeck && !canDeckWrite}
                  className="w-full rounded-lg border-[color:var(--goals-milestones-line)] bg-[rgba(255,215,0,0.12)] py-3 text-[11px] font-black uppercase tracking-[0.15em] text-[color:var(--goals-milestones-gold)] shadow-[0_4px_0_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,215,0,0.26),0_8px_32px_rgba(255,200,0,0.2),inset_0_1px_0_rgba(255,248,220,0.1)] hover:border-[rgba(255,235,160,0.78)] hover:bg-[rgba(255,215,0,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,215,0,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] disabled:cursor-not-allowed disabled:opacity-40 md:min-h-[48px] md:text-[12px]"
                >
                  Create mission
                </motion.button>
              </div>

          <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <div className={DECK_SUBPANEL_ACTIVE}>
              <div className={DECK_TITLE_ACTIVE}>Active missions</div>
              <DeckListToolbar
                tone="fuchsia"
                search={mSearchA}
                onSearchChange={setMSearchA}
                sortLabel="Due"
                sortDir={mSortA}
                onSortDirToggle={() => setMSortA((d) => (d === "desc" ? "asc" : "desc"))}
                placeholder="Search active…"
              />
              <div
                className={missionListScrollClass(
                  filteredActiveMissions.length === 0 ? 0 : pagedActiveMissions.length,
                  SCROLL_GOLD
                )}
              >
                {filteredActiveMissions.length === 0 ? (
                  browseDate ? (
                    <DeckEmptyCta
                      message="No active missions on this day."
                      actionLabel="Show all days"
                      onAction={() => setBrowseDate(null)}
                      accentClass="border-[color:var(--goals-milestones-line)] bg-black/40"
                      ctaTone="gold"
                    />
                  ) : (
                    <DeckEmptyCta
                      message="Nothing in the active queue yet."
                      actionLabel="Create a mission"
                      onAction={focusMissionComposer}
                      accentClass="border-[color:var(--goals-milestones-line)] bg-black/40"
                      ctaTone="gold"
                    />
                  )
                ) : (
                  pagedActiveMissions.map((m) => {
                    const dueTs = new Date(m.targetIso).getTime();
                    const urgent = Number.isFinite(dueTs) && dueTs - Date.now() < 36e5 && dueTs > Date.now();
                    return (
                      <DeckListItem
                        key={m.id}
                        tone="fuchsia"
                        title={m.title}
                        badge={<MissionStatusBadge status="active" />}
                        subtitle={
                          <DueDateLine
                            label="Due"
                            value={new Date(m.targetIso).toLocaleString()}
                            urgent={urgent}
                          />
                        }
                        footer={
                          (!useApiDeck || canDeckWrite) && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={cn(
                                  DECK_ROW_BTN_SECONDARY,
                                  "border-white/22 bg-black/45 text-white/90 shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:border-white/40 focus-visible:ring-white/35"
                                )}
                                onClick={() =>
                                  setTimeEdit({
                                    kind: "mission",
                                    id: m.id,
                                    title: m.title,
                                    targetIso: m.targetIso
                                  })
                                }
                              >
                                Edit time
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  DECK_ROW_BTN_PRIMARY,
                                  "border-[color:var(--goals-milestones-line)] bg-[rgba(255,215,0,0.14)] text-[color:var(--goals-milestones-gold)] shadow-[0_2px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,248,220,0.08)] hover:border-[rgba(255,235,160,0.72)] hover:bg-[rgba(255,215,0,0.2)] focus-visible:ring-[rgba(255,215,0,0.55)]"
                                )}
                                onClick={() => void patchMission(m.id, { status: "done" })}
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  DECK_ROW_BTN_SECONDARY,
                                  "border-rose-400/38 bg-black/45 text-rose-100/88 shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:border-rose-300/55 hover:bg-black/55 focus-visible:ring-rose-400/45"
                                )}
                                onClick={() => void patchMission(m.id, { status: "missed" })}
                              >
                                Mark missed
                              </button>
                            </div>
                          )
                        }
                      />
                    );
                  })
                )}
              </div>
              <MissionBucketPagination
                page={missionPageActive}
                total={filteredActiveMissions.length}
                onPageChange={setMissionPageActive}
                accent="gold"
              />
            </div>
            <div className={DECK_SUBPANEL_MISSED}>
              <div className={DECK_TITLE_MISSED}>Missed missions</div>
              <DeckListToolbar
                tone="rose"
                search={mSearchM}
                onSearchChange={setMSearchM}
                sortLabel="Due"
                sortDir={mSortM}
                onSortDirToggle={() => setMSortM((d) => (d === "desc" ? "asc" : "desc"))}
                placeholder="Search missed…"
              />
              <div
                className={missionListScrollClass(
                  filteredMissedMissions.length === 0 ? 0 : pagedMissedMissions.length,
                  SCROLL_ROSE
                )}
              >
                {filteredMissedMissions.length === 0 ? (
                  browseDate ? (
                    <DeckEmptyCta
                      message="No missed missions on this day."
                      actionLabel="Show all days"
                      onAction={() => setBrowseDate(null)}
                      accentClass="border-rose-400/38 bg-black/40"
                      ctaTone="rose"
                    />
                  ) : (
                    <DeckEmptyCta
                      message="No missed missions in the deck."
                      actionLabel="Create a mission"
                      onAction={focusMissionComposer}
                      accentClass="border-rose-400/38 bg-black/40"
                      ctaTone="rose"
                    />
                  )
                ) : (
                  pagedMissedMissions.map((m) => (
                    <DeckListItem
                      key={m.id}
                      tone="rose"
                      title={m.title}
                      badge={<MissionStatusBadge status="missed" />}
                      subtitle={
                        <DueDateLine label="Was due" value={new Date(m.targetIso).toLocaleString()} />
                      }
                      footer={
                        (!useApiDeck || canDeckWrite) && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={cn(
                                DECK_ROW_BTN_SECONDARY,
                                "border-white/22 bg-black/45 text-white/90 shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:border-white/40 focus-visible:ring-white/35"
                              )}
                              onClick={() =>
                                setTimeEdit({
                                  kind: "mission",
                                  id: m.id,
                                  title: m.title,
                                  targetIso: m.targetIso
                                })
                              }
                            >
                              Edit time
                            </button>
                            <button
                              type="button"
                              className={cn(
                                DECK_ROW_BTN_PRIMARY,
                                "border-rose-400/48 bg-rose-500/14 text-rose-100 shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:border-rose-300/72 hover:bg-rose-500/22 focus-visible:ring-rose-400/55"
                              )}
                              onClick={() => void patchMission(m.id, { status: "done" })}
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              className={cn(
                                DECK_ROW_BTN_SECONDARY,
                                "border-[rgba(255,215,0,0.38)] bg-black/45 text-[rgba(255,248,220,0.88)] shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:border-[rgba(255,215,0,0.55)] hover:bg-black/55 focus-visible:ring-[rgba(255,215,0,0.45)]"
                              )}
                              onClick={() => void patchMission(m.id, { status: "active" })}
                            >
                              Reactivate
                            </button>
                          </div>
                        )
                      }
                    />
                  ))
                )}
              </div>
              <MissionBucketPagination
                page={missionPageMissed}
                total={filteredMissedMissions.length}
                onPageChange={setMissionPageMissed}
                accent="rose"
              />
            </div>
          </div>

          <div className="mt-5 w-full min-w-0">
            <div className={DECK_SUBPANEL_DONE}>
              <div className={DECK_TITLE_DONE}>Completed missions</div>
              <DeckListToolbar
                tone="emerald"
                search={mSearchC}
                onSearchChange={setMSearchC}
                sortLabel="Due"
                sortDir={mSortC}
                onSortDirToggle={() => setMSortC((d) => (d === "desc" ? "asc" : "desc"))}
                placeholder="Search completed…"
              />
              <div
                className={missionListScrollClass(
                  filteredCompletedMissions.length === 0 ? 0 : pagedCompletedMissions.length,
                  SCROLL_EMERALD
                )}
              >
                {filteredCompletedMissions.length === 0 ? (
                  browseDate ? (
                    <DeckEmptyCta
                      message="No completed missions on this day."
                      actionLabel="Show all days"
                      onAction={() => setBrowseDate(null)}
                      accentClass="border-emerald-500/28 bg-black/35"
                      ctaTone="emerald"
                    />
                  ) : (
                    <DeckEmptyCta
                      message="No completed missions in the deck yet — finish one from Active or Missed above."
                      actionLabel="Create a mission"
                      onAction={focusMissionComposer}
                      accentClass="border-emerald-500/28 bg-black/35"
                      ctaTone="emerald"
                    />
                  )
                ) : (
                  pagedCompletedMissions.map((m) => (
                    <DeckListItem
                      key={m.id}
                      tone="emerald"
                      title={m.title}
                      badge={<MissionStatusBadge status="done" />}
                      subtitle={
                        <DueDateLine
                          label="Target was"
                          value={new Date(m.targetIso).toLocaleString()}
                        />
                      }
                      footer={
                        (!useApiDeck || canDeckWrite) && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={cn(
                                DECK_ROW_BTN_SECONDARY,
                                "border-white/22 bg-black/45 text-white/90 shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:border-white/40 focus-visible:ring-white/35"
                              )}
                              onClick={() =>
                                setTimeEdit({
                                  kind: "mission",
                                  id: m.id,
                                  title: m.title,
                                  targetIso: m.targetIso
                                })
                              }
                            >
                              Edit time
                            </button>
                            <button
                              type="button"
                              className={cn(
                                DECK_ROW_BTN_PRIMARY,
                                "border-emerald-400/48 bg-emerald-500/14 text-emerald-100 shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:border-emerald-300/72 hover:bg-emerald-500/22 focus-visible:ring-emerald-400/55"
                              )}
                              onClick={() => void patchMission(m.id, { status: "active" })}
                            >
                              Reactivate
                            </button>
                          </div>
                        )
                      }
                    />
                  ))
                )}
              </div>
              <MissionBucketPagination
                page={missionPageDone}
                total={filteredCompletedMissions.length}
                onPageChange={setMissionPageDone}
                accent="emerald"
              />
            </div>
          </div>

          </div>
          </div>
        </div>

        <div
          className={DECK_NOTES_OUTER}
          style={{
            background:
              "linear-gradient(135deg, rgba(217,70,239,0.48), rgba(255,215,0,0.38), rgba(52,211,153,0.44))"
          }}
        >
          <div className={DECK_NOTES_INNER}>
            <DeckGlowNotes />
            <div className="relative z-[1]">
              <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[color:var(--goals-milestones-gold)] md:text-[13px] lg:text-[14px]">
                Notes
              </div>
              <p className="mt-2 max-w-prose text-[15px] font-normal leading-relaxed text-neutral-200/90 md:leading-[1.55]">
                Capture intel below, then open it from the library — titles stay in the list; the reader shows body
                only. Library paginates 5 notes per page.
              </p>

              {useApiDeck && !canDeckWrite ? (
                <p className="mt-2 text-[12px] font-medium leading-snug text-amber-100/92">Read-only notes for your role.</p>
              ) : null}

              <div id="deck-note-compose" className={FORM_NOTES}>
                <div>
                  <label className={notesFormLabel}>Note title</label>
                  <input
                    ref={noteTitleInputRef}
                    className={notesFormInput}
                    value={nTitle}
                    onChange={(e) => setNTitle(e.target.value)}
                    placeholder="Short label"
                    disabled={useApiDeck && !canDeckWrite}
                  />
                </div>
                <div>
                  <label className={notesFormLabel}>Note body</label>
                  <textarea
                    className={cn(notesFormInput, "min-h-[72px] resize-y")}
                    value={nBody}
                    onChange={(e) => setNBody(e.target.value)}
                    placeholder="Intel, ideas, links…"
                    disabled={useApiDeck && !canDeckWrite}
                  />
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => void addNote()}
                  disabled={useApiDeck && !canDeckWrite}
                  className="w-full rounded-lg border-fuchsia-400/55 bg-fuchsia-500/12 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-100 shadow-[0_4px_0_rgba(0,0,0,0.42),0_0_0_1px_rgba(217,70,239,0.28),0_8px_32px_rgba(192,132,252,0.18),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-fuchsia-300/78 hover:bg-fuchsia-500/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] disabled:cursor-not-allowed disabled:opacity-40 md:min-h-[48px] md:text-[12px]"
                >
                  Save note
                </motion.button>
              </div>

              <div className="mt-6 w-full min-w-0">
                <DeckListToolbar
                  tone="fuchsia"
                  search={nSearch}
                  onSearchChange={setNSearch}
                  sortLabel="Created"
                  sortDir={nSort}
                  onSortDirToggle={() => setNSort((d) => (d === "desc" ? "asc" : "desc"))}
                  placeholder="Search notes…"
                />

                <div
                  className="mt-3 grid min-h-0 w-full min-w-0 grid-cols-1 gap-3 lg:max-h-[min(58vh,640px)] lg:grid-cols-[minmax(240px,34%)_1fr]"
                  role="region"
                  aria-label="Note library and reader"
                >
                  <div className={DECK_SUBPANEL_NOTES_LIB}>
                    <div className="shrink-0 border-b border-fuchsia-500/25 bg-black/30 px-3 py-3 md:px-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200/95">
                        Note library
                      </div>
                      <p className="mt-1 text-[12px] font-normal leading-snug text-neutral-300/90">
                        Tap a row — reader opens on the right. Prev / Next when you have more than five.
                      </p>
                    </div>
                    <div
                      role="listbox"
                      aria-label="Saved notes"
                      className={cn(
                        "flex min-h-0 flex-1 flex-col gap-2 px-2.5 pb-3 pt-2 md:px-3",
                        missionListScrollClass(pagedNotes.length === 0 ? 0 : pagedNotes.length, SCROLL_FUCHSIA)
                      )}
                    >
                      {filteredNotes.length === 0 ? (
                        browseDate ? (
                          <DeckEmptyCta
                            message="No notes created on this day."
                            actionLabel="Show all days"
                            onAction={() => setBrowseDate(null)}
                            accentClass="border-fuchsia-400/35 bg-black/35"
                            ctaTone="gold"
                          />
                        ) : nSearch.trim() ? (
                          <div className="rounded-lg border border-dashed border-fuchsia-400/35 bg-black/35 px-4 py-8 text-center">
                            <p className="text-[14px] font-medium leading-relaxed text-neutral-200/92">
                              No notes match this search.
                            </p>
                            <button
                              type="button"
                              onClick={() => setNSearch("")}
                              className="mt-4 inline-flex min-h-[44px] w-full max-w-[14rem] items-center justify-center rounded-lg border border-fuchsia-400/45 bg-black/50 text-[11px] font-semibold text-fuchsia-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                            >
                              Clear search
                            </button>
                          </div>
                        ) : (
                          <DeckEmptyCta
                            message="No notes saved yet."
                            actionLabel="Write a note"
                            onAction={focusNoteComposer}
                            accentClass="border-fuchsia-400/35 bg-black/35"
                            ctaTone="gold"
                          />
                        )
                      ) : (
                        pagedNotes.map((n) => {
                          const active = selectedNote?.id === n.id;
                          return (
                            <button
                              key={n.id}
                              type="button"
                              role="option"
                              aria-selected={active}
                              title={n.title}
                              onClick={() => setSelectedNoteId(n.id)}
                              className={cn(
                                "min-h-[44px] w-full rounded-lg border px-3 py-2.5 text-left motion-safe:transition-[box-shadow,border-color,background-color,transform] motion-safe:duration-200 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]",
                                active
                                  ? "border-fuchsia-400/55 bg-gradient-to-r from-fuchsia-500/22 via-fuchsia-500/12 to-transparent shadow-[inset_0_0_0_1px_rgba(217,70,239,0.35),0_0_22px_rgba(192,132,252,0.2)]"
                                  : "border-fuchsia-500/20 bg-black/25 motion-safe:hover:-translate-y-px hover:border-fuchsia-400/40 hover:bg-black/40"
                              )}
                            >
                              <div className="line-clamp-2 text-[14px] font-semibold leading-snug text-neutral-50">
                                {n.title}
                              </div>
                              <div className="mt-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400/90">
                                {new Date(n.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="border-t border-fuchsia-500/20 px-2.5 pb-3 pt-1 md:px-3">
                      <MissionBucketPagination
                        page={notePage}
                        total={filteredNotes.length}
                        onPageChange={setNotePage}
                        accent="fuchsia"
                      />
                    </div>
                  </div>

                  <div className={DECK_SUBPANEL_NOTES_READER}>
                    <div className="shrink-0 border-b border-emerald-500/25 bg-black/25 px-4 py-3 md:px-5">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/90">
                        Reader
                      </div>
                    </div>
                    <div
                      className={cn(
                        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 md:px-6 md:py-5",
                        "max-h-[min(52vh,560px)]",
                        SCROLL_EMERALD
                      )}
                    >
                      {selectedNote ? (
                        <div className="flex min-h-0 flex-col pb-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-emerald-500/20 pb-3 font-mono text-[12px] text-neutral-300/90">
                            <span className="font-semibold text-emerald-200/90">
                              {new Date(selectedNote.createdAt).toLocaleString()}
                            </span>
                            {selectedNote.body?.trim() ? (
                              <span className="text-neutral-400/90">{selectedNote.body.trim().length} chars</span>
                            ) : null}
                          </div>
                          <div className="mt-4 whitespace-pre-wrap text-[15px] font-normal leading-[1.65] text-neutral-100/92 md:text-[16px] md:leading-relaxed">
                            {selectedNote.body?.trim()
                              ? selectedNote.body
                              : "No body on this note — titles live in the library list so this space stays for long-form intel."}
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-500/30 bg-black/20 px-4 py-10 text-center">
                          <p className="text-[14px] font-medium text-neutral-200/88">Nothing selected</p>
                          <p className="max-w-sm text-[13px] font-normal leading-relaxed text-neutral-400/88">
                            Choose a note in the library, or create one with the form above.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {timeEdit ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deck-time-edit-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => setTimeEdit(null)}
          />
          <div className="relative z-[1] w-full max-w-md rounded-xl border border-[rgba(255,215,0,0.28)] bg-[#060606]/95 p-4 shadow-[0_0_0_1px_rgba(255,215,0,0.12),0_24px_64px_rgba(0,0,0,0.65)] backdrop-blur-md">
            <h2 id="deck-time-edit-title" className="text-[12px] font-black uppercase tracking-[0.2em] text-[color:var(--goals-milestones-gold)]/95">
              Edit time
            </h2>
            <p className="mt-1 truncate text-[14px] font-semibold text-white/92" title={timeEdit.title}>
              {timeEdit.title}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DeckDateField
                id="deck-time-edit-date"
                label="Date"
                labelClassName="text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-300"
                value={timeEditDate}
                onValueChange={setTimeEditDate}
                disabled={false}
                tone="fuchsia"
              />
              <DeckTimeField
                id="deck-time-edit-time"
                label="Time"
                labelClassName="text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-300"
                value={timeEditTime}
                onValueChange={setTimeEditTime}
                disabled={false}
                tone="fuchsia"
              />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={cn(
                  DECK_ROW_BTN_SECONDARY,
                  "border-white/22 bg-black/50 text-white/90 hover:border-white/38 focus-visible:ring-white/35"
                )}
                onClick={() => setTimeEdit(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cn(
                  DECK_ROW_BTN_PRIMARY,
                  "border-[color:var(--goals-milestones-line)] bg-[rgba(255,215,0,0.14)] text-[color:var(--goals-milestones-gold)] hover:border-[rgba(255,235,160,0.78)] focus-visible:ring-[rgba(255,215,0,0.55)]"
                )}
                disabled={!timeEditDate?.trim() || !timeEditTime?.trim() || !localDateAndTimeToIso(timeEditDate, timeEditTime)}
                onClick={() => void saveTimeEdit()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
