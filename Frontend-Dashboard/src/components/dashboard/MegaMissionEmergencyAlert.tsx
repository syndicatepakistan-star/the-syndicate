"use client";

import { useId } from "react";

type MegaMissionEmergencyAlertProps = {
  /** Faster pulse when a live op is deployed */
  urgent?: boolean;
};

/** Animated neon warning — matches alert.mp4 (triangle + pulsing !). */
export function MegaMissionEmergencyAlert({ urgent = false }: MegaMissionEmergencyAlertProps) {
  const uid = useId().replace(/:/g, "");
  const glowFilter = `mega-alert-glow-${uid}`;

  return (
    <div
      className={`mega-mission-emergency-alert${urgent ? " mega-mission-emergency-alert--urgent" : ""}`}
      role="img"
      aria-label="Emergency alert"
    >
      <div className="mega-mission-emergency-alert__icon" aria-hidden>
        <svg className="mega-mission-emergency-alert__svg" viewBox="0 0 200 200" role="presentation">
          <defs>
            <filter id={glowFilter} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g className="mega-mission-emergency-alert__triangle-group">
            <path
              className="mega-mission-emergency-alert__triangle mega-mission-emergency-alert__triangle--outer"
              d="M100 22 L172 162 L28 162 Z"
              fill="rgba(40,0,0,0.35)"
              stroke="#f8fafc"
              strokeWidth="5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              className="mega-mission-emergency-alert__triangle mega-mission-emergency-alert__triangle--inner"
              d="M100 36 L158 152 L42 152 Z"
              fill="none"
              stroke="#fecaca"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>
          <g className="mega-mission-emergency-alert__mark-group" filter={`url(#${glowFilter})`}>
            <rect
              className="mega-mission-emergency-alert__mark-bar"
              x="92"
              y="72"
              width="16"
              height="58"
              rx="8"
              fill="#ff2222"
            />
            <circle className="mega-mission-emergency-alert__mark-dot" cx="100" cy="148" r="9" fill="#ff2222" />
          </g>
        </svg>
        <span className="mega-mission-emergency-alert__pulse-ring" />
        <span className="mega-mission-emergency-alert__pulse-ring mega-mission-emergency-alert__pulse-ring--2" />
      </div>
      <div className="mega-mission-emergency-alert__copy">
        <p className="mega-mission-emergency-alert__title">Emergency alert</p>
        <p className="mega-mission-emergency-alert__subtitle">Mega mission channel · immediate attention</p>
      </div>
    </div>
  );
}
