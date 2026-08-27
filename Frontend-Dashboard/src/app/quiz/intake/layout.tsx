import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "1 on 1 Audit Form",
  description: "Answer a few quick questions linked to your Syndicate Diagnosis profile.",
  path: "/quiz/intake",
  noIndex: true,
});

export default function QuizIntakeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
