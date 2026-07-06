import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "../syndicate-otp/syndicate-otp.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Checkout",
  description: "Complete your Syndicate purchase.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutBranchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      {children}
    </div>
  );
}
