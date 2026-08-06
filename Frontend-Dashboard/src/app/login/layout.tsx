import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { AuthRouteHead } from "@/components/syndicate-otp/AuthRouteHead";
import "../syndicate-otp/syndicate-otp.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Login",
  description: "Sign in to your Syndicate account.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthRouteHead />
      {children}
    </>
  );
}
