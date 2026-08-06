import type { Metadata } from "next";
import { AuthRouteHead } from "@/components/syndicate-otp/AuthRouteHead";
import "./syndicate-otp.css";

export const metadata: Metadata = {
  title: "THE SYNDICATE",
  description: "OTP login, sign up, and Stripe checkout for The Syndicate.",
};

export default function SyndicateOtpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <AuthRouteHead />
      {children}
    </div>
  );
}
