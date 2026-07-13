"use client";

type ResumeTask = () => void;

let hiddenAt: number | null = null;
let resumeQueued = false;
let bridgeInstalled = false;
const tasks = new Set<ResumeTask>();

/** Ignore brief tab switches — only run heavy refresh after real idle. */
const MIN_HIDDEN_MS = 3500;

export function markDashboardTabHidden(): void {
  hiddenAt = Date.now();
}

function runResumeTasks(): void {
  resumeQueued = false;
  if (hiddenAt === null) return;

  const awayMs = Date.now() - hiddenAt;
  hiddenAt = null;
  if (awayMs < MIN_HIDDEN_MS) return;

  const run = () => {
    for (const task of tasks) {
      try {
        task();
      } catch {
        // Ignore task failures — resume must never block UI.
      }
    }
  };

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(run, { timeout: 1400 });
  } else {
    window.setTimeout(run, 64);
  }
}

export function markDashboardTabVisible(): void {
  if (typeof document === "undefined" || document.visibilityState === "hidden") return;
  if (!hiddenAt || resumeQueued) return;
  resumeQueued = true;
  requestAnimationFrame(runResumeTasks);
}

/** Register a deferred refresh task (runs once per idle return, batched on idle time). */
export function registerDashboardTabResumeTask(task: ResumeTask): () => void {
  tasks.add(task);
  return () => {
    tasks.delete(task);
  };
}

/** Single visibility bridge for the dashboard shell — avoids duplicate listeners. */
export function ensureDashboardTabResumeBridge(): () => void {
  if (typeof document === "undefined" || bridgeInstalled) return () => {};
  bridgeInstalled = true;

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      markDashboardTabHidden();
      return;
    }
    markDashboardTabVisible();
  };

  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    bridgeInstalled = false;
  };
}
