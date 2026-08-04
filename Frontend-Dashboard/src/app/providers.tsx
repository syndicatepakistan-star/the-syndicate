"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActivityTimelineProvider } from "@/contexts/ActivityTimelineContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { GoalsPanelProvider } from "@/contexts/GoalsPanelContext";
import type { CheckoutCurrency } from "@/lib/currency";

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

function DashboardOnlyChrome() {
  const pathname = usePathname();
  if (!isDashboardPath(pathname)) return null;
  return (
    <>
      <ActivityRouteTracker />
      <TabResumeCoordinator />
      <GoalsGlobalChrome />
    </>
  );
}

export function Providers({
  children,
  initialCurrency = "usd",
}: {
  children: ReactNode;
  initialCurrency?: CheckoutCurrency;
}) {
  return (
    <CurrencyProvider initialCurrency={initialCurrency}>
      <AuthProvider>
        <ActivityTimelineProvider>
          <GoalsPanelProvider>
            {children}
            <DashboardOnlyChrome />
          </GoalsPanelProvider>
        </ActivityTimelineProvider>
      </AuthProvider>
    </CurrencyProvider>
  );
}
