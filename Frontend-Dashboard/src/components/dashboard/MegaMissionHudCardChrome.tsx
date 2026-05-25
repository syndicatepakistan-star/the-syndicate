"use client";

/** Corner brackets + rim accents for internal mega-mission HUD panels (non-red). */
export function MegaMissionHudCardChrome() {
  return (
    <div className="mega-mission-card__chrome" aria-hidden>
      <span className="mega-mission-card__rim" />
      <span className="mega-mission-card__rim mega-mission-card__rim--inner" />
      <span className="mega-mission-card__corner mega-mission-card__corner--tl" />
      <span className="mega-mission-card__corner mega-mission-card__corner--tr" />
      <span className="mega-mission-card__corner mega-mission-card__corner--bl" />
      <span className="mega-mission-card__corner mega-mission-card__corner--br" />
      <span className="mega-mission-card__tag-rail" />
    </div>
  );
}
