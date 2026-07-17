"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Shared single-line purchase/value statement.
 * Critical color and motion live inline so modal portals and stale generated CSS cannot mute them.
 */
export function PurchaseValueCallout({ children, className }: Props) {
  return (
    <div
      className={cn("w-full overflow-x-auto pb-1", className)}
      style={{ scrollbarWidth: "none" }}
    >
      <motion.p
        className="w-max min-w-full whitespace-nowrap text-center font-mono font-black uppercase leading-none tracking-[0.055em]"
        initial={false}
        animate={{
          opacity: [0.82, 1, 0.82],
          scale: [1, 1.018, 1],
          textShadow: [
            "0 0 5px rgba(62,184,181,0.38), 0 0 12px rgba(62,184,181,0.18)",
            "0 0 9px rgba(62,184,181,0.95), 0 0 24px rgba(62,184,181,0.58)",
            "0 0 5px rgba(62,184,181,0.38), 0 0 12px rgba(62,184,181,0.18)",
          ],
        }}
        transition={{
          duration: 2.1,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{
          color: "#3eb8b5",
          fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
          transformOrigin: "center",
          willChange: "transform, opacity, text-shadow",
        }}
      >
        {children}
      </motion.p>
    </div>
  );
}
