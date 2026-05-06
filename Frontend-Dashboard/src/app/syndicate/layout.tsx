import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "THE SYNDICATE",
  description: "Syndicate mode lives in the main dashboard."
};

export const dynamic = "force-dynamic";

export default function SyndicateLayout({ children }: { children: ReactNode }) {
  return children;
}
