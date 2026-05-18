"use client";

import { useCallback } from "react";
import { GoalPathSystem } from "@/components/dashboard/path/GoalPathSystem";

/** Public /programs: same YOUR PATH + Next opportunities block as the dashboard command center. */
export function PublicGoalPathSection() {
  const onContinue = useCallback(() => {
    const target = document.getElementById("programs-library");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.hash = "programs-library";
  }, []);

  return (
    <section
      aria-label="Your path and recommended programs"
      className="relative mx-auto w-full max-w-[1400px] px-[clamp(1rem,3.2vw,1.5rem)] pb-2 pt-2 sm:px-6 sm:pb-4 sm:pt-4"
    >
      <GoalPathSystem
        themeMode="default"
        courses={[]}
        opportunityCardFrame="methods"
        onContinue={onContinue}
      />
    </section>
  );
}
