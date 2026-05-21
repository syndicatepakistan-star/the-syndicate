import { NavApp } from "@/components/NavApp";
import { ViewportDecorVideo } from "@/components/ViewportDecorVideo";
import SiteFooter from "@/components/SiteFooter";
import { MembershipOfferLanding } from "@/components/membership/MembershipOfferLanding";

const MEMBERSHIP_BG_VIDEO = "/assets/bg-video%201.mp4";

export default function MembershipMarketingPage() {
  return (
    <div className="membership-marketing-page relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#04060c] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <ViewportDecorVideo
          src={MEMBERSHIP_BG_VIDEO}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute left-[-10%] top-[8%] h-[280px] w-[280px] rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute right-[-12%] top-[14%] h-[300px] w-[300px] rounded-full bg-violet-500/14 blur-3xl" />
        <div className="absolute left-[36%] top-[54%] h-[320px] w-[320px] rounded-full bg-rose-500/10 blur-3xl" />
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
