"use client";

type Props = {
  onClick: () => void;
};

/**
 * Cyberpunk "bonus mission activated" HUD alert (Syndicate Mode).
 * Red grid scene, chamfered neon frame, hazard stripes, targeting reticle.
 */
export function SyndicateBonusMissionAlert({ onClick }: Props) {
  return (
    <div
      className="syndicate-bonus-hud-wrap"
      role="alert"
      aria-live="assertive"
      aria-label="Bonus mission activated"
    >
      <div className="syndicate-bonus-hud__converge syndicate-bonus-hud__converge--left" aria-hidden>
        <span className="syndicate-bonus-hud__rail-long syndicate-bonus-hud__rail-long--primary" />
        <span className="syndicate-bonus-hud__beam syndicate-bonus-hud__beam--bold syndicate-bonus-hud__beam--l1" />
        <span className="syndicate-bonus-hud__beam syndicate-bonus-hud__beam--l2" />
        <span className="syndicate-bonus-hud__beam syndicate-bonus-hud__beam--bold syndicate-bonus-hud__beam--l3" />
      </div>

      <button
        type="button"
        className="syndicate-readable syndicate-bonus-hud syndicate-bonus-hud__core"
        onClick={onClick}
      >
        <span className="syndicate-bonus-hud__accent syndicate-bonus-hud__accent--top" aria-hidden />
        <span className="syndicate-bonus-hud__accent syndicate-bonus-hud__accent--bottom" aria-hidden />
        <span className="syndicate-bonus-hud__bloom" aria-hidden />

        <span className="syndicate-bonus-hud__scene" aria-hidden>
          <span className="syndicate-bonus-hud__binary" aria-hidden>
            0101101011010010110101101011010010110
          </span>
        </span>

        <span className="syndicate-bonus-hud__border" aria-hidden />
        <span className="syndicate-bonus-hud__border-glow" aria-hidden />

        <span className="syndicate-bonus-hud__panel">
          <span className="syndicate-bonus-hud__hazard syndicate-bonus-hud__hazard--top" aria-hidden />
          <span className="syndicate-bonus-hud__hazard syndicate-bonus-hud__hazard--bottom" aria-hidden />
          <span className="syndicate-bonus-hud__center-glow" aria-hidden />

          <span className="syndicate-bonus-hud__reticle">
            <span className="syndicate-bonus-hud__corner syndicate-bonus-hud__corner--tl" aria-hidden />
            <span className="syndicate-bonus-hud__corner syndicate-bonus-hud__corner--tr" aria-hidden />
            <span className="syndicate-bonus-hud__corner syndicate-bonus-hud__corner--bl" aria-hidden />
            <span className="syndicate-bonus-hud__corner syndicate-bonus-hud__corner--br" aria-hidden />
            <span className="syndicate-bonus-hud__title">Bonus mission activated</span>
            <span className="syndicate-bonus-hud__hint">Tap to open the bonus mission section</span>
          </span>
        </span>
      </button>

      <div className="syndicate-bonus-hud__converge syndicate-bonus-hud__converge--right" aria-hidden>
        <span className="syndicate-bonus-hud__rail-long syndicate-bonus-hud__rail-long--primary" />
        <span className="syndicate-bonus-hud__beam syndicate-bonus-hud__beam--bold syndicate-bonus-hud__beam--r1" />
        <span className="syndicate-bonus-hud__beam syndicate-bonus-hud__beam--r2" />
        <span className="syndicate-bonus-hud__beam syndicate-bonus-hud__beam--bold syndicate-bonus-hud__beam--r3" />
      </div>
    </div>
  );
}
