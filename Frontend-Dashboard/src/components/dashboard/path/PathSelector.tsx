"use client";

import { motion } from "framer-motion";
import type { GoalId } from "./goalPathData";
import { GOAL_OPTIONS, PATH_CARD_SKIN } from "./goalPathData";
import { cn } from "../dashboardPrimitives";

export function PathSelector({ selected, onSelect }: { selected: GoalId; onSelect: (g: GoalId) => void }) {
  return (
    <div className="relative">
      <div className="font-mono fluid-path-section-heading font-black uppercase tracking-[0.22em] text-[color:var(--gold-neon)]/92 sm:tracking-[0.24em]">
        Your Path
      </div>
      <p className="mt-2 max-w-2xl text-[clamp(0.85rem,0.55vw+0.68rem,1.1rem)] leading-relaxed text-white/68 sm:text-[clamp(0.92rem,0.5vw+0.72rem,1.15rem)]">
        Choose a focus. Your roadmap and course flow update automatically.
      </p>
      <div className="mt-[clamp(0.85rem,2vw+0.25rem,1.25rem)] grid grid-cols-1 fluid-path-grid-gap min-[480px]:grid-cols-2 lg:grid-cols-5">
        {GOAL_OPTIONS.map((g) => {
          const on = selected === g.id;
          const skin = PATH_CARD_SKIN[g.id];
          return (
            <motion.button
              key={g.id}
              type="button"
              onClick={() => onSelect(g.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "compact-card-ui cut-frame-sm cyber-frame relative min-h-[clamp(3.15rem,7vw+1.1rem,4.35rem)] w-full min-w-0 border px-[clamp(0.75rem,2vw+0.25rem,1.1rem)] py-[clamp(0.55rem,1.4vw+0.2rem,0.95rem)] text-left transition-[box-shadow,border-color,background-color,color,filter] duration-300",
                "fluid-path-card-label font-mono font-black uppercase leading-tight tracking-[0.12em] sm:tracking-[0.14em]",
                on ? skin.active : skin.idle,
              )}
            >
              <span className="block truncate uppercase">{g.label}</span>
              <span
                className={cn(
                  "mt-1.5 block font-mono text-[clamp(0.72rem,0.48vw+0.58rem,0.9rem)] font-bold uppercase tracking-[0.18em] sm:text-[clamp(0.76rem,0.44vw+0.62rem,0.95rem)]",
                  on ? skin.subOn : skin.subOff,
                )}
              >
                {g.short}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
