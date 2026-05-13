import { NavApp } from "@/components/NavApp";
import { MembershipOfferLanding } from "@/components/membership/MembershipOfferLanding";

export default function MembershipMarketingPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black text-white">
      <NavApp />
      <MembershipOfferLanding />
    </div>
  );
}
