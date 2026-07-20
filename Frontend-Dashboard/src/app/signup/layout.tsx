import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "../syndicate-otp/syndicate-otp.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign Up",
  description: "Create your Syndicate account.",
  path: "/signup",
  noIndex: true,
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
