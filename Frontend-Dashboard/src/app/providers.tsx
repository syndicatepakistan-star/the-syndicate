"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import type { CheckoutCurrency } from "@/lib/currency";

const ActivityTimelineProvider = dynamic(
  () =>
    import("@/contexts/ActivityTimelineContext").then((m) => m.ActivityTimelineProvider),
  { ssr: false },
);

const GoalsPanelProvider = dynamic(
  () => import("@/contexts/GoalsPanelContext").then((m) => m.GoalsPanelProvider),
  { ssr: false },
);

const GoalsGlobalChrome = dynamic(
  () => import("@/components/ui/GoalsGlobalChrome").then((m) => m.GoalsGlobalChrome),
  { ssr: false },
);

const ActivityRouteTracker = dynamic(
  () => import("@/components/activity/ActivityRouteTracker").then((m) => m.ActivityRouteTracker),
  { ssr: false },
);

const TabResumeCoordinator = dynamic(() => import("@/components/TabResumeCoordinator"), {
  ssr: false,
});

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <ActivityTimelineProvider>
      <GoalsPanelProvider>
        {children}
        <ActivityRouteTracker />
        <TabResumeCoordinator />
        <GoalsGlobalChrome />
      </GoalsPanelProvider>
    </ActivityTimelineProvider>
  );
}

/**
 * Marketing pages (`/`, `/programs`, …) skip dashboard-only timeline/goals providers
 * so first paint does not parse unused JS. Dashboard mounts them client-side.
 */
export function Providers({
  children,
  initialCurrency = "usd",
}: {
  children: ReactNode;
  initialCurrency?: CheckoutCurrency;
}) {
  const pathname = usePathname() ?? "";
  const onDashboard = isDashboardPath(pathname);

  return (
    <CurrencyProvider initialCurrency={initialCurrency}>
      <AuthProvider>
        {onDashboard ? <DashboardProviders>{children}</DashboardProviders> : children}
      </AuthProvider>
    </CurrencyProvider>
  );
}
