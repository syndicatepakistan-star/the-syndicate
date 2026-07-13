import gsap from "gsap";

let motionSuspended = false;

/** Pause GSAP + decorative media when the tab is backgrounded (prevents return lag / stuck feel). */
export function pauseDashboardMotion(root?: HTMLElement | null) {
  if (typeof document === "undefined" || motionSuspended) return;
  motionSuspended = true;

  gsap.globalTimeline.pause();
  gsap.ticker.sleep();
  root?.classList.add("dashboard-tab-suspended");
  document.documentElement.classList.add("dashboard-tab-suspended");
  root?.classList.remove("is-scrolling");
  document.documentElement.classList.remove("dashboard-is-scrolling");

  document.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
    if (video.paused) return;
    video.dataset.dashboardWasPlaying = "1";
    video.pause();
  });
}

/** Resume motion after tab focus — discard GSAP lag so the UI does not "catch up" in one frame. */
export function resumeDashboardMotion(root?: HTMLElement | null) {
  if (typeof document === "undefined" || !motionSuspended) return;
  motionSuspended = false;

  gsap.ticker.lagSmoothing(0);
  gsap.ticker.wake();
  gsap.globalTimeline.resume();
  root?.classList.remove("dashboard-tab-suspended");
  document.documentElement.classList.remove("dashboard-tab-suspended");

  requestAnimationFrame(() => {
    document.querySelectorAll<HTMLVideoElement>("video[data-dashboard-was-playing='1']").forEach((video) => {
      video.removeAttribute("data-dashboard-was-playing");
      if (document.visibilityState === "hidden") return;
      void video.play().catch(() => {
        // Autoplay may be blocked until the next gesture — safe to ignore.
      });
    });
  });
}

export function isDashboardMotionSuspended(): boolean {
  return motionSuspended;
}
