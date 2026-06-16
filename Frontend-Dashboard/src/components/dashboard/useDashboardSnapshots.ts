import { useEffect, useMemo, useState } from "react";
import {
  fetchChallengesToday,
  fetchSyndicateProgress,
  type ChallengeRow
} from "@/app/challenges/services/challengesApi";
import { getSyndicateAuthToken } from "@/lib/syndicateAuth";
import { getSyndicateDeviceId } from "@/lib/syndicateDeviceId";
import {
  challengeIsDone,
  computeMissionBoardStats,
  computeSyndicateRankFromPoints,
  readSyndicatePointsTotal,
  rowOnBoard
} from "@/lib/syndicateHeroMetrics";
import { applySyncedStateFromServer, SYNDICATE_DASHBOARD_REFRESH_EVENT } from "@/lib/syndicateProgressSync";
import type {
  CoreIntegritySnapshot,
  DashboardSnapshots,
  NotificationItem,
  ProgramSnapshot,
  SyndicateSnapshot
} from "./types";

export type DashboardCourseLike = {
  id: string;
  title: string;
  meta?: string;
  statusText?: string;
  imageSrc?: string;
};

function safeJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function nowMinus(mins: number) {
  return Date.now() - mins * 60_000;
}

function clampPct(v: number) {
  return Math.max(0, Math.min(100, v));
}

function seedNum(seed: string) {
  return seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function missionTitleFallback(missionId: string | null) {
  if (!missionId) return undefined;
  return missionId
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

/** Consecutive calendar days the operator opened the deck (client local date). */
function bumpUptimeStreak(): number {
  const KEY_LAST = "dashboarded:lastVisitDate";
  const KEY_STREAK = "dashboarded:uptimeStreak";
  const today = new Date().toISOString().slice(0, 10);
  const last = window.localStorage.getItem(KEY_LAST);
  let streak = Number(window.localStorage.getItem(KEY_STREAK) || "0");

  if (last === today) {
    return Math.max(1, streak || 1);
  }

  if (!last) {
    streak = 1;
  } else {
    const lastTime = new Date(`${last}T12:00:00`).getTime();
    const todayTime = new Date(`${today}T12:00:00`).getTime();
    const diffDays = Math.round((todayTime - lastTime) / 86400000);
    if (diffDays === 1) {
      streak = Math.max(1, streak) + 1;
    } else {
      streak = 1;
    }
  }

  window.localStorage.setItem(KEY_LAST, today);
  window.localStorage.setItem(KEY_STREAK, String(streak));
  return streak;
}

export function useDashboardSnapshots({
  userName,
  courses,
  syndicateKnightApi = true,
}: {
  userName: string;
  courses: DashboardCourseLike[];
  /** When false (Money Mastery / monk locked), skip knight-only challenge API calls. */
  syndicateKnightApi?: boolean;
}): { snapshots: DashboardSnapshots; hydrated: boolean } {
  const [hydrated, setHydrated] = useState(false);
  const [snap, setSnap] = useState<DashboardSnapshots | null>(null);

  useEffect(() => {
    // Hydrate from localStorage (client-only). This is structured for future API integration.
    const activeProgramId = window.localStorage.getItem("dashboarded:activeProgramId");
    const lastCourseId = window.localStorage.getItem("dashboarded:lastCourseId");
    const progressMap = safeJson<Record<string, number>>(window.localStorage.getItem("dashboarded:course-progress")) ?? {};

    const programs: ProgramSnapshot[] = courses
      .map((c) => ({
        id: c.id,
        title: c.title,
        meta: c.meta ?? c.statusText,
        imageSrc: c.imageSrc,
        progressPct: clampPct(progressMap[c.id] ?? 0),
        lastOpenedTs: c.id === lastCourseId ? nowMinus(8) : c.id === activeProgramId ? nowMinus(3) : undefined
      }))
      .filter((p) => p.progressPct > 0 || p.id === lastCourseId || p.id === activeProgramId)
      .sort((a, b) => (b.lastOpenedTs ?? 0) - (a.lastOpenedTs ?? 0));

    const durationRaw = window.localStorage.getItem("dashboarded:syndicate-duration");
    const durationNum = durationRaw ? Number(durationRaw) : NaN;
    const durationDays: 7 | 14 | 30 = durationNum === 7 || durationNum === 14 || durationNum === 30 ? durationNum : 14;
    const category = window.localStorage.getItem("dashboarded:syndicate-category") ?? "skills";
    const missionId = window.localStorage.getItem("dashboarded:syndicate-missionId");

    const points = readSyndicatePointsTotal();
    const rank = computeSyndicateRankFromPoints(points);
    const mission = computeMissionBoardStats([], Date.now());

    const syndicate: SyndicateSnapshot = {
      rankLabel: rank.rankLabel,
      level: rank.syndicateLevel,
      xpPct: rank.xpPct,
      streakDays: 0,
      durationDays,
      category,
      activeMissionTitle: missionTitleFallback(missionId),
      activeLiveMissionCount: mission.activeMissionCount,
      completedMissionsCount: mission.completedMissionsCount,
      pendingMissionsCount: mission.pendingMissionsCount,
      activeMissionsPct: mission.activeMissionsPct,
      missedChallengesPct: mission.missedChallengesPct,
      leaderboardPos: (seedNum(userName + "lb") % 87) + 1,
      nextRankChecklist: [
        "Complete 2 missions without skipping",
        "Maintain streak for 5 days",
        "Earn +25 XP from challenges",
        "Finish 1 focus-category mission"
      ],
      missionPointsTotal: points,
      nextRankLabel: rank.nextRankLabel,
      pointsToNext: rank.pointsToNext
    };

    const referralLink =
      window.localStorage.getItem("dashboarded:affiliate-ref") || "https://syndicate.app/r/subhan-x91";
    const clicks = (seedNum(userName + "clicks") % 300) + 40;
    const conversions = Math.max(1, Math.floor(clicks * 0.18));
    const earnings = Math.floor(conversions * 38 + (seedNum(userName) % 60));

    const uptimeDays = bumpUptimeStreak();
    const integrityPct = clampPct(Math.min(100, 52 + uptimeDays * 4 + (seedNum(userName + "integrity") % 14)));
    const energyLevel = clampPct(38 + (seedNum(userName + "energy") % 48) + Math.min(12, uptimeDays));
    const coreIntegrity: CoreIntegritySnapshot = {
      integrityPct,
      systemUptimeDays: uptimeDays,
      energyLevel,
      loadSeries: [14, 16, 15, 18, 20, 22, 24].map((v) => v + (seedNum(userName) % 5))
    };

    const notificationsSeed: NotificationItem[] = [
      {
        id: "n-1",
        category: "progress",
        title: "Continue where you left off",
        message: lastCourseId ? `Resume your last program (${lastCourseId.toUpperCase()}) and keep momentum.` : "Pick a program to begin your progress loop.",
        ts: nowMinus(12),
        read: false,
        cta: { label: "Open Programs", nav: "programs" }
      },
      {
        id: "n-2",
        category: "rewards",
        title: "Challenge update",
        message: `You’re ${syndicate.xpPct}% to your next rank unlock. Keep the streak alive.`,
        ts: nowMinus(38),
        read: false,
        cta: { label: "Open Syndicate", nav: "monk" }
      },
      {
        id: "n-3",
        category: "social",
        title: "Community pulse",
        message: "Fresh resource discussions are trending. Check updates and react quickly.",
        ts: nowMinus(74),
        read: true,
        cta: { label: "Open Membership section", nav: "resources" }
      }
    ];

    setSnap({
      programs,
      syndicate,
      affiliate: {
        referralLink,
        clicks,
        conversions,
        earnings,
        recent: [
          { who: "Aariz", status: "joined", ts: nowMinus(9) },
          { who: "Maya", status: "purchased", ts: nowMinus(41) },
          { who: "Nora", status: "clicked", ts: nowMinus(86) }
        ]
      },
      coreIntegrity,
      resources: {
        recent: [
          { title: "Cold Resolve Playbook", tag: "fitness", ts: nowMinus(55) },
          { title: "Offer Craft Framework", tag: "skills", ts: nowMinus(130) }
        ],
        recommended: [
          { title: "Authority Buildout Notes", tag: "power" },
          { title: "Asset Accumulation Checklist", tag: "money" }
        ],
        tags: ["money", "power", "freedom", "fitness", "skills"]
      },
      goals: {
        rankGoalLabel: "Diamond",
        rankProgressPct: clampPct(syndicate.xpPct + 8),
        completionGoalPct: clampPct((programs.reduce((a, p) => a + p.progressPct, 0) / Math.max(1, programs.length)) || 0),
        earningsGoalPct: clampPct(Math.floor((earnings / 2500) * 100)),
        integrityGoalPct: clampPct(Math.floor(((seedNum(userName + "integrityGoal") % 800) / 1000) * 100)),
        milestones: [
          { label: "7-day streak", pct: 100, reached: syndicate.streakDays >= 7 },
          { label: "50% program completion", pct: 50, reached: programs.some((p) => p.progressPct >= 50) },
          { label: "First affiliate payout", pct: 35, reached: earnings >= 300 }
        ]
      },
      recommendations: (() => {
        /** Same titles / subtitles as the Programs → Courses grid (`meta` / `statusText`). */
        const programReason = (c: DashboardCourseLike) => {
          const line = [c.meta, c.statusText].filter(Boolean).join(" · ");
          return line.length > 0 ? line : "Open Programs to continue this track.";
        };
        const programReasonFromSnapshot = (p: ProgramSnapshot) => {
          const line = [p.meta].filter(Boolean).join(" · ");
          if (line.length > 0) {
            return p.progressPct > 0 ? `${line} · ${p.progressPct}% complete` : line;
          }
          return p.progressPct > 0 ? `${p.progressPct}% complete — keep going in Programs.` : "Continue in Programs.";
        };

        const lastId = lastCourseId ?? undefined;
        const activeId = activeProgramId ?? undefined;
        const fromLast = lastId ? courses.find((c) => c.id === lastId) : undefined;
        const fromActive = activeId ? courses.find((c) => c.id === activeId) : undefined;
        const primaryProgram = programs[0];
        const catalogFirst = courses[0];

        const nextProgram =
          fromLast != null
            ? { title: fromLast.title, reason: programReason(fromLast), nav: "programs" as const }
            : fromActive != null
              ? { title: fromActive.title, reason: programReason(fromActive), nav: "programs" as const }
              : primaryProgram != null
                ? {
                    title: primaryProgram.title,
                    reason: programReasonFromSnapshot(primaryProgram),
                    nav: "programs" as const
                  }
                : catalogFirst != null
                  ? { title: catalogFirst.title, reason: programReason(catalogFirst), nav: "programs" as const }
                  : {
                      title: "Programs",
                      reason: "Browse courses and start a track from the Programs tab.",
                      nav: "programs" as const
                    };

        return {
          nextProgram,
          nextChallenge: { title: "Dominance Protocol", reason: "High ROI for confidence and influence.", nav: "monk" },
          affiliateTip: { title: "Add a 1-line CTA", reason: "Improve conversions by clarifying the next step.", nav: "dashboard" },
          systemTip: { title: "Calibrate routine", reason: "Balance daily load so integrity stays in the green band.", nav: "resources" },
          reminder: { title: "Streak defense", reason: "Do one 10-minute mission today to protect streak.", nav: "monk" }
        };
      })(),
      /* Live entries come from ActivityTimelineProvider (localStorage); keep empty here */
      activity: [],
      notifications: notificationsSeed
    });
    setHydrated(true);
  }, [courses, userName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const pullSyndicateLive = async () => {
      const token = getSyndicateAuthToken();
      let streakDays = 0;
      if (token && syndicateKnightApi) {
        try {
          const pr = await fetchSyndicateProgress();
          if (cancelled) return;
          applySyncedStateFromServer(pr.state ?? {});
          streakDays = pr.streak_count ?? 0;
        } catch {
          /* offline */
        }
      }

      const points = readSyndicatePointsTotal();
      const rank = computeSyndicateRankFromPoints(points);
      let rows: ChallengeRow[] = [];
      if (syndicateKnightApi) {
        try {
          const td = await fetchChallengesToday(getSyndicateDeviceId());
          if (cancelled) return;
          rows = td.results ?? [];
        } catch {
          /* same-origin / device missions may still be in local storage */
        }
      }

      const now = Date.now();
      const mission = computeMissionBoardStats(rows, now);
      const liveTitle = rows
        .find((r) => rowOnBoard(r, now) && !challengeIsDone(r.id))
        ?.payload?.challenge_title?.trim();

      setSnap((prev) => {
        if (!prev) return prev;
        const fallbackMissionId = window.localStorage.getItem("dashboarded:syndicate-missionId");
        return {
          ...prev,
          syndicate: {
            ...prev.syndicate,
            streakDays,
            missionPointsTotal: points,
            rankLabel: rank.rankLabel,
            nextRankLabel: rank.nextRankLabel,
            xpPct: rank.xpPct,
            level: rank.syndicateLevel,
            pointsToNext: rank.pointsToNext,
            activeLiveMissionCount: mission.activeMissionCount,
            completedMissionsCount: mission.completedMissionsCount,
            pendingMissionsCount: mission.pendingMissionsCount,
            activeMissionsPct: mission.activeMissionsPct,
            missedChallengesPct: mission.missedChallengesPct,
            activeMissionTitle:
              liveTitle && liveTitle.length > 0
                ? liveTitle
                : prev.syndicate.activeMissionTitle ?? missionTitleFallback(fallbackMissionId)
          }
        };
      });
    };

    void pullSyndicateLive();
    const onRefresh = () => void pullSyndicateLive();
    const onWindowFocus = () => void pullSyndicateLive();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void pullSyndicateLive();
    };
    const pollId = window.setInterval(() => {
      if (!cancelled) void pullSyndicateLive();
    }, 15000);
    window.addEventListener(SYNDICATE_DASHBOARD_REFRESH_EVENT, onRefresh);
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      window.removeEventListener(SYNDICATE_DASHBOARD_REFRESH_EVENT, onRefresh);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [courses, userName, syndicateKnightApi]);

  const snapshots = useMemo(() => {
    if (snap) return snap;
    // Pre-hydration fallback: avoid UI flicker and keep predictable shapes.
    const emptySyndicate: SyndicateSnapshot = {
      rankLabel: "Recruit",
      level: 0,
      xpPct: 0,
      streakDays: 0,
      durationDays: 14,
      activeMissionsPct: 0,
      missedChallengesPct: 0,
      activeLiveMissionCount: 0,
      completedMissionsCount: 0,
      pendingMissionsCount: 0,
      nextRankChecklist: [],
      missionPointsTotal: 0,
      nextRankLabel: "Bronze",
      pointsToNext: 20
    };
    const empty: DashboardSnapshots = {
      programs: [],
      syndicate: emptySyndicate,
      affiliate: { clicks: 0, conversions: 0, earnings: 0, recent: [] },
      coreIntegrity: { integrityPct: 0, systemUptimeDays: 0, energyLevel: 0, loadSeries: [] },
      resources: { recent: [], recommended: [], tags: [] },
      goals: { rankGoalLabel: "Diamond", rankProgressPct: 0, completionGoalPct: 0, earningsGoalPct: 0, integrityGoalPct: 0, milestones: [] },
      recommendations: {},
      activity: [],
      notifications: []
    };
    return empty;
  }, [hydrated, snap]);

  return { snapshots, hydrated };
}

