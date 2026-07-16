"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActivityTimelineProvider } from "@/contexts/ActivityTimelineContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { GoalsPanelProvider } from "@/contexts/GoalsPanelContext";
import { ActivityRouteTracker } from "@/components/activity/ActivityRouteTracker";
import TabResumeCoordinator from "@/components/TabResumeCoordinator";
import type { CheckoutCurrency } from "@/lib/currency";

const GoalsGlobalChrome = dynamic(
  () => import("@/components/ui/GoalsGlobalChrome").then((m) => m.GoalsGlobalChrome),
  { ssr: false },
);

function DashboardOnlyChrome() {
  const pathname = usePathname();
  if (pathname !== "/dashboard" && !pathname.startsWith("/dashboard/")) {
    return null;
  }
  return <GoalsGlobalChrome />;
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
          <ActivityRouteTracker />
          <TabResumeCoordinator />
          <GoalsPanelProvider>
            {children}
            <DashboardOnlyChrome />
          </GoalsPanelProvider>
        </ActivityTimelineProvider>
      </AuthProvider>
    </CurrencyProvider>
  );
}
