import { NavApp } from "@/components/NavApp";
import SiteFooter from "@/components/SiteFooter";
import { MembershipOfferLanding } from "@/components/membership/MembershipOfferLanding";

const MEMBERSHIP_BG_VIDEO = "/assets/bg-video%201.mp4";

export default function MembershipMarketingPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#020205] text-white">
      {/* Full-bleed looped video + HUD overlays */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.48] sm:opacity-[0.54]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src={MEMBERSHIP_BG_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,2,10,0.78)_0%,rgba(2,2,12,0.68)_38%,rgba(2,2,14,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(30,58,138,0.2),transparent_45%),radial-gradient(ellipse_90%_60%_at_100%_100%,rgba(88,28,135,0.16),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(6,182,212,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.18) 1px, transparent 1px)",
            backgroundSize: "64px 64px, 64px 64px",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent 0px, transparent 4px, rgba(0,0,0,0.55) 4px, rgba(0,0,0,0.55) 5px)",
          }}
        />
      </div>
      <div className="relative z-[1]">
        <NavApp />
        <MembershipOfferLanding />
        <SiteFooter />
      </div>
    </div>
  );
}
