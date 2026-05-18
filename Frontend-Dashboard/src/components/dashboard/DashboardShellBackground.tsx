"use client";

const DASHBOARD_BG_VIDEO = "/assets/dashboard/bg.mp4";

/** Full-viewport cover video behind the /dashboard shell (navbar, sidebar, main). */
export function DashboardShellBackground() {
  return (
    <div className="dashboard-shell-bg pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={DASHBOARD_BG_VIDEO} type="video/mp4" />
      </video>
    </div>
  );
}
