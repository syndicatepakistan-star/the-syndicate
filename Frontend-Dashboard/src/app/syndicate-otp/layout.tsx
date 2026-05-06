import type { Metadata } from "next";
import "./syndicate-otp.css";

export const metadata: Metadata = {
  title: "THE SYNDICATE",
  description: "OTP login, sign up, and Stripe checkout for The Syndicate."
};

export default function SyndicateOtpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      {children}
    </div>
  );
}
