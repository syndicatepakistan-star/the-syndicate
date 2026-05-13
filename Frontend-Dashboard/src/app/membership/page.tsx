import { NavApp } from "@/components/NavApp";
import SiteFooter from "@/components/SiteFooter";
import { MembershipOfferLanding } from "@/components/membership/MembershipOfferLanding";

const MEMBERSHIP_BG_VIDEO = "/assets/bg-video%201.mp4";

export default function MembershipMarketingPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black text-white">
      {/* Same ambient wash as `/programs` (fuchsia / metallic gold / cyan) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[10%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-[120px] sm:h-[520px] sm:w-[520px]" />
        <div className="absolute right-[-8%] top-[38%] h-[300px] w-[300px] rounded-full bg-[rgba(212,175,57,0.18)] blur-[110px] sm:h-[460px] sm:w-[460px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[130px] sm:h-[560px] sm:w-[560px]" />
      </div>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.32] sm:opacity-[0.38]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src={MEMBERSHIP_BG_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/88" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,57,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px, 64px 64px",
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
