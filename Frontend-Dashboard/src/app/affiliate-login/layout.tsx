import type { Metadata } from "next";
import "../syndicate-otp/syndicate-otp.css";

export const metadata: Metadata = {
  title: "THE SYNDICATE",
  description: "Email verification for the Syndicate affiliate partner dashboard.",
};

export default function AffiliateLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      {children}
    </div>
  );
}
