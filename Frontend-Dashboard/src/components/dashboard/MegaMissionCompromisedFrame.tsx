"use client";

/** Outer frame — "system compromised" reference (red glow, hazard stripes, warning mark). */
export function MegaMissionCompromisedFrame() {
  return (
    <div className="mega-mission-frame" aria-hidden>
      <span className="mega-mission-frame__bloom" />
      <span className="mega-mission-frame__plate mega-mission-frame__plate--outer" />
      <span className="mega-mission-frame__plate mega-mission-frame__plate--mid" />
      <span className="mega-mission-frame__plate mega-mission-frame__plate--inner" />

      {/* L-corner hazard blocks (reference video) */}
      <CornerHazard position="tl" />
      <CornerHazard position="tr" />
      <CornerHazard position="bl" />
      <CornerHazard position="br" />

      <span className="mega-mission-frame__rail mega-mission-frame__rail--top" />
      <span className="mega-mission-frame__rail mega-mission-frame__rail--bottom" />
      <span className="mega-mission-frame__rail mega-mission-frame__rail--left" />
      <span className="mega-mission-frame__rail mega-mission-frame__rail--right" />

      <span className="mega-mission-frame__tick mega-mission-frame__tick--l1" />
      <span className="mega-mission-frame__tick mega-mission-frame__tick--l2" />
      <span className="mega-mission-frame__tick mega-mission-frame__tick--r1" />
      <span className="mega-mission-frame__tick mega-mission-frame__tick--r2" />

      <span className="mega-mission-frame__edge mega-mission-frame__edge--top">
        <span className="mega-mission-frame__housing">
          <span className="mega-mission-frame__stripes" />
        </span>
        <span className="mega-mission-frame__cap" />
      </span>

      <span className="mega-mission-frame__edge mega-mission-frame__edge--bottom">
        <span className="mega-mission-frame__housing mega-mission-frame__housing--wide">
          <span className="mega-mission-frame__stripes" />
        </span>
        <span className="mega-mission-frame__scanner">
          <span className="mega-mission-frame__scanner-ring mega-mission-frame__scanner-ring--1" />
          <span className="mega-mission-frame__scanner-ring mega-mission-frame__scanner-ring--2" />
          <span className="mega-mission-frame__scanner-core" />
        </span>
        <span className="mega-mission-frame__beam mega-mission-frame__beam--l" />
        <span className="mega-mission-frame__beam mega-mission-frame__beam--r" />
      </span>

      <span className="mega-mission-frame__edge mega-mission-frame__edge--left">
        <span className="mega-mission-frame__housing mega-mission-frame__housing--vert">
          <span className="mega-mission-frame__stripes mega-mission-frame__stripes--vert" />
        </span>
      </span>

      <span className="mega-mission-frame__edge mega-mission-frame__edge--right">
        <span className="mega-mission-frame__housing mega-mission-frame__housing--vert">
          <span className="mega-mission-frame__stripes mega-mission-frame__stripes--vert" />
        </span>
      </span>

    </div>
  );
}

function CornerHazard({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  return (
    <span className={`mega-mission-frame__corner-hazard mega-mission-frame__corner-hazard--${position}`}>
      <span className="mega-mission-frame__corner-hazard-arm mega-mission-frame__corner-hazard-arm--h">
        <span className="mega-mission-frame__stripes" />
      </span>
      <span className="mega-mission-frame__corner-hazard-arm mega-mission-frame__corner-hazard-arm--v">
        <span className="mega-mission-frame__stripes mega-mission-frame__stripes--vert" />
      </span>
    </span>
  );
}
