import { NavApp } from "@/components/NavApp";
import SiteFooter from "@/components/SiteFooter";
import { MembershipOfferLanding } from "@/components/membership/MembershipOfferLanding";

const MEMBERSHIP_BG_VIDEO = "/assets/bg-video%201.mp4";

export default function MembershipMarketingPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#04060c] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src={MEMBERSHIP_BG_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute left-[-10%] top-[8%] h-[400px] w-[400px] rounded-full bg-cyan-400/18 blur-[140px]" />
        <div className="absolute right-[-12%] top-[14%] h-[440px] w-[440px] rounded-full bg-violet-500/20 blur-[150px]" />
        <div className="absolute left-[36%] top-[54%] h-[500px] w-[500px] rounded-full bg-rose-500/10 blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(34,211,238,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.2)_1px,transparent_1px),linear-gradient(rgba(167,139,250,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.14)_1px,transparent_1px)] [background-size:74px_74px,74px_74px,18px_18px,18px_18px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(56,189,248,0.1),transparent_58%),radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(244,63,94,0.11),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040816]/74 via-[#05040c]/88 to-[#020208]/96" />
      </div>

      <NavApp />
      <MembershipOfferLanding />
      <SiteFooter />
    </div>
  );
}
