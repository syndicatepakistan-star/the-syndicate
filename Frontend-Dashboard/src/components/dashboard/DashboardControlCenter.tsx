"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useActivityTimeline } from "@/contexts/ActivityTimelineContext";
import type { ActivityCategory, ActivityItem, DashboardNavKey, DashboardSnapshots } from "./types";
import { useDashboardSnapshots, type DashboardCourseLike } from "./useDashboardSnapshots";
import { accentByKey, Card, cn, themeAccent, type ThemeMode } from "./dashboardPrimitives";
import { GoalPathSystem } from "./path/GoalPathSystem";
import { MissionCommandDeckCard } from "./MissionCommandDeckCard";
import {
  formatSyndicateReminderCountdown,
  useSyndicateMissionsPeek,
  type SyndicateMissionPeekRow
} from "./useSyndicateMissionsPeek";
import { Bell, Lock, Target, Activity } from "lucide-react";
export type { ThemeMode };

function pickPrimaryMission(rows: SyndicateMissionPeekRow[]): SyndicateMissionPeekRow | null {
  const missions = rows.filter((r) => r.mood !== "reminder");
  if (!missions.length) return null;
  return (
    missions.find((r) => !r.completed && r.onBoard) ??
    missions.find((r) => !r.completed) ??
    missions[0] ??
    null
  );
}

function pickPrimaryReminder(rows: SyndicateMissionPeekRow[], now: number): SyndicateMissionPeekRow | null {
  const withRem = rows.filter((r) => r.reminderAtMs != null && r.reminderAtMs > now);
  if (!withRem.length) return null;
  return withRem.reduce((a, b) => ((a.reminderAtMs ?? 0) <= (b.reminderAtMs ?? 0) ? a : b));
}

function formatSyndicateReminderWhen(ms: number) {
  try {
    return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function syndicateDifficultyChipClass(d: string) {
  const x = d.toLowerCase();
  if (x === "easy") return "border-emerald-400/40 bg-emerald-500/14 text-emerald-100/90";
  if (x === "hard") return "border-rose-400/40 bg-rose-500/14 text-rose-100/88";
  return "border-amber-400/38 bg-amber-500/12 text-amber-100/88";
}

function SyndicateMissionsSnapshotCard({
  themeMode,
  onNavigate,
  syndicateNavLocked
}: {
  themeMode: ThemeMode;
  onNavigate: (nav: DashboardNavKey) => void;
  syndicateNavLocked?: boolean;
}) {
  const { rows, loading, error, linkedAccount, apiReached, refresh } = useSyndicateMissionsPeek();
  const [reminderTick, setReminderTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setReminderTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const primaryMission = useMemo(() => pickPrimaryMission(rows), [rows]);
  const primaryReminder = useMemo(() => pickPrimaryReminder(rows, Date.now()), [rows, reminderTick]);

  const ta = themeAccent(themeMode);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-cyan-400/22 bg-[#050607] p-[1px] shadow-[0_0_0_1px_rgba(250,204,21,0.07),0_24px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]"
      style={{ boxShadow: `0 0 0 1px rgba(34,211,238,0.12), 0 28px 80px rgba(0,0,0,0.5), 0 0 48px ${ta.glow}` }}
      aria-labelledby="syndicate-dashboard-snapshot-title"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.95] [background:radial-gradient(720px_420px_at_0%_-10%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(560px_380px_at_100%_0%,rgba(250,204,21,0.09),transparent_52%)]" />
      <div className="relative rounded-[15px] border border-white/[0.07] bg-gradient-to-b from-[#0b0d12]/95 to-[#050505]/98 px-4 py-5 sm:px-6 sm:py-6">
        {syndicateNavLocked ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/38 bg-amber-500/10 px-3 py-2.5 text-[11px] font-bold leading-snug text-amber-50/95 sm:items-center sm:text-[12px]">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-200 sm:mt-0" aria-hidden />
            <span>
              Syndicate Mode is locked for your plan (Money Mastery includes courses only). Upgrade to The Knight to
              unlock missions and the 24h board here.
            </span>
          </div>
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h3
                id="syndicate-dashboard-snapshot-title"
                className="font-mono text-[clamp(1.05rem,2vw+0.55rem,1.45rem)] font-black uppercase italic tracking-[0.07em] text-[color:var(--gold)]/95 drop-shadow-[0_0_20px_rgba(250,204,21,0.2)]"
              >
                Syndicate Mode
              </h3>
              {syndicateNavLocked ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/45 bg-black/40 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-100/95">
                  <Lock className="h-3 w-3" aria-hidden />
                  Locked
                </span>
              ) : null}
              {rows.length > 0 ? (
                <span className="rounded-full border border-cyan-400/35 bg-cyan-500/[0.12] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100/90">
                  Board active
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-[46rem] text-[clamp(0.82rem,1vw+0.62rem,1.02rem)] font-medium leading-relaxed text-white/72">
              Build <span className="font-semibold text-cyan-200/92">streaks</span>, unlock{" "}
              <span className="font-semibold text-[color:var(--gold)]/90">levels</span>, and{" "}
              <span className="font-semibold text-emerald-200/88">earn points</span> — then keep your edge on the 24h board.
            </p>
            {!apiReached && rows.length > 0 ? (
              <p className="mt-2 text-[12px] text-amber-200/78">Board sync limited — showing what’s saved on this device.</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <motion.button
              type="button"
              onClick={() => refresh()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg border border-cyan-400/35 bg-cyan-500/[0.1] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100/92 shadow-[0_0_20px_rgba(34,211,238,0.12)] hover:border-cyan-300/55"
            >
              Refresh
            </motion.button>
            <motion.button
              type="button"
              onClick={() => onNavigate("monk")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg border border-[rgba(250,204,21,0.42)] bg-[rgba(250,204,21,0.08)] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/95 hover:border-[rgba(250,204,21,0.62)]"
            >
              Open mode →
            </motion.button>
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]" aria-busy>
            <div className="h-52 animate-pulse rounded-xl bg-white/[0.06]" />
            <div className="h-52 animate-pulse rounded-xl bg-white/[0.06] lg:h-auto" />
          </div>
        ) : null}

        {!loading && error && rows.length === 0 ? (
          <div className="mt-6 rounded-xl border border-red-500/28 bg-red-950/20 px-4 py-4 text-[14px] text-red-200/90">
            {error}
            <button
              type="button"
              onClick={() => refresh()}
              className="mt-3 block text-[12px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/95 underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading && (rows.length > 0 || (!error && rows.length === 0)) ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-stretch">
            {/* Mission — primary column */}
            <div className="flex min-h-0 flex-col rounded-xl border border-cyan-500/22 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(34,211,238,0.12)] sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-cyan-400/15 pb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/75">Mission</span>
                <Target className="h-5 w-5 shrink-0 text-cyan-300/75" aria-hidden />
              </div>
              <div className="min-h-0 flex-1 pt-4">
                {primaryMission ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-white/38">#{primaryMission.id}</span>
                      {primaryMission.completed ? (
                        <span className="rounded border border-white/16 bg-white/[0.06] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
                          Completed
                        </span>
                      ) : null}
                    </div>
                    <h4
                      className={cn(
                        "text-[clamp(1rem,1.3vw+0.78rem,1.28rem)] font-bold leading-snug text-white/93",
                        primaryMission.completed && "line-through decoration-white/35"
                      )}
                    >
                      {primaryMission.title}
                    </h4>
                    {primaryMission.subtitle ? (
                      <p className="text-[clamp(0.85rem,0.85vw+0.62rem,0.98rem)] leading-relaxed text-white/58">
                        {primaryMission.subtitle}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="rounded-md border border-white/14 bg-black/35 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white/55">
                        {primaryMission.mood}
                      </span>
                      <span className="rounded-md border border-white/14 bg-black/35 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white/55">
                        {primaryMission.category}
                      </span>
                      {primaryMission.difficulty && primaryMission.difficulty !== "—" ? (
                        <span
                          className={cn(
                            "rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em]",
                            syndicateDifficultyChipClass(primaryMission.difficulty)
                          )}
                        >
                          {primaryMission.difficulty}
                        </span>
                      ) : null}
                      {primaryMission.onBoard ? (
                        <span className="rounded-md border border-cyan-500/38 bg-cyan-500/12 px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-cyan-100/85">
                          On 24h board
                        </span>
                      ) : (
                        <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white/38">
                          Off board
                        </span>
                      )}
                      {primaryMission.points > 0 ? (
                        <span className="self-center text-[12px] font-black uppercase tracking-[0.08em] text-[color:var(--gold)]/88">
                          +{primaryMission.points} pts
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-black/30 px-3 py-6 text-center">
                    <p className="text-[clamp(0.9rem,0.95vw+0.65rem,1.02rem)] font-semibold text-white/62">No mission on your board right now.</p>
                    <p className="mt-2 max-w-sm text-[13px] text-white/42">Open Syndicate Mode to pull today’s missions onto the board.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reminder — secondary column */}
            <div className="flex min-h-0 flex-col rounded-xl border border-amber-400/18 bg-[#070605]/90 p-4 shadow-[inset_0_1px_0_rgba(250,204,21,0.08)] sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-amber-400/12 pb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/70">Reminder</span>
                <Bell className="h-5 w-5 shrink-0 text-amber-200/65" aria-hidden />
              </div>
              <div className="min-h-0 flex-1 pt-4">
                {primaryReminder && primaryReminder.reminderAtMs != null && primaryReminder.reminderAtMs > Date.now() ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-cyan-400/28 bg-gradient-to-b from-cyan-500/12 via-black/35 to-transparent px-3 py-4 sm:px-4 sm:py-5">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/82">Next up</div>
                      <p className="mt-2 text-[clamp(0.95rem,1.1vw+0.72rem,1.12rem)] font-bold leading-snug text-white/90">{primaryReminder.title}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/15">
                        <Bell className="h-5 w-5 text-cyan-100/95" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200/80">Rings in</div>
                        <div className="mt-1 font-mono text-[clamp(1.25rem,2vw+0.85rem,1.85rem)] font-black tabular-nums leading-none text-cyan-50">
                          {formatSyndicateReminderCountdown(primaryReminder.reminderAtMs, Date.now())}
                        </div>
                        <div className="mt-2 text-[12px] text-white/52">{formatSyndicateReminderWhen(primaryReminder.reminderAtMs)}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-black/30 px-3 py-6 text-center">
                    <p className="text-[clamp(0.9rem,0.95vw+0.65rem,1.02rem)] font-semibold text-white/62">No reminder scheduled.</p>
                    <p className="mt-2 max-w-sm text-[13px] text-white/42">Set one on a mission card inside Syndicate Mode.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {!loading && rows.length === 0 && !error ? (
          <motion.button
            type="button"
            onClick={() => onNavigate("monk")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 w-full rounded-xl border border-cyan-400/40 bg-cyan-500/14 py-3.5 text-[13px] font-black uppercase tracking-[0.16em] text-cyan-50/95 hover:border-cyan-300/55 md:w-auto md:px-12"
          >
            Open Syndicate Mode
          </motion.button>
        ) : null}

        {!loading && rows.length > 0 && !linkedAccount ? (
          <p className="mt-4 text-[12px] leading-relaxed text-white/45">Sign in from Syndicate Mode to sync missions and reminders across devices.</p>
        ) : null}
      </div>
    </motion.section>
  );
}

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Timeline strip: uppercase compact relative time (matches HUD reference). */
function timeAgoCaps(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}S AGO`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}M AGO`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H AGO`;
  const d = Math.floor(h / 24);
  return `${d}D AGO`;
}

function formatActivityWhen(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

const ACTIVITY_CAT_LABEL: Record<ActivityCategory, string> = {
  program: "PROGRAM",
  syndicate: "SYNDICATE",
  affiliate: "AFFILIATE",
  system: "SYSTEM"
};

/** Full-log modal: per-category borders, chips, and detail panel accents. */
const ACTIVITY_CATEGORY_CHROME: Record<
  ActivityCategory,
  { listRow: string; chip: string; detailShell: string; typeGlow: string }
> = {
  system: {
    listRow:
      "border-2 border-amber-400/50 bg-gradient-to-br from-amber-950/35 via-black/78 to-black/90 shadow-[0_0_36px_rgba(251,191,36,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]",
    chip:
      "rounded-lg border-2 border-amber-400/55 bg-amber-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.35)] sm:text-sm",
    detailShell:
      "border-2 border-amber-400/35 bg-gradient-to-b from-amber-950/20 to-black/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_24px_rgba(251,191,36,0.08)]",
    typeGlow: "font-bold text-amber-200 [text-shadow:0_0_14px_rgba(251,191,36,0.45)]",
  },
  program: {
    listRow:
      "border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-950/30 via-black/78 to-black/90 shadow-[0_0_36px_rgba(34,211,238,0.16),inset_0_1px_0_rgba(255,255,255,0.05)]",
    chip:
      "rounded-lg border-2 border-cyan-400/55 bg-cyan-500/15 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.32)] sm:text-sm",
    detailShell:
      "border-2 border-cyan-400/35 bg-gradient-to-b from-cyan-950/18 to-black/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_24px_rgba(34,211,238,0.1)]",
    typeGlow: "font-bold text-cyan-200 [text-shadow:0_0_14px_rgba(34,211,238,0.4)]",
  },
  syndicate: {
    listRow:
      "border-2 border-violet-400/50 bg-gradient-to-br from-violet-950/35 via-black/78 to-black/90 shadow-[0_0_36px_rgba(167,139,250,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]",
    chip:
      "rounded-lg border-2 border-violet-400/55 bg-violet-500/18 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-violet-50 shadow-[0_0_18px_rgba(167,139,250,0.35)] sm:text-sm",
    detailShell:
      "border-2 border-violet-400/38 bg-gradient-to-b from-violet-950/22 to-black/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_24px_rgba(139,92,246,0.12)]",
    typeGlow: "font-bold text-violet-200 [text-shadow:0_0_14px_rgba(167,139,250,0.45)]",
  },
  affiliate: {
    listRow:
      "border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-950/30 via-black/78 to-black/90 shadow-[0_0_36px_rgba(52,211,153,0.16),inset_0_1px_0_rgba(255,255,255,0.05)]",
    chip:
      "rounded-lg border-2 border-emerald-400/55 bg-emerald-500/18 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-50 shadow-[0_0_18px_rgba(52,211,153,0.32)] sm:text-sm",
    detailShell:
      "border-2 border-emerald-400/35 bg-gradient-to-b from-emerald-950/18 to-black/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_24px_rgba(16,185,129,0.1)]",
    typeGlow: "font-bold text-emerald-200 [text-shadow:0_0_14px_rgba(52,211,153,0.4)]",
  },
};

const ACTIVITY_RECENT_WINDOW_MS = 2 * 60 * 1000;

const ACTIVITY_TIMELINE_DOT: Record<ActivityCategory, { bg: string; glow: string; ring: string }> = {
  system: {
    bg: "rgba(251, 191, 36, 0.95)",
    glow: "0 0 16px rgba(251,191,36,0.85), 0 0 32px rgba(251,191,36,0.35)",
    ring: "border-amber-400/70",
  },
  program: {
    bg: "rgba(34, 211, 238, 0.95)",
    glow: "0 0 16px rgba(34,211,238,0.85), 0 0 32px rgba(34,211,238,0.35)",
    ring: "border-cyan-400/70",
  },
  syndicate: {
    bg: "rgba(167, 139, 250, 0.95)",
    glow: "0 0 16px rgba(167,139,250,0.85), 0 0 32px rgba(139,92,246,0.35)",
    ring: "border-violet-400/70",
  },
  affiliate: {
    bg: "rgba(52, 211, 153, 0.95)",
    glow: "0 0 16px rgba(52,211,153,0.85), 0 0 32px rgba(16,185,129,0.35)",
    ring: "border-emerald-400/70",
  },
};

function activityStructuredFields(a: ActivityItem) {
  const when = formatActivityWhen(a.ts);
  const rel = timeAgo(a.ts);
  const type = ACTIVITY_CAT_LABEL[a.category];
  const headline = a.detail?.trim() || null;
  const story = a.moreDetails?.trim() || null;
  const path = a.route?.trim() || null;
  return { when, rel, type, headline, story, path };
}

/** Concise labeled block for one event (timeline details + full log). */
function ActivityEventDetailBlock({ a, size = "default" }: { a: ActivityItem; size?: "default" | "prominent" }) {
  const f = activityStructuredFields(a);
  const chrome = size === "prominent" ? ACTIVITY_CATEGORY_CHROME[a.category] : null;
  const lg = size === "prominent";
  const detailFallback =
    !f.story && !f.headline && !f.path ? "No extra description was stored for this entry." : null;
  return (
    <div
      className={cn(
        lg && chrome
          ? cn("rounded-xl px-4 py-3.5 sm:px-5 sm:py-4", chrome.detailShell)
          : "rounded-md border border-[rgba(255,215,0,0.14)] bg-black/40 px-3 py-2.5",
      )}
    >
      <div className={cn("font-bold leading-snug text-white/92", lg ? "text-base sm:text-lg" : "text-sm sm:text-base")}>
        {a.title}
      </div>
      <dl
        className={cn(
          "mt-2 grid leading-snug",
          lg ? "grid-cols-[minmax(0,7rem)_1fr] gap-x-4 gap-y-3 text-sm sm:text-base" : "grid-cols-[minmax(0,5.5rem)_1fr] gap-x-3 gap-y-2 text-xs sm:text-sm",
        )}
      >
        <dt
          className={cn(
            "font-bold uppercase tracking-[0.08em]",
            lg ? "text-cyan-300/90" : "text-white/38",
          )}
        >
          When
        </dt>
        <dd className={cn("text-white/78", lg && "text-white/82")}>
          {f.when}
          <span className={cn("text-white/45", lg && "text-violet-200/55")}> · {f.rel}</span>
        </dd>
        <dt
          className={cn(
            "font-bold uppercase tracking-[0.08em]",
            lg ? "text-fuchsia-300/88" : "text-white/38",
          )}
        >
          Type
        </dt>
        <dd className={chrome ? chrome.typeGlow : "text-[color:var(--goals-milestones-gold)]/88"}>{f.type}</dd>
        {f.headline ? (
          <>
            <dt
              className={cn(
                "font-bold uppercase tracking-[0.08em]",
                lg ? "text-amber-200/85" : "text-white/38",
              )}
            >
              Summary
            </dt>
            <dd className={cn("text-white/65", lg && "text-white/72")}>{f.headline}</dd>
          </>
        ) : null}
        {f.path ? (
          <>
            <dt
              className={cn(
                "font-bold uppercase tracking-[0.08em]",
                lg ? "text-emerald-300/85" : "text-white/38",
              )}
            >
              Path
            </dt>
            <dd className={cn("break-all font-mono text-cyan-200/75", lg && "text-[13px] text-cyan-200/88 sm:text-[14px]")}>
              {f.path}
            </dd>
          </>
        ) : null}
        {f.story ? (
          <>
            <dt
              className={cn(
                "font-bold uppercase tracking-[0.08em]",
                lg ? "text-violet-300/88" : "text-white/38",
              )}
            >
              Details
            </dt>
            <dd className={cn("whitespace-pre-wrap break-words text-white/62", lg && "text-white/70")}>{f.story}</dd>
          </>
        ) : detailFallback ? (
          <>
            <dt
              className={cn(
                "font-bold uppercase tracking-[0.08em]",
                lg ? "text-violet-300/88" : "text-white/38",
              )}
            >
              Details
            </dt>
            <dd className={cn("text-white/50", lg && "text-white/58")}>{detailFallback}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

function HeroStatusPanel({
  themeMode,
  userName,
  userRole,
  profileAvatar,
  snapshots,
  onNavigate,
  syndicateNavLocked
}: {
  themeMode: ThemeMode;
  userName: string;
  userRole: string;
  profileAvatar: string;
  snapshots: DashboardSnapshots;
  onNavigate: (nav: DashboardNavKey) => void;
  syndicateNavLocked?: boolean;
}) {
  const s = snapshots;
  const t = themeAccent(themeMode);
  const ongoingPrograms = s.programs.length;
  const completedMissionCount = s.syndicate.completedMissionsCount ?? 0;
  const pendingMissionCount = s.syndicate.pendingMissionsCount ?? (s.syndicate.activeLiveMissionCount ?? (s.syndicate.activeMissionTitle ? 1 : 0));
  const totalMissionPoints = s.syndicate.missionPointsTotal ?? 0;
  return (
    <div
      className="cut-frame cyber-frame gold-stroke relative w-full max-w-none overflow-hidden border-2 border-[rgba(255,198,62,0.62)] bg-[#060400]/92 p-5 backdrop-blur-[12px] md:p-6 lg:p-7"
      style={{ borderColor: "rgba(255,198,62,0.62)", boxShadow: `0 0 0 1px rgba(255,198,62,0.38), 0 0 95px rgba(255,198,62,0.45), 0 0 120px ${t.glow}` }}
    >
      <div className="absolute inset-0 opacity-[0.96] [background:radial-gradient(980px_580px_at_25%_0%,rgba(255,198,62,0.28),rgba(0,0,0,0)_64%)]" />
      <div className="absolute inset-0 opacity-55 [background:radial-gradient(900px_380px_at_90%_0%,rgba(255,172,39,0.2),rgba(0,0,0,0)_62%)]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={profileAvatar}
            alt="Profile avatar"
            className="h-16 w-16 rounded-lg border border-[rgba(255,215,0,0.5)] bg-black/30 object-cover p-0.5 shadow-[0_0_24px_rgba(255,215,0,0.35)]"
          />
          <div className="min-w-0">
            <div className="font-mono text-[16px] font-black uppercase tracking-[0.15em] text-[color:var(--gold)] [text-shadow:0_0_18px_rgba(255,215,0,0.62)]">
              {userName}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/84">
              {userRole} • Level system: <span className="text-white/80">Level {s.syndicate.level}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="group relative inline-flex items-center gap-2 rounded-md border border-[rgba(255,198,62,0.46)] bg-black/40 px-2 py-1 shadow-[0_0_20px_rgba(255,198,62,0.24)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/22" fill="none" aria-hidden="true">
                  <path d="M12 3.8l6.2 3.6v7.2L12 18.2l-6.2-3.6V7.4L12 3.8Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7.8 9.2h8.4M7.8 12h6.2M7.8 14.8h8.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                </svg>
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
                  Level {s.syndicate.level}
                </span>
                <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-50 hidden w-[280px] -translate-x-1/2 rounded-md border border-white/10 bg-black/90 p-2 text-[11px] text-white/70 shadow-[0_0_28px_rgba(34,211,238,0.18)] group-hover:block">
                  <div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">Syndicate rewards</div>
                  <div className="mt-1">
                    {typeof s.syndicate.pointsToNext === "number" && s.syndicate.pointsToNext > 0 ? (
                      <>
                        Earn <span className="font-mono font-black text-white/90">{s.syndicate.pointsToNext}</span> more mission
                        {s.syndicate.pointsToNext === 1 ? " point" : " points"} to reach{" "}
                        <span className="text-amber-200">{s.syndicate.nextRankLabel}</span> (same ladder as Unlock &amp; redeem).
                      </>
                    ) : s.syndicate.pointsToNext === 0 ? (
                      <>You have cleared every mission-points tier in the current ladder.</>
                    ) : (
                      <>Complete missions in Syndicate Mode to advance the rewards ladder.</>
                    )}
                  </div>
                </div>
              </div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/58">Syndicate level</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="grid w-full max-w-none grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-4">
            <button
              type="button"
              onClick={() => onNavigate("programs")}
              className={cn(
                "flex min-h-[8.75rem] w-full flex-col items-center justify-between rounded-md border-2 border-cyan-400/55 bg-gradient-to-br from-cyan-500/[0.14] to-black/65 px-3 py-3 text-center transition duration-300",
                "shadow-[0_0_0_1px_rgba(34,211,238,0.22),0_0_28px_rgba(34,211,238,0.28),0_0_52px_rgba(6,182,212,0.12)]",
                "hover:border-cyan-200/75 hover:bg-gradient-to-br hover:from-cyan-400/[0.2] hover:to-black/72",
                "hover:shadow-[0_0_0_1px_rgba(103,232,249,0.45),0_0_40px_rgba(34,211,238,0.42),0_0_88px_rgba(6,182,212,0.22)]"
              )}
            >
              <div className="w-full text-[10px] font-extrabold uppercase leading-tight tracking-[0.16em] text-cyan-100">
                Active programs
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
                <div
                  className="font-mono text-[22px] font-black leading-none tabular-nums text-white"
                  style={{ textShadow: "0 0 22px rgba(34,211,238,0.55), 0 0 40px rgba(6,182,212,0.25)" }}
                >
                  {ongoingPrograms}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/78">Ongoing</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("monk")}
              className={cn(
                "flex min-h-[8.75rem] w-full flex-col items-center justify-between rounded-md border-2 border-emerald-400/55 bg-gradient-to-br from-emerald-500/[0.14] to-black/65 px-3 py-3 text-center transition duration-300",
                "shadow-[0_0_0_1px_rgba(52,211,153,0.22),0_0_28px_rgba(52,211,153,0.26),0_0_52px_rgba(16,185,129,0.12)]",
                "hover:border-emerald-200/75 hover:bg-gradient-to-br hover:from-emerald-400/[0.2] hover:to-black/72",
                "hover:shadow-[0_0_0_1px_rgba(110,231,183,0.42),0_0_40px_rgba(52,211,153,0.4),0_0_88px_rgba(16,185,129,0.2)]",
                syndicateNavLocked && "opacity-80 ring-1 ring-emerald-500/35"
              )}
            >
              <div className="flex w-full items-center justify-center gap-1 text-[10px] font-extrabold uppercase leading-tight tracking-[0.16em] text-emerald-100">
                Syndicate Completed Missions
                {syndicateNavLocked ? <Lock className="h-3 w-3 shrink-0 text-emerald-200/90" aria-hidden /> : null}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
                <div
                  className="font-mono text-[22px] font-black leading-none tabular-nums text-white"
                  style={{ textShadow: "0 0 22px rgba(52,211,153,0.5), 0 0 40px rgba(16,185,129,0.22)" }}
                >
                  {completedMissionCount}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-200/78">From challenges</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("monk")}
              className={cn(
                "flex min-h-[8.75rem] w-full flex-col items-center justify-between rounded-md border-2 border-amber-400/58 bg-gradient-to-br from-amber-400/[0.14] to-black/65 px-3 py-3 text-center transition duration-300",
                "shadow-[0_0_0_1px_rgba(251,191,36,0.24),0_0_28px_rgba(251,191,36,0.28),0_0_52px_rgba(245,158,11,0.14)]",
                "hover:border-amber-200/78 hover:bg-gradient-to-br hover:from-amber-300/[0.2] hover:to-black/72",
                "hover:shadow-[0_0_0_1px_rgba(253,224,71,0.42),0_0_40px_rgba(251,191,36,0.42),0_0_88px_rgba(234,88,12,0.18)]",
                syndicateNavLocked && "opacity-80 ring-1 ring-amber-500/35"
              )}
            >
              <div className="flex w-full items-center justify-center gap-1 text-[10px] font-extrabold uppercase leading-tight tracking-[0.16em] text-amber-100">
                Syndicate Pending Missions
                {syndicateNavLocked ? <Lock className="h-3 w-3 shrink-0 text-amber-200/90" aria-hidden /> : null}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
                <div
                  className="font-mono text-[22px] font-black leading-none tabular-nums text-white"
                  style={{ textShadow: "0 0 22px rgba(251,191,36,0.48), 0 0 40px rgba(245,158,11,0.22)" }}
                >
                  {pendingMissionCount}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200/78">In challenges</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("monk")}
              className={cn(
                "flex min-h-[8.75rem] w-full flex-col items-center justify-between rounded-md border-2 border-fuchsia-400/55 bg-gradient-to-br from-fuchsia-500/[0.14] to-black/65 px-3 py-3 text-center transition duration-300",
                "shadow-[0_0_0_1px_rgba(232,121,249,0.22),0_0_28px_rgba(217,70,239,0.28),0_0_52px_rgba(192,38,211,0.12)]",
                "hover:border-fuchsia-200/75 hover:bg-gradient-to-br hover:from-fuchsia-400/[0.2] hover:to-black/72",
                "hover:shadow-[0_0_0_1px_rgba(240,171,252,0.42),0_0_40px_rgba(217,70,239,0.4),0_0_88px_rgba(168,85,247,0.2)]",
                syndicateNavLocked && "opacity-80 ring-1 ring-fuchsia-500/35"
              )}
            >
              <div className="flex w-full items-center justify-center gap-1 text-[10px] font-extrabold uppercase leading-tight tracking-[0.16em] text-fuchsia-100">
                Total points
                {syndicateNavLocked ? <Lock className="h-3 w-3 shrink-0 text-fuchsia-200/90" aria-hidden /> : null}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
                <div
                  className="font-mono text-[22px] font-black leading-none tabular-nums text-white"
                  style={{ textShadow: "0 0 22px rgba(217,70,239,0.52), 0 0 44px rgba(168,85,247,0.22)" }}
                >
                  {totalMissionPoints}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-fuchsia-200/78">Mission pool</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="rounded-md border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
          style={{
            borderColor: accentByKey("alerts").border,
            background: accentByKey("alerts").fill,
            color: accentByKey("alerts").text,
            boxShadow: `0 0 22px ${accentByKey("alerts").glow}`
          }}
        >
          Streak: {s.syndicate.streakDays} days
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button
            type="button"
            onClick={() => onNavigate("programs")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md border bg-black/30 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--gold)]/95 hover:bg-black/45"
            style={{ borderColor: accentByKey("energy").border, boxShadow: `0 0 20px ${accentByKey("energy").glow}` }}
          >
            Continue Program
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onNavigate("monk")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border bg-black/30 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] hover:bg-black/45",
              syndicateNavLocked && "opacity-85 ring-1 ring-amber-500/35"
            )}
            style={{ borderColor: accentByKey("monk").border, color: accentByKey("monk").text, boxShadow: `0 0 20px ${accentByKey("monk").glow}` }}
          >
            Join Challenge
            {syndicateNavLocked ? <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
          </motion.button>
        </div>
      </div>

    </div>
  );
}

function ActivityTimelineCard({ themeMode }: { themeMode: ThemeMode }) {
  const { items } = useActivityTimeline();
  const [recentDetailsOpen, setRecentDetailsOpen] = useState(false);
  const [fullLogOpen, setFullLogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const recentWindowItems = useMemo(() => {
    const cutoff = nowMs - ACTIVITY_RECENT_WINDOW_MS;
    return items.filter((a) => a.ts >= cutoff).sort((a, b) => b.ts - a.ts);
  }, [items, nowMs]);

  const t = themeAccent(themeMode);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const intervalId = window.setInterval(tick, 10_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!fullLogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullLogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullLogOpen]);

  useEffect(() => {
    if (!fullLogOpen || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullLogOpen]);

  const fullLogModal = mounted
    ? createPortal(
        <AnimatePresence>
          {fullLogOpen ? (
            <motion.div
              key="activity-full-log"
              className="fixed inset-0 z-[240] flex items-center justify-center p-2 sm:p-5 md:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/75 backdrop-blur-[3px]"
                aria-label="Close activity log"
                onClick={() => setFullLogOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="activity-full-log-title"
                className="relative z-[1] flex max-h-[min(92vh,940px)] min-h-0 w-[min(96vw,960px)] max-w-[960px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-400/40 bg-[#050508]/96 p-[2px] shadow-[0_0_0_1px_rgba(168,85,247,0.3),0_0_72px_rgba(34,211,238,0.28),0_0_120px_rgba(217,70,239,0.18)] sm:rounded-3xl"
                style={{
                  backgroundImage:
                    "linear-gradient(145deg, rgba(34,211,238,0.4), rgba(168,85,247,0.35), rgba(251,191,36,0.32))",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.08), 0 0 64px rgba(34,211,238,0.22), 0 0 120px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.07)",
                }}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex max-h-[inherit] min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[#07070c]/98 sm:rounded-[22px]">
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-cyan-400/25 bg-gradient-to-r from-black/85 via-fuchsia-950/25 to-black/85 px-4 py-4 sm:px-6 sm:py-5">
                  <div>
                    <div
                      id="activity-full-log-title"
                      className="text-base font-black uppercase tracking-[0.2em] text-cyan-100 [text-shadow:0_0_22px_rgba(34,211,238,0.5)] sm:text-lg sm:tracking-[0.22em]"
                    >
                      Full activity log
                    </div>
                    <div className="mt-1 text-sm text-fuchsia-200/65 sm:text-base">
                      {items.length} entr{items.length === 1 ? "y" : "ies"} — same layout as timeline details
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullLogOpen(false)}
                    className="rounded-xl border-2 border-fuchsia-400/50 bg-black/50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.35)] transition hover:border-fuchsia-300/75 hover:shadow-[0_0_36px_rgba(217,70,239,0.48)] sm:text-sm"
                  >
                    Close
                  </button>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4 sm:space-y-4 sm:p-6 [scrollbar-color:rgba(34,211,238,0.5)_rgba(0,0,0,0.45)]">
                  {items.length === 0 ? (
                    <p className="px-2 text-center text-base leading-relaxed text-white/65 sm:text-lg">
                      Nothing logged yet. Switch sections, open Goals &amp; Milestones, pick a course, or visit another app
                      route.
                    </p>
                  ) : (
                    items.map((a) => {
                      const cat = ACTIVITY_CATEGORY_CHROME[a.category];
                      return (
                      <div
                        key={a.id}
                        className={cn("rounded-xl px-4 py-3.5 sm:rounded-2xl sm:px-5 sm:py-4", cat.listRow)}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="min-w-0 text-base font-bold leading-snug text-white/92 sm:text-lg">
                            {a.title}
                          </span>
                          <span className={cat.chip}>
                            {ACTIVITY_CAT_LABEL[a.category]}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/48 sm:text-sm">
                            {timeAgoCaps(a.ts)} · {formatActivityWhen(a.ts)}
                          </span>
                        </div>
                        {a.detail ? (
                          <div className="mt-2 text-sm leading-relaxed text-white/58 sm:text-base">{a.detail}</div>
                        ) : null}
                        <div className="mt-3">
                          <ActivityEventDetailBlock a={a} size="prominent" />
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <>
      {fullLogModal}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        whileHover={{ y: -2 }}
        className="dashboard-card cyber-corners group relative w-full max-w-none overflow-hidden rounded-2xl p-[2px] transition-[box-shadow,transform] duration-500"
        style={{
          background:
            "linear-gradient(135deg, rgba(34,211,238,0.7), rgba(129,140,248,0.55), rgba(251,191,36,0.52), rgba(244,114,182,0.55))",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.07), 0 0 52px rgba(168,85,247,0.24), 0 0 100px rgba(34,211,238,0.16), 0 0 140px rgba(251,191,36,0.08), 0 0 80px ${t.glow}`,
        }}
      >
        <div className="cut-frame cyber-frame relative overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#050508]/96 backdrop-blur-[14px]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.9] [background:radial-gradient(920px_440px_at_10%_0%,rgba(34,211,238,0.18),transparent_56%),radial-gradient(820px_400px_at_95%_0%,rgba(167,139,250,0.16),transparent_54%),radial-gradient(720px_380px_at_50%_100%,rgba(251,191,36,0.09),transparent_52%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:22px_22px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:linear-gradient(105deg,transparent_38%,rgba(34,211,238,0.07)_48%,rgba(244,114,182,0.06)_58%,transparent_70%)]"
            aria-hidden
          />

          <div className="relative border-b border-cyan-400/25 bg-gradient-to-r from-black/70 via-violet-950/20 to-black/70 px-4 py-4 sm:px-6 sm:py-5">
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
              aria-hidden
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-cyan-400/60 bg-black/55 shadow-[0_0_40px_rgba(34,211,238,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-14 sm:w-14">
                  <span
                    className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse"
                    aria-hidden
                  />
                  <Activity
                    className="h-5 w-5 text-cyan-100 [filter:drop-shadow(0_0_14px_rgba(34,211,238,0.95))] sm:h-6 sm:w-6"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="bg-gradient-to-r from-amber-200 via-cyan-200 to-fuchsia-200 bg-clip-text text-lg font-black uppercase leading-tight tracking-[0.18em] text-transparent sm:text-xl md:text-2xl">
                    Activity timeline
                  </h2>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.12em] text-fuchsia-200/60 sm:text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                      Live
                    </span>
                    <span>2 min window</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFullLogOpen(true)}
                  className="rounded-lg border-2 border-fuchsia-400/50 bg-black/50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-100 shadow-[0_0_22px_rgba(217,70,239,0.35)] transition hover:border-fuchsia-300/75 hover:bg-black/60 hover:shadow-[0_0_32px_rgba(217,70,239,0.5)] sm:text-sm"
                >
                  Full log
                </button>
                <div className="rounded-lg border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/15 to-black/60 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.35)] sm:text-sm">
                  2 min
                </div>
              </div>
            </div>
          </div>

          <div className="relative px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
            <div className="rounded-xl border border-violet-500/25 bg-gradient-to-b from-violet-950/10 to-transparent p-[1px] shadow-[0_0_44px_rgba(139,92,246,0.15)]">
              <div className="rounded-[11px] border border-cyan-400/15 bg-[#06060c]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="min-h-[min(38vh,340px)] max-h-[min(64vh,660px)] overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-5 sm:py-5 sm:pr-3 [scrollbar-color:rgba(34,211,238,0.42)_rgba(0,0,0,0.4)]">
                  {items.length === 0 ? (
                    <div className="rounded-xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-950/30 via-black/55 to-fuchsia-950/25 px-6 py-12 text-center shadow-[0_0_48px_rgba(34,211,238,0.14),0_0_64px_rgba(168,85,247,0.1)]">
                      <p className="text-sm leading-relaxed text-white/72 sm:text-base">
                        Your moves are logged automatically—open a section, a course, use quick search, or Goals &amp; Milestones.
                        The panel below shows the{" "}
                        <span className="font-semibold text-cyan-200 [text-shadow:0_0_14px_rgba(34,211,238,0.45)]">last 2 minutes</span>
                        ; use <span className="font-semibold text-fuchsia-200 [text-shadow:0_0_14px_rgba(232,121,249,0.4)]">Full log</span> for
                        everything else.
                      </p>
                    </div>
                  ) : recentWindowItems.length === 0 ? (
                    <div className="rounded-xl border-2 border-amber-400/35 bg-gradient-to-br from-amber-950/25 via-black/55 to-violet-950/20 px-6 py-12 text-center shadow-[0_0_48px_rgba(251,191,36,0.14),0_0_56px_rgba(139,92,246,0.1)]">
                      <p className="text-sm font-semibold text-white/82 sm:text-base">Nothing in the last 2 minutes.</p>
                      <p className="mt-3 text-xs leading-relaxed text-white/58 sm:text-sm">
                        Older activity is still saved — open{" "}
                        <span className="font-semibold text-fuchsia-200/95 [text-shadow:0_0_12px_rgba(232,121,249,0.45)]">Full log</span> to
                        review it.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-emerald-400/35 bg-gradient-to-br from-emerald-950/18 via-black/48 to-cyan-950/22 px-4 py-4 shadow-[0_0_48px_rgba(52,211,153,0.14),0_0_56px_rgba(34,211,238,0.12)] sm:px-5 sm:py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100 [text-shadow:0_0_18px_rgba(34,211,238,0.5)] sm:text-base">
                            Last 2 minutes
                          </div>
                          <p className="mt-1.5 text-xs leading-snug text-white/65 sm:text-sm">
                            <span className="font-bold tabular-nums text-emerald-200">{recentWindowItems.length}</span>{" "}
                            {recentWindowItems.length === 1 ? "event" : "events"} · newest{" "}
                            <span className="font-semibold text-violet-200/90">{timeAgo(recentWindowItems[0]!.ts)}</span>
                          </p>
                          <ul className="relative mt-4 list-none space-y-0 p-0 pl-1">
                            <div
                              className="pointer-events-none absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-cyan-400/70 via-violet-400/50 to-transparent"
                              aria-hidden
                            />
                            {recentWindowItems.slice(0, 6).map((a, idx) => {
                              const dot = ACTIVITY_TIMELINE_DOT[a.category];
                              const cat = ACTIVITY_CATEGORY_CHROME[a.category];
                              return (
                                <motion.li
                                  key={a.id}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.22, delay: idx * 0.04 }}
                                  className="relative flex gap-3 pb-4 last:pb-0"
                                >
                                  <span
                                    className={cn(
                                      "relative z-[1] mt-1.5 inline-flex h-5 w-5 shrink-0 rounded-full border-2 bg-black/80",
                                      dot.ring,
                                    )}
                                    style={{ background: dot.bg, boxShadow: dot.glow }}
                                    aria-hidden
                                  />
                                  <div
                                    className={cn(
                                      "min-w-0 flex-1 rounded-lg border px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-4 sm:py-3",
                                      cat.listRow.replace("border-2", "border"),
                                    )}
                                  >
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                      <span className="font-mono text-xs font-bold tabular-nums text-cyan-200/80 sm:text-sm">
                                        {new Date(a.ts).toLocaleTimeString(undefined, {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit",
                                        })}
                                      </span>
                                      <span className={cat.chip}>{ACTIVITY_CAT_LABEL[a.category]}</span>
                                    </div>
                                    <p className="mt-1.5 text-sm font-semibold leading-snug text-white/92 sm:text-base">
                                      {a.title}
                                    </p>
                                    {a.detail ? (
                                      <p className="mt-1 text-xs leading-relaxed text-white/55 sm:text-sm">{a.detail}</p>
                                    ) : null}
                                  </div>
                                </motion.li>
                              );
                            })}
                          </ul>
                          {recentWindowItems.length > 6 ? (
                            <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-fuchsia-200/55 sm:text-sm">
                              +{recentWindowItems.length - 6} more in details
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setRecentDetailsOpen((o) => !o)}
                          className="shrink-0 rounded-lg border-2 border-violet-400/50 bg-black/50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.35)] transition hover:border-violet-300/75 hover:shadow-[0_0_26px_rgba(139,92,246,0.5)] sm:text-sm"
                        >
                          {recentDetailsOpen ? "Hide" : "Details"}
                        </button>
                      </div>
                      <AnimatePresence initial={false}>
                        {recentDetailsOpen ? (
                          <motion.div
                            key="recent-activity-details"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-5 space-y-4 border-t border-violet-400/30 pt-5">
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-200/65 sm:text-sm">
                                Everything in this window — newest first
                              </p>
                              <div className="space-y-4">
                                {recentWindowItems.map((a, idx) => (
                                  <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                                  >
                                    <ActivityEventDetailBlock a={a} />
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export type DashboardControlCenterProps = {
  themeMode: ThemeMode;
  userName: string;
  userRole: string;
  profileAvatar: string;
  courses: DashboardCourseLike[];
  onNavigate: (nav: DashboardNavKey) => void;
  /** From `/api/auth/me/` — Money Mastery locks Syndicate + membership + goals FAB. */
  dashboardNavLocks?: { monk?: boolean; resources?: boolean; goals?: boolean; dashboard?: boolean } | null;
};

export default function DashboardControlCenter({
  themeMode,
  userName,
  userRole,
  profileAvatar,
  courses,
  onNavigate,
  dashboardNavLocks
}: DashboardControlCenterProps) {
  const { snapshots } = useDashboardSnapshots({ userName, courses });
  const integrityHigh = snapshots.coreIntegrity.integrityPct > 90;
  const syndicateLocked = !!dashboardNavLocks?.monk;

  return (
    <>
      {/* Reminders surface inside Syndicate Mode only (not on main dashboard overview). */}
      <div
        className={cn(
          "relative w-full max-w-none space-y-5 rounded-lg transition-[box-shadow] duration-700 md:space-y-6 lg:space-y-7",
          integrityHigh && "dashboard-integrity-pulse"
        )}
      >
        <div className="ghost-muted w-full min-w-0 max-w-none space-y-5 md:space-y-6 lg:space-y-7">
          <HeroStatusPanel
            themeMode={themeMode}
            userName={userName}
            userRole={userRole}
            profileAvatar={profileAvatar}
            snapshots={snapshots}
            onNavigate={onNavigate}
            syndicateNavLocked={syndicateLocked}
          />

          <MissionCommandDeckCard themeMode={themeMode} />

          <SyndicateMissionsSnapshotCard
            themeMode={themeMode}
            onNavigate={onNavigate}
            syndicateNavLocked={syndicateLocked}
          />

          <GoalPathSystem
            themeMode={themeMode}
            courses={courses}
            onContinue={() => onNavigate("programs")}
          />

          <ActivityTimelineCard themeMode={themeMode} />
        </div>
      </div>
    </>
  );
}

