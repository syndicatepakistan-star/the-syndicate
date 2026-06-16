"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  programTitle: string;
  onComplete: () => void;
};

type Phase = "shake" | "break" | "unlocked" | "done";

export function ProgramUnlockCelebration({ programTitle, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("shake");
  const completedRef = useRef(false);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const shakeTimer = window.setTimeout(() => setPhase("break"), 700);
    const breakTimer = window.setTimeout(() => setPhase("unlocked"), 1200);
    const doneTimer = window.setTimeout(() => {
      setPhase("done");
      finish();
    }, 3400);
    return () => {
      window.clearTimeout(shakeTimer);
      window.clearTimeout(breakTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div
      className="program-unlock-celebration-backdrop fixed inset-0 z-[200] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="program-unlock-title"
    >
      <div className="program-unlock-celebration-panel relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#caa724]/70 bg-[#04060d]/95 p-6 text-center shadow-[0_0_80px_rgba(202,167,36,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md sm:p-8">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(202,167,36,0.22),transparent_55%)]" aria-hidden />
        <div className="relative z-[1] flex flex-col items-center gap-4">
          <div className="program-unlock-icon-stage relative flex h-28 w-28 items-center justify-center">
            {phase === "unlocked" ? (
              <Unlock
                className="program-unlock-icon program-unlock-icon--revealed h-16 w-16 text-[#f5c814]"
                strokeWidth={2.2}
                aria-hidden
              />
            ) : (
              <>
                <Lock
                  className={cn(
                    "program-unlock-icon program-unlock-lock h-16 w-16 text-red-500",
                    phase === "shake" && "program-unlock-lock--shake",
                    phase === "break" && "program-unlock-lock--break"
                  )}
                  strokeWidth={2.2}
                  aria-hidden
                />
                {phase === "break" ? (
                  <>
                    <span className="program-unlock-shard program-unlock-shard--a" aria-hidden />
                    <span className="program-unlock-shard program-unlock-shard--b" aria-hidden />
                    <span className="program-unlock-shard program-unlock-shard--c" aria-hidden />
                    <span className="program-unlock-burst" aria-hidden />
                  </>
                ) : null}
              </>
            )}
          </div>

          <div className="space-y-2">
            <p
              id="program-unlock-title"
              className={cn(
                "text-[clamp(1.1rem,4vw,1.45rem)] font-black uppercase tracking-[0.12em] text-[#ffe9a3] transition-all duration-500",
                phase === "unlocked" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Program Unlocked
            </p>
            <p
              className={cn(
                "text-sm font-semibold leading-relaxed text-white/80 transition-all duration-500 delay-100 sm:text-base",
                phase === "unlocked" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The lock is broken — you can now access{" "}
              <span className="text-[#f5c814]">{programTitle}</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={finish}
            className={cn(
              "mt-2 rounded-xl border border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.35),rgba(98,73,11,0.95))] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#ffe9a3] shadow-[0_0_24px_rgba(202,167,36,0.45)] transition hover:scale-[1.02] sm:text-sm",
              phase === "unlocked" ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            Access Program
          </button>
        </div>
      </div>
    </div>
  );
}

export const PROGRAM_UNLOCK_CELEBRATION_KEY = "program_unlock_celebration_id";
