import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "../syndicate-otp/syndicate-otp.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Verify code",
  description: "Enter your Syndicate one-time code.",
  path: "/verify-otp",
  noIndex: true,
});

export default function VerifyOtpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
