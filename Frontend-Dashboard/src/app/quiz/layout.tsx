import type { Metadata } from "next";
import DeferredLetterGlitch from "@/components/quiz-funnel/DeferredLetterGlitch";
import { buildPageMetadata } from "@/lib/seo";
import "./quiz-funnel.css";

export const metadata: Metadata = buildPageMetadata({
  title: "The Syndicate Diagnosis",
  description:
    "Take The Syndicate Diagnosis — a short quiz to find your operator path, program fit, and next step inside the Syndicate ecosystem.",
  path: "/quiz",
});

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="quiz-funnel-root">
      <div className="global-letter-glitch">
        <div className="quiz-glitch-placeholder" aria-hidden />
        <DeferredLetterGlitch
          glitchColors={["#24345f", "#2dc6e8", "#be992e"]}
          glitchSpeed={55}
          centerVignette
          outerVignette
          smooth
          className="quiz-glitch-canvas"
        />
      </div>
      <div className="global-app-layer">{children}</div>
    </div>
  );
}
